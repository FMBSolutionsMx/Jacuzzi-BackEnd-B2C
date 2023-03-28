import {Request, Response} from "express";
import ProductsModel from "../models/ProductsModel";
import CategoriesModel from "../models/CategoriesModel";
import PromocionalesProcedure from "../procedures/PromocionalesProcedure";
import BonificacionesProcedure from "../procedures/BonificacionesProcedure";
import BusinessPartners from "../interfaces/BusinessPartners";
import ResponseModel from "../models/ResponseModel";
import {getProfile} from "./ProfileController";
import {getTaxes} from "./CatalogsController";
import { exists } from "fs";
import { logger } from "../util/logger";
import ProductsProcedure from "../procedures/ProductsProcedure";

export async function getDetailsPartner(request: Request, response: Response) {
    const { user } = request.params;
    let responseModel = new ResponseModel();
    try {
        let model: CategoriesModel = new CategoriesModel();

        model.action = 'detailsPartner';
        model.idRegistro = '';
        model.param = user;
        let result = await BonificacionesProcedure(model);
        
        responseModel.status = 1;
        responseModel.message = "Detail Profile";
        responseModel.data =  result;
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function updatePartner(request: Request, response: Response) {
    const { sapConfig } = response.locals.business;
    // //console.log('con°-°ENTREEEEEEEEEEEEEEEEE')
    //const {CardCode} = response.locals.user;
    const {data} = request.body;
    const responseModel = new ResponseModel();

    try {
        // //console.log('con°-°DATA update', data)

        let businessPartnersInterface = new BusinessPartners(sapConfig);
        businessPartnersInterface.updateXMLPassword(data);
        businessPartnersInterface.replaceSapVersion();
        businessPartnersInterface.setOptions();
        ////console.log("Impresion del bussiness",businessPartnersInterface);
        let partnerResponse: any = await businessPartnersInterface.createCall();
        
        if (!partnerResponse.status) {
        responseModel.message = partnerResponse.error;
        response.json(responseModel);
        return;
        }
    
        responseModel.message = 'Usuario actualizado';
        responseModel.status = 1;
            
        response.json(responseModel);
    
    } catch (error) {
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
  }