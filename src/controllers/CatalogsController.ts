import {Request, Response} from "express";
import ResponseModel from "../models/ResponseModel";
import CatalogsModel from '../models/CatalogsModel';
import CatalogsProcedure from "../procedures/CatalogsProcedures";
import {logger} from "../util/logger";

export async function getFlete(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const model = new CatalogsModel();
    const responseModel = new ResponseModel();

    model.action = "getFlete";
    model.business = db_name;
    // Execute procedure
    try {
        let result = await CatalogsProcedure(model);
        responseModel.status = 1;
        responseModel.data =  result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar información de registro (país)';
        responseModel.data = [];
    }

    response.json(responseModel);
}

export async function getCountries(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const model = new CatalogsModel();
    const responseModel = new ResponseModel();

    model.action = "getCountries";
    model.business = db_name;
    // Execute procedure
    try {
        let result = await CatalogsProcedure(model);
        
        ////console.log("Desde countries",result);
        responseModel.status = 1;
        responseModel.data =  result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar informacíon de registro (país)';
        responseModel.data = [];
    }

    response.json(responseModel);
}

export async function getStates(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {key} = request.params;
    const model = new CatalogsModel();
    const responseModel = new ResponseModel();

    model.action = "getStates";
    model.business = db_name;
    try {
        let result = await CatalogsProcedure(model);
        
        if(key === 'all'){
            responseModel.data =  result;
        }else{
            let newStates = result.filter( (state:any) => {
                return (state.Country === key)
            });
            responseModel.data =  newStates;
        }
        responseModel.status = 1;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar información de registro (Estados)';
        responseModel.data = [];
    }

    response.json(responseModel);
}

export async function getInfoCP(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {key} = request.params;
    const model = new CatalogsModel();
    const responseModel = new ResponseModel();

    model.action = "getInfoCP";
    model.business = db_name;
    model.code = key;
    try {
        let result: any = await CatalogsProcedure(model);
        let colonia: any = [];
        let edo: any = '';
        let cd: any = '';
        // console.log("Numero de resultado",result);
        for (let i in result) {
            colonia.push(result[i].d_asenta);
        }
        edo = result[0].d_estado;
        cd = result[0].d_ciudad || result[0].d_mnpio;
        let data = {
            edo,
            cd,
            colonia,
        }
        responseModel.status = 1;
        responseModel.data = data;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar información del código';
        responseModel.data = [];
    }

    response.json(responseModel);
}

export async function getTaxes (request: Request, response: Response, internal: boolean = false) {
    const {db_name, taxCode} = response.locals.business;
    const responseModel = new ResponseModel();

    let tax = taxCode;

    let model: CatalogsModel = new CatalogsModel();
    model.action = 'getTaxes';
    model.business = db_name;
    model.code = taxCode;
    let result = await CatalogsProcedure(model);
        
    if(tax){
        if(!result || !result[0]){
            responseModel.message =  'Ocurrio un error al solicitar información de impuestos';
            if(internal){
                return responseModel
            }else{
                response.json(responseModel);
            }
            return;
        }
        responseModel.message = '';
        responseModel.status = 1;
        responseModel.data = result[0];

        if(internal){
            return responseModel
        }else{
            response.json(responseModel);
        }
    }
}

export async function getPackageStore(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {key} = request.params;
    const model = new CatalogsModel();
    const responseModel = new ResponseModel();

    model.action = "getPackageStore";
    model.business = db_name;
    try {
        let result = await CatalogsProcedure(model);
        ////console.log("Desde paqueterias",result);
        
        if(key === 'all'){
            responseModel.data =  result;
        }else{
            let newStates = result.filter( (state:any) => {
                return (state.Country === key)
            });
            responseModel.data =  newStates;
        }
        responseModel.status = 1;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar información de registro (Estados)';
        responseModel.data = [];
    }

    response.json(responseModel);
}


export async function getSpecialPrices(CardCode: string, ItemCode: any = null){
    const responseModel = new ResponseModel();
    try {
        // General SN
        let model: CatalogsModel = new CatalogsModel();
        model.action = 'getGeneralSpecialPrices';
        model.business = 'LaloHogar';
        model.code = CardCode || '';
        model.itemCode = ItemCode || '';
        let respuesta = await CatalogsProcedure(model);

        // General
        if(!respuesta || !respuesta[0]){
            responseModel.message = 'No existen precios especiales';
            responseModel.status = 0;
            responseModel.data = respuesta[0];
            return responseModel;
        }

        const precios = respuesta || [];

        // Fechas
        for(let i = 0; i < precios.length; i++){
            let price = precios[i];
            model.action = 'getSpecialPricesByDate';
            model.business = 'LaloHogar';
            model.code = CardCode || '';
            model.itemCode = price.ItemCode || "";
            let datesPrice = await CatalogsProcedure(model);
            price.children = datesPrice && datesPrice.length > 0 ? datesPrice : [];
        }

        // Cantidades
        for(let i = 0; i < precios.length; i++){
            let price = precios[i];
            model.action = 'getSpecialPricesByQuantity';
            model.business = 'LaloHogar';
            model.code = CardCode || '';
            model.itemCode = price.ItemCode || "";
            let quantityPrice = await CatalogsProcedure(model);
            price.childrenCantidades = quantityPrice && quantityPrice.length > 0 ? quantityPrice : [];
        }
        
        responseModel.message = 'Si existen precios especiales';
        responseModel.status = 1;
        responseModel.data = precios;
        return responseModel;
    } catch (error) {
        responseModel.message = 'Error al consultar los precios especiales';
        responseModel.status = 0;
        responseModel.data = [];
        return responseModel;
    }
}

export async function getValidationSpecialPrices (request: Request, response: Response, internal: boolean = false) {
    const responseModel = new ResponseModel();
    try {
        let model: CatalogsModel = new CatalogsModel();
        model.action = 'getValidationSpecialPrices';
        let result = await CatalogsProcedure(model);
    
        if(!result || !result[0]){
            responseModel.message =  'No existe la tabla de validación de precios especiales';
            responseModel.status = 0;
            if(internal){
                return responseModel;
            }else{
                response.json(responseModel);
            }
        } else {
            responseModel.message = 'Bandera de precios especiales';
            responseModel.status = 1;
            responseModel.data = result[0].Name;
            if(internal){
                return responseModel;
            }else{
                response.json(responseModel);
            }
        }
    } catch(e){
        responseModel.message = 'No existe la tabla de validación de precios especiales';
        responseModel.status = 0;
        responseModel.data = { Error: 'error' };
        if(internal){
            return responseModel;
        }else{
            response.json(responseModel);
        }
    }    
}

export async function updateSPStatus(request: Request, response: Response) {
    const { db_name } = response.locals.business;
    const { status } = request.body;
    const responseModel = new ResponseModel();    

    try {        
        let model: CatalogsModel = new CatalogsModel();
        model.action = 'updateSPStatus';
        model.business = db_name;
        model.code = status;
        let result = await CatalogsProcedure(model);
    
        responseModel.message = 'Estatus actualizado';
        responseModel.status = 1;          
        response.json(responseModel);  
    } catch (error) {
        responseModel.message = "Error al actualizar el estatus de Precios Especiales";
        response.json(responseModel);
    }
  }