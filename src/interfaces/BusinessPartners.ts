import axios from 'axios';
import {xmlRequest, xmlBusinessPartners, getTypeDocument} from "./xml";
import {logger} from "../util/logger";
import { isArray } from 'util';

const responseFormat = (status = 0, message = "", data = null) => {
    return {
        status: status,
        message: message,
        data: data
    }
};


class BusinessPartners {
    public config: any;
    public xml:any;
    public diServer:any;
    public SOAPBody:any;
    public SOAPResponse:any;
    public SOAPResult:any;
    public SOAPAction:any;
    public options:any;
    public document:any;
    public header:any;
    public service:any;
    public addresses:any;
    public action:any;
    public contacts:any;
    public methodCodes:any;
    public queryParams:any;

    constructor(config: any) {
        this.config = config;
        this.xml = xmlRequest;
        this.diServer = this.config.sap_url_server;
        this.SOAPBody = this.config.sap_soap_body;
        this.SOAPResponse = this.config.sap_soap_response;
        this.SOAPResult = this.config.sap_soap_result;
        this.SOAPAction = this.config.sap_soap_action;
    }

    public userFieldsPartner(data: any) {
        let body = "";
        //let userFields = new UserFieldsController();
        //body = userFields.userFieldsPartner(data);

        return body;
    }

    public createXML(data: any) {
        ////console.log("data from Create XML",data);
        let destination = getTypeDocument(data.model.ObjType);

        this.service = destination.serviceUpdate;
        this.action = 'AddObject';
        this.queryParams = '';
        this.document = xmlBusinessPartners;

        this.header = this.getHeader(data);
        this.addresses = this.getAddressesNew(data);
        this.methodCodes = this.getMethods(data);
    }

    public createXMLUpdateAddresses(data: any) {
        let destination = getTypeDocument(data.model.ObjType);

        this.service = destination.serviceUpdate;
        this.action = 'UpdateObject';
        this.queryParams = `<QueryParams><CardCode>${data.model.CardCode}</CardCode></QueryParams>`;
        this.document = xmlBusinessPartners;

        // this.header = this.getHeaderUpdate(data.addressnew);
        this.header = '';
        this.addresses = this.getAddresses(data);
        this.methodCodes = '';
        this.contacts = '';
    }

    public updateXML(data: any) {
        this.queryParams = `<QueryParams><CardCode>${data.model.CardCode}</CardCode></QueryParams>`;
        this.action = 'UpdateObject';
        this.header = this.getHeader(data);

        this.addresses = '';
        data.model.DeliveriesAddress.map((address: any) => {
            this.addresses += this.getAddresses(address);
        });

        data.model.InvoicesAddress.map((address: any) => {
            this.addresses += this.getAddresses(address);
        });

        this.contacts = '';
        data.model.ContactPersons.map((contact: any) => {
            this.contacts += this.getContacts(contact, data);
        });

        this.methodCodes = '';
        data.model.PayMethodCodes.map((method: any) => {
            this.methodCodes += this.getMethods(method);
        });

        let userFields = this.userFieldsPartner(data);
        this.header += userFields;
    }

    public updateXMLPassword(model: any) {
        this.queryParams = `<QueryParams><CardCode>${model.user}</CardCode></QueryParams>`;
        this.action = 'UpdateObject';

        model.update = 0;
        this.document = xmlBusinessPartners;
        //console.log('con°-°model PASSWORD DATA', model);

        let destination = getTypeDocument('2');
        this.service = destination.serviceUpdate;

        let userFieldsPasswords = `
            {CardCode}
            <U_FMB_Handel_Pass>${model.newPass1}</U_FMB_Handel_Pass>        
        `;
        userFieldsPasswords = userFieldsPasswords.replace(/{CardCode}/, (model.update == 0 ? "<CardCode>" + (model.user || '') + "</CardCode>" : ''));

        this.header = userFieldsPasswords;
    }

