import { Request, Response } from "express";
import NewsLetterModel from "../models/NewsLetterModel";
import NewsLetterProcedure from "../procedures/NewsLetterProcedure";
import createToken from "../commands/JWT";
import ResponseModel from "../models/ResponseModel";
import { Addresses, BusinessPartner } from "../models/SapModel";
import { getProfile, createProfile } from "./ProfileController";
import BusinessPartners from "../interfaces/BusinessPartners";
import axios from "axios";
import convert from "xml-js";
import path from "path";
import { logger } from "../util/logger";
import fs from "fs";

export async function subscribeUnsubscribe(request: Request, response: Response) {
  const { Email_SAP } = request.body.user;
  const { option } = request.body;
  const { db_name } = response.locals.business;
  const responseModel = new ResponseModel();
  let localstorage = request.body.localShoppingCart;
  try {
    let model: NewsLetterModel = new NewsLetterModel();
    //console.log('con°-°option', option);
    if(option === 'S'){
      model.action = "subscribe";
    } else if(option === 'U'){
      model.action = "unsubscribe";
    } else {
      responseModel.message = "Error de identificación de suscripcion/dejar de estar suscrito";
      response.json(responseModel);
      return;
    }
    model.business = db_name;
    model.userEmail = Email_SAP;

    let result = await NewsLetterProcedure(model);
    
    if(option === 'S'){
      if (!result || !result[0] || (result[0].id === '' || result[0].id === undefined)) {
        responseModel.message = "Error en suscripción";
        response.json(responseModel);
        return;
      }

      responseModel.status = 1;
      responseModel.data = { id: result[0].id };
      responseModel.message = "Has sido suscrito al boletín de noticias";
      response.json(responseModel);
    } else {
      responseModel.status = 1;
      responseModel.message = "Has dejado de estar suscrito al boletín de noticias";
      response.json(responseModel);
    }
  } catch (e) {
    logger.error(e);
    responseModel.message = "Ocurrió un error inesperado";
    //console.log('con°-°e',e );
    response.json(responseModel);
  }
}

export async function verifySubscription(request: Request, response: Response): Promise<void> {
  let {db_name} = response.locals.business;
  //const {wareHouse} = response.locals.business;
  let responseModel = new ResponseModel();
  let {mail} = request.params;
  let mailOk = decodeURIComponent(mail);

  try {
    let model: NewsLetterModel = new NewsLetterModel();
    model.action = "verify";
    model.business = db_name;
    model.userEmail = mailOk;

    let result = await NewsLetterProcedure(model);
    
    responseModel.status = 1;
    if (!result || !result[0]) {
      responseModel.data = { status: 'U' };
    } else {
      responseModel.data = { status: 'S' };
    }
    response.json(responseModel);
    //console.log('con°-°responseModel', responseModel);

  } catch (e) {
    logger.error(e);
    responseModel.message = "Ocurrió un error al traer su info. de cliente";
    response.json(responseModel);
  }
}

export async function verSuscritos(request: Request, response: Response) {
  let responseModel = new ResponseModel();

  try {
    let model: NewsLetterModel = new NewsLetterModel();
    model.action = "selectAll";

    let result = await NewsLetterProcedure(model);    
    
    responseModel.status = 1;
    if (!result || !result[0]) {
      responseModel.data = [];
    } else {
      responseModel.data = result;
    }
    response.json(responseModel);

  } catch (e) {
    logger.error(`${e}`);
    responseModel.message = "No se pudieron traer los clientes registrados";
    response.json(responseModel);
  }
}