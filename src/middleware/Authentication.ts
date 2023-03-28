import { Request, Response, NextFunction } from "express";
import jwt from "jwt-simple";
import moment from "moment";
import ResponseModel from "../models/ResponseModel";
import {logger} from "../util/logger";
const secret = 'secret_word';

export default function (request: Request, response: Response, next: NextFunction) {
    let token: string | undefined  = request.headers.authorization;
    const responseModel = new ResponseModel();


    if (token) {
        
        token = token.replace(/['"]+/g, '');
        let payload;

        try {
            payload = jwt.decode(token, secret);
            if (payload.exp >= moment().unix) {
                responseModel.status = -99;
                responseModel.message = "La sesion ah expirado.";
                response.json(responseModel);
                return ;
            }

        } catch (e) {
            logger.error(e);
            
            responseModel.status = -99;
            responseModel.message = "El token no es válido.";
            response.json(responseModel);
            return;
        }

        response.locals.user = payload.data;
    }

    next();
}