    public updateXMLPersonalData(model: any) {
        this.queryParams = `<QueryParams><CardCode>${model.user}</CardCode></QueryParams>`;
        this.action = 'UpdateObject';

        model.update = 0;
        this.document = xmlBusinessPartners;

        let destination = getTypeDocument('2');
        this.service = destination.serviceUpdate;

        //console.log('con°-°model PERSONAL DATA', model);

    //model.social
        let personalData = `
            {CardCode}
            <CardName>${model.name}</CardName>
            <FederalTaxID>${model.RFC}</FederalTaxID>
            <Phone1>${model.phone1 || ''}</Phone1>
            <Phone2>${model.phone2 || ''}</Phone2>
        `;
        personalData = personalData.replace(/{CardCode}/, (model.update == 0 ? "<CardCode>" + (model.user || '') + "</CardCode>" : ''));

        this.header = personalData;
    }

    public getHeaderUpdate(data: any) {
        ////console.log('Datos a Guardar UpadateAddress',data);
        let model = data;
        let header = '';

        model.forEach((element: any) => {
            ////console.log("AddressAll:=>",element);
            if(element.AdresType==='B'){
                if(!element.TaxID || element.TaxID !== ""){
                    header = `<FederalTaxID>${element.TaxID}</FederalTaxID>`;
                }
                if(element.cfdi || element.cfdi !== ""){
                    header = header + `<U_FMB_Handel_CFDI>${element.cfdi}</U_FMB_Handel_CFDI>`;
                }
            }
        });
        //header
        return header;
    }

    public getHeader(data: any) {
        ////console.log('Datos a Guardar Address',data);
        let {model} = data;
        let header = `{CardCode}
                    <CardName> ${!model.CardName ? 'nil:"true"' : ''}${model.CardName}</CardName>
                    <CardType>${model.CardType}</CardType>
                    {ShipToDefault}
                    <PeymentMethodCode>${model.PymCode}</PeymentMethodCode>
                    <FederalTaxID>${model.LicTradNum}</FederalTaxID>
                    <Phone1>${model.Phone1}</Phone1>
                    <Phone2>${model.Phone2}</Phone2>
                    <EmailAddress>${model.E_mail}</EmailAddress>
                    <Valid>${model.validFor}</Valid>
                    <ValidFrom nil="true" />
                    <ValidTo nil="true" />
                    <Frozen>${model.validFor == 'Y' ? 'N' : 'Y'}</Frozen>
                    <FrozenFrom nil="true"/>
                    <FrozenTo nil="true" />
                    <AdditionalID>${model.CardCode}</AdditionalID>
                    <GroupCode>${model.GroupCode}</GroupCode>
                    <Currency>${model.Currency}</Currency>
                    <PayTermsGrpCode>${model.GroupNum}</PayTermsGrpCode>
                    <PriceListNum>${model.PriceListNum}</PriceListNum>
                    <U_FMB_Handel_CFDI>${model.MainUsage}</U_FMB_Handel_CFDI>
                    <U_almacen_ecommerce>${'01'}</U_almacen_ecommerce>`;

        header = header.replace(/{CardCode}/, (model.update == 0 ? "<CardCode>" + (model.CardCode || '') + "</CardCode>" : ''));
        header = header.replace(/{ShipToDefault}/, (model.ShipToDef ? "<ShipToDefault>" + (model.ShipToDef || '') + "</ShipToDefault>" : ''));
        header += `
          <U_FMB_Handel_Email>${model.E_mail}</U_FMB_Handel_Email>
          <U_FMB_Handel_Pass>${model.password}</U_FMB_Handel_Pass>
        `;


        return header;
    }

