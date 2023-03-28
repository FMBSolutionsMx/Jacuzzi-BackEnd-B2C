import {Request, Response} from "express";
import ProductsModel from "../models/ProductsModel";
import OrdersModel from "../models/OrdersModel";
import CategoriesModel from "../models/CategoriesModel";
import ResponseModel from "../models/ResponseModel";
import {getProfile} from "./ProfileController";
import {getTaxes} from "./CatalogsController";
import { exists } from "fs";
import { logger } from "../util/logger";
import ProductsProcedure from "../procedures/ProductsProcedure";
import OrdersProcedure from "../procedures/OrdersProcedure";
import AutorizacionesProcedure from "../procedures/AutorizacionesProcedure";
import { helpers } from "../middleware/helper";
import EmailProcedure from "../procedures/EmailProcedure";
import { DatabaseService } from "../util/dataBase";
import VentasClientes from "../interfaces/VentasClientes";
import CatalogsModel from "../models/CatalogsModel";
import CatalogsProcedure from "../procedures/CatalogsProcedures";
import { insertPoints } from "../controllers/PointsHistoryController";
import {getTypeDocument} from '../interfaces/xml';
import { SchemaService } from "../util/Schema";

let fs = require('fs');
let path = require('path');

export async function getAutorizaciones(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    const { user, type } = request.body;
    let responseModel = new ResponseModel();
    try {

        let data = {
            actions : 'Autorization',
            param1 : type, 
            param2 : user
        }
        
        let result = await AutorizacionesProcedure(data);
        
        responseModel.status = 1;
        responseModel.data = { list: result};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function detailsAutorization(request: Request, response: Response) {
    const { db_name } = response.locals.business;
    const {profile_id} = response.locals.user;
    const { docEntry } = request.params;
    const {CardCode} = response.locals.user;

    const responseModel = new ResponseModel();

    if(!profile_id || !docEntry){
        responseModel.message = "no tienes permiso de realizar esta acción";
        responseModel.data = [];
    }
    let list = JSON.parse(docEntry);
    try {
        let data = {
            actions : 'DetailsAutorization',
            param1 : list,
        }

        let responseBody = await AutorizacionesProcedure(data);

        responseModel.message = "información del pedido";
        responseModel.status = 1;
        responseModel.data = {body: responseBody};
        ////console.log("data model", responseModel);
        response.json(responseModel);
    }catch (e) {
      logger.error(e);
        responseModel.message = "ocurrio un problema al traer la información del pedido";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function createAutorization(request: Request, response: Response) {
    const {db_name, sapConfig, taxCode, currency, paymentMethod,type,wareHouse} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {CardCode} = response.locals.user;
    const {U_FMB_Handel_Email} = response.locals.user;
    const {CardName} = response.locals.user;
    const {DocEntry, Usuario, WstCode, tipo} = request.body;
    
    if(type === 'SQL'){
    const db = new DatabaseService();
    const responseModel = new ResponseModel();
    let responseDiServer:any = '';
    try {
        let ordersResponse:any = '';
        let reason:any ='';
        try {
            await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_WDD1] SET U_Status = 'Y', U_UpdateDate = GETDATE() WHERE U_WddCode = ${DocEntry} AND U_UserID = ${Usuario} AND U_StepCode=${WstCode} AND U_Remarks ='${tipo}'`);
            
            let resultado = await db.Query(`SELECT * FROM [Handel_B2C_Irco].[dbo].[FMB_OWDD] WHERE U_DocEntry = ${DocEntry} AND U_CurrStep=${WstCode} AND U_Remarks ='${tipo}'`);
            resultado = resultado.recordset;
            for (let index = 0; index < resultado.length; index++) {
                const resul = resultado[index];
                let MaxReqr  = resul.U_MaxReqr;
                let StepCode  = resul.U_CurrStep;

                let datos = await db.Query(`SELECT * FROM [Handel_B2C_Irco].[dbo].[FMB_WDD1] WHERE U_WddCode =${DocEntry} AND U_StepCode = ${StepCode} AND U_Remarks ='${tipo}'`);
                let acept = 0;
                datos = datos.recordset;
                for (let index = 0; index < datos.length; index++) { 
                    const dat = datos[index];
                    if (dat.U_Status === 'Y'){
                        acept++;
                    }
                } 
                if(acept === MaxReqr){
                    let flag = false;
                    let resul = await db.Query(`SELECT * FROM [Handel_B2C_Irco].[dbo].[FMB_OWDD] WHERE U_DocEntry = ${DocEntry}`);
                    resul = resul.recordset;
                    
                    for (let index = 0; index < resul.length; index++) {
                        const resu = resul[index];
                        if(resu.Name === (Usuario).toString() || resu.Name === null){
                            flag = true;
                        }
                    }

                    if(flag){
                        await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_OWDD] SET U_Status = 'Y', Name = ${Usuario} WHERE U_DocEntry = ${DocEntry}`);
                        let Total = await db.Query(`SELECT SUM(U_MaxReqr) AS U_MaxReqr  FROM [Handel_B2C_Irco].[dbo].[FMB_OWDD] WHERE U_DocEntry =  ${DocEntry}`);
                        Total = Total.recordset;
                        let cuantos = await db.Query(`SELECT COUNT(*) AS CUANTOS  FROM [Handel_B2C_Irco].[dbo].[FMB_WDD1] WHERE U_Status = 'Y' AND U_WddCode = ${DocEntry}`);
                        cuantos = cuantos.recordset;
                        reason = "Documento creado con exito.";
                        if(Total[0].U_MaxReqr === cuantos[0].CUANTOS){
                          try {
                              // Crear documento 
                              let getCabecera = {
                                  actions : 'ODRF',
                                  param1 : DocEntry,
                              }
                              let shoppingCart : any = [];
                              let Cabecera = await AutorizacionesProcedure(getCabecera);
                              Cabecera.map((items: any) =>{
                                  if(items.ItemCode != 'ENVIO'){
                                      let lines ={
                                          ItemCode: items.ItemCode,
                                          quantity: items.Quantity,
                                          Price: items.Price,
                                          taxRate: 16,
                                          taxSum: 12.96,
                                          priceTax: 93.96,
                                          currency: items.Currency,
                                          localLanguage: 'es-MX',
                                          WhsCode : items.WhsCode
                                      }
                                      shoppingCart.push(lines);
                                  }
                              })
                              let getAddress = {
                                  actions : 'Address',
                                  param1 : Cabecera[0].CardCode,
                                  param2 : Cabecera[0].ShipToCode,
                              }
                              let resultAddress = await AutorizacionesProcedure(getAddress);
                              let address :any= '';
                              if(resultAddress.length>0){
                                  address = {
                                      address : resultAddress[0].Address || '',
                                      street : resultAddress[0].Street || '',
                                      block : resultAddress[0].Block || '',
                                      city : resultAddress[0].City || '',
                                      cp : resultAddress[0].ZipCode || '',
                                      state : resultAddress[0].StateName || '',
                                      country : resultAddress[0].CountryName || '',
                                  };
                              }
                              
                              let getBill = {
                                  actions : 'Bill',
                                  param1 : Cabecera[0].CardCode,
                                  param2 : Cabecera[0].PayToCode,
                              }
                              let resultBill = await AutorizacionesProcedure(getBill);
                              let bill : any = '';
                              if(resultBill.length>0){
                                  bill = {
                                      address : resultBill[0].Address || '',
                                      street : resultBill[0].Street || '',
                                      block : resultBill[0].Block || '',
                                      city : resultBill[0].City || '',
                                      cp : resultBill[0].ZipCode || '',
                                      state : resultBill[0].StateName || '',
                                      country : resultBill[0].CountryName || '',
                                  };
                              }
                  
                              let insurance = '';
                              Cabecera.map((items: any) =>{
                                  if(items.ItemCode === 'MANIOBRAS II'){
                                      insurance = items.Price;
                                  }
                              })
                  
                              let insuranceObject = {
                                  ItemCode: 'MANIOBRAS II',
                                  quantity: '1',
                                  Price: insurance
                              }
                  
                              let objType = 17;
                              let service = 'OrdersService'
                              let cardCode = Cabecera[0].CardCode;
                              let addressKey = Cabecera[0].ShipToCode;
                              let billKey = Cabecera[0].PayToCode;
                              let comments = '';
                              let comment = Cabecera[0].Comments;
                              let docCurrency =  Cabecera[0].Currency;
                              let serie =  Cabecera[0].Series;
                              let empID =  Cabecera[0].SlpCode;
                              let creator = Cabecera[0].U_FMB_Handel_Creador || '';
                              let discPrcnt =  0;
                              let IdPackge = '4';
                              let PorCobrar = false;
                              let tipoEntrega = 'toAddress';
                              let convenio = '';
                              let dataInsertMinus = 0;
                              let itemsGift : any = [];
                              let datos = {
                                file: Cabecera[0].U_OC,
                                numOrden: Cabecera[0].U_NumOC,
                                resurtido: Cabecera[0].U_Resurtido
                              }
                              const model = new CatalogsModel();
                              model.action = "getFlete";
                              model.business = db_name;
                              
                              let result = await CatalogsProcedure(model);
                              let responseFlete = result[0];
                              
                              // Buscando puntos 
                              let modelProducts: ProductsModel = new ProductsModel();
                              modelProducts.action = 'getPoints';
                              modelProducts.cardCode = cardCode;
                              modelProducts.business = db_name;
                              let itemPoints = shoppingCart;
                              let totalPoints = 0;
                              // Puntos por total de documento
                              for (let i = 0; i < itemPoints.length; i++) {
                                  modelProducts.key = itemPoints[i].ItemCode;
                                  modelProducts.quantity = itemPoints[i].quantity;
                                  let points = await ProductsProcedure(modelProducts);
                                  if(points && points.length > 0){
                                      let queryPoints = Number(points[0].queryPoints).toFixed(0);
                                      itemPoints[i].itemPoint = Number(queryPoints);
                                      totalPoints += Number(queryPoints);
                                  }else{
                                      itemPoints[i].itemPoint = 0;
                                      totalPoints += 0;
                                  }  
                              }
                  
                              let data = {
                                  header: { dataInsertMinus, objType, service,cardCode, currency, docCurrency, addressKey, billKey, comments, 
                                      comment, wareHouse, taxCode, serie, paymentMethod,empID,creator, totalPoints,
                                      discPrcnt,IdPackge,PorCobrar,tipoEntrega,convenio, insurance: 50,datos }, //estado
                                  items: itemPoints || [],
                                  itemsGift : itemsGift || [],
                                  responseFlete: responseFlete || [],
                                  address: address,
                                  bill: bill,
                                  insurance: insuranceObject
                              };
                              // console.log('con°-°', data);
                              const ventasClienteInterface = new VentasClientes(sapConfig);
                              ventasClienteInterface.createXML(data);
                              ventasClienteInterface.setOptions();
                              responseDiServer = await ventasClienteInterface.createCall();
                              //console.log("rsponse di server",responseDiServer);

                              let doc = getTypeDocument(objType);
                              let ordersModel: OrdersModel = new OrdersModel();
                              ordersModel.action = 'findDocNum';
                              ordersModel.business = db_name;
                              ordersModel.docEntry = responseDiServer.docEntry || 0;
                              ordersModel.table = 'ORDR'; 

                              let docNumResponse = await OrdersProcedure(ordersModel);

                              if(!docNumResponse || !docNumResponse[0]){
                                  responseModel.message = 'Ocurrio un error al generar tu pedido. intentalo nuevamente.';
                                  response.json(responseModel);
                                  await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_WDD1] SET U_Status = 'W' WHERE U_WddCode = ${DocEntry} AND U_UserID = ${Usuario} AND U_Remarks ='${tipo}'`); //AND "U_UserID" = ${Usuario}
                                  await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_OWDD] SET U_Status = 'W', Name = null WHERE U_DocEntry = ${DocEntry} AND U_Remarks ='${tipo}'`);
                                  return;
                              }

                              let dataInsert = {
                                  DocEntry: responseDiServer.docEntry,
                                  DocNum: docNumResponse[0].DocNum,
                                  CardCode: cardCode,
                                  Total: totalPoints,
                                  Type: "suma",
                              }
                              
                              let resultInsert = await insertPoints(dataInsert);
                              
                              if(!responseDiServer.status){
                                  responseModel.message = 'Ocurrio un error al generar tu pedido. intentalo nuevamente (estado de la orden)';
                                  response.json(responseModel);
                                  await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_WDD1] SET U_Status = 'W' WHERE U_WddCode = ${DocEntry} AND U_UserID = ${Usuario} AND U_Remarks ='${tipo}'`); 
                                  await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_OWDD] SET U_Status = 'W', Name = null WHERE U_DocEntry = ${DocEntry} AND U_Remarks ='${tipo}'`);
                                  return;
                              } 

                              //-----------------------------------------MANDAR CORREO-----------------------------------------
                              //-----------------------------------------------------------------------------------------------
                              let Rechazado = {
                                  actions : 'Rechazado',
                                  param1 : DocEntry
                              }
                              let rechazado = await AutorizacionesProcedure(Rechazado);
                              let codigoCli = rechazado[0].CardCode;
                              let cliente = rechazado[0].CardName;
                              let documento = rechazado[0].DocNum+'-'+DocEntry;
                              let ShipToCode = rechazado[0].ShipToCode;
                              let totalpesoNeto = 0;
                              let Subtotal = rechazado[0].DocTotal;

                              let Vendedor = rechazado[0].Mail;
                              let body: any;
                                  body = '';
                              rechazado.map((item:any) =>{
                                  totalpesoNeto += Number(item.Peso);
                                  body += `
                                  <tr>
                                      <td>${item.ItemCode}</td>
                                      <td>${item.ItemName}</td>
                                      <td style="text-align: center;" >${parseInt(item.Quantity)}</td>
                                      <td>$ ${parseFloat(item.Price).toFixed(2)}</td>              
                                      <td>$ ${Number(item.PrecioLin).toFixed(2)}</td>`;
                                  return body;
                              })
                              body += '</tr>'

                              let RechazadoDir = {
                                  actions : 'RechazadoDir',
                                  param1 : codigoCli, 
                                  param2 : ShipToCode
                              }

                              let rechazadodir = await AutorizacionesProcedure(RechazadoDir);

                              let DATOS = {
                                  actions : 'DATOS',
                                  param1 : codigoCli, 
                              }
                              let CorreoCliente = await AutorizacionesProcedure(DATOS)
                              let mensajeCond = CorreoCliente[0].PymntGroup;
                              let mailToCliente = CorreoCliente[0].E_Mail; //'hola@gmail.com'; //
                              let men = '';
                              
                              if(mensajeCond.substr(0,7) === 'CONTADO'){
                                  men = 'Recuerda que si no cancelas dentro de las 24 horas siguientes tu pedido se anulara.'
                              }
                              else{
                                  men = '';
                              }

                              let infoEmail = {
                                documento : rechazado[0].DocNum+'-'+DocEntry,
                                cliente,
                                body,
                                Subtotal,
                                rechazadodir,
                              }
                                  
                              let msghtml =  mailCreateAutorization(infoEmail);
                              
                              let dataMail = await EmailProcedure("getOrder");
                              let bcc;
                              if (dataMail[0].validateOrderBCC === 1){
                                  bcc = dataMail[0].orderBCC;
                              }else{
                                  bcc="";
                              }
                              let subject = dataMail[0].orderSubject;
                              let sendMail = await helpers.sendEmail( 'gerente.desarrollo@fmbsolutions.mx',Vendedor,"",subject,msghtml,null );
                              
                              // response.json(responseModel);
                          } catch (e) {
                              logger.error("(00002-1) AuthorizationController-> authorizedDocument-> ", e);
                              await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_WDD1] SET U_Status = 'W' WHERE U_WddCode = ${DocEntry}  AND U_UserID = ${Usuario} AND U_Remarks ='${tipo}'`); 
                              responseModel.message = 'Error al crear el documento '+ e;
                              responseModel.status = 0;
                              responseModel.data = {}  
                              response.json(responseModel);
                              return;
                          }
                        }
                    }else{
                        reason = "Documento creado con exito";
                    }
                }
                else{
                    reason = "Documento en proceso de autorización";
                }
                // await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_WDD1] SET U_Status = 'Y' WHERE U_WddCode = ${DocEntry} AND U_StepCode = ${WstCode}`);
                // await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_OWDD] SET U_Status = 'Y' WHERE U_DocEntry =${DocEntry} AND U_CurrStep = ${StepCode}`);

                // await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_WDD1] SET U_Status = 'N' WHERE U_WddCode = ${DocEntry} AND U_StepCode = ${WstCode}`);
                // await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_OWDD] SET U_Status = 'N' WHERE U_DocEntry =${DocEntry} AND U_CurrStep = ${StepCode}`);
                responseModel.message = reason;
                responseModel.status = 1;
                responseModel.data = {}  
                response.json(responseModel);
            }
        } catch (error) {
            logger.error("AuthorizationController-> ", error);
        }

    } catch (error) {
        logger.error('Crear autorizacion: ', error)
    }
    }else{      
      try {
        const sh = new SchemaService ();

        const responseModel = new ResponseModel();
        // let responseDiServer:any = '';
        try {
            let ordersResponse:any = '';
            let reason:any ='';
            let createorden:any = '';
            try {
                await sh.statements(`UPDATE "_E_HANDEL_B2C"."FMB_WDD1" SET "U_Status" = 'Y' WHERE "U_WddCode" = ${DocEntry} AND "U_UserID" = ${Usuario} AND "U_StepCode"=${WstCode} AND "U_Remarks" ='${tipo}'`);
                
                let resultado = await sh.statements(`SELECT * FROM "_E_HANDEL_B2C"."FMB_OWDD" WHERE "U_DocEntry" = ${DocEntry} AND "U_CurrStep"=${WstCode} AND "U_Remarks" ='${tipo}'`);
                for (let index = 0; index < resultado.length; index++) {
                    const resul = resultado[index];
                    let MaxReqr  = resul.U_MaxReqr;
                    let StepCode  = resul.U_CurrStep;

                    let datos = await sh.statements(`SELECT * FROM "_E_HANDEL_B2C"."FMB_WDD1" WHERE "U_WddCode" =${DocEntry} AND "U_StepCode" = ${StepCode} AND "U_Remarks" ='${tipo}'`);
                    let acept = 0;
                    for (let index = 0; index < datos.length; index++) { 
                        const dat = datos[index];
                        if (dat.U_Status === 'Y'){
                            acept++;
                        }
                    } 
                    if(acept === MaxReqr){
                        let flag = false;
                        let resul = await sh.statements(`SELECT * FROM "_E_HANDEL_B2C"."FMB_OWDD" WHERE "U_DocEntry" = ${DocEntry}`);
                        
                        for (let index = 0; index < resul.length; index++) {
                            const resu = resul[index];
                            if(resu.Name === (Usuario).toString() || resu.Name === null){
                                flag = true;
                            }
                        }

                        if(flag){
                            let DocumentLines: any =[];

                            await sh.statements(`UPDATE "_E_HANDEL_B2C"."FMB_OWDD" SET "U_Status" = 'Y', "Name" = ${Usuario} WHERE "U_DocEntry" = ${DocEntry}`);
                            let Total = await sh.statements(`SELECT SUM("U_MaxReqr") AS "U_MaxReqr"  FROM "_E_HANDEL_B2C"."FMB_OWDD" WHERE "U_DocEntry" =  ${DocEntry}`);
                            let cuantos = await sh.statements(`SELECT COUNT(*) AS "CUANTOS"  FROM "_E_HANDEL_B2C"."FMB_WDD1" WHERE "U_Status" = 'Y' AND "U_WddCode" = ${DocEntry}`);                            
                            reason = "Documento creado con exito.";
                            if(Total[0].U_MaxReqr === cuantos[0].CUANTOS){
                              try {
                                  // Crear documento 
                                  ordersResponse = await sh.getDocument("Drafts",DocEntry);
                                  let documentLines = ordersResponse.DocumentLines || [];

                                  for (let i = 0; i < documentLines.length; i++) {
                                    const draf = documentLines[i];

                                    let lines : any ={
                                      ItemCode : draf.ItemCode,
                                      Quantity : draf.Quantity,
                                      Currency : draf.Currency,
                                      WarehouseCode: draf.WarehouseCode,
                                      // DiscountPercent : 0,
                                      // TaxCode: draf.TaxCode,
                                      // Price: draf.Price,
                                      // U_FMB_ComentarioBonificacion : draf.U_FMB_ComentarioBonificacion,
                                      // U_FMB_NamePromo : draf.U_FMB_NamePromo,
                                    }
                                    DocumentLines.push(lines);
                                  } 

                                  let data = {
                                    DocDueDate: ordersResponse.DocDueDate,
                                    DocDate: ordersResponse.DocDate,
                                    TaxDate: ordersResponse.TaxDate,
                                    CardCode: ordersResponse.CardCode,
                                    U_FMB_Handel_PKG: ordersResponse.U_FMB_Handel_PKG,
                                    U_FMB_Handel_NUCN : ordersResponse.U_FMB_Handel_NUCN,
                                    U_Doc_Ecommerce: ordersResponse.U_Doc_Ecommerce,
                                    DiscountPercent : ordersResponse.DiscountPercent,
                                    // SalesPersonCode: ordersResponse.SalesPersonCode,
                                    // Series: ordersResponse.Series,//  323,
                                    // DocCurrency: ordersResponse.DocCurrency,
                                    Comments: ordersResponse.Comments,
                                    ShipToCode: ordersResponse.ShipToCode,
                                    ShipFrom: ordersResponse.ShipFrom,
                                    PayToCode: ordersResponse.PayToCode,
                                    // PaymentGroupCode: ordersResponse.PaymentGroupCode,
                                    // NumAtCard: ordersResponse.NumAtCard,
                                    // U_FMB_StockBonificacion : ordersResponse.U_FMB_StockBonificacion,
                                    // U_FMB_ArticulosBonificacion : ordersResponse.U_FMB_ArticulosBonificacion,
                                    // U_FMB_Handel_Creador : ordersResponse.U_FMB_Handel_Creador,
                                    DocObjectCode: ordersResponse.DocObjectCode,    	
                                    DocumentLines,
                                    AddressExtension: {
                                      ShipToStreet: ordersResponse.AddressExtension.ShipToStreet,
                                      ShipToBlock: "",
                                      ShipToCity: ordersResponse.AddressExtension.ShipToCity,
                                      ShipToCounty: "",
                                      ShipToState: ordersResponse.AddressExtension.ShipToState,
                                      ShipToCountry: ordersResponse.AddressExtension.ShipToCountry,
                                      ShipToAddressType: ordersResponse.AddressExtension.ShipToAddressType,
                                      BillToStreet: ordersResponse.AddressExtension.BillToStreet,
                                      BillToBlock: "",
                                      BillToCity: ordersResponse.AddressExtension.BillToCity,
                                      BillToCounty: "",
                                      BillToState: ordersResponse.AddressExtension.BillToState,
                                      BillToCountry: ordersResponse.AddressExtension.BillToCountry,
                                      BillToAddressType: ordersResponse.AddressExtension.BillToAddressType
                                    }			
                                  };

                                  createorden = await sh.NewOrderService('Orders',data);
                                  
                                  if(createorden.message){
                                    let error = createorden.message.error.message.value;
                                    //error = error.substr(10);
                                    console.log('con<<<<', error);
                                    logger.error("ERROR Autorizador -> ", error);
                                    responseModel.message = error;
                                    response.json(responseModel);
                                    await sh.statements(`UPDATE "_E_HANDEL_B2C"."FMB_WDD1" SET "U_Status" = 'W' WHERE "U_WddCode" = ${DocEntry} AND "U_UserID" = ${Usuario} AND "U_Remarks" ='${tipo}'`); 
                                    await sh.statements(`UPDATE "_E_HANDEL_B2C"."FMB_OWDD" SET "U_Status" = 'W', "Name" = null WHERE "U_DocEntry" = ${DocEntry} AND "U_Remarks" ='${tipo}'`);
                                    return;
                                  }
                                  
                                  //-----------------------------------------MANDAR CORREO-----------------------------------------
                                  //-----------------------------------------------------------------------------------------------
                                  let Rechazado = {
                                      actions : 'Rechazado',
                                      param1 : DocEntry
                                  }
                                  let rechazado = await AutorizacionesProcedure(Rechazado);
                                  let codigoCli = rechazado[0].CardCode;
                                  let cliente = rechazado[0].CardName;
                                  let documento = rechazado[0].DocNum+'-'+DocEntry;
                                  let ShipToCode = rechazado[0].ShipToCode;
                                  let totalpesoNeto = 0;
                                  let Subtotal = rechazado[0].DocTotal;

                                  let body: any;
                                      body = '';
                                  rechazado.map((item:any) =>{
                                      totalpesoNeto += Number(item.Peso);
                                      body += `
                                      <tr>
                                          <td>${item.ItemCode}</td>
                                          <td>${item.ItemName}</td>
                                          <td style="text-align: center;" >${parseInt(item.Quantity)}</td>
                                          <td>$ ${parseFloat(item.Price).toFixed(2)}</td>              
                                          <td>$ ${Number(item.PrecioLin).toFixed(2)}</td>`;
                                      return body;
                                  })
                                  body += '</tr>'

                                  let RechazadoDir = {
                                      actions : 'RechazadoDir',
                                      param1 : codigoCli, 
                                      param2 : ShipToCode
                                  }

                                  let rechazadodir = await AutorizacionesProcedure(RechazadoDir);

                                  let DATOS = {
                                      actions : 'DATOS',
                                      param1 : codigoCli, 
                                  }
                                  let CorreoCliente = await AutorizacionesProcedure(DATOS)
                                  let mensajeCond = CorreoCliente[0].PymntGroup;
                                  let mailToCliente = CorreoCliente[0].U_FMB_Handel_Email; //'hola@gmail.com'; //
                                  let Vendedor = CorreoCliente[0].Email;
                                  let men = '';
                                  
                                  if(mensajeCond.substr(0,7) === 'CONTADO'){
                                      men = 'Recuerda que si no cancelas dentro de las 24 horas siguientes tu pedido se anulara.'
                                  }
                                  else{
                                      men = '';
                                  }
                                  // MANDAR CORREO
                                  let infoEmail = {
                                    documento : rechazado[0].DocNum+'-'+DocEntry,
                                    cliente,
                                    body,
                                    Subtotal,
                                    rechazadodir,
                                  }
                                      
                                  let msghtml =  mailCreateAutorization(infoEmail);
                                  
                                  let dataMail = await EmailProcedure("getOrder");
                                  let bcc;
                                  if (dataMail[0].validateOrderBCC === 1){
                                      bcc = dataMail[0].orderBCC;
                                  }else{
                                      bcc="";
                                  }
                                  let subject = dataMail[0].orderSubject;
                                  let sendMail = await helpers.sendEmail( mailToCliente,Vendedor,"",subject,msghtml,null );
                                  
                                  // response.json(responseModel);
                              } catch (e) {
                                  logger.error("(00002-1) AuthorizationController-> authorizedDocument-> ", e);
                                  await sh.statements(`UPDATE "_E_HANDEL_B2C"."FMB_WDD1" SET "U_Status" = 'W' WHERE "U_WddCode" = ${DocEntry} AND "U_UserID" = ${Usuario} AND "U_Remarks" ='${tipo}'`); 
                                  responseModel.message = 'Error al crear el documento '+ e;
                                  responseModel.status = 0;
                                  responseModel.data = {}  
                                  response.json(responseModel);
                                  return;
                              }
                            }
                        }else{
                            reason = "Documento creado con exito";
                        }
                    }
                    else{
                        reason = "Documento en proceso de autorización";
                    }
                    responseModel.message = reason;
                    responseModel.status = 1;
                    responseModel.data = {}  
                    response.json(responseModel);
                }
            } catch (error) {
                logger.error("AuthorizationController-> ", error);
            }

        } catch (error) {
            logger.error('Crear autorizacion: ', error)
        }
      } catch (error) {
        logger.error('createAutorization => ', error)
      }
    }    
}

