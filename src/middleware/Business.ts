'use strict';

import { Request, Response, NextFunction } from "express";
import ResponseModel from "../models/ResponseModel";
import {logger} from "../util/logger";

export default function (req: Request, res: Response, next: NextFunction) {
    let businessId = req.headers.business;
    let responseModel = new ResponseModel();

    if (!businessId) {
        responseModel.status = -99;
        responseModel.message = "La petición necesita un id de sociedad";
        res.json(responseModel);
        return;
    }

    let GlobalBusiness = JSON.parse(global.business);
    let GlobalSap = JSON.parse(global.sap_config);
    let GlobalBusinessConfig = JSON.parse(global.businessConfig);

    let businessArray = GlobalBusiness || [];


    let business = businessArray.filter( (register:any) => {
        return (register.id == businessId)
    });

        if(!business.length) {
            responseModel.status = -99;
            responseModel.message = "No se encuentra el id de sociedad dentro del sistema.";
            res.json(responseModel);
            return;
        }

    let sap = GlobalSap || [];

    let sapConfig = sap.filter( (register:any) => {
        return (business.id == register.bussines_id)
    });

    if(!sapConfig.length) {
        responseModel.status = -99;
        responseModel.message = "No se encuentra configuración sap de la sociedad.";
        res.json(responseModel);
        return;
    }


    let businessConfig = GlobalBusinessConfig.filter( (config:any) => {
        return (config.business_id == business[0].id)
    });
    
    if(!businessConfig.length){
        responseModel.status = -99;
        responseModel.message = "Error en la configuración del Sistema.";
        res.json(responseModel);
        return;
    }


    //business[0].sapConfig =  helpers.desencryptData(sapConfig[0]);
    business[0].sapConfig = sapConfig[0];
    business[0].wareHouse = businessConfig[0].wareHouseDefault;
    business[0].priceList = businessConfig[0].priceListDefault;
    business[0].currency = businessConfig[0].currencyDefault;
    business[0].localLanguage = businessConfig[0].localLanguage;
    business[0].groupCode = businessConfig[0].groupCodeDefault;
    business[0].paymentCondition = businessConfig[0].paymentConditionDefault;
    business[0].paymentMethod = businessConfig[0].paymentMethodDefault;
    business[0].rfcGeneric = businessConfig[0].rfcGenericDefault;
    business[0].taxCode = businessConfig[0].taxCodeDefault;
    business[0].serie = businessConfig[0].serieDefault;

    res.locals.business = business[0];
    res.locals.user = {
        CardCode: businessConfig[0].CardCodeDefault,
        wareHouse : businessConfig[0].wareHouseDefault,
    };



    next();
};