    public getAddresses(data: any) {

        const getAddress = (address:any, data:any, index: Number) => {
            let returnAddress = `
               <row>
                   <AddressName>${address.Address}</AddressName>
                   <Street>${address.Street}</Street>
                   <Block>${address.Block}</Block>
                   <ZipCode>${address.ZipCode}</ZipCode>
                   <City>${address.City}</City>
                   <County>${address.County}</County>
                   <Country>${address.Country}</Country>
                   <State>${address.State}</State>
                   <TaxCode>${address.TaxCode}</TaxCode>
                   <StreetNo>${address.StreetNo}</StreetNo>
                   <BuildingFloorRoom>${address.Building}</BuildingFloorRoom>
                   <GlobalLocationNumber>${address.GlblLocNum}</GlobalLocationNumber>
                   <AddressType>${address.TypeOfAddress}</AddressType>
               </row>
        `;
            return returnAddress;
        }

        let addresses= '';
        if(!data.model.DeliveriesAddress.length){
            return addresses;
        }
        addresses = '<BPAddresses>';
        data.model.DeliveriesAddress.map((address: any, index: Number) => {
            addresses += getAddress(address, data, index);
        });
        addresses += '</BPAddresses>';

        return addresses;
    }

    public getAddressesNew(data: any) {
        ////console.log("data from getAddressNew",data);
        const getAddress = (address:any, data:any) => {
            let returnAddress = `
               <row>
                   <AddressName>${address.Address}</AddressName>
                   <Street>${address.Street}</Street>
                   <Block>${address.Block}</Block>
                   <ZipCode>${address.ZipCode}</ZipCode>
                   <City>${address.City}</City>
                   <County>${address.County}</County>
                   <Country>${address.Country}</Country>
                   <State>${address.State}</State>
                   <TaxCode>${address.TaxCode}</TaxCode>
                   <StreetNo>${address.StreetNo}</StreetNo>
                   <BuildingFloorRoom>${address.Building}</BuildingFloorRoom>
                   <GlobalLocationNumber>${address.GlblLocNum}</GlobalLocationNumber>
                   <AddressType>${address.TypeOfAddress}</AddressType>   
               </row>
        `;
            return returnAddress;
        }
        
        let addresses= '';
        if(!data.model.DeliveriesAddress.length){
            return addresses;
        }
        addresses = '<BPAddresses>';
        data.model.DeliveriesAddress.map((address: any) => {
            addresses += getAddress(address, data);
        });
        data.model.BillingAddress.map((address: any) => {
            addresses += getAddress(address, data);
        });
        addresses += '</BPAddresses>';
        //Imprime el xml a enviar
        ////console.log(addresses);

        return addresses;
    }

    public getContacts(contact: any, data: any) {
        //<CardCode></CardCode>
        let contacts = `
               <row>
               
               <Name>${contact.Name}</Name>
               <Active>${contact.Active}</Active>
               <FirstName>${contact.FirstName}</FirstName>
               <Title>${contact.Title}</Title>
               <MiddleName>${contact.MiddleName}</MiddleName>
               <Position>${contact.Position}</Position>
               <LastName>${contact.LastName}</LastName>
               <Phone1>${contact.Tel1}</Phone1>
               <Phone2>${contact.Tel2}</Phone2>
               <MobilePhone>${contact.Cellolar}</MobilePhone>
               <Fax>${contact.Fax}</Fax>
               <E_Mail>${contact.E_MailL}</E_Mail>
               <Remarks1>${contact.Notes1}</Remarks1>
               <Remarks2>${contact.Notes1}</Remarks2>
               </row>  
        `;

        return contacts;
    }

    public deleteXMLAddress(model: any) {
        // console.log('con<<<<<<<<<<<',model.model.CardCode, model.model.DeliveriesAddress);
        this.queryParams = `<QueryParams><CardCode>${model.model.CardCode}</CardCode></QueryParams>`;
        this.action = 'UpdateObject';

        model.update = 0;
        this.document = xmlBusinessPartners;
        //console.log('con°-°model PASSWORD DATA', model);

        let destination = getTypeDocument('2');
        this.service = destination.serviceUpdate;


        let body: any;
        body = '';
        model.model.DeliveriesAddress.map((address: any) =>{
            body += `
                <BPAddress>
                <AddressName>${address.Address}</AddressName>
                <Street>${address.Street}</Street>
                <Block>${address.Block}</Block>
                <ZipCode>${address.ZipCode}</ZipCode>
                <City>${address.City}</City>
                <County>${address.County}</County>
                <Country>${address.Country}</Country>
                <State>${address.State}</State>
                <TaxCode>${address.TaxCode}</TaxCode>
                <StreetNo>${address.StreetNo}</StreetNo>
                <BuildingFloorRoom>${address.Building}</BuildingFloorRoom>
                <GlobalLocationNumber>${address.GlblLocNum}</GlobalLocationNumsber>
                <AddressType>${address.TypeOfAddress}</AddressType> `;
          });
        body += '</BPAddress>'

        let userFieldsPasswords = `
            {CardCode}   
            <BPAddresses>${body}</BPAddresses>   
        `;
        userFieldsPasswords = userFieldsPasswords.replace(/{CardCode}/, (model.model.update == 0 ? "<CardCode>" + (model.model.CardCode || '') + "</CardCode>" : ''));

        this.header = userFieldsPasswords;
    }

