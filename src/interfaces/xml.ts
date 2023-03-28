export const xmlRequest:string = `<?xml version="1.0"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <{{SOAPBody}} xmlns="http://mit4.mx/">
                <xmlBufer><![CDATA[<?xml version="1.0"?><env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Header><SessionID>jkz</SessionID></env:Header><env:Body><dis:{{action}} xmlns:dis='http://www.sap.com/SBO/DIS'>
                    {{document}}
                 </dis:{{action}}></env:Body></env:Envelope>]]></xmlBufer>
             </{{SOAPBody}}>
        </soap:Body>
    </soap:Envelope>`;

export const xmlBusinessPartners: string = `
                         <BOM>
                            <BO>
                                <AdmInfo>
                                    <Object>{{serviceOption}}</Object>
                                </AdmInfo>
                                {{QueryParams}}
                                <BusinessPartners>
                                    <row>
                                      {{header}}
                                    </row>
                                </BusinessPartners>
                                {{addresses}}
                                {{methodCodes}}
                          </BO> 
                        </BOM>`;
export const xmlPayments: string = `
                        <BOM>
                            <BO>
                                <AdmInfo>
                                    <Object>{{serviceOption}}</Object>
                                </AdmInfo>
                                <Payments>
                                    <row>
                                        {{header}}
                                    </row>
                                </Payments>
                                <Payments_Invoices>
                                    {{PaymentsInvoices}}
                                </Payments_Invoices>
                            </BO> 
                        </BOM>`;

                        //               {{addresses}}
                        //               {{methodCodes}}
export const xmlVentaClientes:string = `
        <Service>{{serviceOption}}</Service>
            <Document>
                {{header}}
                {{body}}
            </Document>
`;
export const xmlPago:string = `<?xml version="1.0"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
 <soap:Body>
<{SOAPBody} xmlns="http://mit4.mx/">
  <xmlBufer><![CDATA[<?xml version="1.0"?><env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Header><SessionID>jkz</SessionID></env:Header><env:Body><dis:{actionFirme} xmlns:dis='http://www.sap.com/SBO/DIS'>
  <BOM>
  <BO>
      <AdmInfo>
          <Object>{{serviceOption}}</Object>
      </AdmInfo>
      <Payments>
          <row>
              {{header}}
          </row>
      </Payments>
      <Payments_Invoices>
          {{PaymentsInvoices}}
      </Payments_Invoices>
  </BO> 
</BOM>                               
  </dis:{actionFirme}></env:Body></env:Envelope>]]></xmlBufer>
   </{SOAPBody}>
   </soap:Body>
  </soap:Envelope>`;

export const getTypeDocument = (destination :any) => {
        let service: any = "";
        let serviceUpdate: any = "";
        let table: any = '';
        let subTable: any = '';
        switch (destination) {
            case '17':
                table = 'ORDR';
                subTable = 'RDR1';
                service = "OrdersService";
                serviceUpdate = "oOrders";
                break;
            case '13':
                table = 'OINV';
                subTable = 'INV1';
                service = "InvoicesService";
                serviceUpdate = "oInvoices";
                break;
            case '15':
                table = 'ODLN';
                subTable = 'DLN1';
                service = "DeliveryNotesService";
                serviceUpdate = "oDeliveryNotes";
                break;
            case '14':
                table = 'ORIN';
                subTable = 'RIN1';
                break;
            case '16':
                service = "ReturnsService";
                serviceUpdate = "oReturns";
                break;
            case '2':
                service = "BusinessPartnersService";
                serviceUpdate = "oBusinessPartners";
                break;
            case '23':
                table = 'OQUT';
                subTable = 'QUT1';
                service = "QuotationsService";
                serviceUpdate = "oQuotations";
                break;
            case '24':
                service = "oIncomingPayments";
                serviceUpdate = "oIncomingPayments";
                break;
            case '112':
                table = 'ODRF';
                subTable = 'DRF1';
                service = "DraftsService";
                serviceUpdate = "oDrafts";
                break;
            default:
                service = "";
                serviceUpdate = "";
        }

        return {service, serviceUpdate, table, subTable};
    };