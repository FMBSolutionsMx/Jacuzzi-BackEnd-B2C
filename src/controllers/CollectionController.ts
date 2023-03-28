import {Request, Response} from "express";
import moment from 'moment';
import ResponseModel from "../models/ResponseModel";
import CollectionModel from '../models/CollectionModel';
import CollectionProcedure from '../procedures/CollectionProcedure';
import {getTypeDocument} from '../interfaces/xml';
import {helpers} from '../middleware/helper';
import {logger} from "../util/logger";
import EmailProcedure from "../procedures/EmailProcedure";

let fs = require('fs');
let path = require('path');
export async function Collection(request: Request, response: Response) {
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
        let ordersModel: CollectionModel = new CollectionModel();
        let doc = getTypeDocument('13');
        //Fecha condicional desde donde aparecen los pedidos
        // let initialDate = moment(new Date(2020,1,1)).format('YYYYMMDD');
        // let finalDate = moment(new Date()).format('YYYYMMDD');

        ordersModel.action = 'getCollection';
        ordersModel.business = db_name;
        ordersModel.table = doc.table;
        ordersModel.cardCode = CardCode;
        ordersModel.initialDate = fechaInicio;
        ordersModel.finalDate = fechaFinal;
        //console.log("Se va por cobranzas ",ordersModel);
        let responseList = await CollectionProcedure(ordersModel);


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

        responseModel.message = "Lista de cobranzas";
        responseModel.status = 1;
        responseModel.data = responseList || [];
        response.json(responseModel);
    }catch (e) {
      logger.error(e);
        responseModel.message = "Ocurrio un error al traer la lista de cobranzas";
        responseModel.data =  [];
        response.json(responseModel);
    }
}