    public getMethods(data: any) {

        const getMethods = (methods: any, data: any) => {
            let method = `
               <row>
               <PaymentMethodCode>${methods.PymCode}</PaymentMethodCode>
               </row>  
        `;
        return method;
        };

        let methods = '';
        
        if(!data.model.PayMethodCodes.length){
            return methods;
        }
        methods = '<BPPaymentMethods>';
        data.model.PayMethodCodes.map((method: any) => {
            methods += getMethods(method, data);
        });
        methods  += '</BPPaymentMethods>';
        return methods;
    }

    public replaceSapVersion() {
        this.xml = this.xml.replace(/{{SOAPBody}}/g, this.SOAPBody);
        this.xml = this.xml.replace(/{{action}}/g, this.action);
        this.xml = this.xml.replace(/{{document}}/g, this.document);
        this.xml = this.xml.replace(/{{serviceOption}}/g, this.service);
        this.xml = this.xml.replace(/{{header}}/g, this.header);
        this.xml = this.xml.replace(/{{addresses}}/g, this.addresses);
        this.xml = this.xml.replace(/{{contacts}}/g, this.contacts);
        this.xml = this.xml.replace(/{{methodCodes}}/g, this.methodCodes);
        this.xml = this.xml.replace(/{{QueryParams}}/g, this.queryParams);
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
            // console.log("con°-°ResponseOptions---------------",response);
            let xml2js = require('xml-js');
            let bodyString = xml2js.xml2json(response.data, {compact: true, spaces: 1});
            let jsonObject = JSON.parse(bodyString);
            // console.log('con<',jsonObject['soap:Envelope']['soap:Body']['RegisterNewDocumentsResponse']['RegisterNewDocumentsResult']['env:Envelope']['env:Body']['env:Fault']['env:Reason']['env:Text']['_text']);
            jsonObject = jsonObject['soap:Envelope']['soap:Body'][this.SOAPResponse][this.SOAPResult];
            return this.getResponseDiServer(jsonObject);
        } catch (e) {
            
            logger.error("con°-°response catch DiServer :", e.status, ' ', e.data);
            try{
                let xml2js = require('xml-js');
                let bodyString = xml2js.xml2json(e.data, {compact: true, spaces: 1});
                let jsonObject = JSON.parse(bodyString);

                jsonObject = jsonObject['soap:Envelope']['soap:Body'][this.SOAPResponse][this.SOAPResult];
                return this.getResponseDiServer(jsonObject);
            }catch {
                logger.error("response Posible creacion :");
                return this.getResponseDiServer(null);
            }

        }
    }


    public getResponseDiServer(body:any){
        
        const data = {cardCode: null, error: '', status: 0};
        if(!body){
            data.status = 1;
            return data;
        }

            try {
                // //console.log('con<...........',body['DocumentParams']);
                data.cardCode = body['DocumentParams']['DocEntry']._text;
                data.status = 1;
            }catch (e) {
                logger.error(e);
                try {
                    data.error = body['env:Envelope']['env:Body']['env:Fault']['env:Reason'];
                    data.error = 'Ocurrio un error al crear tu cuenta. Intentalo mas tarde';
                }catch (e) {
                    logger.error(e);
                    data.error = 'Ocurrio un error un error en el servidor';
                }
        }
        return data;
    }

}

export default BusinessPartners;