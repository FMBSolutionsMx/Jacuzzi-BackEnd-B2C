
import {logger} from "../util/logger";
import { DatabaseService } from "../util/dataBase";
import {getTypeDocument} from '../interfaces/xml';
import moment from 'moment';
import { SchemaService } from "../util/Schema";
class Order {
     public async getStatus (doc: any, responseBody: any){
        const db = new DatabaseService();
        const sh = new SchemaService ();
        let GlobalBusiness = JSON.parse(global.business);
        let baseEntry:any = null;
        let targetEntry:any = null;
        let baseType:any = null;
        let targetType:any = null;

        let responseData: any = [];

        let complete: any = true;
        try {
            // Recorrer líneas de documento al Ver Detalles
            for (let index = 0; index < responseBody.length; index++) {
                const item = responseBody[index];
                // Vverificar que exista un TrgetEntry en todas las lineas
                if(!item.TrgetEntry  && doc !== 'OINV'){
                    complete = false;
                }
                // Encontrar y asignar TrgetEntry
                if(!targetEntry && item.TrgetEntry){
                    targetEntry = item.TrgetEntry;
                    targetType = item.TargetType;
                }
                // Encontrar y asignar BaseEntry
                if(!baseEntry && item.BaseEntry){
                    baseEntry = item.BaseEntry;
                    baseType = item.BaseType;
                }
            }

            // Si todas las líneas tienen TrgetEntry
            if(complete){
                if(targetEntry){
                    responseData.push({
                        DocEntry: targetEntry,
                        ObjectType: targetType,
                       });
                }
                if(baseEntry){
                    responseData.push({
                        DocEntry: baseEntry,
                        ObjectType: baseType,
                    });
                }
              
                    
               while(baseEntry || targetEntry){
                    let doc = getTypeDocument(((targetType || baseType)).toString());
                    
                    let resultado:any = [];
                    const found = responseData.find((element:any) => element.targetType === targetType || element.baseType === baseType);
                    if(doc.subTable !== '' && (targetEntry || baseEntry)){
                        if(GlobalBusiness[0].type === 'SQL'){
                            resultado= await db.Query(`SELECT TrgetEntry,TargetType,BaseEntry,BaseType FROM [192.168.0.181].[SBODEMOMX].[dbo].[${doc.subTable}] WHERE DocEntry = ${(targetEntry || baseEntry)}`);
                        }else{
                            resultado = await sh.statements(`SELECT "TrgetEntry","TargetType","BaseEntry","BaseType" FROM "PRUEBAS_FMB"."${doc.subTable}" WHERE "DocEntry" = '${(targetEntry || baseEntry)}'`);
                        }    
                        if(!resultado){
                            targetEntry = null;
                            targetType = null;
                            baseEntry = null;
                            baseType = null;
                        }else{
                            resultado = GlobalBusiness[0].type === 'SQL'? resultado.recordset[0] : resultado[0];
                            baseEntry = resultado.BaseEntry;
                            baseType = resultado.BaseType;
                            targetEntry = resultado.TrgetEntry;
                            targetType = resultado.TargetType;
                            if(targetEntry){
                                const found = responseData.find((element:any) => element.DocEntry === targetEntry || element.ObjectType === targetType);
                        
                                if(!found){
                                    responseData.push({
                                        DocEntry: targetEntry,
                                        ObjectType: targetType,
                                    });
                                }
                            }
                            if(baseEntry){
                                const found = responseData.find((element:any) =>  element.baseEntry === baseEntry || element.ObjectType === baseType);
                        
                                if(!found){
                                    responseData.push({
                                        DocEntry: baseEntry,
                                        ObjectType: baseType,
                                    });
                                }
                            }                            
                        }
                    
                    }else{
                        targetEntry = null;
                        targetType = null;
                        baseEntry = null;
                        baseType = null;
                    }                  
                }
                
                if(doc === 'ODLN'){
                    if(responseData.length >= 3){
                        const order = responseData.find((element: any) => element.ObjectType === 17);
                        let resultado:any = null;
                        if(GlobalBusiness[0].type === 'SQL'){
                            resultado = await db.Query(`SELECT TOP 1 BaseEntry, BaseType FROM [192.168.0.181].[SBODEMOMX].[dbo].[RDR1] WHERE DocEntry = ${(order.DocEntry)}`);
                            responseData.push({
                                DocEntry: resultado.recordset[0].BaseEntry,
                                ObjectType: resultado.recordset[0].BaseType,
                            });
                        }else{
                            resultado = await sh.statements(`SELECT TOP 1 "BaseEntry", "BaseType" FROM "PRUEBAS_FMB"."RDR1" WHERE "DocEntry" = '${(order.DocEntry)}'`);
                            responseData.push({
                                DocEntry: resultado[0].BaseEntry,
                                ObjectType: resultado[0].BaseType,
                            });
                        } 
                    }                    
                } else if(doc === 'OINV'){
                    if(responseData.length >= 2){
                        const delivery = responseData.find((element: any) => element.ObjectType === 15);
                        let resultado:any = null;
                        let resultado2:any = null;
                        if(GlobalBusiness[0].type === 'SQL'){
                            resultado = await db.Query(`SELECT TOP 1 BaseEntry, BaseType FROM [192.168.0.181].[SBODEMOMX].[dbo].[DLN1] WHERE DocEntry = ${(delivery.DocEntry)}`);
                            resultado2 = await db.Query(`SELECT TOP 1 BaseEntry, BaseType FROM [192.168.0.181].[SBODEMOMX].[dbo].[RDR1] WHERE DocEntry = ${(resultado.recordset[0].BaseEntry)}`);
                            responseData.push(
                                {
                                    DocEntry: resultado.recordset[0].BaseEntry,
                                    ObjectType: resultado.recordset[0].BaseType,
                                },
                                {
                                    DocEntry: resultado2.recordset[0].BaseEntry,
                                    ObjectType: resultado2.recordset[0].BaseType,
                                },
                            );
                        }else{
                            resultado = await sh.statements(`SELECT TOP 1 "BaseEntry", "BaseType" FROM "PRUEBAS_FMB"."DLN1" WHERE "DocEntry" = '${(delivery.DocEntry)}'`);
                            resultado2 = await sh.statements(`SELECT TOP 1 "BaseEntry", "BaseType" FROM "PRUEBAS_FMB"."RDR1" WHERE "DocEntry" = '${(resultado[0].BaseEntry)}'`);
                            responseData.push(
                                {
                                    DocEntry: resultado[0].BaseEntry,
                                    ObjectType: resultado[0].BaseType,
                                },
                                {
                                    DocEntry: resultado2[0].BaseEntry,
                                    ObjectType: resultado2[0].BaseType,
                                },
                            );
                        }
                    }
                }

                for (let i = 0; i < responseData.length; i++) {
                    const element = responseData[i];
                    let type = element.ObjectType;
                    element.Legend = type === 23 ? 'ACEPTADO' : type === 17 ? 'PREPARANDO' : type === 15 ? 'EMPAQUETANDO' : type === 13 ? 'FACTURADO' : type === 14 ? 'CANCELADO' : '';
                    element.Table = type === 23 ? 'OQUT' : type === 17 ? 'ORDR' : type === 15 ? 'ODLN' : type === 13 ? 'OINV' : type === 14 ? 'ORIN' : '';
                    element.Table2 = type === 23 ? 'QUT1' : type === 17 ? 'RDR1' : type === 15 ? 'DLN1' : type === 13 ? 'INV1' : type === 14 ? 'RIN1' : '';
                    if(element.Table !== ''){
                        let request:any = null;
                        let request2:any = null;
                        if(GlobalBusiness[0].type === 'SQL'){
                            request = await db.Query(`SELECT DocDate, DocNum FROM [192.168.0.181].[SBODEMOMX].[dbo].[${element.Table}] WHERE DocEntry = ${(element.DocEntry)}`);
                            element.DocDate = request.recordset[0].DocDate ? moment(request.recordset[0].DocDate).utc().format() : moment().utc().format('YYYY-MM-DD');
                            element.DocNum = request.recordset[0].DocNum || '';

                            request2 = await db.Query(`SELECT DISTINCT PickIdNo FROM [192.168.0.181].[SBODEMOMX].[dbo].[${element.Table2}] WHERE DocEntry = ${(element.DocEntry)}`);
                            element.PickIdNo = request2.recordset[0].PickIdNo || '';

                        }else{
                            request = await sh.statements(`SELECT "DocDate", "DocNum" FROM "PRUEBAS_FMB"."${element.Table}" WHERE "DocEntry" = '${(element.DocEntry)}'`);
                            element.DocDate = request[0].DocDate ? moment(request[0].DocDate).utc().format() : moment().utc().format('YYYY-MM-DD');
                            element.DocNum = request[0].DocNum || '';

                            request2 = await sh.statements(`SELECT DISTINCT "PickIdNo" FROM "PRUEBAS_FMB"."${element.Table2}" WHERE "DocEntry" = '${(element.DocEntry)}'`);
                            element.PickIdNo = request2[0].PickIdNo || '';
                        }
                    }
                }
            }
        } catch (error) {
          logger.error(error);
        }
        return responseData;
    }
}

export const orderValidate = new Order();