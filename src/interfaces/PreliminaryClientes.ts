import moment from "moment";
import axios from 'axios';
import {xmlRequest, xmlVentaClientes, getTypeDocument} from './xml'
import {logger} from "../util/logger";

const responseFormat = (status = 0, message = "", data = null) => {
    return {
        status: status,
        message: message,
        data: data
    }
};
class PreliminaryClientes{
    public xml: any;
    public config: any;
    public options: any;
    public document: any;
    public action: any;

    public diServer: any;
    public SOAPBody: any;
    public SOAPResponse: any;
    public SOAPResult: any;
    public SOAPAction: any;

    public body: any;
    public checks: any;
    public header: any;
    public service: any;

    public DocEntry: any;
    public query: any;


    constructor(config: any) {
        this.config = config;
        this.xml = xmlRequest;
        this.diServer = this.config.sap_url_server;
        this.SOAPBody = this.config.sap_soap_body;
        this.SOAPResponse = this.config.sap_soap_response;
        this.SOAPResult = this.config.sap_soap_result;
        this.SOAPAction = this.config.sap_soap_action;
    };
    //Creacion del XML
    public createXML(data: any) {
        let document = getTypeDocument(data.header.objType);
        this.action = "Add";
        this.document = xmlVentaClientes;
        this.service = "DraftsService";
        //Cabecera del XML se va para llenar con "Data"
        this.header = this.getHeader(data);
        let address = data.address;
        let bill = data.bill;

        this.body = "<DocumentLines>";

        //Variables apra definir se envia el fete o no a SAP
        let subTotal = 0;
        let taxTotal = 0;
        let tax = 0;
        let transport = 0;
        let limit = 0;
        let localLanguage = '';
        let currency = '';

        data.items.map((item: any) => {
            this.body += this.getBody(item, data);
            //Operaciones para 
            let totalPrice = Number(item.Price * item.quantity);
            subTotal += totalPrice;
            tax = item.taxRate;
            taxTotal += Number(item.taxSum * item.quantity);
            localLanguage = item.localLanguage;
            currency = item.currency;
        });
        //validacion del flete para enviar a SAP
        ////console.log('DataFlete',data);
        limit = parseInt(data.responseFlete.PurchaseLimit);
        transport = parseFloat(data.responseFlete.Price);
        if(subTotal < limit){
            let Flete = {ItemCode:data.responseFlete.ItemCode,quantity:"1",Price: transport}
            this.body += this.getBody(Flete, data);
        }      
        let statesd = {'Aguascalientes': 'AGS','Baja California': 'BC','Baja California Sur': 'BCS','Campeche': 'CAM','Chiapas': 'CHS','Chihuahua': 'CHI','Coahuila': 'COA',
            'Colima': 'COL','Distrito Federal': 'DF','Durango': 'DUR','Estado de México': 'MEX','Guanajuato': 'GTO','Guerrero': 'GRO','Hidalgo': 'HID','Jalisco': 'JAL',
            'Michoacan': 'MCH','Morelos': 'MOR','Nayarit': 'NAY','Nuevo León': 'NL','Oaxaca': 'OAX','Puebla': 'PUE','Queretaro': 'QUE','Quintana Roo': 'QR',
            'San Luis Potosi': 'SLP','Sinaloa': 'SIN','Sonora': 'SON','Tabasco': 'TAB','Tamaulipas': 'TAM','Tlaxcala': 'TLA','Veracruz': 'VER','Yucatan': 'YUC','Zacateca': 'ZAC' };
        let newStateFix = "";
        for (const [key, value] of Object.entries(statesd)) {
            if(key===address.state) newStateFix = value;
        }
        this.body += `</DocumentLines>
        <AddressExtension>
        <ShipToStreet>${address.street}</ShipToStreet>
        <ShipToBlock>${address.block}</ShipToBlock>
        <ShipToCounty>${address.city}</ShipToCounty>
        <ShipToZipCode>${address.cp}</ShipToZipCode>
        <ShipToState>${newStateFix}</ShipToState>
        <ShipToCountry>MX</ShipToCountry>
        <BillToStreet>${bill.street}</BillToStreet>
        <BillToBlock>${bill.block}</BillToBlock>
        <BillToCounty>${bill.city}</BillToCounty>
        <BillToZipCode>${bill.cp}</BillToZipCode>
        <BillToState>${newStateFix}</BillToState>
        <BillToCountry>MX</BillToCountry>
        </AddressExtension>`;
    };
    //Cabecera del XML
    public getHeader(data: any) {
        let today:any = new Date();
        today = moment(today).format('YYYYMMDD');
        let header = `
                <DocType>dDocument_Items</DocType>
                <DocDate>${today}</DocDate>
                <DocDueDate>${today}</DocDueDate>
                <CardCode>${data.header.cardCode}</CardCode>
                <DocCurrency>${data.header.docCurrency}</DocCurrency>
                <Reference1>${data.header.numCard}</Reference1>
                <Comments>${data.header.comments}</Comments>
                <SalesPersonCode>-1</SalesPersonCode>
                <DiscountPercent>${data.header.discount || '0'}</DiscountPercent>
                <DocObjectCode>${data.header.objType}</DocObjectCode>
                {ShipToCode}
                {PayToCode}
                <DocCurrency>${data.header.docCurrency}</DocCurrency>
        `;
        // header = header.replace(/{ownerCode}/, ((data.header.owner !== "") ?  "<DocumentsOwner>" + (data.header.owner || '') + "</DocumentsOwner>": ''));
        header = header.replace('{ShipToCode}', data.header.addressKey ? `<ShipToCode>${data.header.addressKey}</ShipToCode>` : '' );
        header = header.replace('{PayToCode}', data.header.billKey ? `<PayToCode>${data.header.billKey}</PayToCode>` : '' );
        // header = header.replace('{U_FMB_Handel_Creador}', data.header.creator ? `<U_FMB_Handel_Creador>${data.header.creator}</U_FMB_Handel_Creador>` : '' );
        return header;
    };
    public getBody(item: any, data: any) {
        let body = `
                    <DocumentLine>
                        <ItemCode>${item.ItemCode}</ItemCode>
                        <Quantity>${item.quantity}</Quantity>
                        <WarehouseCode>${data.header.wareHouse}</WarehouseCode>
                        <Price>${item.Price}</Price>
                        <UnitPrice>${item.Price}</UnitPrice>
                        <TaxCode>${data.header.taxCode}</TaxCode>
                        <BaseLine nil="true" />
                    </DocumentLine>
        `;
        return body;
    };
    public replaceSapVersion() {
        this.xml = this.xml.replace(/{{SOAPBody}}/g, this.SOAPBody);
        this.xml = this.xml.replace(/{{action}}/g, this.action);
        this.xml = this.xml.replace(/{{document}}/g, this.document);
        this.xml = this.xml.replace(/{{serviceOption}}/g, this.service);
        this.xml = this.xml.replace(/{{header}}/g, this.header);
        this.xml = this.xml.replace(/{{body}}/g, this.body);
    };
    public setOptions() {
        this.replaceSapVersion();
        this.options = {
            url: this.diServer,
            method: 'POST',
            data: this.xml,
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': this.SOAPAction
            }
        };
        ////console.log(this.options);
    }
    public async createCall() {
        let options: any = this.options;
        ////console.log("Options",options);
        try {
            let response: any = await axios.request(options);
            //contestacion de errores
            ////console.log("ResponseOptions",response);
            logger.error("response DiServer :", response.status, ' ', response.data);
            let xml2js = require('xml-js');
            let bodyString = xml2js.xml2json(response.data, {compact: true, spaces: 1});
            ////console.log("bodystring from try",bodyString);
            let jsonObject = JSON.parse(bodyString);

            jsonObject = jsonObject['soap:Envelope']['soap:Body'][this.SOAPResponse][this.SOAPResult];
            ////console.log("Createcall from try",jsonObject);

            return this.getResponseDiServer(jsonObject);
        } catch (e) {
            logger.error("response catch DiServer :", e.status, ' ', e.data);
            let xml2js = require('xml-js');
            let bodyString = xml2js.xml2json(e.data, {compact: true, spaces: 1});
            let jsonObject = JSON.parse(bodyString);

            jsonObject = jsonObject['soap:Envelope']['soap:Body'][this.SOAPResponse][this.SOAPResult];
            ////console.log("Createcall from catch",jsonObject);
            return this.getResponseDiServer(jsonObject);
        }
    }
    public getResponseDiServer(body:any){
        
        const data = {docEntry: null, status: 0};
        ////console.log("getResponceDiServer",data);
        if(this.action === 'Add'){
            try {
                data.docEntry = body['DocumentParams']['DocEntry']._text;
                data.status = 1;
            }catch (e) {
                logger.error(e);
                data.docEntry  = null;
                data.status = 0;
            }
        }
        return data;
    }
}
export default PreliminaryClientes;