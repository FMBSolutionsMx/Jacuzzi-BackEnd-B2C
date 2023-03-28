import {Request, Response} from "express";
import moment from 'moment';
import VentasClientes from '../interfaces/VentasClientes';
import {getShoppingCart} from "./ProfileController";
import ResponseModel from "../models/ResponseModel";
import OrdersModel from '../models/OrdersModel';
import OrdersProcedure from '../procedures/OrdersProcedure';
import ProductsModel from "../models/ProductsModel";
import ProductsProcedure from "../procedures/ProductsProcedure";
import {getTypeDocument} from '../interfaces/xml';
import {helpers} from '../middleware/helper';
import {logger} from "../util/logger";
import SeriesProcedure from "../procedures/SeriesProcedure";
import EmailProcedure from "../procedures/EmailProcedure";
import { ConsoleTransportOptions } from "winston/lib/winston/transports";
import AutorizacionesProcedure from "../procedures/AutorizacionesProcedure";
import { insertPoints } from "../controllers/PointsHistoryController";
import PointsHistoryModel from "../models/PointsHistoryModel";
import PointsHistoryProcedure from "../procedures/PointsHistoryProcedure";
import { DatabaseService } from "../util/database";
import {orderValidate} from '../middleware/Order';
import { SchemaService } from "../util/Schema";
import formidable from 'formidable';
const fs = require('fs-extra')

