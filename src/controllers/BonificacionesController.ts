import {Request, Response} from "express";
import ProductsModel from "../models/ProductsModel";
import CategoriesModel from "../models/CategoriesModel";
import PromocionalesProcedure from "../procedures/PromocionalesProcedure";
import BonificacionesProcedure from "../procedures/BonificacionesProcedure";
import ResponseModel from "../models/ResponseModel";
import {getProfile} from "./ProfileController";
import {getTaxes} from "./CatalogsController";
import { exists } from "fs";
import { logger } from "../util/logger";
import ProductsProcedure from "../procedures/ProductsProcedure";

let fs = require('fs');
let path = require('path');

export async function getPromo(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let { tipo} = request.body.data;
    try {

        let detalle = {
            param1 : tipo,
        }

        let result = await PromocionalesProcedure(detalle);
        responseModel.status = 1;
        responseModel.data = { list: result};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function obtenerPromocionales(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    try {

        let detalle = {
            param1 : 'ObtenerDetalles',
            param2 : data
        }

        let result = await PromocionalesProcedure(detalle);
        responseModel.status = 1;
        responseModel.data =  result;
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function getItems(request: Request, response: Response) {
    const item  = request.body.item;
    const { db_name } = response.locals.business; 
    const responseModel = new ResponseModel();
    try {

        let detalle = {
            param1 : 'Items',
            param3 : item || ''
        }

        let result = await PromocionalesProcedure(detalle);
        responseModel.status = 1;
        responseModel.data = { list: result};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function searchConditions(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {condicion, value} = request.body.data;
    try {
        let model: CategoriesModel = new CategoriesModel();

        let detalle = {
            param1 : 'GetConditions',
            param2 : condicion,
            param3 : value || ' '
        }
        let result = await PromocionalesProcedure(detalle);

        responseModel.status = 1;
        responseModel.data = { list: result};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function insertPromocionales(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    try {
        let model: CategoriesModel = new CategoriesModel();

        model.action = data.typeProm; //'Volumennnnnn'; //  
        model.nombre = data.Name;
        model.typeProm = 'Volumen'; //data.typeProm;
        model.typeVol  = data.typeVol;
        model.acumulable = data.cumulative;
        model.prioridad  = data.priority;
        model.chkConditions = data.chkConditions;
        model.desde = data.dateInicial;
        model.hasta = data.dateFinal;
        model.obligatoria = data.obligatory;
        model.typeSelectCond = data.typeSelectCond;
        model.promoUniClient = data.promoUniClient;   
        model.typeReward = data.typeReward;   
        model.typeRewardFin = data.typeRewardFin;  
        model.typeMonto = data.typeMonto;  
        model.quantityarticulos = data.quantityarticulos;
        model.active = data.active; 
        model.listNum  = data.listNum;
        model.listNumber  = data.listNumber;
        model.quantitybonifi = data.quantitybonifi;
        model.vigencia  = data.chkVigencia;
        model.tipobonificacion = data.tipobonificacion;
        model.bonificacion = data.bonificacion;
        model.monto = data.Monto;
        model.packagesInfo = data.packagesInfo;
        model.valueSelectCond = data.valueSelectCond;
        model.descuento = data.descuento;
        model.condiciones = data.arrayCond;
        // model.checkAutomatico = data.checkAutomatico;
        
        /////////////////////////////////////////////// INSERTAR PROMOCIONES
        let idPromociones = '';//ID DE LA PROMOCION
        let idDisparador = ''; //ID DEL DISPADOR
        let idBonificacion = '';
        let idCondiciones = '';
        let idRes = '';
        try {
            let promo = {
                param1 : 'InsertPromociones',
                param2 : model.nombre,
                param3 : model.active === 'SI' ? 1 : '0',
                param4 : model.prioridad,
                param5 : '2'
            }
            let InsertPromociones = await PromocionalesProcedure(promo);
            idPromociones = InsertPromociones[0].id;
            //console.log('con< PROMOCIONES==',idPromociones);

        } catch (error) {
            logger.error("ERROR PROMOCIONES: ", error)
        }

        /////////////////////////////////////////////// INSERTAR DISPARADOR
        try {
            let disparador = {
                param1 : 'InsertTipoDispardor',
                param2 : model.typeVol === '1' ? '2' : '1',
                param3 : model.action === 'Volumen' ? 1 : 0,
            }
            let InsertTipoDispardor = await PromocionalesProcedure(disparador);
            idDisparador = InsertTipoDispardor[0].id;
            //console.log('con< TIPODISPARADOR==',idDisparador);     

        } catch (error) {
            logger.error("ERROR TIPODISPARADOR: ", error)
        }

        /////////////////////////////////////////////// MODIFICAR PROMOCION CON EL ID--DISPARADOR
        try {
            let updateDis = {
                param1 : 'UpdateDispardor',
                param2 : idPromociones,
                param3 : idDisparador,
            }
            await PromocionalesProcedure(updateDis);   

        } catch (error) {
            logger.error("ERROR UpdateDispardor: ", error)
        }
        
        /////////////////////////////////////////////// INSERTAR BONIFICACION
        
        try {
            let bonificacion = {
                param1 : 'InsertTipoBonificacion',
                param2 : model.typeVol === '1' ? '2' : '1',
                param3 : model.action === 'Volumen' ? 1 : 2,
                param4 : data.checkAutomatico
            }
            let InsertTipoBonificacion = await PromocionalesProcedure(bonificacion);
            idBonificacion = InsertTipoBonificacion[0].id;
            //console.log('con< TipoBonificacion==',idBonificacion);
            
        } catch (error) {
            logger.error("ERROR InsertTipoBonificacion: ", error)
        }
        
        /////////////////////////////////////////////// MODIFICAR PROMOCION CON EL ID--BONIFICACION
        try {
            let updateBof = {
                param1 : 'UpdateBonificacion',
                param2 : idPromociones,
                param3 : idBonificacion,
            }
            await PromocionalesProcedure(updateBof);

        } catch (error) {
            logger.error("ERROR UpdateBonificacion: ", error)
        }
        
        /////////////////////////////////////////////// INSERTAR CONDICIONES
        try {
            let condiciones = {
                param1 : 'InsertCondiciones',
                param2 : 'IRCO',//model.nombre,
                param3 : model.vigencia === 'SI' ? '1' : '0',
                param4 : model.desde || '---',
                param5 : model.hasta || '---',
                param6 : model.limitada || '1',
                param7 : model.acumulable === 'SI' ? '1' : '0'
            }
            let InsertCondiciones = await PromocionalesProcedure(condiciones);
            idCondiciones = InsertCondiciones[0].id;
            //console.log('con< idCondiciones==',idCondiciones);
            
        } catch (error) {
            logger.error("ERROR InsertCondiciones: ", error)
        }
        
        /////////////////////////////////////////////// MODIFICAR PROMOCION CON EL ID--CONDICONES
        try {
            let updateCond = {
                param1 : 'UpdateCondiciones',
                param2 : idPromociones,
                param3 : idCondiciones,
            }
            await PromocionalesProcedure(updateCond);
            
        } catch (error) {
            logger.error("ERROR UpdateCondiciones: ", error)
        }

        try {
            if(model.packagesInfo.length > 0){
                for (let i = 0; i < model.packagesInfo.length; i++) {
                    const element = model.packagesInfo[i];
                    //console.log('con<-',i+1, element.itemCode, element.quantity); //element.bonificacion.length);

                    let disparador = {
                        param1 : "InsertItemsCondicion1",
                        param2 : idDisparador,
                        param3 : model.typeVol === '1' ? model.packagesInfo[0].quantity : element.quantity,
                        param4 : element.itemCode,
                        param5 : model.typeVol === '1' ? '1' : i+1
                    }        
                    await PromocionalesProcedure(disparador);
                    if(element.bonificacion.length > 0){
                        for (let x = 0; x < element.bonificacion.length; x++) {
                            const bonifi = element.bonificacion[x];
                            for (let y = 0; y < bonifi.length; y++) {
                                const pack = bonifi[y];
                                //console.log('con<----',i+1, x+1 , pack.itemCode, pack.quantity,'---', data.checkAutomatico);
                                if(data.checkAutomatico === 2) {
                                    let packs = {
                                        param1 : "InsertItemsCondicion",
                                        param2 : idBonificacion,
                                        param3 : pack.quantity,//model.typeVol === '1' ? model.packagesInfo[x].globalQuantity : model.packagesInfo[x].arrayVentas[y].Quantity,
                                        param4 : pack.itemCode,
                                        param5 : model.typeVol === '1' ? '1' : i+1,
                                        param6 : x+1
                                    }        
                                    await PromocionalesProcedure(packs);
                                }
                                else{
                                    let packsAuto = {
                                        param1 : "InsertItemsCondicion1",
                                        param2 : idBonificacion,
                                        param3 : pack.quantity,
                                        param4 : pack.itemCode,
                                        param5 : model.typeVol === '1' ? '1' : i+1,
                                    }        
                                    await PromocionalesProcedure(packsAuto);
                                }
                                
                            }
                        }
                    }
                }
            }
            
        } catch (error) {
            logger.error('ERROR INSERT ITEMS', error);
        }        

        /////////////////////////////////////////////// INSERTAR CONDICIONES
        try {
            let InsertRestricciones = {
                param1 : "InsertRestricciones",
                param2 : 'RINTI',//model.nombre, //model.condiciones[y].value1,
                param3 : '1'//model.condiciones[y].value3
            }          
            let idResul = await PromocionalesProcedure(InsertRestricciones);
            idRes = idResul[0].id ;
        } catch (error) {
            logger.error('ERROR InsertCond: ', error)
        }
        
        try {
            for (let y = 0; y < model.condiciones.length; y++) {
                let InsertCond = {
                    param1 : "InsertCond",
                    param2 : idRes,
                    param3 : model.condiciones[y].value1,
                    param4 : model.condiciones[y].value3
                }          
           await PromocionalesProcedure(InsertCond);
            }
        } catch (error) {
            logger.error('ERROR InsertCond: ', error)
        }

        try {
            let updCond = {
                param1 : 'UpdateCond',
                param2 : idCondiciones,
                param3 : idRes,
            }
            await PromocionalesProcedure(updCond);
        } catch (error) {
            logger.error('ERROR UPDATE REST: ', error)
        }

        responseModel.status = 1;
        responseModel.data = { list: idPromociones};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function obtenerConditions(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    try {

        let detalle = {
            param1 : 'ObtenerDetallesConditions',
            param2 : data
        }

        let result = await PromocionalesProcedure(detalle);
        responseModel.status = 1;
        responseModel.data = { list: result};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function obtenerPromocionalesDisparador(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    try {

        let detalle = {
            param1 : 'ObtenerDetallesDisparador',
            param2 : data
        }
        let result = await PromocionalesProcedure(detalle);
        responseModel.status = 1;
        responseModel.data =  result;
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function aprobarPromocionales(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    
    try {
        try {
            let Upromo = {
                param1 : 'Aprobada',
                param2 : data.id,
                param3 : data.aprobada,
            }
            await PromocionalesProcedure(Upromo);
            
        } catch (error) {
            logger.error("Error update APROBADA:", error)
        }

        responseModel.status = 1;
        responseModel.message = "Se aprobo correctamente";
        responseModel.data = { list: '1'};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function activarPromocionales(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    
    try {
        try {
            let Upromo = {
                param1 : 'Active',
                param2 : data.id,
                param3 : data.activa,
            }
            await PromocionalesProcedure(Upromo);
            
        } catch (error) {
            logger.error("Error update APROBADA:", error)
        }

        responseModel.status = 1;
        responseModel.data = { list: '1'};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function updatePromocionales(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    try {
        let model: CategoriesModel = new CategoriesModel();
        model.action = data.typeProm; 
        model.typeProm = 'Volumen'; 
        model.typeVol  = data.typeVol;
        model.acumulable = data.cumulative;
        model.chkConditions = data.chkConditions;
        model.desde = data.dateInicial;
        model.hasta = data.dateFinal;
        model.obligatoria = data.obligatory;
        model.typeSelectCond = data.typeSelectCond;
        model.promoUniClient = data.promoUniClient;   
        model.typeReward = data.typeReward;   
        model.typeRewardFin = data.typeRewardFin;  
        model.typeMonto = data.typeMonto;  
        model.quantityarticulos = data.quantityarticulos;
        model.listNum  = data.listNum;
        model.listNumber  = data.listNumber;
        model.quantitybonifi = data.quantitybonifi;
        model.vigencia  = data.chkVigencia;
        model.tipobonificacion = data.tipobonificacion;
        model.bonificacion = data.bonificacion;
        model.monto = data.Monto;
        model.packagesInfo = data.packagesInfo;
        model.valueSelectCond = data.valueSelectCond;
        model.descuento = data.descuento;
        model.condiciones = data.arrayCond;
        model.checkAutomatico = data.checkAutomatico;
        
        /////////////////////////////////////////////// UPDATE PROMOCIONES

        try {
            let Upromo = {
                param1 : 'UPromociones',
                param2 : data.Name,
                param3 : data.id,
                param4 : data.active === 'SI' ? 1 : '0',
                param5 : data.priority,
            }
            await PromocionalesProcedure(Upromo);
            
        } catch (error) {
            logger.error("UPDATE PROMO: ", error)
        }

        try {
            let condiciones = {
                param1 : 'UCondiciones',
                param2 : data.condicion,
                param3 : data.chkVigencia === 'SI' ? '1' : '0',
                param4 : data.dateInicial || '---',
                param5 : data.dateFinal || '---',
                param6 : data.cumulative === 'SI' ? '1' : '0'
            }
            await PromocionalesProcedure(condiciones);
        } catch (error) {
            logger.error("ERROR UPDATE Condiciones: ", error)
        }

        if(data.arrayCond.length > 0 ){
            try {
                let DeleteRestriccion = {
                    param1 : 'DeleteRestriccion',
                    param2 : data.fkRestriccion
                }
                await PromocionalesProcedure(DeleteRestriccion);

                for (let y = 0; y < data.arrayCond.length; y++) {
                    let InsertCond = {
                        param1 : "InsertCond",
                        param2 : data.fkRestriccion,
                        param3 : data.arrayCond[y].value1,
                        param4 : data.arrayCond[y].value3
                    }          
                    await PromocionalesProcedure(InsertCond);
                }
            } catch (error) {
                logger.error('ERROR RESTRICCIONES: ', error)
            }
        }

        try {
            if(data.packagesInfo.length > 0){
                let DeleteArticulos = {
                    param1 : 'DeleteArticulos',
                    param2 : data.disparador,
                }
                await PromocionalesProcedure(DeleteArticulos);
    
                let DeleteBonificacion = {
                    param1 : 'DeleteBonificacion',
                    param2 : data.bonificacion
                }
                await PromocionalesProcedure(DeleteBonificacion);

                let VERDetalles = {
                    param1 : 'VERDetalles',
                    param2 : data.disparador,
                    param3 : data.bonificacion
                }
                let hola =  await PromocionalesProcedure(VERDetalles);
            }
        } catch (error) {
            logger.error('ERROR ', error)
        }

        try {
            if(data.packagesInfo.length > 0){    
                for (let i = 0; i < data.packagesInfo.length; i++) {
                    const element = data.packagesInfo[i];
                    //console.log('con<',i+1, element.itemCode, element.quantity); //element.bonificacion.length);
                    let disparador = {
                        param1 : "InsertItemsCondicion1",
                        param2 : data.disparador,
                        param3 : data.typeVol === '1' ? data.packagesInfo[0].quantity : element.quantity,
                        param4 : element.itemCode,
                        param5 : data.typeVol === '1' ? '1' : i+1
                    }        
                    await PromocionalesProcedure(disparador);
                    if(element.bonificacion.length > 0){
                        for (let x = 0; x < element.bonificacion.length; x++) {
                            const bonifi = element.bonificacion[x];
                            for (let y = 0; y < bonifi.length; y++) {
                                const pack = bonifi[y];
                                //console.log('con<-----',i+1, x+1 , pack.itemCode, pack.quantity,'---', data.checkAutomatico);
                                if(data.checkAutomatico === 2) {
                                    let packs = {
                                        param1 : "InsertItemsCondicion",
                                        param2 : data.bonificacion,
                                        param3 : pack.quantity,
                                        param4 : pack.itemCode,
                                        param5 : data.typeVol === '1' ? '1' : i+1,
                                        param6 : x+1
                                    }        
                                    await PromocionalesProcedure(packs);
                                }
                                else{
                                    let packsAuto = {
                                        param1 : "InsertItemsCondicion1",
                                        param2 : data.bonificacion,
                                        param3 : pack.quantity,
                                        param4 : pack.itemCode,
                                        param5 : data.typeVol === '1' ? '1' : i+1,
                                    }        
                                    await PromocionalesProcedure(packsAuto);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('ERROR ACTUALIZAR ARTICULOS: ', error)
        }

        responseModel.status = 1;
        responseModel.data = { list: '1'};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function getPromocionales(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {datos} = request.body;

    try {
        let model: CategoriesModel = new CategoriesModel();

        model.action = 'Promocionales';
        model.business = db_name;
        let promoCondiciones: any =[];
       
        let result = await BonificacionesProcedure(model);

        let Cliente = [];
        let Region = [];
        let Canal = [];
        let SubCanal = [];

        for (let index = 0; index < result.length; index++) {
            const res = result[index];
            let flang = false;
            model.action = "PromoCondiciones"
            model.idRegistro = res.fkRestriccion
            
            let condiciones = await BonificacionesProcedure(model);
            if(condiciones.length > 0){
                for (let x = 0; x < condiciones.length; x++) {
                    const condi = condiciones[x];
                    if(condi.codigo === datos.CardCode){
                        Cliente.push(res)
                    }else if(condi.codigo === datos.Region){
                        Region.push(res)
                    }else if(condi.codigo === datos.SubCanal){
                        SubCanal.push(res)
                    }
                    else if(condi.codigo === datos.Canal){
                        Canal.push(res)
                    }
                    // if(condi.codigo === datos.CardCode || condi.codigo === datos.Region ||  condi.codigo === datos.SubCanal || condi.codigo === datos.Canal){
                    //     flang = true;
                    // }
                }
                if(Cliente.length > 0 ){
                    promoCondiciones = Cliente
                }
                else if(Region.length > 0){
                    promoCondiciones = Region
                }
                else if(SubCanal.length > 0){
                    promoCondiciones = SubCanal
                }
                else if(Canal.length > 0){
                    promoCondiciones = Canal
                }
            }
            else{
                promoCondiciones.push(res)
            }
        }

        let Disparador: any = [];
        let detallesDisparador: any = [];

        promoCondiciones.sort((a:any, b:any) => (a.prioridad > b.prioridad) ? 1 : -1);
            for (let index = 0; index < promoCondiciones.length; index++) {
                const prom = promoCondiciones[index];
                if (prom.vigencia) {
                    let inicial = new Date(prom.desde);
                    let final = new Date(prom.hasta);
                    let today = new Date();
                    
                    inicial.setMinutes(inicial.getMinutes() + inicial.getTimezoneOffset());
                    final.setMinutes(final.getMinutes() + final.getTimezoneOffset());

                    inicial.setHours(0, 0, 0, 0);
                    final.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    //SOLO ENTRA SI ESTA DENTRO DEL RANGO DE FECHAS
                    if (inicial <= today && today <= final) {
                        Disparador.push(promoCondiciones[index]);
                    }
                }else {
                        Disparador.push(promoCondiciones[index])
                }
            }
            
            if(Disparador.length >0 ){
                for (let index = 0; index < Disparador.length; index++) {
                    const disp = Disparador[index];
                    if (disp.acumulable === 0 && index > 0) {
                        Disparador.splice( index, 1 );
                    }
                }
                
                if(Disparador.length >0 ){
                   //let detallesDisparador = await apiClient.getDescuento(Disparador)

                   model.action = 'detallesDisparador';
                   model.business = db_name;
                   let result: any;
                    for (let index = 0; index < Disparador.length; index++) {
                        const disp = Disparador[index];
                        model.idRegistro = disp.idRegistro;
                        result = await BonificacionesProcedure(model);
                        if(result.length > 0){
                            detallesDisparador.push(result);
                            
                        }                        
                    }
                }
            }  
        responseModel.status = 1;
        responseModel.data = detallesDisparador;
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function getBonificaciones (request: Request, response: Response): Promise<void>{
    let {db_name} = response.locals.business;
    const {CardCode, wareHouse} = response.locals.user;
    // const {} = response.locals.business;
    let responseModel = new ResponseModel();
    let {data} = request.body;
    
    
    try {
        const {U_SYP_RICO_CCANAL,U_SYP_RICO_CSUCUR} = response.locals.user;
        let model: CategoriesModel = new CategoriesModel();

        model.action = 'detallesBonificacion';
        model.business = db_name;
        let bonificaciones :any = [];
        
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            model.idRegistro = element.bonificacion;
            let result = await BonificacionesProcedure(model);
            if(result[0]){
              const found = bonificaciones.find((element:any) => element[0].idRegistro === result[0].idRegistro);
              
                if(!found){
                    bonificaciones.push(result);
                }
            }
        }

        for (let i = 0; i < bonificaciones.length; i++) {
            const bonificacion = bonificaciones[i];
            let model: ProductsModel = new ProductsModel();
            for (let x = 0; x < bonificacion.length; x++) {
                const item = bonificacion[x];                

                model.action = 'findOne';
                model.business = db_name;
                model.cardCode = CardCode;
                model.wareHouse = wareHouse;
                model.itemCode = item.idProducto;

                const result = await ProductsProcedure(model);

                item.Stock = result ? result[0].OnHand : 0;
            }
        }
        
        responseModel.status = 1;
        responseModel.message = "Bonificaciones";
        responseModel.data =  bonificaciones;
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

// export async function getValidateWhs (request: Request, response: Response): Promise<void>{
//     let {db_name} = response.locals.business;
//     // const {CardCode, wareHouse} = response.locals.user;
//     //const {wareHouse} = response.locals.business;
//     let responseModel = new ResponseModel();
//     let {data} = request.body;
    
    
//     try {
//         let model: ProductsModel = new ProductsModel();
//         model.action = 'searchWhs'; 
//         model.business = db_name;
//         model.itemCode =  data;
//         let responseWhs:any = await ProductsProcedure(model);
        
        
//         responseModel.status = 1;
//         responseModel.message = "Todo chido";
//         responseModel.data =  responseWhs;
//         response.json(responseModel);
//     } catch (e) {
//         logger.error(e);
//         responseModel.message = "Ocurrió un problema inesperado";
//         response.json(responseModel);
//     }
// }