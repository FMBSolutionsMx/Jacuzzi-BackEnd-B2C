import {Request, Response} from "express";
import moment from 'moment';
import ResponseModel from "../models/ResponseModel";
import resumenModel from '../models/resumenModel';
import ResumenProcedure from '../procedures/ResumenProcedure';
import {logger} from "../util/logger";

export async function itemsInvoices(request: Request, response: Response) {
    const { slpCode, fechauno, fechados } = request.body;

    const responseModel = new ResponseModel();

    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemInvoices';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        
        responseModel.message = "información del vendedor";
        responseModel.status = 1;
        responseModel.data = responses;
        response.json(responseModel);
    }catch (e) {
        logger.error("ResumenController.js => itemsInvoices: ",e);
        responseModel.message = "ocurrio un error al traer la información del vendedor";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function itemsInvoicesCredito(request: Request, response: Response) {
    const { slpCode, fechauno, fechados } = request.body;
    const responseModel = new ResponseModel();

    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemInvoicesCredito';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        
        responseModel.message = "información del vendedor";
        responseModel.status = 1;
        responseModel.data = responses;
        response.json(responseModel);
    }catch (e) {
        logger.error("ResumenController.js => itemsInvoicesCredito: ",e);
        responseModel.message = "ocurrio un error al traer la información del vendedor";
        responseModel.data =  [];
        response.json(responseModel);
    }
}
export async function totalInvoices(request: Request, response: Response) {
    const { slpCode, fechauno, fechados } = request.body;
    const responseModel = new ResponseModel();

    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getTotalInvoices';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);

        responseModel.message = "información del vendedor";
        responseModel.status = 1;
        responseModel.data = responses;
        response.json(responseModel);
    }catch (e) {
        logger.error("ResumenController.js => totalInvoices: ",e);
        responseModel.message = "ocurrio un error al traer la información del vendedor";
        responseModel.data =  [];
        response.json(responseModel);
    }
}
export async function itemsDeliveries(request: Request, response: Response) {
    const { slpCode, fechauno, fechados } = request.body;

    const responseModel = new ResponseModel();

    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemsDeliveries';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        responseModel.message = "información del vendedor";
        responseModel.status = 1;
        responseModel.data = responses;
        response.json(responseModel);
    }catch (e) {
        logger.error("ResumenController.js => itemsDeliveries: ",e);
        responseModel.message = "ocurrio un error al traer la información del vendedor";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function itemsDeliveriesCredito(request: Request, response: Response) {
    const { slpCode, fechauno, fechados } = request.body;

    const responseModel = new ResponseModel();

    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemsDeliveriesCredito';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        responseModel.message = "información del vendedor";
        responseModel.status = 1;
        responseModel.data = responses;
        response.json(responseModel);
    }catch (e) {
        logger.error("ResumenController.js => itemsDeliveriesCredito: ",e);
        responseModel.message = "ocurrio un error al traer la información del vendedor";
        responseModel.data =  [];
        response.json(responseModel);
    }
}

export async function totalDeliveries(request: Request, response: Response) {
    const { slpCode, fechauno, fechados } = request.body;
    const responseModel = new ResponseModel();
   
    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getTotalDeliveries';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        
        responseModel.message = "información del vendedor";
        responseModel.status = 1;
        responseModel.data = responses;
        response.json(responseModel);
    }catch (e) {
        logger.error("ResumenController.js => totalDeliveries: ",e);
        responseModel.message = "ocurrio un error al traer la información del vendedor";
        responseModel.data =  [];
        response.json(responseModel);
    }
}
export async function dataResumen(request: Request, response: Response) {
    const { slpCode, fechauno, fechados } = request.body;
    const responseModel = new ResponseModel();
    let data: any = [];
    // Items de facturas al contado
    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemInvoices';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        data.push(responses);
    }catch (e) {
        logger.error("ResumenController.js => itemsInvoices: ",e);
        data.push([]);
    }
    // Items de facturas al credito
    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemInvoicesCredito';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        data.push(responses);
    }catch (e) {
        logger.error("ResumenController.js => itemsInvoicesCredito: ",e);
        data.push([]);
    }
    // total de las facturas
    try {
        let ordersModel: resumenModel = new resumenModel();
        ordersModel.action = 'getTotalInvoices';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        data.push(responses);
    }catch (e) {
        logger.error("ResumenController.js => totalInvoices: ",e);
        data.push([]);
    }
    // items de las entregas
    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemsDeliveries';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        data.push(responses);
    }catch (e) {
        logger.error("ResumenController.js => itemsDeliveries: ",e);
        data.push([]);
    }
    // items de las entregas a credito
    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getItemsDeliveriesCredito';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        data.push(responses);
    }catch (e) {
        logger.error("ResumenController.js => itemsDeliveriesCredito: ",e);
        data.push([]);
    }
    // total entregas
    try {
        let ordersModel: resumenModel = new resumenModel();
        
        ordersModel.action = 'getTotalDeliveries';
        ordersModel.business = slpCode;
        ordersModel.initialDate = fechauno;
        ordersModel.finalDate = fechados;

        let responses = await ResumenProcedure(ordersModel);
        // //console.log("Console", responses);
        data.push(responses);
    }catch (e) {
        logger.error("ResumenController.js => totalDeliveries: ",e);
        data.push([]);
    }
    responseModel.message = "información del vendedor";
    responseModel.status = 1;
    responseModel.data = data;
    response.json(responseModel);
}

