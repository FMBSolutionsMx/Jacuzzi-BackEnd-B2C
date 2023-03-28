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

class VentasClientes {

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
    }

    public createXML(data: any) {
        let document = getTypeDocument(data.header.objType);
        
        this.action = "Add";
        this.document = xmlVentaClientes;
        this.service = data.header.service // document.service; //"DraftsService"; //
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
        //#########################################itemsGift##############################################

        let datos : any;
        let stockBonificacion = false;
        let articulosbonificacion = '';
        let quiebreStock : any =[];
        if(data.itemsGift.length > 0){
            for (let i = 0; i < data.itemsGift.length; i++) {
                const itembonificacion = data.itemsGift[i];
                let final = itembonificacion.bonificacion.comment ? itembonificacion.bonificacion.comment.indexOf('/') : '';
                let cantidadAntesDeOrden =  itembonificacion.bonificacion.comment ? itembonificacion.bonificacion.comment.slice(13, final) : '';
                // //console.log('con<',itembonificacion.bonificacion.idProducto , itembonificacion.bonificacion.comment, cantidadAntesDeOrden);
                // // // // // // datos = await sh.statements(`SELECT "ItemCode", "ItemName","U_SYP_RICO_CDIM2" FROM "B1H_MARCHABLANCA"."OITM" WHERE  "ItemCode" = '${itembonificacion.bonificacion.idProducto}';`);
                if(cantidadAntesDeOrden == '0'){
                    stockBonificacion = true;
                    articulosbonificacion += itembonificacion.bonificacion.idProducto +' : '+ itembonificacion.bonificacion.cantidad +', ';
                    // quiebreStock += '<h4><a style="color: #FF0000; padding-top: 1px;">-producto '+datos[0].ItemName +' : '+ itembonificacion.bonificacion.cantidad +' unidades. </a></h4>';
                }
                if(cantidadAntesDeOrden != '0'){
                    this.body += this.getBodyBonificacion(itembonificacion.bonificacion, data);
                    
                }
            }  
        }
        //#########################################itemsGift##############################################
        

        //validacion del flete para enviar a SAP
        ////console.log('DataFlete',data);
        limit = parseInt(data.responseFlete.PurchaseLimit);
        transport = parseFloat(data.responseFlete.Price);
        // if(subTotal < limit){
        //     let Flete = {ItemCode:data.responseFlete.ItemCode,quantity:"1",Price: transport, itemPoint: 0}
        //     this.body += this.getBody(Flete, data);
        // }

        // Seguro de artículo
        // if(data.header.insurance != ''){
        //     this.body += this.getBody(data.insurance, data);  
        // }
          

       let statesd = {'Aguascalientes': 'AGS',
'Baja California': 'BC',
'Baja California Sur': 'BCS',
'Campeche': 'CAM',
'Chiapas': 'CHS',
'Chihuahua': 'CHI',
'Coahuila': 'COA',
'Colima': 'COL',
'Distrito Federal': 'DF',
'Durango': 'DUR',
'Estado de México': 'MEX',
'Guanajuato': 'GTO',
'Guerrero': 'GRO',
'Hidalgo': 'HID',
'Jalisco': 'JAL',
'Michoacan': 'MCH',
'Morelos': 'MOR',
'Nayarit': 'NAY',
'Nuevo León': 'NL',
'Oaxaca': 'OAX',
'Puebla': 'PUE',
'Queretaro': 'QUE',
'Quintana Roo': 'QR',
'San Luis Potosi': 'SLP',
'Sinaloa': 'SIN',
'Sonora': 'SON',
'Tabasco': 'TAB',
'Tamaulipas': 'TAM',
'Tlaxcala': 'TLA',
'Veracruz': 'VER',
'Yucatan': 'YUC',
'Zacateca': 'ZAC' };
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
        //aqui va todo el codigo de direccion de envio y facturacion

    }

    public getHeader(data: any) {
        // //console.log('con< getHeader:', data.header.estado); <U_FMB_Estado>${data.header.estado}</U_FMB_Estado>
        let today:any = new Date();
        today = moment(today).format('YYYYMMDD');
        today = '20211110'

        let header = `
                <DocType>dDocument_Items</DocType>
                <DocObjectCode>${data.header.objType}</DocObjectCode>
                <EDocStatus>C</EDocStatus>
                <EDocSeries>0</EDocSeries>
                <EDocGenerationType>N</EDocGenerationType>
                <EDocExportFormat>1</EDocExportFormat>
                <PaymentMethod>${data.header.paymentMethod}</PaymentMethod>
                <PaymentGroupCode>1</PaymentGroupCode>
                <ReserveInvoice>tNO</ReserveInvoice>
                <DocDate>${today}</DocDate>
                <DocDueDate>${today}</DocDueDate>
                <TaxDate>${today}</TaxDate>
                {U_FMB_Handel_address}
                <Series>${data.header.serie}</Series>
                {ShipToCode}
                {PayToCode}
                <CardCode>${data.header.cardCode}</CardCode>
                <DiscountPercent>${data.header.discPrcnt || 0}</DiscountPercent>
                <DocCurrency>${data.header.docCurrency}</DocCurrency>
                
                {SlpCode}
                {Comments}
                <U_FMB_Handel_PNTT>${data.header.totalPoints || 0}</U_FMB_Handel_PNTT>
                <U_FMB_Handel_PKG>${data.header.IdPackge || ''}|${data.header.packageKeySelect||''}|${data.header.convenio ||''}</U_FMB_Handel_PKG>
                <U_FMB_Handel_PPKG>${data.header.PorCobrar === true ? 1 : 2}</U_FMB_Handel_PPKG>
                <U_FMB_Handel_NUCN>${data.header.PorCobrar === false ? data.header.convenio : ''}</U_FMB_Handel_NUCN>
                <U_FMB_Handel_TENT>${data.header.tipoEntrega === 'toAddress' ? 1 : 2}</U_FMB_Handel_TENT>
                <U_FMB_Handel_SUBS>${data.header.dataInsertMinus !== 0 ? data.header.dataInsertMinus : 0}</U_FMB_Handel_SUBS>
        `;
        
        header = header.replace('{ShipToCode}', data.header.addressKey ? `<ShipToCode>${data.header.addressKey}</ShipToCode>` : '' );
        header = header.replace('{SlpCode}', data.header.empID ? ` <SalesPersonCode>${data.header.empID}</SalesPersonCode>` : '' );
        header = header.replace('{PayToCode}', data.header.billKey ? `<PayToCode>${data.header.billKey}</PayToCode>` : '' );
        header = header.replace('{Comments}', data.header.comment ? `<Comments>${data.header.comment}</Comments>` : '' );
        header = header.replace('{U_FMB_Handel_address}', data.header.comments ? `<U_FMB_Handel_address>${data.header.comments}</U_FMB_Handel_address>` : '' );
        // header = header.replace('{U_FMB_Handel_Creador}', data.header.creator ? `<U_FMB_Handel_Creador>${data.header.creator}</U_FMB_Handel_Creador>` : '' );
        return header;
    }


    public getBody(item: any, data: any) {
        let body = `
                    <DocumentLine>
                        <ItemCode>${item.ItemCode}</ItemCode>
                        <Quantity>${item.quantity}</Quantity>
                        <Currency>${item.currency}</Currency>
                        <WarehouseCode>${item.WhsCode || data.header.wareHouse}</WarehouseCode>
                        <Price>${item.Price}</Price>
                        <UnitPrice>${item.Price}</UnitPrice>
                        <TaxCode>${data.header.taxCode}</TaxCode>
                        {LineTotal}
                        <BaseLine nil="true" />
                        <BaseType>-1</BaseType>
                        <DiscountPercent>${item.discount || 0}</DiscountPercent>
                        <BaseEntry nil="true" />
                        <U_FMB_Handel_PNTA>${item.itemPoint || 0}</U_FMB_Handel_PNTA>
                    </DocumentLine>
        `;
        body = body.replace('{LineTotal}', item.discount ? item.discount == 99.99 ? `<LineTotal>${0.01}</LineTotal>` : '' : '' );

        // //console.log("body", body);
        return body;
    }

    public getBodyBonificacion(item: any, data: any) {
        let body = `
                    <DocumentLine>
                        <ItemCode>${item.idProducto}</ItemCode>
                        <Quantity>${item.cantidad}</Quantity>
                        <Currency>${data.header.docCurrency}</Currency>
                        <WarehouseCode>${data.header.wareHouse}</WarehouseCode>
                        <Price>0</Price>
                        <UnitPrice>0</UnitPrice>
                        <TaxCode>${data.header.taxCode}</TaxCode>
                        <BaseLine nil="true" />
                        <BaseType>-1</BaseType>
                        <DiscountPercent>0</DiscountPercent>
                        <BaseEntry nil="true" />
                        <U_FMB_Comentario>${item.comment ? item.comment : ''}</U_FMB_Comentario>
                    </DocumentLine>
        `;
        return body;
    }

    public replaceSapVersion() {
        this.xml = this.xml.replace(/{{SOAPBody}}/g, this.SOAPBody);
        this.xml = this.xml.replace(/{{action}}/g, this.action);
        this.xml = this.xml.replace(/{{document}}/g, this.document);
        this.xml = this.xml.replace(/{{serviceOption}}/g, this.service);
        this.xml = this.xml.replace(/{{header}}/g, this.header);
        this.xml = this.xml.replace(/{{body}}/g, this.body);
    }

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
        try {
            let response: any = await axios.request(options);
            console.log('con>response',response)
            logger.error("response DiServer :", response.status, ' ',  response.statusText);
            let xml2js = require('xml-js');
            let bodyString = xml2js.xml2json(response.data, {compact: true, spaces: 1});
            let jsonObject = JSON.parse(bodyString);
            // console.log('con<<<<<<<<<<<<<<<<<<<<<<<<',jsonObject['soap:Envelope']['soap:Body']['RegisterNewDocumentsResponse']['RegisterNewDocumentsResult']['env:Envelope']['env:Body']['env:Fault']['env:Reason']['env:Text']['_text'] );
            jsonObject = jsonObject['soap:Envelope']['soap:Body'][this.SOAPResponse][this.SOAPResult];

            return this.getResponseDiServer(jsonObject);
        } catch (e) {
            logger.error("response catch DiServer :", e.status, ' ', e.data);
            let xml2js = require('xml-js');
            let bodyString = xml2js.xml2json(e.data, {compact: true, spaces: 1});
            let jsonObject = JSON.parse(bodyString);

            jsonObject = jsonObject['soap:Envelope']['soap:Body'][this.SOAPResponse][this.SOAPResult];
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

    public xmlUpdate: any = `<?xml version="1.0"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <{SOAPBody} xmlns="http://mit4.mx/">
                  <xmlBufer><![CDATA[<?xml version="1.0"?>
    <env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">
      <env:Header>
        <SessionID>jkz</SessionID>
      </env:Header>
      <env:Body>
        <dis:UpdateObject xmlns:dis="http://www.sap.com/SBO/DIS">
          <BOM>
            <BO>
              <AdmInfo>
                <Object>{serviceOptions}</Object>
              </AdmInfo>
              <QueryParams>
                <DocEntry>{DocEntry}</DocEntry>
              </QueryParams>
              <Documents>
                    <row>
                        {header}
                    </row>
                </Documents>
                <Document_Lines>
                        {body}
                </Document_Lines>
            </BO> 
          </BOM>
        </dis:UpdateObject>
      </env:Body>
    </env:Envelope>]]></xmlBufer>
                </{SOAPBody}>
              </soap:Body>
            </soap:Envelope>`;

    public updateOrdersStatus(data:any,status:any){
        this.action = "UpdateObject";
        this.query = "";
        this.DocEntry = data.header.DocEntry;
        this.service = 'oOrders';
        this.header = this.getHeaderStatusOrder(status);
        this.body = "";   
    }

    private getHeaderStatusOrder(data: any) {

        let header = `<U_FMB_Estado>C</U_FMB_Estado>`;    
        
        return header;
    }

    public replaceSapVersionUpdate() {
        this.xml =  this.xmlUpdate.replace(/{SOAPBody}/g, this.SOAPBody);
        this.xml =  this.xml.replace(/{header}/g, this.header);
        this.xml =  this.xml.replace(/{body}/g, this.body);
        this.xml =  this.xml.replace(/{DocEntry}/g, this.DocEntry);
        this.xml =  this.xml.replace(/{actionFirme}/g, this.action);
        this.xml =  this.xml.replace(/{serviceOptions}/g, this.service);
        this.xml =  this.xml.replace(/{query}/g, this.query);
    }

    public Createcall() {
        let request:any = require('request');
        let options:any =  this.options;
        let version  = "v91";
   
        //console.log('con> XML', this.xml);
        return new Promise( (resolve, reject) => {
            request(options, (error: any, response: any, body: any) => {
               
              
                if (!error && response.statusCode == 200) {
                    let xml2js = require('xml-js');
                    
                    let bodyString = body.toString().replace(/env:/g, "").replace(/soap:/g, "");
                    bodyString = xml2js.xml2json(bodyString, {compact: true, spaces: 4});
                    let jsonObject = JSON.parse(bodyString);
                    // //console.log(JSON.stringify(jsonObject));
                    try {
                        var response: any;
                     response = jsonObject.Envelope.Body;

                        switch (version) {
                            case "v91":
                                response = response.RegisterNewDocumentsResponse.RegisterNewDocumentsResult;
                                
                                break;
                            default:
                                response = null;
                                break;
                        }

                        resolve(responseFormat(1, "response",response));

                    }catch (e) {
                        logger.error("SAPFirme-> Createcall-> ",e);
                        reject(responseFormat(0, "Error En La Petición"));
                    }
                }else{
                    let xml2js = require('xml-js');
                    
                    let bodyString = body.toString().replace(/env:/g, "").replace(/soap:/g, "");
                    bodyString = xml2js.xml2json(bodyString, {compact: true, spaces: 4});
                    let jsonObject = JSON.parse(bodyString);
                   ////console.log(JSON.stringify(jsonObject));
                    try {
                        var response: any;                        
                        response = jsonObject.Envelope.Body;
                      
                        resolve(responseFormat(1, "response",response));
                    }catch (e) {
                        logger.error("SAPFirme-> Createcall-> ",e);
                        resolve(responseFormat(0, "Error En La Petición"));
                    }
                }
            })
        })
    }

}

export default VentasClientes;