export async function createDocuments(request: Request, response: Response) {
    const {db_name, sapConfig, taxCode, currency, paymentMethod, type} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {CardCode,GroupNum} = response.locals.user;
    const {U_FMB_Handel_Email} = response.locals.user;
    const {CardName, wareHouse} = response.locals.user;
    const {objType, address, bill, responseFlete, empID,creator, comment,insurance, itemsGift, fecha, discPrcnt,discPnt, Handel,IdPackge,PorCobrar,tipoEntrega,convenio, datos,packageKeySelect} = request.body;

  if(type === 'SQL'){
    let serie;
    let maniobrasdos = insurance ? insurance : 0;

    //Se define el nuemro de seríe
    await SeriesProcedure('getSerie').then(result => {
      serie = result[0].serieDefault;
    });
    // await SeriesProcedure('getSeries').then(result => {
    //   for (let index = 0; index < result.length; index++) {
    //     const element = result[index];
    //     if(objType === '17' && element.ObjectCode === '17'){
    //       serie = element.Series;
    //     }else if (objType === '23' && element.ObjectCode === '23'){
    //       serie = element.Series;
    //     }
    //   }
    // });
    // let numSerie = await SeriesProcedure("getSerieOrder");
    // serie = numSerie[0].Series;

    const db = new DatabaseService();

    // Definicion del valor del punto
    let pointsModel: PointsHistoryModel = new PointsHistoryModel();
    pointsModel.action = "pointsMoney";
    let infoPointsMoneyResponse = await PointsHistoryProcedure(pointsModel);
    let valueEquals = parseFloat(infoPointsMoneyResponse[0].Name) || 0;

    // modelo de respuesta
    const responseModel = new ResponseModel();

    let shoppingCart: any = await getShoppingCart(request, response, true);
    //obtiene lo que trae el arreglo del carrito

    if(!shoppingCart.status){
        responseModel.message = 'Ocurrió un error al obtener el carrito de compras para generar el pedido';
        response.json(responseModel);
        return;
    }

    let cardCode = CardCode;
    let addressKey = '';
    let billKey = '';
    let comments = '';
    let docCurrency = currency;
    //Email del cliente
    // let mailToCliente = U_FMB_Handel_Email;
    let nameMail = CardName;
    let totalMail = '0';

    if(profile_id){
      if(address.address===bill.address){
        addressKey = address.address;
        billKey = "";
      }else{
        addressKey = address.address;
        billKey = bill.address;
      }
    }else{
        comments = `
        nombre: ${address.name}, email: ${address.email}, telefono: ${address.phone},
        calle: ${address.street}, colonia: ${address.block}, municipio: ${address.city},código postal: ${address.cp},
        estado: ${address.state}, pais: ${address.country},
        `;
    }

    let subTotal = 0;
    let taxTotal = 0;
    let total = 0;
    let tax = 0;
    //Variables para validacion del Flete
    let transport = 0;
    let taxTransport = 0;
    let limit = 0;
    let articulos: any = [];
    shoppingCart.data.shoppingCart.map((item:any) => {
        let totalPrice = Number((item.Price * item.Rate) * item.quantity);
        subTotal += totalPrice;
        tax = item.taxRate;
        taxTotal += Number(item.taxSum * item.quantity);
        articulos.push({'ItemCode': item.ItemCode, 'quantity': parseInt(item.quantity)});
    });
    articulos = JSON.stringify(articulos);
    
    limit = parseInt(responseFlete.PurchaseLimit);
    transport = parseFloat(responseFlete.Price);
    taxTransport = Number(transport*(tax*0.01));
    //Validacion del flete
    if(subTotal < limit){
        taxTotal = taxTotal + taxTransport;
        total = subTotal + transport + taxTotal;
    }else{
        transport = 0;
        total = subTotal + transport + taxTotal;
    }


    //#region AUTORIZACION
    let autorizaciones : any = []; // await AuthorizationDocuments(request,response);
    //#endregion AUTORIZACION
    let doc = getTypeDocument(objType);

    // Buscando puntos
    let model: ProductsModel = new ProductsModel();
    model.action = 'getPoints';
    model.cardCode = CardCode;
    model.business = db_name;

    let itemPoints = shoppingCart.data.shoppingCart;
    let totalPoints = 0;
    let activePointsNew = Number(discPnt);
    let activePointsNewCopy = activePointsNew;

    // Puntos por total de documento
    for (let i = 0; i < itemPoints.length; i++) {
      model.key = itemPoints[i].ItemCode;
      model.quantity = itemPoints[i].quantity;
      let points = await ProductsProcedure(model);
      if(points && points.length > 0){
        let queryPoints = Number(points[0].queryPoints).toFixed(0);
        itemPoints[i].itemPoint = Number(queryPoints);
        totalPoints += Number(queryPoints);
      }else{
        itemPoints[i].itemPoint = 0;
        totalPoints += 0;
      }

      let totalPrice = Number(itemPoints[i].Price) * Number(itemPoints[i].quantity);
      
      if(itemPoints[i].U_FMB_Handel_PNTA == 1){
        let valuePoints = Number(activePointsNew) * Number(valueEquals);
        if(valuePoints >= totalPrice){
            valuePoints = totalPrice;
        }
        totalPrice -= valuePoints;
        
        let discPrcntBack = totalPrice == 0 ? Number(99.99).toFixed(2) : Number(((valuePoints * 100)) / (Number(itemPoints[i].Price * Number(itemPoints[i].quantity)))).toFixed(2);
        itemPoints[i].discount = discPrcntBack === 'NaN' ? 0 : discPrcntBack;
        //Restar puntos
        activePointsNew -= valuePoints/valueEquals;
      }  
    }

    let transportWithoutTax = parseFloat(insurance); //Seguro con iva
    transportWithoutTax = Number(( transportWithoutTax - (transportWithoutTax * (itemPoints[0].taxRate/100)) ).toFixed(2));
    let insuranceObject = {
      // ItemCode: 'MANIOBRAS II',
      // quantity: '1',
      // Price: transportWithoutTax
    }

    let service = autorizaciones.length > 0 ? "DraftsService" : doc.service;
    // let estado = autorizaciones.length > 0 ? "A" : 'C'
    // Eliminar puntos en caso de que se hayan usado
    let dataInsertMinus = 0; 
    if(Number(discPnt) != 0){
      dataInsertMinus = activePointsNewCopy - activePointsNew;
    }

    let data = {
      header: { 
        dataInsertMinus, 
        objType, 
        service,
        cardCode, 
        currency, 
        docCurrency, 
        addressKey, 
        billKey, 
        comments, 
        comment, 
        wareHouse, 
        taxCode, serie, paymentMethod,empID,creator, totalPoints,discPrcnt,IdPackge, PorCobrar, tipoEntrega, convenio, insurance, datos,packageKeySelect }, //estado
      items: itemPoints || [],
      itemsGift : itemsGift || [],
      responseFlete: responseFlete || [],
      address: address,
      bill: bill,
      insurance: insuranceObject
    };
    
    const ventasClienteInterface = new VentasClientes(sapConfig);
    
    ventasClienteInterface.createXML(data);
    ventasClienteInterface.setOptions();
    let responseDiServer:any = await ventasClienteInterface.createCall();

    if(!responseDiServer.status){
        responseModel.message = 'Ocurrio un error al generar tu pedido. intentalo nuevamente (estado de la orden)';
        response.json(responseModel);
        return;
    }        

    let ordersModel: OrdersModel = new OrdersModel();

    ordersModel.action = 'findDocNum';
    ordersModel.business = db_name;
    ordersModel.docEntry = responseDiServer.docEntry || 0;
    ordersModel.table = autorizaciones.length > 0 ? "ODRF" : doc.table; // 

    let datosCliente = {
      actions : 'DATOS',
      param1 : CardCode,
      param2 : '', 
      param3 : '',
    }
    let CorreoCliente = await AutorizacionesProcedure(datosCliente);

    let docNumResponse = await OrdersProcedure(ordersModel);

    if(!docNumResponse || !docNumResponse[0]){
        responseModel.message = 'Ocurrio un error al generar tu pedido. intentalo nuevamente (valida un numero)';
        response.json(responseModel);
        return;
    }

    // FALTA AGREGAR ESTO EN AUTORIZACIONES EN CASO DE QUE SE VAYA A BORRADORES
    if(ordersModel.table !== "ODRF"){
      // HAcer la incersion a la tabla de movimientos de punto
      // Resta de puntos utilizados
      if(Number(discPnt) != 0){
        let dataInsertDeleteUsedPoints = {
          DocEntry: responseDiServer.docEntry,
          DocType: 23,
          DocNum: docNumResponse[0].DocNum,
          CardCode: CardCode,
          Total: activePointsNewCopy - activePointsNew,
          Type: 'resta',
          UsedPoints: '1'
        }   
        let resultInsertDeleteUsedPoints = await insertPoints(dataInsertDeleteUsedPoints);
      }
      // if(Number(discPnt) != 0){
      //   let dataInsertMinus = {
      //     DocEntry: responseDiServer.docEntry,
      //     DocNum: docNumResponse[0].DocNum,
      //     CardCode: CardCode,
      //     Total: activePointsNewCopy - activePointsNew,
      //     Type: "resta",
      //   }
      //   let resultInsert = await insertPoints(dataInsertMinus); 
      // }

      // NO se debe agregar a tabla porque aun no es Factura
      // if(totalPoints != 0){
      //   let dataInsert = {
      //     DocEntry: responseDiServer.docEntry,
      //     DocNum: docNumResponse[0].DocNum,
      //     CardCode: CardCode,
      //     Total: totalPoints,
      //     Type: "suma",
      //   }
    
      //   let resultInsert = await insertPoints(dataInsert);  
      // }
    }
    // let mensajeCond = CorreoCliente[0].PymntGroup;
    let mailToCliente = CorreoCliente[0].E_Mail;
    // let Vendedor = CorreoCliente[0].Email;

    let isDraft = ordersModel.docEntry;
    let hoy = new Date();
    let today = moment(hoy).format('YYYYMMDD');
    var Hora = hoy.getHours();
    var Min = hoy.getMinutes();
    let CorreoAutorizadores = '';
    let file: any[] = [];

    for (let index = 0; index < autorizaciones.length; index++) {
      const datos = autorizaciones[index];
      CorreoAutorizadores += datos.Correo+",";                   
      try {
        let wtmCode = file.indexOf(datos.wtm);
        if(wtmCode == -1){
          file.push(datos.wtm);
          let respon = await db.Query(`INSERT INTO [Handel_B2C_Irco].[dbo].[FMB_OWDD] 
          (U_WtmCode,U_OwnerID,U_DocEntry,U_ObjType,CartShop,U_DocDate,U_CurrStep,U_Status,U_Remarks,U_UserSign,U_CreateDate,U_CreateTime,U_IsDraft,U_MaxReqr,U_MaxRejReqr) 
          VALUES (${datos.wtm},${datos.autoId},${isDraft},'17','${articulos}','${today}',${datos.wst},'W','${datos.nameCond}','1','${today}',${Hora+''+Min},'Y',${datos.MaxReqr},${datos.MaxRejReqr})`);   
        }              
        await db.Query(`INSERT INTO [Handel_B2C_Irco].[dbo].[FMB_WDD1] 
            (U_WddCode,U_StepCode,U_UserID,U_Status,U_Remarks,U_UserSign,U_CreateDate,U_CreateTime,U_UpdateDate,U_UpdateTime)
            VALUES (${isDraft},${datos.wst},${datos.autoId},'W','${datos.nameCond}','1','${today}',${Hora+''+Min},'${today}',1)`);    
      }
      catch (e) {
        logger.error("Autorizacion-> Insert FMB_OWDD: ", e);
      }  
    }

    let Subtotal = 0;
    let Total = 0; 
    // let tax = 0;
    let totalpesoNeto = 0;
    let tipoVta= '';
    let des = '';
  
      let DocEntry = des === 'Drafts' ? docNumResponse[0].DocNum+'-'+ docNumResponse[0].DocEntry :  docNumResponse[0].DocNum;
  
      let titulo1 = tipoVta === '02' ? 'Pedido no. '+DocEntry+' (Transferencia gratuita).' : 'Pedido no. '+DocEntry;
      let titulo2 = tipoVta === '02' ? 'Pedido no. '+DocEntry+' (Transferencia gratuita en proceso de autorización).' : 'Pedido no. '+DocEntry+'(En proceso de autorización).';
      let titulo = des === 'Drafts' ? titulo2 : titulo1;

    let body: any;
    body = '';
    // data.items.map((item: any) =>{
    //   item.Discount = parseInt(item.Discount);
    //   if (isNaN(item.Discount)) {
    //     item.Discount = 0;
    //   }
    //   let Preciototal = Number(item.priceTax * item.quantity - (item.priceTax * item.quantity * (item.Discount / 100)));
    //   tax = item.taxRate;
    //   Subtotal += Preciototal;
    //   totalpesoNeto += Number(item.weight * item.quantity);
    //     body += `
    //     <tr>
    //       <td>${item.ItemCode}</td>
    //       <td>${item.ItemName}</td>
    //       <td style="text-align: center;" >${item.quantity}</td>
    //       <td>$ ${parseFloat(item.Price).toFixed(2)}</td>              
    //       <td>$ ${Number(Preciototal).toFixed(2)}</td>
    //       <td style="text-align: right;">${Number(item.weight * item.quantity).toFixed(2)} KG</td>`;
    //     //return body;
    //   });
    // body += '</tr>'
    data.items.map((item: any) =>{
      item.Discount = parseInt(item.Discount);
      if (isNaN(item.Discount)) {
        item.Discount = 0;
      }
      let Preciototal = Number(item.priceTax * item.quantity - (item.priceTax * item.quantity * (item.Discount / 100)));
      tax = item.taxRate;
      Subtotal += tipoVta === '02' ? 0 : Preciototal;
      totalpesoNeto += Number(item.weight * item.quantity);
        body += `
        <tr>
          <td>${item.ItemCode}</td>
          <td>${item.ItemName}</td>
          <td style="text-align: center;" >${item.quantity}</td>
          <td>$ ${parseFloat(item.Price).toFixed(2)}</td>              
          <td>$ ${Number(Preciototal).toFixed(2)}</td>`;
        return body;
      });
      // if(Object.keys(responseFlete).length > 0){
      //   body += `
      //   <tr>
      //     <td>${responseFlete.ItemCode}</td>
      //     <td>${responseFlete.ItemName}</td>
      //     <td style="text-align: center;" >1</td>
      //     <td>$ ${parseFloat(responseFlete.Price).toFixed(2)}</td>              
      //     <td>$ ${Number(responseFlete.Price).toFixed(2)}</td>`;
      // }
      // if(insuranceObject){
        // body += `
        // <tr>
        //   <td>${insuranceObject.ItemCode}</td>
        //   <td>${insuranceObject.ItemCode}</td>
        //   <td style="text-align: center;" >1</td>
        //   <td>$ ${parseFloat(maniobrasdos).toFixed(2)}</td>              
        //   <td>$ ${Number(maniobrasdos).toFixed(2)}</td>`;
      // }
    let maniobras = 0// Object.keys(responseFlete).length > 0 ? responseFlete.Price : 0;

    Subtotal = Subtotal //+ maniobras;
    Subtotal = Subtotal //+ maniobrasdos;
    Subtotal = discPrcnt ? Subtotal - (Subtotal * discPrcnt / 100)  : Subtotal;
    let htmlDiscPrcnt:any = '';
    if(discPrcnt){
      htmlDiscPrcnt = `<tr>
      <td colspan="4" style="text-align: right; color: black;">Descuento:</td>
      <th colspan="6" style="text-align: left; background-color: #FFF; color: black" > ${discPrcnt}%</th>
    </tr>`
    }
    body += '</tr>'
    let Igv = tipoVta === '02' ? 0 : tax * Subtotal / 100;
    Total = tipoVta === '02' ? 0 : Subtotal + Igv;
    let borr = 'Documento en proceso de autorización con No. ' +docNumResponse[0].DocNum+'-'+isDraft;
    let order = 'Se créo correctamente el documento con el No. '+docNumResponse[0].DocNum;
    let respuesta = autorizaciones.length > 0 ? borr : order; //  

    let mensaje = "Te informamos que tu Pedido se encuentra en estado pendiente.";
    responseModel.message = 'orden creada';
    responseModel.status = 1;
    responseModel.data = {docNum: respuesta};
    let orderMail = docNumResponse[0].DocNum;

    let infoEmail =  {
      orderMail: orderMail,
      nameMail: nameMail,
      mensaje:mensaje,
      body: body,
      Subtotal:Subtotal,
      totalpesoNeto: totalpesoNeto,
      address: address || '',
      htmlDiscPrcnt
    }

    let msghtml = contextEmailDaysPlus(infoEmail);
    // Validacion de tipo de credito
    
    // HAcer la incersion a la tabla de movimientos de punto
      
    let dataMail = await EmailProcedure("getOrder");
    ////console.log(dataMail);
    let bcc;
    if (dataMail[0].validateOrderBCC === 1){
      bcc = dataMail[0].orderBCC;
    }else{
      bcc="";
    }
    let subject = dataMail[0].orderSubject;
    let sendMail = await helpers.sendEmail( mailToCliente + "desarrollo3@fmbsolutions.mx","",bcc,subject,msghtml,null );
    response.json(responseModel);
  }else{
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const sh = new SchemaService ();
    let serie;
    await SeriesProcedure('getSerie').then(result => {
      serie = result[0].serieDefault;
    });
    const responseModel = new ResponseModel();

    let shoppingCart: any = await getShoppingCart(request, response, true);
    //obtiene lo que trae el arreglo del carrito
    
    if(!shoppingCart.status){
        responseModel.message = 'Ocurrió un problema al obtener el carrito de compras para generar el pedido';
        response.json(responseModel);
        return;
    }

    let prices :any;
    
    let tipoVta = '01';
    let cardCode = CardCode;
    let addressKey = '';
    let billKey = '';
    let comments = '';
    let docCurrency = currency;
    //Email del cliente
    //let mailToCliente = U_Handel_Email;
    let nameMail = CardName;
    let totalMail = '0';

    if(profile_id){
      if(address.address===bill.address){
        addressKey = address.address;
        billKey = "";
      }else{
        addressKey = address.address;
        billKey = bill.address;
      }
    }else{
        comments = `
        nombre: ${address.name}, email: ${address.email}, telefono: ${address.phone},
        calle: ${address.street}, colonia: ${address.block}, municipio: ${address.city},código postal: ${address.cp},
        estado: ${address.state}, pais: ${address.country},
        `;
    }

    let today:any = new Date();
		today = moment(today).format('YYYYMMDD');
    let fecha = moment(today).format('YYYY-MM-DD');
    // fecha = fecha.substr(0,7);
    //WAREHOUSE DEL DOCUMENTO
    let resultWareHouse : any= []// await WareHouseProcedure('U_SYP_RICO_CCANAL', 'U_SYP_RICO_CSUCUR');
    
    //resultWareHouse = resultWareHouse[0].U_SYP_RICO_CODALM;
    let articulos: any = [];//INSERT EN AUTORIZACION   
		let items: any = [];
    items = shoppingCart.data.shoppingCart;
    
    //Descuentos
    let model: ProductsModel = new ProductsModel();

    model.action = 'searchByKey';
    model.business = db_name;
    model.cardCode = CardCode;

    let DocumentLines: any =[];
    let datos : any;
        
		items.map((item: any) =>{    
			let lines ={
				ItemCode:item.ItemCode,
        Quantity: item.quantity,
        Currency : item.currency,
        WarehouseCode: item.WhsCode,
				// TaxCode: 'IVAV16',
        // Price: item.Price,
        //Debe ser Y si en la linea es bonificacion
        //U_SYP_RICO_BONIF: 'N', 
        //Si es bonificaicon tYES solo en la linea que es y si es TRANSFERENCIA GRATUITA ES EN TODAS LAS LINEAS       
        // TaxOnly: 'tNO',
			}
      DocumentLines.push(lines);
      articulos.push({'ItemCode': item.ItemCode, 'quantity': parseInt(item.quantity)});
    });
     articulos = JSON.stringify(articulos);
    //#########################################itemsGift##############################################
    let stockBonificacion = false;
    let articulosbonificacion = '';
    let quiebreStock : any =[];
       
      //----------------------------
      
     let DocSubtotal = 0;
     let DocTotal = 0; 
     let Doctax = 0;
     items.map((item: any) =>{
       item.Discount = parseInt(item.Discount);
       if (isNaN(item.Discount)) {
         item.Discount = 0;
     }
       let Preciototal = Number(item.Price * item.quantity - (item.Price * item.quantity * (item.Discount / 100)));
       Doctax = item.taxRate;
       DocSubtotal += tipoVta === '02' ? 0 : Preciototal;
     });

     let DocIgv = tipoVta === '02' ? 0 : Doctax * DocSubtotal / 100;
     DocTotal = tipoVta === '02' ? 0 : DocSubtotal + DocIgv;

    

  ////PROCESO DE AUTORIZACION QUERY 
    // let ModelAutorization : any;
    // let IdAutorization : any;
    // let NameAutorization : any;
    
    // //let resul = await AutorizationProcedure();  
    // let ListAutorizations = {
    //   actions : 'ALL'
    // }
    // let resul = await AutorizacionesProcedure(ListAutorizations);    
    
    let creditLimit = false;
    // let borrador : any;
    // let dataResult = {};
    // var autorizaciones = new Array();
    // for (let index = 0; index < resul.length; index++) {
    //     const autorizarion = resul[index];
    //     // VTA-OV-FACVENC-LIMA
    //     if(autorizarion.QueryId===1546){
    //       let numAutorizacion = {
    //         actions : '1546',
    //         param1 : CardCode,
    //         param2 : total, 
    //         param3 : '',
    //       }
    //       let res = await AutorizacionesProcedure(numAutorizacion)
    //       borrador = res.length > 0 ? res[0] : [ { "'FALSE'": 'FALSE' } ];
    //       borrador = Object.values(borrador);
    //       borrador = borrador[0];
    //       if(borrador === 'TRUE'){
    //         ModelAutorization = autorizarion.Name;
    //         IdAutorization = autorizarion.UserID;
    //         NameAutorization = autorizarion.U_NAME;
    //       }
    //     }
    //     if(borrador === 'TRUE'){
    //         dataResult = {
    //             cond:true,
    //             nameCond : ModelAutorization,
    //             autoId : IdAutorization,
    //             autoName : NameAutorization,
    //             wtm : autorizarion.WtmCode,
    //             wst : autorizarion.WstCode,
    //             MaxReqr :autorizarion.MaxReqr,
    //             MaxRejReqr : autorizarion.MaxRejReqr,
    //             Correo : autorizarion.E_Mail
    //         }
    //         autorizaciones.push(dataResult);
    //     }              
    // }     
    let autorizaciones :any = []; // await AuthorizationDocuments(request, response);
    // let auto = autorizaciones ? autorizaciones : '';

    let des  = autorizaciones.length > 0 ? 'Drafts' : 'Orders';//  Quotations  
    let dire = bill.street+'-'+bill.block || '' + '-' + bill.city || ''+ '-' + bill.county || '';
    let datosCliente = {
      actions : 'DATOS',
      param1 : CardCode,
      param2 : '', 
      param3 : '',
    }
    let CorreoCliente = await AutorizacionesProcedure(datosCliente);
    ///////////////////DATA//////////////////////
    let data = {
			DocDueDate: fecha,
      DocDate: fecha,
      TaxDate: fecha,
			CardCode: CardCode,
      U_FMB_Handel_PKG: `${IdPackge || ''}|${packageKeySelect||''}|${convenio ||''}`,
      U_FMB_Handel_NUCN : convenio || '',
      U_Doc_Ecommerce: 'Y',
			// SalesPersonCode: '91',
			Series: serie,
			Comments: comment,//"Documento Prueba_Handel de " + CardCode,
			ShipToCode: addressKey,
      ShipFrom: addressKey,
			PayToCode: bill.address,
      // PaymentGroupCode : tipoVta === '02' ? -1 : CorreoCliente[0].GroupNum,
      // U_FMB_StockBonificacion : stockBonificacion ? "1" : "0",
      // U_FMB_ArticulosBonificacion : stockBonificacion ? articulosbonificacion :' ',
      // U_FMB_Handel_Creador : creator,
      DocObjectCode: 17,      
      //Descuento
      DiscountPercent: discPrcnt || 0,		
			DocumentLines,
			// AddressExtension: {
			// 	ShipToStreet: address.street,
			// 	ShipToBlock: "",
			// 	ShipToCity: address.city,
			// 	ShipToCounty: "",
			// 	ShipToState: address.state,
			// 	ShipToCountry: address.country,
			// 	ShipToAddressType: "S",
			// 	BillToStreet: bill.street,
      //   BillToBlock: bill.block,
      //   BillToCity: bill.city,
      //   BillToCounty: bill.county,
      //   BillToState: bill.state,
      //   BillToCountry: bill.country,
			// 	BillToAddressType: "bo_BillTo"
			// }			
    };
    ///////////////////DATA//////////////////////
    // console.log('con<',data);
    
    let ordersResponse = await sh.NewOrderService(des,data);
    // let respuestsa = await sh.getDocument("Orders",110913); 
        // console.log("con<<<", respuestsa)
        // return;
        if(ordersResponse.message){
            let error = ordersResponse.message.error.message.value;
            logger.error("OrdersController => CreateDocument ",error);
            responseModel.message = error;///'Ocurrio un error al generar tu pedido. intentalo nuevamente (estado de la orden)';
            response.json(responseModel);
            return;
        }
        // let CorreoCliente = await Autorization('DATOS',CardCode,'','')
        let mensajeCond = CorreoCliente[0].PymntGroup;
        let mailToCliente = CorreoCliente[0].E_Mail;
        let Vendedor = CorreoCliente[0].Email;
        let men = '';
        
        if(mensajeCond.substr(0,7) === 'CONTADO'){
          men = 'Recuerda que si no cancelas dentro de las 24 horas siguientes tu pedido se anulara.'
        }
        else{
          men = '';
        }
        let DocNum = des === 'Drafts' ? ordersResponse.DocNum+'-'+ordersResponse.DocEntry : ordersResponse.DocNum;

        let trans = tipoVta === '01' ? 'NORMAL' : 'TRANSFERENCIA GRATUITA';
        let creditoExc = creditLimit ? 'por exceder el límite de crédito'  : '';
        let borr = 'Documento en proceso de autorización con No. ' +DocNum;
        let order = 'Se créo correctamente el documento con el No. '+DocNum;
        
        let respuesta = des === 'Drafts' ? borr : order;

        responseModel.message = '';
        responseModel.status = 1;
        responseModel.data = {docNum: respuesta}

        let hoy = new Date();
        var Hora = hoy.getHours();
        var Min = hoy.getMinutes();
        let CorreoAutorizadores = '';

        let isDraft = ordersResponse.DocEntry;
        let file: any[] = [];
        autorizaciones.map(async (datos: { autoName: any; nameCond: any; Correo: string; wtm: any; autoId: any; wst: any; MaxReqr: any; MaxRejReqr: any; }) =>{
          CorreoAutorizadores += datos.Correo+",";
          
              setTimeout(async () =>{              
                  let wtmCode = file.indexOf(datos.wtm);
                  if(wtmCode == -1){
                    try {
                      file.push(datos.wtm);
                      let respon = await sh.statements(`INSERT INTO "_E_HANDEL_B2C"."FMB_OWDD" 
                      ("U_WtmCode","U_OwnerID","U_DocEntry","U_ObjType","CartShop","U_DocDate","U_CurrStep","U_Status","U_Remarks","U_UserSign","U_CreateDate","U_CreateTime","U_IsDraft","U_MaxReqr","U_MaxRejReqr") 
                      VALUES (${datos.wtm},${datos.autoId},${isDraft},'17','${articulos}','${today}',${datos.wst},'W','${datos.nameCond}','1','${today}',${Hora+''+Min},'Y',${datos.MaxReqr},${datos.MaxRejReqr})`);   
                      
                    }                      
                    catch (error) {
                        logger.error("Insert FMB_OWDD:", error)
                    }                       
                  }              
              await sh.statements(`INSERT INTO "_E_HANDEL_B2C"."FMB_WDD1" 
                     ("U_WddCode","U_StepCode","U_UserID","U_Status","U_Remarks","U_UserSign","U_CreateDate","U_CreateTime","U_UpdateDate","U_UpdateTime")
                      VALUES (${isDraft},${datos.wst},${datos.autoId},'W','${datos.nameCond}','1','${today}',${Hora+''+Min},'${today}',1)`);    
              },500)
              
          });

        let Subtotal = 0;
        let Total = 0; 
        let tax = 0;
        let totalpesoNeto = 0;
        let mensajebonificacion = stockBonificacion ? 'El producto en Bonificación no cuenta con stock disponible: ' : '';
        let articulosbonifi = stockBonificacion ? quiebreStock : '';
        
        let DocEntry = des === 'Drafts' ? ordersResponse.DocNum+'-'+ordersResponse.DocEntry :  ordersResponse.DocNum;

        let titulo1 = tipoVta === '02' ? 'Pedido no. '+DocEntry+' (Transferencia gratuita).' : 'Pedido no. '+DocEntry;
        let titulo2 = tipoVta === '02' ? 'Pedido no. '+DocEntry+' (Transferencia gratuita en proceso de autorización).' : 'Pedido no. '+DocEntry+'(En proceso de autorización).';
        let titulo = des === 'Drafts' ? titulo2 : titulo1;
        let body: any;
        
        body = '';
        ordersResponse.DocumentLines.map((item: any) =>{
          let Preciototal = Number(item.PriceAfterVAT * item.Quantity);
          tax = item.TaxTotal;
          Subtotal += Preciototal;
          totalpesoNeto += Number(item.weight * item.Quantity);
            body += `
            <tr>
              <td>${item.ItemCode}</td>
              <td>${item.ItemDescription}</td>
              <td style="text-align: center;" >${item.Quantity}</td>
              <td>$ ${parseFloat(item.Price).toFixed(2)}</td>              
              <td>$ ${Number(Preciototal).toFixed(2)}</td>`;
            return body;
          });
        body += '</tr>'

        Subtotal = discPrcnt ? Subtotal - (Subtotal * discPrcnt / 100)  : Subtotal;
          
        let htmlDiscPrcnt:any = '';
        if(discPrcnt){
          htmlDiscPrcnt = `<tr>
          <td colspan="4" style="text-align: right; color: black;">Descuento:</td>
          <th colspan="6" style="text-align: left; background-color: #FFF; color: black" > ${discPrcnt}%</th>
        </tr>`
        }
        let Igv = tipoVta === '02' ? 0 : tax * Subtotal / 100;
        Total = tipoVta === '02' ? 0 : Subtotal + Igv;
        let mensaje = '';
        if(creditLimit){
          mensaje = 'Le informamos que su pedido ha excedido su límite de crédito disponible, favor de comunicarse con su asesor de ventas.';
        }else{
          mensaje = 'Nos complace informarle que su pedido ha sido correctamente registrado y será atendido a la brevedad.';
        }

        let infoEmail =  {
          orderMail: ordersResponse.DocNum,
          nameMail: nameMail,
          mensaje:mensaje,
          body: body,
          Subtotal:Subtotal,
          totalpesoNeto: totalpesoNeto,
          address: address || '',
          htmlDiscPrcnt
        }

        let msghtml = contextEmailDaysPlus(infoEmail);


        let dataMail = await EmailProcedure("getOrder");

        let bcc;
        if (dataMail[0].validateOrderBCC === 1){
          bcc = dataMail[0].orderBCC;
        }else{
          bcc="";
        }
        let subject = dataMail[0].orderSubject;
        let correosNuevos = '';

        correosNuevos = CorreoAutorizadores+Vendedor;

        let sendMail = await helpers.sendEmail(mailToCliente,correosNuevos +',tlm01@ircomx.com',"",subject,msghtml,null );

        response.json(responseModel);
  }
}
export async function SaveFileOV(request: Request, response: Response) {
  const {sapConfig} = response.locals.business;
  const responseModel = new ResponseModel();
  var form = new formidable.IncomingForm();
  let GlobalSap = JSON.parse(global.sap_config);
  try {
    form.parse(request, async function (err: any, fields: any, files: any) {
      if(!err) {
        
        // let cv = files.file.name;
        // let lastName;
        // let ext = cv.lastIndexOf(".");
        // let validateExt = cv.substring(ext, cv.length);
        
        // let fileName = moment().format("YYYY-MM-DD_HH-mm").toString() + "_OC_" + files.file.name;
        // fileNameMail = files.file.name;
        let route = GlobalSap[0].rutaATC;
        let fullRouteName = route + files.archivo.name;
        await fs.move(files.archivo.path, fullRouteName)
        .then(async () => {
          //117 cambios dudoso
          responseModel.message = 'orden creada';
          responseModel.status = 1;
          response.json(responseModel)
          //va pa arriba
          let newFiles = {
            pdfName: files.archivo.name ,
          };
          console.log('117>newFiles',newFiles);
          
          
        })
        .catch((err:any) => {
          console.log('con>err',err)
          responseModel.message = 'Error al cargar el documento, el nombre de este documento ya fue registrado';
          responseModel.status = 0;
          response.json(responseModel)
        })
        
       
      }else{
        responseModel.message = 'Error al cargar el documento';
        responseModel.status = 0;
        response.json(responseModel)
      }

    });
    
  } catch (error) {
    logger.error("SaveFileOV->>"+error);
    responseModel.message = 'Error al cargar el documento';
    responseModel.status = 0;
    response.json(responseModel)
  }
}