export async function rejectedAutorization(request: Request, response: Response) {
  const { type } = response.locals.business;
  const {DocEntry, Usuario, Comentario, WstCode} = request.body;

  if(type === 'SQL'){
    const db = new DatabaseService();
    // const sh = new SchemaService ();
    const responseModel = new ResponseModel();
    
    // let data = {
    //     "U_SYP_RICO_ESTADO": "R",
    //     "Comments" : Comentario
    // };

    // let order = `Drafts(${DocEntry})`;
    let ordersResponse:any = '';
    // let ordersResponse = await sh.UpdateAutorization(order,data);  

    // if(ordersResponse.message){
    //   let error = ordersResponse.message.error.message.value;
    //   responseModel.message = error;///'Ocurrio un error al generar tu pedido. intentalo nuevamente (estado de la orden)';
    //   response.json(responseModel);
    //   return;
    // }
    let respon = await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_OWDD] SET U_Status = 'N' WHERE U_DocEntry =${DocEntry}`);
    let responses = await db.Query(`UPDATE [Handel_B2C_Irco].[dbo].[FMB_WDD1] SET U_Status = 'N' WHERE U_WddCode =${DocEntry}`); 
    logger.error("UPDATE FMB_OWDD", respon, responses)

    // try {
    //   let rechazado = true;
    //   let ordersResponse:any = '';
    //   let reason:any = '';
    //   await sh.statements(`UPDATE "FMB_WDD1" SET "U_Status" = 'N' WHERE "U_WddCode" =${DocEntry} AND "U_UserID" =${Usuario} AND "U_StepCode" = ${WstCode}`);
    //   let resultado = await sh.statements(`SELECT * FROM "FMB_OWDD" WHERE "U_DocEntry" =${DocEntry}`);
    
    //   for (let index = 0; index < resultado.length; index++) {
    //       const resul = resultado[index];
    //       let MaxReqr  = resul.U_MaxReqr;
    //       let MaxRejReqr  = resul.U_MaxRejReqr;
    //       let StepCode  = resul.U_CurrStep;
  
    //       for (let index = 0; index < MaxReqr; index++) {
    //           let datos = await sh.statements(`SELECT * FROM "FMB_WDD1" WHERE "U_WddCode" =${DocEntry} AND "U_StepCode" = ${StepCode}`);
    //           let acept = 0;
              
    //           datos.map((dat:any) =>{
    //               if (dat.U_Status === 'Y'){
    //                   acept++;
    //               }
    //           });
    //           if(acept === MaxReqr){
    //               await sh.statements(`UPDATE "FMB_WDD1" SET "U_Status" = 'Y' WHERE "U_WddCode" = ${DocEntry} AND "U_StepCode" = ${WstCode}`);
    //               await sh.statements(`UPDATE "FMB_OWDD" SET "U_Status" = 'Y' WHERE "U_DocEntry" =${DocEntry} AND "U_CurrStep" = ${StepCode}`);
    //           }
    //       } 
    //       for (let index = 0; index < MaxRejReqr; index++) {
    //           let datos = await sh.statements(`SELECT * FROM "FMB_WDD1" WHERE "U_WddCode" =${DocEntry} AND "U_StepCode" = ${StepCode}`);
    //           let cancel = 0;
              
    //           datos.map((dat:any) =>{
    //               if(dat.U_Status === 'N'){
    //                   cancel++;
    //               }
    //           });
    //           if(cancel === MaxRejReqr){
    //               await sh.statements(`UPDATE "FMB_WDD1" SET "U_Status" = 'N' WHERE "U_WddCode" = ${DocEntry} AND "U_StepCode" = ${WstCode}`);
    //               await sh.statements(`UPDATE "FMB_OWDD" SET "U_Status" = 'N' WHERE "U_DocEntry" =${DocEntry} AND "U_CurrStep" = ${StepCode}`);
    //           }
    //       } 
    //   }
      
    //   let resul = await sh.statements(`SELECT * FROM "FMB_OWDD" WHERE "U_DocEntry" = ${DocEntry}`);
      
    //   for (let index = 0; index < resul.length; index++) {
    //       const resu = resul[index];
    //       if(resu.U_Status === 'W' || resu.U_Status === 'Y'){
    //           rechazado = false;
    //       }
    //   }
    
    //   if(rechazado){
    //       try {
    //         // reason = "Documento Cancelado";
    //         let data = {
    //             "U_SYP_RICO_ESTADO": "R",
    //             "Comments" : Comentario
    //         };
  
    //         let order = `Drafts(${DocEntry})`;
    //         ordersResponse = await sh.UpdateAutorization(order,data);  
          
    //       } catch (e) {
    //       logger.error("AuthorizationController-> authorizedDocument-> ", e);
    //       }
    //     }
      
    // } catch (error) {
    //   logger.error("AuthorizationController-> authorizedDocument-> ", error);
    // }

    
    responseModel.message = 'Documento Rechazado';
    responseModel.status = 1;
    responseModel.data = {docNum: ordersResponse}

    //-----------------------------------------MANDAR CORREO-----------------------------------------
    //-----------------------------------------------------------------------------------------------
    let Rechazado = {
        actions : 'Rechazado',
        param1 : DocEntry
    }
    let rechazado = await AutorizacionesProcedure(Rechazado);
    
    let codigoCli = rechazado[0].CardCode;
    let cliente = rechazado[0].CardName;
    let documento = rechazado[0].DocNum+'-'+DocEntry;
    let ShipToCode = rechazado[0].ShipToCode;
    let totalpesoNeto = 0;
    let Subtotal = rechazado[0].DocTotal;

    let Vendedor = rechazado[0].Mail;

    let body: any;
      body = '';
    rechazado.map((item:any) =>{
      totalpesoNeto += Number(item.Peso);
        body += `
        <tr>
          <td>${item.ItemCode}</td>
          <td>${item.ItemName}</td>
          <td style="text-align: center;" >${parseInt(item.Quantity)}</td>
          <td>$ ${parseFloat(item.Price).toFixed(2)}</td>              
          <td>$ ${Number(item.PrecioLin).toFixed(2)}</td>`;
        return body;
    })
    body += '</tr>'

    let RechazadoDir = {
        actions : 'RechazadoDir',
        param1 : codigoCli, 
        param2 : ShipToCode
    }
    let rechazadodir = await AutorizacionesProcedure(RechazadoDir);

    let DATOS = {
        actions : 'DATOS',
        param1 : codigoCli, 
    }
    let CorreoCliente = await AutorizacionesProcedure(DATOS)
    let mensajeCond = CorreoCliente[0].PymntGroup;
    let mailToCliente = CorreoCliente[0].E_Mail; //'hola@gmail.com'; //
    let men = '';
    
    if(mensajeCond.substr(0,7) === 'CONTADO'){
      men = 'Recuerda que si no cancelas dentro de las 24 horas siguientes tu pedido se anulara.'
    }
    else{
      men = '';
    }

    let infoEmail = {
      documento : rechazado[0].DocNum+'-'+DocEntry,
      Comentario,
      cliente,
      body,
      Subtotal,
      rechazadodir,
    }
      
    let msghtml =  mailRejectedAutorization(infoEmail);

    let dataMail = await EmailProcedure("getOrder");

    let bcc;
    if (dataMail[0].validateOrderBCC === 1){
      bcc = dataMail[0].orderBCC;
    }else{
      bcc="";
    }
    let subject = dataMail[0].orderSubject;
    let sendMail = await helpers.sendEmail( 'gerente.desarrollo@fmbsolutions.mx',Vendedor,"",subject,msghtml,null );
    response.json(responseModel);
  }else{
    const sh = new SchemaService ();
    const responseModel = new ResponseModel();
    let ordersResponse:any = '';
    let respon = await sh.statements(`UPDATE "_E_HANDEL_B2C"."FMB_OWDD" SET "U_Status" = 'N' WHERE "U_DocEntry" =${DocEntry}`);
    let responses = await sh.statements(`UPDATE "_E_HANDEL_B2C"."FMB_WDD1" SET "U_Status" = 'N' WHERE "U_WddCode" =${DocEntry}`); 
    logger.error("UPDATE FMB_OWDD", respon, responses);
    
    responseModel.message = 'Documento Rechazado';
    responseModel.status = 1;
    responseModel.data = {docNum: ordersResponse}

    //-----------------------------------------MANDAR CORREO-----------------------------------------
    //-----------------------------------------------------------------------------------------------
    let Rechazado = {
        actions : 'Rechazado',
        param1 : DocEntry
    }
    let rechazado = await AutorizacionesProcedure(Rechazado);
    
    let codigoCli = rechazado[0].CardCode;
    let cliente = rechazado[0].CardName;
    let documento = rechazado[0].DocNum+'-'+DocEntry;
    let ShipToCode = rechazado[0].ShipToCode;
    let totalpesoNeto = 0;
    let Subtotal = rechazado[0].DocTotal;


    let body: any;
      body = '';
    rechazado.map((item:any) =>{
      totalpesoNeto += Number(item.Peso);
        body += `
        <tr>
          <td>${item.ItemCode}</td>
          <td>${item.ItemName}</td>
          <td style="text-align: center;" >${parseInt(item.Quantity)}</td>
          <td>$ ${parseFloat(item.Price).toFixed(2)}</td>              
          <td>$ ${Number(item.PrecioLin).toFixed(2)}</td>`;
        return body;
    })
    body += '</tr>'

    let RechazadoDir = {
        actions : 'RechazadoDir',
        param1 : codigoCli, 
        param2 : ShipToCode
    }
    let rechazadodir = await AutorizacionesProcedure(RechazadoDir);

    let DATOS = {
        actions : 'DATOS',
        param1 : codigoCli, 
    }
    let CorreoCliente = await AutorizacionesProcedure(DATOS)
    let mensajeCond = CorreoCliente[0].PymntGroup;
    let mailToCliente = CorreoCliente[0].U_FMB_Handel_Email; //'hola@gmail.com'; //
    let Vendedor = CorreoCliente[0].Email;
    let men = '';
    
    if(mensajeCond.substr(0,7) === 'CONTADO'){
      men = 'Recuerda que si no cancelas dentro de las 24 horas siguientes tu pedido se anulara.'
    }
    else{
      men = '';
    }

    let infoEmail = {
      documento : rechazado[0].DocNum+'-'+DocEntry,
      Comentario,
      cliente,
      body,
      Subtotal,
      rechazadodir,
    }
      
    let msghtml =  mailRejectedAutorization(infoEmail);

    let dataMail = await EmailProcedure("getOrder");

    let bcc;
    if (dataMail[0].validateOrderBCC === 1){
      bcc = dataMail[0].orderBCC;
    }else{
      bcc="";
    }
    let subject = dataMail[0].orderSubject;
    let sendMail = await helpers.sendEmail( mailToCliente,Vendedor,"",subject,msghtml,null );
    response.json(responseModel);
  }
}

function mailCreateAutorization(data: any){  
  let msghtml =  `
  <html>
    <head>
    <meta charset="UTF-8">
    <meta content="text/html; charset=iso-8859-1" http-equiv="Content-Type">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
  </head>
  
  <body style="margin: 0px; padding: 0px; width: 100%!important; background-color: white;">
  
    <style type="text/css">
      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
  
        font-weight: inherit !important;
        line-height: inherit !important;
      }
  
      a {
        text-decoration: none;
      }
  
      b {
        font-weight: bold;
      }
  
      * {
        -webkit-text-size-adjust: none;
      }
  
      body {
        font-family: 'Helvetica';
        margin: 0 auto !important;
        padding: 0px !important;
        width: 100%;
        margin-right: auto;
        margin-left: auto;
      }
  
      html,
      body {
        margin: 0px;
        padding: 0px !important;
      }
  
      table,
      td,
      th {
        border-collapse: collapse;
        border-spacing: 0px;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
  
      div,
      p,
      a,
      li,
      td {
        -webkit-text-size-adjust: none;
      }
  
      * {
        -webkit-text-size-adjust: none;
      }
  
      img {
        display: block !important;
      }
  
      .ReadMsgBody {
        width: 100%;
      }
  
      .ExternalClass p,
      .ExternalClass span,
      .ExternalClass font,
      .ExternalClass td,
      .ExternalClass div {
        line-height: 100%;
        margin: 0px;
        padding: 0px;
      }
  
      .ExternalClass {
        width: 100%;
      }
  
      span.MsoHyperlink {
        mso-style-priority: 99;
        color: inherit;
      }
  
      span.MsoHyperlinkFollowed {
        mso-style-priority: 99;
        color: inherit;
      }
  
      .nav .yshortcuts {
        color: #666666
      }
  
      .blacklink .yshortcuts {
        color: #000000
      }
  
      .graylink .yshortcuts {
        color: #999999
      }
  
      .footerLink a {
        color: #999999 !important;
        text-decoration: none !important;
      }
  
      .timeline {
        position: relative;
        margin-left: 17%;
        margin-top: 40px;
        margin-bottom: -14px;
      }
  
      .timeline li {
        list-style: none;
        float: left;
        width: 20%;
        margin-left: 7px;
        position: relative;
        text-align: center;
        text-transform: uppercase;
  
        color: #F1F1F1;
      }
  
      .timeline li img {
        list-style: none;
        float: left;
        width: 20%;
        position: absolute;
        text-align: center;
        margin-top: -60;
        margin-left: 23;
      }
  
      ul:nth-child(1) {
        color: #09488F;
      }
  
      .timeline li:before {
        counter-increment: year;
        content: counter(year);
        width: 50px;
        height: 50px;
        border: 3px solid #F1F1F1;
        border-radius: 50%;
        display: block;
        text-align: center;
        line-height: 50px;
        margin: 0 auto 10px auto;
        background: #F1F1F1;
        color: #F1F1F1;
        transition: all ease-in-out .3s;
      }
  
      .timeline li:after {
        content: "";
        position: absolute;
        width: 100%;
        height: 5px;
        background-color: #F1F1F1;
        top: 25px;
        left: -50%;
        z-index: -999;
        transition: all ease-in-out .3s;
      }
  
      .timeline li:first-child:after {
        content: none;
      }
  
      /*texto que va debajo de la lista activa*/
      .timeline li.active {
        color: #C55930;
      }
  
      /*texto que va dentro del circulo activo*/
      .timeline li.active:before {
        background: #C55930;
        color: #C55930;
      }
  
      .timeline li.active+li:after {
        background: #C55930;
      }
  
      div,
      button {
        margin: 0 !important;
        padding: 0;
        display: block !important;
      }
  
      @media screen and (max-width: 600px) and (min-width: 480px) {
        .scale {
          width: 100% !important;
          min-width: 1px !important;
          max-width: 600px !important;
          height: auto !important;
          max-height: none !important;
        }
      }
  
      @media (max-width: 480px) {
        .scale {
          width: 100% !important;
          min-width: 1px !important;
          max-width: 480px !important;
          height: auto !important;
          max-height: none !important;
        }
  
        .scale-480 {
          width: 100% !important;
          min-width: 1px !important;
          max-width: 480px !important;
          height: auto !important;
          max-height: none !important;
        }
  
        .stack {
          display: block !important;
          width: 100% !important;
        }
  
        .hide {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
          max-height: 0px !important;
          padding: 0px 0px 0px 0px !important;
          overflow: hidden !important;
          font-size: 0px !important;
          line-height: 0px !important;
        }
  
        .ship-text {
          padding: 12px 0px 12px 0px !important;
          font-size: 12px !important;
          line-height: 120% !important;
          letter-spacing: 0px !important;
        }
  
        .logo-box {
          padding: 10px 0px 10px 0px !important;
        }
  
        .headline {
          padding: 25px 25px 10px 25px !important;
          font-size: 30px !important;
          line-height: 110% !important;
          letter-spacing: 0px !important;
        }
  
        .reviews {
          padding: 20px 10px 10px 10px !important;
        }
  
        .copy {
          font-size: 12px !important;
          line-height: 16px !important;
          padding: 5px 10px 0px 10px !important;
        }
  
        .product {
          font-size: 12px !important;
        }
  
        .cta {
          width: 130px !important;
          height: auto !important;
        }
  
        .contact-pad {
          padding: 20px 0px 20px 0px !important;
        }
  
        .contact-text {
          font-size: 14px !important;
          line-height: 120% !important;
        }
  
        .trust-pad {
          padding: 10px !important;
        }
  
        /* Custom CSS */
        .mob-br {
          display: block !important;
        }
  
        .pr {
          padding: 0px 0px 0px 0px !important;
        }
      }
  
      @media (max-width: 400px) {
        .trust-pad {
          padding: 10px 0px !important;
        }
  
        .mob-br-400 {
          display: block !important;
        }
  
        .ship-text {
          font-size: 11px !important;
        }
      }
    </style>
  
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #D6D6D6;">
      <tbody>
        <tr>
          <td width="100%" align="center" valign="top">
            <table style="border: border-collapse;" cellpadding="0" cellspacing="0" border="0">
              <tbody>
                <tr>
                  <td align="center">
                    <table align="center" border="0" cellpadding="0" cellspacing="0"
                      style="min-width: 600px; width: 600px;" width="600" class="scale">
                      <tbody>
                        <tr>
                          <td bgcolor="#FFFFFF" align="center" valign="top">
                            <table align="center" border="0" cellpadding="0" cellspacing="0"
                              style="min-width: 600px; width: 600px;" width="600" class="scale">
                              <tbody> 
                                <!-- ESTO ES COMO UN BR PORQUE DA UN ESPACIO EN BLANCO -->
                                <tr><td style="height: 15px"></td></tr>
                                <!-- CUERPO DEL MENSAJE -->
                                <tr>
                                  <td class="logo-box" width="100%" align="center"
                                    style="background-color: #C55930; padding: 25px 0px 25px 0px;" bgcolor="#008af0">
                                    <a style="text-decoration: none;" href=" " target="_blank">
                                      <img
                                        style="width: 100%; max-width: 150px; height: auto; max-height: none; margin: 0px auto;"
                                        src="https://blogger.googleusercontent.com/img/a/AVvXsEhB43RwNpaaT7HL5R_4rvYOkyF9yMZfbYTn72T84UOZFNr8T1oQ0PoBzH8gWleuyFO1UXlyisK3Eh9FB8z4gf9lpTdP172uqzOWwV02Dfb0Xr7DyDPAAC4Vpu6ID8CXjJ73Z20x58Qd2sXprKAd8824SZCpAc0ZcZq5_vnfVc6P_j2GylJat7dXwEW3wQ=s700"
                                        width="480" height="46" border="0">
                                    </a>
                                  </td>
                                </tr>
                                <!-- CUERPO DEL MENSAJE -->
                                <tr>
                                  <td
                                    style="font-family:Helvetica; color: #444444; font-size: 30px; font-weight: 700; line-height: 45px; mso-line-height-rule: exactly; text-align: center; padding: 35px 10px 10px 10px;"
                                    align="center" class="headline">
                                    <a style="text-decoration: none; color: #444444;">
                                      Te informamos que tu pedido ha sido APROBADO no.
                                      ${data.documento}</a>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 25px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 30px 20px;"
                                    align="center" class="copy">
                                    <a style="color: #000000; text-decoration: none;">Estimado
                                      ${data.cliente},</a>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; mso-line-height-rule: exactly; text-align: justify; padding: 0px 20px 0px 20px;"
                                    align="center" class="copy">
                                    <a style="color: #000000; text-decoration: none;">
                                      <p>Te informamos que tu pedido ha sido autorizado. <br>
                                        Si tienes alguna duda puedes contactarnos al
                                        telefono <a style="color: #045bab; font-weight: bold; text-decoration: none;"> 667
                                          760 5233 Ext. 107 y 108</a> o
                                        escri­benos al
                                        correo <a
                                          style="color: #045bab;  font-weight: bold;">contacto@ircocommercial.com</a>,
                                        donde con gusto te atenderemos.</p>
                                    </a>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 0px 20px;"
                                    align="center" class="copy">
                                    <a style="color: #000000; text-decoration: none;">
                                      Detalle del pedido.</a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <br>
                            <!-- DETALLE DEL PEDIDO  -->
                            

                            <div style="padding: 0px 20px 0px 20px;">
                              <table align="center" border="0" cellpadding="0" cellspacing="0"
                                style="min-width: 600px; width: 600px;" width="600" class="scale">
                                <tr style="font-size: 15px; background-color: #C55930; color: white">
                                  <th>ARTICULO</th>
                                  <th>DESCRIPCIÓN</th>
                                  <th>CANTIDAD</th>
                                  <th>PRECIO</th>
                                  <th>TOTAL</th>
                                </tr>
                                ${data.body}
                                <tr>
                                  <td colspan="6" style="text-align: right;"></td>
                                </tr>
                                <tr>
                                  <td colspan="4" style="text-align: right;">Total:</td>
                                  <th style="text-align: left; background-color: #C55930; color: white;font-size: 13px;">
                                    $ ${Number(data.Subtotal).toFixed(2)}</th>
                                </tr>
                              </table>
                            </div>
  
                            <table align="center" border="0" cellpadding="0" cellspacing="0"
                              style="background-color: #ffffff; min-width: 600px; width: 600px;" width="600"
                              class="scale">
                              <tbody>
                                <tr>
                                  <td
                                    style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 0px 20px;"
                                    align="center" class="copy">
                                    <a style="color: #000000; text-decoration: none;">
                                      El pedido será entregado en:</a>
                                  </td>
                                </tr>
                                <td
                                  style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; mso-line-height-rule: exactly; text-align: justify; padding: 0px 20px 0px 20px;"
                                  align="center" class="copy">
                                  <a style="color: #000000; text-decoration: none;">
                                    <p><b>Dirección: </b> ${ data.rechazadodir[0].Address }
                                      ,<b>Calle/Número: </b> ${ data.rechazadodir[0].Street
                                      } ,<b>CP: </b> ${ data.rechazadodir[0].ZipCode }
                                      ,<b>Ciudad: </b> ${ data.rechazadodir[0].City }
                                      ,<b>Paí­s: </b> ${ data.rechazadodir[0].Country } </p>
                                  </a>
                                </td>
                              </tbody>
                            </table>
                            <!-- SECCION ESTATUS DEL PEDIDO IMAGENES TRES PUNTITOS  -->
                            <div align="center">
                              <h3 style="font-size: 15px;">Estatus del Pedido</h3>
                              <center>
                                <ul class="timeline">
                                  <li class="active">
                                    <svg xmlns="http://www.w3.org/2000/svg" style="width: 30px ;height: 30px; position: absolute; top: 12px; right: 35px; color: #fff;" fill="currentColor"
                                    class="bi bi-hourglass-split" viewBox="0 0 16 16">
                                    <path
                                      d="M2.5 15a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2h-7zm3 6.35c0 .701-.478 1.236-1.011 1.492A3.5 3.5 0 0 0 4.5 13s.866-1.299 3-1.48V8.35zm1 0v3.17c2.134.181 3 1.48 3 1.48a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351z" />
                                  </svg>
                                    En proceso</li>
                                  <li class="active">Empacado</li>
                                  <li class="active">Facturado</li>
                                </ul>
                              </center>
                            <br>
                            <br>
                            </div>
                            <!-- SECCION FOOTER BARRA DE CONTACTO  -->
                            <table border="0" cellpadding="0" cellspacing="0"
                              style="min-width: 600px; width: 600px; background-color: #C55930;" width="600"
                              class="scale">
                              <tbody>
                                <tr>
                                  <td width="100%" align="center" valign="middle" style="vertical-align: middle;">
                                    <table cellpadding="0" cellspacing="0" border="0">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 40px 0px 40px 0px;" class="contact-pad" align="center">
                                            <table cellpadding="0" cellspacing="0" border="0">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 0px 7px 0px 0px;" align="center" width="27"><a
                                                      style="text-decoration: none; color: #ffffff;"
                                                      href="https://ircomx.com/contacto/" target="_blank"
                                                      rilt="ContactUs_Icon"><img style="display: inline;"
                                                        src="https://1.bp.blogspot.com/-VoID1BgvhrY/YRGMjLGW24I/AAAAAAAAAbE/mWax9GkDfJsDgCObf6geHCCP5FbyftsZACLcBGAsYHQ/s20/telefono_Mesa%2Bde%2Btrabajo%2B1.png"
                                                        width="20" height="20" alt="" border="0"></a>
                                                  </td>
                                                  <td
                                                    style="font-size: 22px; font-weight: 700; color: #ffffff; text-align: center;"
                                                    class="contact-text" align="center"><a
                                                      style="text-decoration: none; color: #ffffff;"
                                                      href="https://ircomx.com/contacto/" target="_blank"
                                                      rilt="ContactUs_Text"> Llamanos al 667 760 5233 Ext. 107 y 108 </a>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <br>
                            <!-- SECCION FOOTER BAJA ICONOS Y REDES SOCIALES  -->
                            <table align="center" border="0" cellpadding="0" cellspacing="0"
                              style="background-color: #ffffff; min-width: 600px; width: 600px;" width="600"
                              class="scale">
                              <tbody>
                                <tr>
                                  <td style="padding:0 0 21px;">
                                    <table align="center" style="margin:0 auto;" cellpadding="0" cellspacing="0">
                                      <tbody>
                                        <tr>
                                          <!-- facebook -->
                                          <td class="active-i">
                                            <a style="text-decoration:none;"
                                              href="https://www.facebook.com/ircocommercial" target="_blank">
                                              <img src="https://blogger.googleusercontent.com/img/a/AVvXsEgde4jxkeChupZEDSxVmwtK3r2K5tCzWQziQqM2KNVIP3vardtmFJQSl5YReE7aDn368cdOgyucSJ0RBZp9Id7MS-rtno79fbYGtZK8Z9EtPKxB-N4s-b9Im7Hvm4RThFC4AJGxbPdkSuE9ujwp931J6NpYHWEtLz8pSHiLmCIEM87LL5EPYiftoVnqlw=w128-h128-p-k-no-nu" width="30"
                                                style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                alt="fb">
                                            </a>
                                          </td>
                                          <!-- WHATS CONTACTO -->
                                          <td width="20"></td>
                                          <td class="active-i">
                                            <a style="text-decoration:none;" href="https://api.whatsapp.com/message/ZPC6FBIMZR2ME1" target="_blank">
                                              <img
                                                src="https://blogger.googleusercontent.com/img/a/AVvXsEjqaqX5ldiIPbcp5NTJMpyEGGv5-UKLAOqQ0gBfsxFM_EY9BfVRlpc4N-BH7O93dKuJHlUB7q0fjDMN4Tb953KRDYohHn4F3JMznQNheMMTdeZhataZ-1VWc8U0YicOuo-3ay0PBVAURVD-xtcm5C3Qay064Fmh9KPjj5oINGSjO8kLIdl3eTLJAxmkEg=s512"
                                                width="30"
                                                style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                alt="ig">
                                            </a>
                                          </td>
                                          <!-- Linkedin -->
                                          <td width="20"></td>
                                          <td class="active-i">
                                            <a style="text-decoration:none;"
                                              href="https://www.linkedin.com/company/ircocommercial" target="_blank">
                                              <img src="https://blogger.googleusercontent.com/img/a/AVvXsEjjRyYybHb4R6-HFrss9Uqf0pVz16Vb5tGPkdjJ1PYynwfFaw7n7WgLi6GaqufMLYqkwUJrUVvGNcNcwQEhcK3Oc4ldlXfW-bWZztlLDp09QtfvSjr0ekF_oEExjoW8aVVMwr7Cfq7v4SJQ44dXybk77uoYZih3BSM9SVQnYXmEJYCNouXHJmoXDrZQkg=w128-h128-p-k-no-nu" width="30"
                                                style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                alt="tw">
                                            </a>
                                          </td>
                                          <!-- web -->
                                          <td width="20"></td>
                                          <td class="active-i">
                                            <a style="text-decoration:none;" href="https://ircomx.com/" target="_blank">
                                              <img
                                                src="https://blogger.googleusercontent.com/img/a/AVvXsEh3HK6D2z1Ex7SnDv2C6z8sCYtFXc5cIdDLo26tQQONMyCPhwsCww8KRey6jTGgUKGDFj2dKeayvEuK0kgftLR_ELwaxLbozfEpKAfMGY9uWRoRFEA9MUZFF-hmJKV10aICo8mdtud5E50Qo4YOdDusrYSEq9b6afNfLklmiKwh499yS23-e87FWSQ2Zw=w128-h128-p-k-no-nu"
                                                width="30"
                                                style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                alt="tw">
                                            </a>
                                          </td>
                                          <!-- instagram -->
                                          <td width="20"></td>
                                          <td class="active-i">
                                            <a style="text-decoration:none;" href="https://www.instagram.com/ircomx/"
                                              target="_blank">
                                              <img
                                                src="https://blogger.googleusercontent.com/img/a/AVvXsEihGR_WFsY_mcr1O98nFd3UJgyHDzBiFdCCIJfo8pUxKzafRg4Ejs40lIX9Pq5ay-zTp1fdP2Hgqqf0tZ2J6WGe8uihlEkEbWdmEEKMhIvGFj5tzyfbo_dYIlSEWKZsWX3_57FklXJRHH85STBRAAAy4VM_8qvzX_v8S0xer6l7xOKOm4g60_ETnuiMmw=w128-h128-p-k-no-nu"
                                                width="30"
                                                style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                alt="tw">
                                            </a>
                                          </td>
                                          <!-- youtube -->
                                          <td width="20"></td>
                                          <td class="active-i">
                                            <a style="text-decoration:none;" href="https://www.youtube.com/channel/UCKXH3Y4ePOk_hnN3tnmHPYQ" target="_blank">
                                              <img
                                                src="https://blogger.googleusercontent.com/img/a/AVvXsEh0Hl8ESN5td3FWq1e6FkjZck1H_RPmy7MuFEU5Y6HQuFnATwuwci2ot51JNOCWplh9M13s7R_AB7-Lw3dHMl6pkoS-GdW9QeTXqVBqxDDgM3GEPCY1jgjJGlI55uObZlWyFUidKSkGCuWNO0jxR27PK-Kwze41WjrbJb3F3w0Ywaqg2aT8mu60nnjueA=w128-h128-p-k-no-nu"
                                                width="30"
                                 
                                                style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                alt="tw">
                                            </a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                      <tbody>
                                        <tr>
                                          <td
                                            style="padding: 0px 20px 7px 20px; font-size: 12px; color: #999999; text-align: center; line-height: 100%; mso-line-height-rule: exactly;">
                                            <span class="footerLink">
                                              © 2021. Todos los derechos reservados.
                                            </span>
                                            <br>
                                            <br>
                                            <a href="https://ircomx.com/" style="color:#999999;"
                                              target="_blank">ircocommercial.com</a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <br>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <!-- ESTO ES COMO UN BR PORQUE DA UN ESPACIO EN BLANCO -->
                            <tr><td style="height: 15px"></td></tr>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
  </html>`;
  return msghtml;
}

function mailRejectedAutorization(data: any){
  let msghtml =  `<html>

  <head>
      <meta charset="UTF-8">
  </head>
  
  <body style="margin: 0px; padding: 0px; width: 100%!important; background-color: white;">
      <meta content="text/html; charset=iso-8859-1" http-equiv="Content-Type">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
      <style type="text/css">
          a[x-apple-data-detectors] {
              color: inherit !important;
              text-decoration: none !important;
              font-size: inherit !important;
  
              font-weight: inherit !important;
              line-height: inherit !important;
          }
  
          a {
              text-decoration: none;
          }
  
          b {
              color: black;
          }
  
          * {
              -webkit-text-size-adjust: none;
          }
  
          body {
              font-family: 'Helvetica';
              margin: 0 auto !important;
              padding: 0px !important;
              width: 100%;
              margin-right: auto;
              margin-left: auto;
          }
  
          html,
          body {
              margin: 0px;
              padding: 0px !important;
          }
  
          table,
          td,
          th {
              border-collapse: collapse;
              border-spacing: 0px;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
          }
  
          div,
          p,
          a,
          li,
          td {
              -webkit-text-size-adjust: none;
          }
  
          * {
              -webkit-text-size-adjust: none;
          }
  
          img {
              display: block !important;
          }
  
          .ReadMsgBody {
              width: 100%;
          }
  
          .ExternalClass p,
          .ExternalClass span,
          .ExternalClass font,
          .ExternalClass td,
          .ExternalClass div {
              line-height: 100%;
              margin: 0px;
              padding: 0px;
          }
  
          .ExternalClass {
              width: 100%;
          }
  
          span.MsoHyperlink {
              mso-style-priority: 99;
              color: inherit;
          }
  
          span.MsoHyperlinkFollowed {
              mso-style-priority: 99;
              color: inherit;
          }
  
          .nav .yshortcuts {
              color: #666666
          }
  
          .blacklink .yshortcuts {
              color: #000000
          }
  
          .graylink .yshortcuts {
              color: #999999
          }
  
          .footerLink a {
              color: #999999 !important;
              text-decoration: none !important;
          }
  
          .timeline {
              position: relative;
              margin-left: 10%;
              margin-top: 40px;
              margin-bottom: 40px;
          }
  
          .timeline li {
              list-style: none;
              float: left;
              width: 20%;
              position: relative;
              text-align: center;
              text-transform: uppercase;
  
              color: #F1F1F1;
          }
  
          .timeline li img {
              list-style: none;
              float: left;
              width: 20%;
              position: absolute;
              text-align: center;
              margin-top: -60;
              margin-left: 23;
          }
  
          ul:nth-child(1) {
              color: #09488F;
          }
  
          .timeline li:before {
              counter-increment: year;
              content: counter(year);
              width: 50px;
              height: 50px;
              border: 3px solid #F1F1F1;
              border-radius: 50%;
              display: block;
              text-align: center;
              line-height: 50px;
              margin: 0 auto 10px auto;
              background: #F1F1F1;
              color: #F1F1F1;
              transition: all ease-in-out .3s;
          }
  
          .timeline li:after {
              content: "";
              position: absolute;
              width: 100%;
              height: 5px;
              background-color: #F1F1F1;
              top: 25px;
              left: -50%;
              z-index: -999;
              transition: all ease-in-out .3s;
          }
  
          .timeline li:first-child:after {
              content: none;
          }
  
          /*texto que va debajo de la lista activa*/
          .timeline li.active {
              color: #C55930;
          }
  
          /*texto que va dentro del circulo activo*/
          .timeline li.active:before {
              background: #C55930;
              color: #C55930;
          }
  
          .timeline li.active+li:after {
              background: #C55930;
          }
  
          div,
          button {
              margin: 0 !important;
              padding: 0;
              display: block !important;
          }
  
          @media screen and (max-width: 600px) and (min-width: 480px) {
              .scale {
                  width: 100% !important;
                  min-width: 1px !important;
                  max-width: 600px !important;
                  height: auto !important;
                  max-height: none !important;
              }
          }
  
          @media (max-width: 480px) {
              .scale {
                  width: 100% !important;
                  min-width: 1px !important;
                  max-width: 480px !important;
                  height: auto !important;
                  max-height: none !important;
              }
  
              .scale-480 {
                  width: 100% !important;
                  min-width: 1px !important;
                  max-width: 480px !important;
                  height: auto !important;
                  max-height: none !important;
              }
  
              .stack {
                  display: block !important;
                  width: 100% !important;
              }
  
              .hide {
                  display: none !important;
                  width: 0px !important;
                  height: 0px !important;
                  max-height: 0px !important;
                  padding: 0px 0px 0px 0px !important;
                  overflow: hidden !important;
                  font-size: 0px !important;
                  line-height: 0px !important;
              }
  
              .ship-text {
                  padding: 12px 0px 12px 0px !important;
                  font-size: 12px !important;
                  line-height: 120% !important;
                  letter-spacing: 0px !important;
              }
  
              .logo-box {
                  padding: 10px 0px 10px 0px !important;
              }
  
              .headline {
                  padding: 25px 25px 10px 25px !important;
                  font-size: 30px !important;
                  line-height: 110% !important;
                  letter-spacing: 0px !important;
              }
  
              .reviews {
                  padding: 20px 10px 10px 10px !important;
              }
  
              .copy {
                  font-size: 12px !important;
                  line-height: 16px !important;
                  padding: 5px 10px 0px 10px !important;
              }
  
              .product {
                  font-size: 12px !important;
              }
  
              .cta {
                  width: 130px !important;
                  height: auto !important;
              }
  
              .contact-pad {
                  padding: 20px 0px 20px 0px !important;
              }
  
              .contact-text {
                  font-size: 14px !important;
                  line-height: 120% !important;
              }
  
              .trust-pad {
                  padding: 10px !important;
              }
  
              /* Custom CSS */
              .mob-br {
                  display: block !important;
              }
  
              .pr {
                  padding: 0px 0px 0px 0px !important;
              }
          }
  
          @media (max-width: 400px) {
              .trust-pad {
                  padding: 10px 0px !important;
              }
  
              .mob-br-400 {
                  display: block !important;
              }
  
              .ship-text {
                  font-size: 11px !important;
              }
          }
      </style>
  
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #e0e0e0;">
          <tbody>
              <tr>
                  <td width="100%" align="center" valign="top">
                      <table style="border: border-collapse;" cellpadding="0" cellspacing="0" border="0">
                          <tbody>
                              <tr>
                                  <td align="center">
                                      <table align="center" border="0" cellpadding="0" cellspacing="0"
                                          style="min-width: 600px; width: 600px;" width="600" class="scale">
                                          <tbody>
                                              <tr>
                                                  <td bgcolor="#FFFFFF" align="center" valign="top">
                                                      <table align="center" border="0" cellpadding="0" cellspacing="0"
                                                          style="min-width: 600px; width: 600px;" width="600"
                                                          class="scale">
                                                          <tbody>
                                                              <tr>
                                                                  <td class="logo-box" width="100%" align="center"
                                                                      style="background-color: #C55930; padding: 25px 0px 25px 0px;"
                                                                      bgcolor="#57FF09">
                                                                      <a style="text-decoration: none;"
                                                                          href="https://ircomx.com/" target="_blank">
                                                                          <img style="width: 100%; max-width: 150px; height: auto; max-height: none; margin: 0px auto;"
                                                                              src="https://blogger.googleusercontent.com/img/a/AVvXsEhB43RwNpaaT7HL5R_4rvYOkyF9yMZfbYTn72T84UOZFNr8T1oQ0PoBzH8gWleuyFO1UXlyisK3Eh9FB8z4gf9lpTdP172uqzOWwV02Dfb0Xr7DyDPAAC4Vpu6ID8CXjJ73Z20x58Qd2sXprKAd8824SZCpAc0ZcZq5_vnfVc6P_j2GylJat7dXwEW3wQ=s700"
                                                                              width="480" height="46" border="0">
                                                                      </a>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td bgcolor="#ffffff"
                                                                      style="height: 15px; line-height: 15px; background-color: #ffffff;"
                                                                      height="15">
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="color: black; font-size: 30px; font-weight: 700; line-height: 45px; mso-line-height-rule: exactly; text-align: center; padding: 35px 10px 10px 10px;"
                                                                      align="center" class="headline">
                                                                      <a style="text-decoration: none; color: black;">Pedido
                                                                          RECHAZADO no.
                                                                          ${data.documento}</a>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 25px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 30px 20px;"
                                                                      align="center" class="copy">
                                                                      <a style="color: #000000; text-decoration: none;">Estimado
                                                                          ${data.cliente},</a>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; mso-line-height-rule: exactly; text-align: justify; padding: 0px 20px 0px 20px;"
                                                                      align="center" class="copy">
                                                                      <a style="color: #000000; text-decoration: none;">
                                                                          <p>
                                                                              <h4
                                                                                  style="font-weight: bold; font-size: 15px;">
                                                                                  Te informamos que tu pedido ha sido
                                                                                  RECHAZADO por
                                                                                  la siguiente razón "${data.Comentario}"
                                                                              </h4>
                                                                          </p>
                                                                          <p>Si tienes alguna duda puedes contactarnos al
                                                                              teléfono <a
                                                                                  style="color: #045bab; font-weight: bold;">
                                                                                  667 760 5233 Ext. 107 y 108</a> o
                                                                              escríbenos al correo <a
                                                                                  style="color: #045bab; font-weight: bold;">contacto@ircocommercial.com</a>,
                                                                              donde con gusto te
                                                                              atenderemos.</p>
                                                                      </a>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 0px 20px;"
                                                                      align="center" class="copy">
                                                                      <a style="color: #000000; text-decoration: none;">
                                                                          Detalle del pedido.</a>
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                      <br>
                                                      <div style="padding: 0px 20px 0px 20px;">
                                                          <table align="center" border="0" cellpadding="0" cellspacing="0"
                                                              style="min-width: 600px; width: 600px;" width="600"
                                                              class="scale">
                                                              <tr style="background-color: #C55930; color: white">
                                                                  <th>ARTÍCULO</th>
                                                                  <th>DESCRIPCIÓN</th>
                                                                  <th>CANTIDAD</th>
                                                                  <th>PRECIO</th>
                                                                  <th>TOTAL</th>
                                                              </tr>
                                                              ${data.body}
                                                              <tr>
                                                                  <td colspan="6" style="text-align: right;"></td>
                                                              </tr>
                                                              <tr>
                                                                  <td colspan="4" style="text-align: right;">Total:</td>
                                                                  <th
                                                                      style="text-align: left; background-color: #C55930; font-size: 13px; color:white;">
                                                                      $
                                                                      ${Number(data.Subtotal).toFixed(2)}</th>
                                                              </tr>
                                                          </table>
                                                      </div>
  
                                                      
                                                      <br><br>
  
                                                      <table border="0" cellpadding="0" cellspacing="0"
                                                          style="min-width: 600px; width: 600px; background-color: #C55930;"
                                                          width="600" class="scale">
                                                          <tbody>
                                                              <tr>
                                                                  <td width="100%" align="center" valign="middle"
                                                                      style="vertical-align: middle;">
                                                                      <table cellpadding="0" cellspacing="0" border="0">
                                                                          <tbody>
                                                                              <tr>
                                                                                  <td style="padding: 40px 0px 40px 0px;"
                                                                                      class="contact-pad" align="center">
                                                                                      <table cellpadding="0"
                                                                                          cellspacing="0" border="0">
                                                                                          <tbody>
                                                                                              <tr>
                                                                                                  <td style="padding: 0px 7px 0px 0px;"
                                                                                                      align="center"
                                                                                                      width="27"><a
                                                                                                          style="text-decoration: none; color: #ffffff;"
                                                                                                          href="https://ircomx.com/contacto/"
                                                                                                          target="_blank"
                                                                                                          rilt="ContactUs_Icon"><img
                                                                                                              style="display: inline;"
                                                                                                              src="https://1.bp.blogspot.com/-VoID1BgvhrY/YRGMjLGW24I/AAAAAAAAAbE/mWax9GkDfJsDgCObf6geHCCP5FbyftsZACLcBGAsYHQ/s20/telefono_Mesa%2Bde%2Btrabajo%2B1.png"
                                                                                                              width="20"
                                                                                                              height="20"
                                                                                                              alt=""
                                                                                                              border="0"></a>
                                                                                                  </td>
                                                                                                  <td style="font-size: 22px; font-weight: 700; color: #ffffff; text-align: center;"
                                                                                                      class="contact-text"
                                                                                                      align="center"><a
                                                                                                          style="text-decoration: none; color: #ffffff;"
                                                                                                          href="https://ircomx.com/contacto/"
                                                                                                          target="_blank"
                                                                                                          rilt="ContactUs_Text">
                                                                                                          Llámanos al 667
                                                                                                          760 5233 Ext.
                                                                                                          107 y 108 </a>
                                                                                                  </td>
                                                                                              </tr>
                                                                                          </tbody>
                                                                                      </table>
                                                                                  </td>
                                                                              </tr>
                                                                          </tbody>
                                                                      </table>
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                      <br>
                                                      <table align="center" border="0" cellpadding="0" cellspacing="0"
                                                          style="background-color: #ffffff; min-width: 600px; width: 600px;"
                                                          width="600" class="scale">
                                                          <tbody>
                                                              <tr>
                                                                  <td style="padding:0 0 21px;">
                                                                      <table align="center" style="margin:0 auto;"
                                                                          cellpadding="0" cellspacing="0">
                                                                          <tbody>
                                                                          <tbody>
                                                                            <tr>
                                                                                <!-- facebook -->
                                                                                <td class="active-i">
                                                                                  <a style="text-decoration:none;"
                                                                                    href="https://www.facebook.com/ircocommercial" target="_blank">
                                                                                    <img src="https://blogger.googleusercontent.com/img/a/AVvXsEgde4jxkeChupZEDSxVmwtK3r2K5tCzWQziQqM2KNVIP3vardtmFJQSl5YReE7aDn368cdOgyucSJ0RBZp9Id7MS-rtno79fbYGtZK8Z9EtPKxB-N4s-b9Im7Hvm4RThFC4AJGxbPdkSuE9ujwp931J6NpYHWEtLz8pSHiLmCIEM87LL5EPYiftoVnqlw=w128-h128-p-k-no-nu" width="30"
                                                                                      style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                                                      alt="fb">
                                                                                  </a>
                                                                                </td>
                                                                                <!-- WHATS CONTACTO -->
                                                                                <td width="20"></td>
                                                                                <td class="active-i">
                                                                                  <a style="text-decoration:none;" href="https://api.whatsapp.com/message/ZPC6FBIMZR2ME1" target="_blank">
                                                                                    <img
                                                                                      src="https://blogger.googleusercontent.com/img/a/AVvXsEjqaqX5ldiIPbcp5NTJMpyEGGv5-UKLAOqQ0gBfsxFM_EY9BfVRlpc4N-BH7O93dKuJHlUB7q0fjDMN4Tb953KRDYohHn4F3JMznQNheMMTdeZhataZ-1VWc8U0YicOuo-3ay0PBVAURVD-xtcm5C3Qay064Fmh9KPjj5oINGSjO8kLIdl3eTLJAxmkEg=s512"
                                                                                      width="30"
                                                                                      style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                                                      alt="ig">
                                                                                  </a>
                                                                                </td>
                                                                                <!-- Linkedin -->
                                                                                <td width="20"></td>
                                                                                <td class="active-i">
                                                                                  <a style="text-decoration:none;"
                                                                                    href="https://www.linkedin.com/company/ircocommercial" target="_blank">
                                                                                    <img src="https://blogger.googleusercontent.com/img/a/AVvXsEjjRyYybHb4R6-HFrss9Uqf0pVz16Vb5tGPkdjJ1PYynwfFaw7n7WgLi6GaqufMLYqkwUJrUVvGNcNcwQEhcK3Oc4ldlXfW-bWZztlLDp09QtfvSjr0ekF_oEExjoW8aVVMwr7Cfq7v4SJQ44dXybk77uoYZih3BSM9SVQnYXmEJYCNouXHJmoXDrZQkg=w128-h128-p-k-no-nu" width="30"
                                                                                      style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                                                      alt="tw">
                                                                                  </a>
                                                                                </td>
                                                                                <!-- web -->
                                                                                <td width="20"></td>
                                                                                <td class="active-i">
                                                                                  <a style="text-decoration:none;" href="https://ircomx.com/" target="_blank">
                                                                                    <img
                                                                                      src="https://blogger.googleusercontent.com/img/a/AVvXsEh3HK6D2z1Ex7SnDv2C6z8sCYtFXc5cIdDLo26tQQONMyCPhwsCww8KRey6jTGgUKGDFj2dKeayvEuK0kgftLR_ELwaxLbozfEpKAfMGY9uWRoRFEA9MUZFF-hmJKV10aICo8mdtud5E50Qo4YOdDusrYSEq9b6afNfLklmiKwh499yS23-e87FWSQ2Zw=w128-h128-p-k-no-nu"
                                                                                      width="30"
                                                                                      style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                                                      alt="tw">
                                                                                  </a>
                                                                                </td>
                                                                                <!-- instagram -->
                                                                                <td width="20"></td>
                                                                                <td class="active-i">
                                                                                  <a style="text-decoration:none;" href="https://www.instagram.com/ircomx/"
                                                                                    target="_blank">
                                                                                    <img
                                                                                      src="https://blogger.googleusercontent.com/img/a/AVvXsEihGR_WFsY_mcr1O98nFd3UJgyHDzBiFdCCIJfo8pUxKzafRg4Ejs40lIX9Pq5ay-zTp1fdP2Hgqqf0tZ2J6WGe8uihlEkEbWdmEEKMhIvGFj5tzyfbo_dYIlSEWKZsWX3_57FklXJRHH85STBRAAAy4VM_8qvzX_v8S0xer6l7xOKOm4g60_ETnuiMmw=w128-h128-p-k-no-nu"
                                                                                      width="30"
                                                                                      style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                                                      alt="tw">
                                                                                  </a>
                                                                                </td>
                                                                                <!-- youtube -->
                                                                                <td width="20"></td>
                                                                                <td class="active-i">
                                                                                  <a style="text-decoration:none;" href="https://www.youtube.com/channel/UCKXH3Y4ePOk_hnN3tnmHPYQ" target="_blank">
                                                                                    <img
                                                                                      src="https://blogger.googleusercontent.com/img/a/AVvXsEh0Hl8ESN5td3FWq1e6FkjZck1H_RPmy7MuFEU5Y6HQuFnATwuwci2ot51JNOCWplh9M13s7R_AB7-Lw3dHMl6pkoS-GdW9QeTXqVBqxDDgM3GEPCY1jgjJGlI55uObZlWyFUidKSkGCuWNO0jxR27PK-Kwze41WjrbJb3F3w0Ywaqg2aT8mu60nnjueA=w128-h128-p-k-no-nu"
                                                                                      width="30"
                                                                       
                                                                                      style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                                                      alt="tw">
                                                                                  </a>
                                                                                </td>
                                                                              </tr>
                                                                          </tbody>
                                                                      </table>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td valign="top">
                                                                      <table border="0" cellpadding="0" cellspacing="0"
                                                                          style="width: 100%;" width="100%">
                                                                          <tbody>
                                                                              <tr>
                                                                                  <td
                                                                                      style="padding: 0px 20px 7px 20px; font-family: Helvetica; font-size: 12px; color: #999999; text-align: center; line-height: 100%; mso-line-height-rule: exactly;">
  
                                                                                      <span class="footerLink">
  
                                                                                          © 2021. Todos los derechos
                                                                                          reservados.</span>
  
                                                                                      <br>
                                                                                      <br>
                                                                                      <a href="https://ircomx.com/"
                                                                                          style="color:#999999; text-decoration: underline;"
                                                                                          target="_blank">ircocommercial.com</a>
                                                                                  </td>
                                                                              </tr>
                                                                          </tbody>
                                                                      </table>
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </td>
              </tr>
          </tbody>
      </table>
  </body>
  </html>`;
  return msghtml;
}