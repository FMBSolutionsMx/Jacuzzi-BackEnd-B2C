import {Request, Response} from "express";
import ResponseModel from "../models/ResponseModel";
import CfdiProcedure from "../procedures/CfdiProcedure";
import {logger} from "../util/logger";

export async function getCFDI(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const responseModel = new ResponseModel();

    // Execute procedure
    try {
        let result = await CfdiProcedure("getCfdi");
        
        
        responseModel.status = 1;
        responseModel.data =  result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar informacíon de los CFDI';
        responseModel.data = [];
    }

    response.json(responseModel);
}