export async function orders(request: Request, response: Response) {
    const {db_name, localLanguage} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {CardCode} = response.locals.user;
    const { fechaInicio, fechaFinal } = request.params;

    const responseModel = new ResponseModel();
    if(!profile_id){
        responseModel.message = "no tienes permiso de realizar esta acción";
        responseModel.data = [];
    }

    try {
        let ordersModel: OrdersModel = new OrdersModel();
        let doc = getTypeDocument('17');
        //Fecha condicional desde donde aparecen los pedidos
        // let initialDate = moment(new Date(2020,1,1)).format('YYYYMMDD');
        // let finalDate = moment(new Date()).format('YYYYMMDD');

        ordersModel.action = 'getOrders';
        ordersModel.business = db_name;
        ordersModel.table = doc.table;
        ordersModel.cardCode = CardCode;
        ordersModel.initialDate = fechaInicio;
        ordersModel.finalDate = fechaFinal;

        let responseList = await OrdersProcedure(ordersModel);

        
        responseList.map( (order:any) => {
            order.localLanguage = localLanguage;
           if(order.DocCur === 'MXP'){
               order.DocCur = 'MXN';
           }
           //Ajuste de fecha con minutos y zona horaria
           let date = new Date(order.TaxDate);
           date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
           order.TaxDate = moment(new Date(date)).format('YYYYMMDD'); 
        });

        responseModel.message = "lista de pedidos";
        responseModel.status = 1;
        responseModel.data = responseList || [];
        response.json(responseModel);
    }catch (e) {
      logger.error(e);
        responseModel.message = "ocurrio un error al traer la lista de pedidos";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function ordersSeller(request: Request, response: Response) {
  const {db_name, localLanguage} = response.locals.business;
  const {profile_id} = response.locals.user;
  const {CardCode} = response.locals.user;
  const {salesPrson} = request.body;

  const responseModel = new ResponseModel();
  if(!profile_id){
      responseModel.message = "no tienes permiso de realizar esta acción";
      responseModel.data = [];
  }

  try {
      let ordersModel: OrdersModel = new OrdersModel();
      let doc = getTypeDocument('17');
      //Fecha condicional desde donde aparecen los pedidos
      let initialDate = moment(new Date(2020,1,1)).format('YYYYMMDD');
      let finalDate = moment(new Date()).format('YYYYMMDD');

      ordersModel.action = 'getOrdersSeller';
      ordersModel.business = db_name;
      ordersModel.table = doc.table;
      ordersModel.cardCode = salesPrson;
      ordersModel.initialDate = initialDate;
      ordersModel.finalDate = finalDate;
      let responseList = await OrdersProcedure(ordersModel);


      responseList.map( (order:any) => {
          order.localLanguage = localLanguage;
         if(order.DocCur === 'MXP'){
             order.DocCur = 'MXN';
         }
         //Ajuste de fecha con minutos y zona horaria
         let date = new Date(order.TaxDate);
         date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
         order.TaxDate = moment(new Date(date)).format('YYYYMMDD'); 
      });

      responseModel.message = "lista de pedidos";
      responseModel.status = 1;
      responseModel.data = responseList || [];
      response.json(responseModel);
  }catch (e) {
    logger.error(""+e);
      responseModel.message = "ocurrio un error al traer la lista de pedidos";
      responseModel.data =  [];
      response.json(responseModel);
  }
}

export async function order(request: Request, response: Response) {
    const { db_name } = response.locals.business;
    const {profile_id} = response.locals.user;
    const { docEntry } = request.params;
    const {CardCode} = response.locals.user;

    const responseModel = new ResponseModel();

    if(!profile_id || !docEntry){
        responseModel.message = "no tienes permiso de realizar esta acción";
        responseModel.data = [];
    }

    try {
        let ordersModel: OrdersModel = new OrdersModel();
        let doc = getTypeDocument('17');

        ordersModel.action = 'getOrderHeader';
        ordersModel.business = db_name;
        ordersModel.table = doc.table;
        ordersModel.cardCode = CardCode;
        ordersModel.docEntry = docEntry;
        let responseHeader = await OrdersProcedure(ordersModel);

        responseHeader = responseHeader[0] || {};
        if(responseHeader.DocCur === 'MXP'){
            responseHeader.DocCur = 'MXN';
        }

        ordersModel.action = 'getOrderBody';
        ordersModel.business = db_name;
        ordersModel.table = doc.subTable;
        ordersModel.cardCode = CardCode;
        ordersModel.docEntry = docEntry;
        let responseBody = await OrdersProcedure(ordersModel);
        let statusGuia = await orderValidate.getStatus(doc.table, responseBody);
        responseModel.message = "información del pedido";
        responseModel.status = 1;
        responseModel.data = {header: responseHeader, body: responseBody, statusGuia};
        response.json(responseModel);
    }catch (e) {
      logger.error(""+e);
        responseModel.message = "ocurrio un error al traer la información del pedido";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function dataProfile(request: Request, response: Response) {
  const { db_name } = response.locals.business;
  const {profile_id} = response.locals.user;
  const { docEntry } = request.params;
  const {CardCode} = response.locals.user;

  const responseModel = new ResponseModel();

  if(!profile_id || !docEntry){
      responseModel.message = "no tienes permiso de realizar esta acción";
      responseModel.data = [];
  }

  try {
      let ordersModel: OrdersModel = new OrdersModel();
      let doc = getTypeDocument('17');

      ordersModel.action = 'getDataProfile';
      ordersModel.business = db_name;
      ordersModel.table = doc.subTable;
      ordersModel.cardCode = CardCode;
      ordersModel.docEntry = docEntry;
      
      let responseBody = await OrdersProcedure(ordersModel);    

      responseModel.message = "información del pedido";
      responseModel.status = 1;
      responseModel.data = { body: responseBody};
      response.json(responseModel);
  }catch (e) {
    logger.error(e);
      responseModel.message = "ocurrio un error al traer la información del pedido";
      responseModel.data =  [];
      response.json(responseModel);
  }
}

export async function AuthorizationModels(request: Request, response: Response) {
  const responseModel = new ResponseModel();
  let arreglo :any = await AuthorizationDocuments(request, response);
  responseModel.message = 'Modelos de autorización';
  responseModel.status = 1;
  responseModel.data = arreglo;
  response.json(responseModel);
}

const  AuthorizationDocuments = async (request:Request, response: Response) =>{
  const {db_name, sapConfig, taxCode, currency, paymentMethod, type} = response.locals.business;
  const {profile_id} = response.locals.user;
  const {CardCode,GroupNum} = response.locals.user;
  const {U_FMB_Handel_Email} = response.locals.user;
  const {CardName, wareHouse} = response.locals.user;
  const {objType, address, bill, responseFlete, empID,creator, comment,insurance, itemsGift, fecha, discPrcnt,discPnt, Handel,IdPackge,PorCobrar,tipoEntrega,convenio, datos,packageKeySelect} = request.body;

  if(type === 'SQL'){
    let serie;
    let maniobrasdos = 0// insurance ? insurance : 0;

    //Se define el nuemro de seríe
    await SeriesProcedure('getSerie').then(result => {
      serie = result[0].serieDefault;
    });

    const db = new DatabaseService();

    // Definicion del valor del punto
    let pointsModel: PointsHistoryModel = new PointsHistoryModel();
    pointsModel.action = "pointsMoney";
    let infoPointsMoneyResponse = await PointsHistoryProcedure(pointsModel);
    let valueEquals = parseFloat(infoPointsMoneyResponse[0].Name) || 0;

    // modelo de respuesta
    const responseModel = new ResponseModel();

    let shoppingCart: any = await getShoppingCart(request, response, true);
    //obtiene lo que trae el arreglo del carrito

    if(!shoppingCart.status){
        responseModel.message = 'Ocurrió un error al obtener el carrito de compras para generar el pedido';
        response.json(responseModel);
        return;
    }

        let cardCode = CardCode;
        let addressKey = '';
        let billKey = '';
        let comments = '';
        let docCurrency = currency;
        //Email del cliente
        let mailToCliente = U_FMB_Handel_Email;
        let nameMail = CardName;
        let totalMail = '0';

        if(profile_id){
          if(address.address===bill.address){
            addressKey = address.address;
            billKey = "";
          }else{
            addressKey = address.address;
            billKey = bill.address;
          }
        }else{
            comments = `
            nombre: ${address.name}, email: ${address.email}, telefono: ${address.phone},
            calle: ${address.street}, colonia: ${address.block}, municipio: ${address.city},código postal: ${address.cp},
            estado: ${address.state}, pais: ${address.country},
            `;
        }

        let subTotal = 0;
        let taxTotal = 0;
        let total = 0;
        let tax = 0;
        //Variables para validacion del Flete
        let transport = 0;
        let taxTransport = 0;
        let limit = 0;
        let articulos: any = [];
        shoppingCart.data.shoppingCart.map((item:any) => {
            let totalPrice = Number((item.Price * item.Rate) * item.quantity);
            subTotal += totalPrice;
            tax = item.taxRate;
            taxTotal += Number(item.taxSum * item.quantity);
            articulos.push({'ItemCode': item.ItemCode, 'quantity': parseInt(item.quantity)});
        });
        articulos = JSON.stringify(articulos);
        
        limit = parseInt(responseFlete.PurchaseLimit);
        transport = parseFloat(responseFlete.Price);
        taxTransport = Number(transport*(tax*0.01));
        //Validacion del flete
        if(subTotal < limit){
            taxTotal = taxTotal + taxTransport;
            total = subTotal + transport + taxTotal;
        }else{
            transport = 0;
            total = subTotal + transport + taxTotal;
        }


        //#region AUTORIZACION
        let ModelAutorization : any;
        let IdAutorization : any;
        let NameAutorization : any;
        let borrador : any;
        let dataResult = {};
        var autorizaciones = new Array();

        let storedprocedure = {
          actions : 'ALL'
        }

        let resul = await AutorizacionesProcedure(storedprocedure);
        for (let index = 0; index < resul.length; index++) {
          const autorization = resul[index];
          //  --Saldo Fac y Lim Cr22 
          if(autorization.QueryId === 350){
            let query350 = {
              actions : '350',
              param1 : cardCode,
              param2 : Number(total).toFixed(2)
            }
            let res = await AutorizacionesProcedure(query350);
            borrador = res[0];
            borrador = Object.values(borrador);
            borrador = borrador[0];

            if(borrador === 'TRUE'){
              ModelAutorization = autorization.Name;
              IdAutorization = autorization.UserID;
              NameAutorization = autorization.U_NAME;
              // creditLimit = true;
            }
          }
          //  --Condición de pago Autorizacion
          // if(autorization.QueryId === 3400){
          //   let query340 = {
          //     actions : '340',
          //     param2 : cardCode
          //   }
          //   let res = await AutorizacionesProcedure(query340);
          //   borrador = res[0];
          //   borrador = Object.values(borrador);
          //   borrador = borrador[0];
          //   if(borrador === 'TRUE'){
          //     ModelAutorization = autorization.Name;
          //     IdAutorization = autorization.UserID;
          //     NameAutorization = autorization.U_NAME;
          //     // creditLimit = true;
          //   }
          // }
          if(borrador === 'TRUE'){
              dataResult = {
                  cond:true,
                  nameCond : ModelAutorization,
                  autoId : IdAutorization,
                  autoName : NameAutorization,
                  wtm : autorization.WtmCode,
                  wst : autorization.WstCode,
                  MaxReqr :autorization.MaxReqr,
                  MaxRejReqr : autorization.MaxRejReqr,
                  Correo : autorization.E_Mail
              }
              autorizaciones.push(dataResult);
          }              
      } 


      //#endregion AUTORIZACION
        
      return autorizaciones;
  }else{
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const sh = new SchemaService ();
    let serie;
    await SeriesProcedure('getSerie').then(result => {
      serie = result[0].serieDefault;
    });
    const responseModel = new ResponseModel();

    let shoppingCart: any = await getShoppingCart(request, response, true);
    //obtiene lo que trae el arreglo del carrito
    
    if(!shoppingCart.status){
        responseModel.message = 'Ocurrió un problema al obtener el carrito de compras para generar el pedido';
        response.json(responseModel);
        return;
    }

    let prices :any;
    
    let tipoVta = '01';
    let cardCode = CardCode;
    let addressKey = '';
    let billKey = '';
    let comments = '';
    let docCurrency = currency;
    //Email del cliente
    //let mailToCliente = U_Handel_Email;
    let nameMail = CardName;
    let totalMail = '0';

    if(profile_id){
      if(address.address===bill.address){
        addressKey = address.address;
        billKey = "";
      }else{
        addressKey = address.address;
        billKey = bill.address;
      }
    }else{
        comments = `
        nombre: ${address.name}, email: ${address.email}, telefono: ${address.phone},
        calle: ${address.street}, colonia: ${address.block}, municipio: ${address.city},código postal: ${address.cp},
        estado: ${address.state}, pais: ${address.country},
        `;
    }

    let subTotal = 0;
        let taxTotal = 0;
        let total = 0;
        let tax = 0;
        //Variables para validacion del Flete
        let transport = 0;
        let taxTransport = 0;
        let limit = 0;
        let articulosUno: any = [];
        shoppingCart.data.shoppingCart.map((item:any) => {
            let totalPrice = Number((item.Price * item.Rate) * item.quantity);
            subTotal += totalPrice;
            tax = item.taxRate;
            taxTotal += Number(item.taxSum * item.quantity);
            articulosUno.push({'ItemCode': item.ItemCode, 'quantity': parseInt(item.quantity)});
        });
        articulosUno = JSON.stringify(articulosUno);
        
        limit = parseInt(responseFlete.PurchaseLimit);
        transport = parseFloat(responseFlete.Price);
        taxTransport = Number(transport*(tax*0.01));
        //Validacion del flete
        if(subTotal < limit){
            taxTotal = taxTotal + taxTransport;
            total = subTotal + transport + taxTotal;
        }else{
            transport = 0;
            total = subTotal + transport + taxTotal;
        }

    let today:any = new Date();
    today = moment(today).format('YYYYMMDD');
    let fecha = moment(today).format('YYYY-MM-DD');
    // fecha = fecha.substr(0,7);
    //WAREHOUSE DEL DOCUMENTO
    let resultWareHouse : any= []// await WareHouseProcedure('U_SYP_RICO_CCANAL', 'U_SYP_RICO_CSUCUR');
    
    //resultWareHouse = resultWareHouse[0].U_SYP_RICO_CODALM;
    let articulos: any = [];//INSERT EN AUTORIZACION   
    let items: any = [];
    items = shoppingCart.data.shoppingCart;
    
    //Descuentos
    let model: ProductsModel = new ProductsModel();

    model.action = 'searchByKey';
    model.business = db_name;
    model.cardCode = CardCode;

    let DocumentLines: any =[];
    let datos : any;
        
    items.map((item: any) =>{    
      let lines ={
        ItemCode:item.ItemCode,
        Quantity: item.quantity,
        Currency : item.currency,
        WarehouseCode: item.WhsCode,
        // TaxCode: 'IVAV16',
        // Price: item.Price,
        //Debe ser Y si en la linea es bonificacion
        //U_SYP_RICO_BONIF: 'N', 
        //Si es bonificaicon tYES solo en la linea que es y si es TRANSFERENCIA GRATUITA ES EN TODAS LAS LINEAS       
        // TaxOnly: 'tNO',
      }
      DocumentLines.push(lines);
      articulos.push({'ItemCode': item.ItemCode, 'quantity': parseInt(item.quantity)});
    });
    articulos = JSON.stringify(articulos);
    //#########################################itemsGift##############################################
    let stockBonificacion = false;
    let articulosbonificacion = '';
    let quiebreStock : any =[];
     
      //----------------------------
      
    let DocSubtotal = 0;
    let DocTotal = 0; 
    let Doctax = 0;
    items.map((item: any) =>{
      item.Discount = parseInt(item.Discount);
      if (isNaN(item.Discount)) {
        item.Discount = 0;
    }
      let Preciototal = Number(item.Price * item.quantity - (item.Price * item.quantity * (item.Discount / 100)));
      Doctax = item.taxRate;
      DocSubtotal += tipoVta === '02' ? 0 : Preciototal;
    });

    let DocIgv = tipoVta === '02' ? 0 : Doctax * DocSubtotal / 100;
    DocTotal = tipoVta === '02' ? 0 : DocSubtotal + DocIgv;

    

  ////PROCESO DE AUTORIZACION QUERY 
    let ModelAutorization : any;
    let IdAutorization : any;
    let NameAutorization : any;
    
    let ListAutorizations = {
      actions : 'ALL'
    }
    let resul = await AutorizacionesProcedure(ListAutorizations);    
    
    let creditLimit = false;
    let borrador : any;
    let dataResult = {};
    var autorizaciones = new Array();
    for (let index = 0; index < resul.length; index++) {
        const autorizarion = resul[index];
        // VTA-OV-FACVENC-LIMA
        if(autorizarion.QueryId===1546){
          let numAutorizacion = {
            actions : '1546',
            param1 : CardCode,
            param2 : Number(total).toFixed(2), 
            param3 : '',
          }
          let res = await AutorizacionesProcedure(numAutorizacion)
          
          borrador = res.length > 0 ? res[0] : [ { "'FALSE'": 'FALSE' } ];
          borrador = Object.values(borrador);
          borrador = borrador[0];
          if(borrador === 'TRUE'){
            ModelAutorization = autorizarion.Name;
            IdAutorization = autorizarion.UserID;
            NameAutorization = autorizarion.U_NAME;
          }
        }
        if(borrador === 'TRUE'){
            dataResult = {
                cond:true,
                nameCond : ModelAutorization,
                autoId : IdAutorization,
                autoName : NameAutorization,
                wtm : autorizarion.WtmCode,
                wst : autorizarion.WstCode,
                MaxReqr :autorizarion.MaxReqr,
                MaxRejReqr : autorizarion.MaxRejReqr,
                Correo : autorizarion.E_Mail
            }
            autorizaciones.push(dataResult);
        }              
    }     
    return autorizaciones;
  }
}

function contextEmailDaysPlus(data: any){  
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
                                <td bgcolor="#ffffff"
                                  style="height: 15px; line-height: 15px; background-color: #ffffff;" height="15">
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style=" color: #444444; font-size: 30px; font-weight: 700; line-height: 45px; mso-line-height-rule: exactly; text-align: center; padding: 35px 10px 10px 10px;"
                                  align="center" class="headline">
                                  <a style="text-decoration: none; color: #444444;">Pedido IRCO Commercial
                                    ${data.orderMail}</a>
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 25px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 30px 20px;"
                                  align="center" class="copy">
                                  <a style="color: #000000; text-decoration: none;">Estimado ${data.nameMail},</a>
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style=" color: #000000; font-size: 15px; line-height: 20px; mso-line-height-rule: exactly; text-align: justify; padding: 0px 20px 0px 20px;"
                                  align="center" class="copy">
                                  <a style="color: #000000; text-decoration: none;">
                                    <p>${data.mensaje}</p>
                                    <p>Si tienes alguna duda puedes contactarnos al teléfono <a style="color: #045bab; font-weight: bold; text-decoration: none;"> 667
                                        760 5233 Ext. 107 y 108</a> o escríbenos al
                                      correo <a style="color: #045bab;  font-weight: bold;">contacto@ircocommercial.com</a>, donde
                                      con gusto te atenderemos.</p>
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style=" color: #000000; font-size: 15px; line-height: 20px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 0px 20px;"
                                  align="center" class="copy">
                                  <a style="color: #000000; text-decoration: none;"> Detalle del pedido.</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <br>
                          <div style="padding: 0px 20px 0px 20px;">
                            <table align="center" border="0" cellpadding="0" cellspacing="0"
                              style="min-width: 600px; width: 600px;" width="600" class="scale">
                              <tr style="background-color: #C55930; color: white">
                                <th style="max-width: 13vh;">ARTÍCULO</th>
                                <th style="max-width: 20vh;">DESCRIPCIÓN</th>
                                <th>CANTIDAD</th>
                                <th>PRECIO</th>
                                <th>TOTAL</th>
                              </tr>
                              ${data.body}
                              ${data.htmlDiscPrcnt}
                              <tr>
                                <td colspan="6" style="text-align: right;"></td>
                              </tr>
                              <tr>
                                <td colspan="4" style="text-align: right; color: white;">Total:</td>
                                <th style="text-align: left; background-color: #C55930; color: white">$
                                  ${Number(data.Subtotal).toFixed(2)}</th>
                              </tr>
                            </table>
                          </div>

                          <table align="center" border="0" cellpadding="0" cellspacing="0"
                            style="background-color: #ffffff; min-width: 600px; width: 600px;" width="600"
                            class="scale">
                            <tbody>
                              <tr>
                                <td
                                  style=" color: #000000; font-size: 15px; line-height: 20px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 0px 20px;"
                                  align="center" class="copy">
                                  <a style="color: #000000; text-decoration: none;"> Si el pedido es autorizado, será entregado en:</a>
                                </td>
                              </tr>
                              <td
                                style=" font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; mso-line-height-rule: exactly; text-align: justify; padding: 0px 20px 0px 20px;"
                                align="center" class="copy">
                                <a style="color: #000000; text-decoration: none;">
                                  <p><b>Dirección: </b> ${ data.address.address } 
                                    ,<b>Calle/Número: </b> ${ data.address.street } 
                                    ,<b>CP: </b> ${ data.address.cp } 
                                    ,<b>Ciudad: </b> ${ data.address.city } 
                                    ,<b>País: </b> ${ data.address.country} </p>
                                </a>
                              </td>

                            </tbody>
                          </table>
                          <br>
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
                                                    rilt="ContactUs_Text"> Llámanos al 667 760 5233 Ext. 107 y 108 </a>
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