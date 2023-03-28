import moment from "moment";
import axios from 'axios';
import {xmlRequest, xmlPayments,xmlPago, getTypeDocument} from './xml'
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
        // this.diServer = 'http://192.168.0.181/WSB1/Service.asmx?WSDL';
        this.diServer = 'http://10.10.15.2/WSB1/Service.asmx?WSDL'; 

        this.SOAPBody = 'NewEntryPayments';
        this.SOAPResponse = 'NewEntryPaymentsResponse';
        this.SOAPResult = 'NewEntryPaymentsResult';
        this.SOAPAction = 'http://mit4.mx/NewEntryPayments';
    }

    public createXML(data: any) {
        let document = getTypeDocument(data.header.objType);
        
        this.action = "AddObject";
        this.document = xmlPayments;
        this.service = data.header.service // document.service; //"DraftsService"; //
        this.header = this.getHeader(data);
        this.body = this.getBody(data);
        // this.checks = this.getBody(data);

    }

    public getHeader(data: any) {

        // Fecha del documento
        let today:any = new Date();
        today = moment(today).format('YYYYMMDD');
        // today = moment(today).format('YYYY-MM-DD');

        // Inofrmación del pago
        let header = `
                                        <Series>${data.header.serie}</Series>
                                        <CardCode>${data.header.CardCode}</CardCode>
                                        <DocTypte>C</DocTypte>
                                        <Address/>
                                        <ContactPersonCode/>
                                        <DocDate>${today}</DocDate>
                                        <TaxDate>${today}</TaxDate>
                                        <DueDate>${today}</DueDate>
                                        <DocObjectCode>bopot_IncomingPayments</DocObjectCode>
                                        <DocCurrency>$</DocCurrency>
                                        <JournalRemarks/>
                                        <Remarks>Pago realizado en e-Handel</Remarks>
                                        <CounterReference/>
                                        <U_CFDI33_FPAGO>${data.header.seleccion}</U_CFDI33_FPAGO>
                                        <U_COK1_01FORMPAG33>${data.header.seleccion}</U_COK1_01FORMPAG33>
                                        {cash}
                                        {transfer}
                                        <TransferDate>${today}</TransferDate>
                                        <TransferReference/>
                                        {check}
                                        <IsPayToBank>tNO</IsPayToBank>
                                        <ControlAccount />
        `;
        
        header = header.replace('{cash}', data.header.typePayment === 'efectivo' ? `<CashAccount>${data.header.cuentaMayor}</CashAccount><CashSum>${data.header.DocTotal}</CashSum>` : `<CashAccount/><CashSum>0</CashSum>` );
        header = header.replace('{transfer}', data.header.typePayment === 'transfer' ? `<TransferAccount>${data.header.cuentaMayor}</TransferAccount><TransferSum>${data.header.DocTotal}</TransferSum>` : `<TransferAccount/><TransferSum/>` );
        // header = header.replace('{check}', data.header.typePayment === 'cheque' ? `<CheckAccount>${data.header.cuentaMayor}</CheckAccount>` : `<CheckAccount/>` );
        return header;
    }


    public getBody(data: any) {
        let body = `
                                    <row>
                                        <DocEntry>${data.items.DocEntry}</DocEntry>
                                        <InvoiceType>13</InvoiceType>
                                        <DistributionRule/>
                                        <DistributionRule2/>
                                        <DistributionRule3/>
                                        <DistributionRule4/>
                                        <SumApplied>${data.items.DocTotal}</SumApplied>
                                    </row>
        `;
        return body;
    }

    public getBodyCheck(data: any) {
        // Fecha del documento
        let today:any = new Date();
        today = moment(today).format('YYYYMMDD');
        let body = `
            <row>
                <DueDate>${today}</DueDate>
                <CheckSum>1</CheckSum>
                <CountryCode>MX</CountryCode>
                <BankCode>0001</BankCode>
                <Branch>015</Branch>
                <AccounttNum>234</AccounttNum>
                <Trnsfrable>N</Trnsfrable>
                <CheckNumber>2</CheckNumber>
                <CheckAccount>2</CheckAccount>
            </row>
        `;
        return body;
    }


    public replaceSapVersion() {
        this.xml = this.xml.replace(/{{SOAPBody}}/g, this.SOAPBody);
        this.xml = this.xml.replace(/{{action}}/g, this.action);
        this.xml = this.xml.replace(/{{document}}/g, this.document);
        this.xml = this.xml.replace(/{{serviceOption}}/g, this.service);
        this.xml = this.xml.replace(/{{header}}/g, this.header);
        this.xml = this.xml.replace(/{{PaymentsInvoices}}/g, this.body);
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
    }

    public async createCall() {
        let options: any = this.options;
        try {
            let response: any = await axios.request(options);
            //contestacion de errores
            console.log("Response", response);
            
            logger.error("response DiServer :", response.status, ' ',  response.statusText);
            let xml2js = require('xml-js');
            let bodyString = xml2js.xml2json(response.data, {compact: true, spaces: 1});
            // console.log("con<<< bodystring from try",bodyString);
            let jsonObject = JSON.parse(bodyString);
            jsonObject = jsonObject['soap:Envelope']['soap:Body'][this.SOAPResponse][this.SOAPResult];
            // console.log("Createcall from try",jsonObject);
            return this.getResponseDiServer(jsonObject);
        } catch (e) {
            console.log("Response error", e);

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
        // console.log("getResponceDiServer",body);
        if(this.action === 'AddObject'){
            try {
                data.docEntry = body['AddObjectResponse']['RetKey']['_text'];
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

export default VentasClientes;