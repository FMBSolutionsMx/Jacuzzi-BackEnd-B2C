import { Request, Response } from "express";
import UsersModel from "../models/UsersModel";
import SellerProcedure from "../procedures/SellerProcedure";
import createToken from "../commands/JWT";
import ResponseModel from "../models/ResponseModel";
import { getProfile } from "./ProfileController";
import BusinessPartners from "../interfaces/BusinessPartners";
import axios from "axios";
import convert from "xml-js";
import path from "path";
import { logger } from "../util/logger";
import fs from "fs";
import ProfileModel from "../models/ProfileModel";
import ProfileProcedure from "../procedures/ProfileProcedure";
import OptionsController from "../procedures/PayMethoProcedure";
import EmailProcedure from "../procedures/EmailProcedure";
import {helpers} from '../middleware/helper';

export async function loginSeller(request: Request, response: Response) {
    ////console.log('Login Parner',request.body)
    const { email, password } = request.body.user;
    const { db_name } = response.locals.business;
    const responseModel = new ResponseModel();

    try {
        let model: UsersModel = new UsersModel();
  
        model.action = "login";
        model.business = db_name;
        model.arg1 = email;
        let result = await SellerProcedure(model);
        
        responseModel.from = 2;
        if (!result || !result[0]) {
            responseModel.message = "La cuenta no existe";
            responseModel.type = 1;
            response.json(responseModel);
            return;
        }
  
        if (password != result[0].password) {
            // validate encriptor
            responseModel.message = "Contraseña incorrecta. Comuníquese con su soporte";
            responseModel.type = 2;
            response.json(responseModel);
            return;
        }
        
        let token = createToken(result[0]);

        responseModel.status = 1;
        responseModel.from = 2;
        responseModel.data = { user: result[0] ,token};
        
        ////console.log("pr aqui",responseModel);
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un error inesperado";
        response.json(responseModel);
    }
}

export async function listClient(request: Request, response: Response) {
    const {user, buscar}  = request.body;
    const { nextNum } = request.body;
    const { db_name } = response.locals.business;
    const responseModel = new ResponseModel();
    try {
        let model: UsersModel = new UsersModel();  
        model.action = "listClient";
        model.business = buscar;
        model.arg1 = user;
        model.nextNumber = nextNum || 0; 
        ////console.log("Model to list client",model);
        let result = await SellerProcedure(model);
        ////console.log("Listado",result);
        
        // model.action = "countSearchClient";
        // model.business = db_name;
        // model.arg1 = user;
        // model.nextNumber = nextNum || 0; 
        // let resultRows = await SellerProcedure(model);
        // let totalRows = resultRows[0].TotalRows || 0

        responseModel.status = 1;
        responseModel.data = { list: result };
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un error inesperado";
        response.json(responseModel);
    }
}
export async function searchClient(request: Request, response: Response) {
    const user  = request.body.user;
    const { db_name } = response.locals.business;
    const { nextNum } = request.body;
    const responseModel = new ResponseModel();
    try {
        let model: UsersModel = new UsersModel();  
        model.action = "searchClient";
        model.business = db_name;
        model.arg1 = user;
        model.nextNumber = nextNum || 0; 
        let result = await SellerProcedure(model);
        
        model.action = "countSearchClient";
        model.business = db_name;
        model.arg1 = user;
        model.nextNumber = nextNum || 0; 
        let resultRows = await SellerProcedure(model);
        let totalRows = resultRows[0].TotalRows || 0
        responseModel.status = 1;
        responseModel.data = { list: result, totalRows};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un error inesperado";
        response.json(responseModel);
    }
}