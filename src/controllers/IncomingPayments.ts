import {Request, Response} from "express";
import IncomingPayments from '../interfaces/IncomingPayments';
import ResponseModel from "../models/ResponseModel";
import {getTypeDocument} from '../interfaces/xml';
import SeriesProcedure from "../procedures/SeriesProcedure";
import { SchemaService } from "../util/Schema";
import moment from "moment";
import { logger } from "../util/logger";

export async function createPayment(request: Request, response: Response) {
  const {sapConfig,type} = response.locals.business;
  const {CardCode, DocEntry, DocTotal,objType,seleccion } = request.body;
  
  //Se define el nuemro de seríe 
  let serie;
  // Se define la cuenta de mayor
  let cuentaMayor;
  await SeriesProcedure('getInfoPayment').then(result => {
      serie = result[0].seriePayment;
      cuentaMayor = result[0].majorAccount;
  });

    if(type === 'SQL'){
        // Numero de documento
        let doc = getTypeDocument(objType);
        let service = doc.service

        // Tipo de pago
        let typePayment = 'transfer'


        // Lienas del pago
        let itemsRow = {
            DocEntry : DocEntry,
            DocTotal : DocTotal,
        }

        // Datos para el pago
        let data = {
            header: { 
            objType, 
            serie, 
            CardCode, 
            DocTotal,
            service, 
            typePayment,
            cuentaMayor ,
            seleccion
            },
            items: {
            DocEntry : DocEntry,
            DocTotal : DocTotal,
            },
        };

        const incomingPaymentsInterface = new IncomingPayments(sapConfig);

        incomingPaymentsInterface.createXML(data);
        incomingPaymentsInterface.setOptions();
        let responseDiServer:any = await incomingPaymentsInterface.createCall();

        // modelo de respuesta
        const responseModel = new ResponseModel();

        console.log("rsponse di server",responseDiServer);
        if(responseDiServer.status === 1){
            responseModel.message = `Pago creado correctamente ${responseDiServer.docEntry}`;
            responseModel.status = 1;
            responseModel.data = { docNum: responseDiServer.docEntry };
        }else{
            responseModel.message = 'El pago no se ceo de forma correcta';
            responseModel.status = 0;
        }
        response.json(responseModel);
    }else{
        const sh = new SchemaService ();
        const responseModel = new ResponseModel();
        let today:any = new Date();
        today = moment(today).format('YYYYMMDD');
        let dataBill = await sh.getDocument("Invoices",DocEntry);
        // console.log('con<',dataBill);

        let dataTransfer = {
            CardCode: CardCode,
            Series : serie,
            DocTypte : 'C',
            Address: dataBill.Address,
            ContactPersonCode : dataBill.ContactPersonCode,
            DocDate : today,
            TaxDate : today,
            DueDate : today,
            DocObjectCode: 'bopot_IncomingPayments',
            DocCurrency: dataBill.DocCurrency,
            Remarks : "Pago recibido desde Ecommerce de la Factura #" + dataBill.DocNum,
            CashSum : '0',
            TransferAccount : cuentaMayor,
            TransferSum: dataBill.DocTotal,
            TransferDate: today,
            // TransferReference: reference,
            IsPayToBank : 'tNO',
            PaymentInvoices : [{
                DocEntry: DocEntry,
                InvoiceType : 'it_Invoice',
                SumApplied : dataBill.DocTotal,
                U_parcialidad: 1
            }]
        }

        let paymentsResponse = await sh.NewOrderService('IncomingPayments',dataTransfer);

        if(paymentsResponse.message){
            let error = paymentsResponse.message.error.message.value;
            // console.log('con<',error);
            logger.error("Payment => ",error);
            responseModel.message = error;
            response.json(responseModel);
            return;
        }
        // console.log('con<',paymentsResponse.DocEntry);

        responseModel.message = `Pago creado correctamente ${paymentsResponse.DocEntry}`;
        responseModel.status = 1;
        responseModel.data = { docNum: paymentsResponse.DocEntry };

        response.json(responseModel);
    }
}