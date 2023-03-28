import {Request, Response} from "express";
import moment from 'moment';
import ResponseModel from "../models/ResponseModel";
import SavedModel from '../models/SavedModel';
import SavedProcedure from '../procedures/SavedProcedure';
import {getTypeDocument} from '../interfaces/xml';
import {helpers} from '../middleware/helper';
import {logger} from "../util/logger";
import EmailProcedure from "../procedures/EmailProcedure";

let fs = require('fs');
let path = require('path');
export async function Saved(request: Request, response: Response) {
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
        let ordersModel: SavedModel = new SavedModel();
        let doc = getTypeDocument('13');
        //Fecha condicional desde donde aparecen los pedidos
        // let initialDate = moment(new Date(2020,1,1)).format('YYYYMMDD');
        // let finalDate = moment(new Date()).format('YYYYMMDD');

        ordersModel.action = 'getSaved';
        ordersModel.business = db_name;
        ordersModel.table = doc.table;
        ordersModel.cardCode = CardCode;
        ordersModel.initialDate = fechaInicio;
        ordersModel.finalDate = fechaFinal;
        ////console.log("Se va por Salvados ",ordersModel);
        let responseList = await SavedProcedure(ordersModel);


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

        responseModel.message = "Lista de Salvados";
        responseModel.status = 1;
        responseModel.data = responseList || [];
        response.json(responseModel);
    }catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al traer la lista de Salvados";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function dataSaved(request: Request, response: Response) {
    const { db_name } = response.locals.business;
    const {profile_id} = response.locals.user;
    const { docEntry } = request.params;
    const {CardCode} = response.locals.user;
    const responseModel = new ResponseModel();

    if(!profile_id || !docEntry){
        responseModel.message = "no tienes permiso de realizar esta acción";
        responseModel.data = [];
    }

    let ordersModel: SavedModel = new SavedModel();

    ordersModel.action = 'getCarrito';
    ordersModel.business = db_name;
    ordersModel.cardCode = CardCode;
    ordersModel.docEntry = docEntry;
    let listado = await SavedProcedure(ordersModel);
    ////console.log("desde el data saved",docEntry);
    let list = JSON.parse(listado[0].Cart);
    try {
        let ordersModel: SavedModel = new SavedModel();
        let doc = getTypeDocument('13');  
        ordersModel.action = 'getDataProduct';
        ordersModel.business = db_name;
        ordersModel.table = doc.subTable;
        ordersModel.cardCode = CardCode;
        let responseBody = [];
        let productTem = [];
        for (let i of list){
            ordersModel.docEntry = i.ItemCode;
            let responseProdcut = await SavedProcedure(ordersModel);
            responseBody.push({ItemCode: responseProdcut[0].ItemCode, ItemName: responseProdcut[0].ItemName, PicturName: responseProdcut[0].PicturName, Quantity: i.quantity, Price : responseProdcut[0].Price, Currency:responseProdcut[0].Currency, Rate:responseProdcut[0].Rate});
        }
        responseModel.message = "información del pedido";
        responseModel.status = 1;
        responseModel.data = {body: responseBody};
        response.json(responseModel);
    }catch (e) {
      logger.error(e);
        responseModel.message = "ocurrio un error al traer la información del pedido";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function dataDocument(request: Request, response: Response) {
    const { db_name } = response.locals.business;
    const {profile_id} = response.locals.user;
    const { data } = request.body;
    const {CardCode} = response.locals.user;

    const responseModel = new ResponseModel();

    try {
        let ordersModel: SavedModel = new SavedModel();
        let doc = getTypeDocument('13');
        
        ordersModel.action = 'getDataProduct';
        ordersModel.business = db_name;
        ordersModel.table = doc.subTable;
        ordersModel.cardCode = CardCode;
        let responseBody = [];
        let mess = '';
        for (let i in data){
            if(data[i].__EMPTY_4 !== "ITEMCODE"){
                if(data[1].__EMPTY_5 === CardCode){
                    ordersModel.docEntry = data[i].__EMPTY_4.trim() || data[i].__EMPTY_3.trim();
                    ////console.log("Se va por saved body",ordersModel);
                    let responseProdcut = await SavedProcedure(ordersModel);
                    ////console.log("Producto",responseProdcut);
                    responseBody.push({ItemCode: responseProdcut[0].ItemCode, ItemName: responseProdcut[0].ItemName, PicturName: responseProdcut[0].PicturName, Quantity: data[i].__EMPTY_1});
                }
                else{
                    mess = 'El usuario ingresado en el Excel no coincide con el usuario logueado.';
                    responseBody = [];
                    break;
                }
            }
        };
 
        if(responseBody.length > 0){

            let nuevos :any = [];

            for (let i = 0; i < responseBody.length; i++) {
                const element = responseBody[i];
                let bandera = true;
                nuevos.map((arr:any) => {
                    if(arr.ItemCode === element.ItemCode){
                        bandera = false;
                    }
                })
                if(bandera){
                    nuevos.push(responseBody[i])
                }
            }

            responseModel.message = "información del pedido";
            responseModel.status = 1;
            responseModel.data = {body: nuevos};
            response.json(responseModel);
        }
        else{
            responseModel.message = mess ? mess : "ocurrio un problema al traer la información del pedido.";
            responseModel.data = [];
            response.json(responseModel);
        }
        
    }catch (e) {
        logger.error(""+e);
        responseModel.message = "Ocurrio un error al traer la información del pedido";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function createSavedCart(request: Request, response: Response){
    const {db_name, localLanguage} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {CardCode} = response.locals.user;

    const responseModel = new ResponseModel();
    if(!profile_id){
        responseModel.message = "no tienes permiso de realizar esta acción";
        responseModel.data = [];
    }

    try {
        let ordersModel: SavedModel = new SavedModel();
        let doc = getTypeDocument('13');
        //Fecha condicional desde donde aparecen los pedidos
        let initialDate = moment(new Date(2020,1,1)).format('YYYYMMDD');
        let finalDate = moment(new Date()).format('YYYYMMDD');

        ordersModel.action = 'getCart';
        ordersModel.business = db_name;
        ordersModel.table = doc.table;
        ordersModel.cardCode = CardCode;
        ordersModel.initialDate = initialDate;
        ordersModel.finalDate = finalDate;
        ////console.log("Se va por Salvados",ordersModel);
        let responseList = await SavedProcedure(ordersModel);
        ////console.log(responseList);
        ordersModel.action = 'setCart';
        ordersModel.cardCode = CardCode;
        ordersModel.initialDate = finalDate;
        ordersModel.arg1 = responseList[0].shoppingCart
        ////console.log("Se va por Salvados ",ordersModel);
        let insertData = await SavedProcedure(ordersModel);

        // //console.log("response insert", insertData[0]);

        responseModel.message = "Carrito guardado";
        responseModel.status = 1;
        responseModel.data = {docNum: 'undefined'};//insertData[0] || [];
        response.json(responseModel);
    }catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al traer la lista de Salvados";
        responseModel.data =  [];
        response.json(responseModel);
    }
}