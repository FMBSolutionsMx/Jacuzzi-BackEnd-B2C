import { Request, Response } from "express";
import PointsHistoryModel from "../models/PointsHistoryModel";
import PointsHistoryProcedure from "../procedures/PointsHistoryProcedure";
import ResponseModel from "../models/ResponseModel";
import { logger } from "../util/logger";
import moment from "moment";

export async function insertPoints(Data: any) {
  const {DocEntry,DocNum,DocDate,CardCode,Total,Type,DocType,UsedPoints} = Data;
  // let localstorage = request.body.localShoppingCart;
  try {
    let model: PointsHistoryModel = new PointsHistoryModel();
    model.action = "insertPoints";
    model.DocEntry = parseInt(DocEntry);
    model.DocType = parseInt(DocType);
    model.DocNum = parseInt(DocNum);
    model.DocDate = DocDate || '';
    model.CardCode = CardCode;
    model.Total = parseInt(Total);
    model.Type = Type;
    model.UsedPoints = UsedPoints || '';

    let result = await PointsHistoryProcedure(model);
    
  } catch (e) {
    logger.error("Register Ponits: =>",e);
    //console.log('con°-°errInserPoints', e);
    
  }
}

export async function infoPoints(Data: any) {
  const {CardCode, DocDate} = Data;
  const responseModel = new ResponseModel();
  // let localstorage = request.body.localShoppingCart;
  try {
    let model: PointsHistoryModel = new PointsHistoryModel();

    // Invoices
    model.CardCode = CardCode;
    model.action = "getPointsFromSAPInvoices";
    model.DocDate = moment(DocDate).utc().format('YYYY-MM-DD');
    let sapPointsResponseInvoices = await PointsHistoryProcedure(model);

    // Credit Notes
    model.action = "getPointsFromSAPCreditNotes";
    let sapPointsResponseCreditNotes = await PointsHistoryProcedure(model);

    if(!sapPointsResponseInvoices && !sapPointsResponseCreditNotes){
      let goBackWrong = {
        resultsPoints: [],
        totalPoints: 0,
      }
      return goBackWrong;
    }

    model.action = "infoPoints";
    model.CardCode = CardCode;
    model.DocDate = moment(DocDate).utc().format('YYYY-MM-DD');     
    let infoPointsResponse = await PointsHistoryProcedure(model);

    // Invoices Loop
    for (let i = 0; i < sapPointsResponseInvoices.length; i++) {
      const elementSAP = sapPointsResponseInvoices[i];
      let flag = true;
      for (let j = 0; j < infoPointsResponse.length; j++) {
        const elementHandelTable = infoPointsResponse[j];
          if(parseInt(elementSAP.DocEntry) ===  parseInt(elementHandelTable.DocEntry) && elementSAP.Type == elementHandelTable.Type){
            flag = false;
          }
      }
      if(flag === true){
        let dataInsert = {
          DocEntry: elementSAP.DocEntry,
          DocType: elementSAP.DocType,
          DocNum: elementSAP.DocNum,
          DocDate: elementSAP.DocDate,
          CardCode: elementSAP.CardCode,
          Total: elementSAP.Total,
          Type: elementSAP.Type,
        }        
        let resultInsert = await insertPoints(dataInsert);
        // if(elementSAP.U_FMB_Handel_SUBS !== null && elementSAP.U_FMB_Handel_SUBS != 0 && elementSAP.U_FMB_Handel_SUBS !== ''){
        //   let dataInsertDeleteUsedPoints = {
        //     DocEntry: elementSAP.DocEntry,
        //     DocType: elementSAP.DocType,
        //     DocNum: elementSAP.DocNum,
        //     DocDate: elementSAP.DocDate,
        //     CardCode: elementSAP.CardCode,
        //     Total: elementSAP.U_FMB_Handel_SUBS,
        //     Type: 'resta',
        //     UsedPoints: '1'
        //   }        
        //   let resultInsertDeleteUsedPoints = await insertPoints(dataInsertDeleteUsedPoints);
        // }
      }
    }
 
    // Credit Notes Loop
    let infoPointsResponseForCreditNotes = await PointsHistoryProcedure(model);
    for (let i = 0; i < sapPointsResponseCreditNotes.length; i++) {
      const elementSAP = sapPointsResponseCreditNotes[i];
      let flag = true;
      for (let j = 0; j < infoPointsResponseForCreditNotes.length; j++) {
        const elementHandelTable = infoPointsResponseForCreditNotes[j];   
        // Valida que exista una factura con relacion a la nota de crédito
        // if(parseInt(elementSAP.DocEntry) === parseInt(elementHandelTable.DocEntry) && elementSAP.Type != elementHandelTable.Type && elementSAP.DocType != elementHandelTable.DocType){
        //   flag = true;
        // }
        // Valida que no este insertada esta nota de crédito
        if(parseInt(elementSAP.DocEntry) === parseInt(elementHandelTable.DocEntry) && elementSAP.DocType == elementHandelTable.DocType){
          flag = false;
        }
      }
      if(flag === true){
        // let dataInsertCreditNote = {
        //   DocEntry: elementSAP.DocEntry,
        //   DocType: elementSAP.DocType,
        //   DocNum: elementSAP.DocNum,
        //   DocDate: elementSAP.DocDate,
        //   CardCode: elementSAP.CardCode,
        //   Total: elementSAP.Total,
        //   Type: elementSAP.Type,
        // }        
        // let resultInsert = await insertPoints(dataInsertCreditNote);
        if(elementSAP.U_FMB_Handel_SUBS !== null && elementSAP.U_FMB_Handel_SUBS != 0 && elementSAP.U_FMB_Handel_SUBS !== ''){
          let dataInsertDeleteUsedPoints = {
            DocEntry: elementSAP.DocEntry,
            DocType: elementSAP.DocType,
            DocNum: elementSAP.DocNum,
            DocDate: elementSAP.DocDate,
            CardCode: elementSAP.CardCode,
            Total: elementSAP.U_FMB_Handel_SUBS,
            Type: 'suma',
            UsedPoints: '1'
          }        
          let resultInsertDeleteUsedPoints = await insertPoints(dataInsertDeleteUsedPoints);
        }
      }
    }

    model.action = "infoPoints";
    model.CardCode = CardCode;   
    model.DocDate = moment(DocDate).utc().format('YYYY-MM-DD');   
    let infoPointsSecondResponse = await PointsHistoryProcedure(model);

    let totalPoints = 0;
    if(infoPointsSecondResponse[0]){
      totalPoints = parseInt(infoPointsSecondResponse[0].Acumulado) - parseInt(infoPointsSecondResponse[0].Descontados);
      let sumaRestaAnterior = 0;
      infoPointsSecondResponse.map((infoPoint:any) => {
        infoPoint.lastTotal = sumaRestaAnterior;
        if(infoPoint.Type === 'suma'){
          sumaRestaAnterior += infoPoint.Total;
        } else {
          sumaRestaAnterior -= infoPoint.Total;
        }
        infoPoint.nextToLastTotal = sumaRestaAnterior;
      });
    }

    model.action = "pointsMoney";
    let infoPointsMoneyResponse = await PointsHistoryProcedure(model);

    let goBack = {
      resultsPoints: infoPointsSecondResponse,
      totalPoints: totalPoints,
      pointsMoney : infoPointsMoneyResponse[0].Name
    }

    return goBack;
    
  } catch (e) {
    logger.error("Get info Ponits: => ",e);
    return {};
  }
}

export async function infoResetPoints(request: Request, response: Response): Promise<void> {
  const responseModel = new ResponseModel();
  // let localstorage = request.body.localShoppingCart;
  try {
    let model: PointsHistoryModel = new PointsHistoryModel();
    model.action = "infoResetPoints";
    let sapPointsResponse = await PointsHistoryProcedure(model);

    if(!sapPointsResponse || !sapPointsResponse[0]){
      responseModel.data = { error: true };
      responseModel.message = 'No existen registros en la tabla de periodo de puntos';
      response.json(responseModel);
      return;
    }
    
    responseModel.data = { resetPoints: sapPointsResponse};                        
    responseModel.message = 'Periodo de puntos';
    responseModel.status = 1;
    response.json(responseModel);
  } catch (e) {
    logger.error(e);
    //console.log('con°-°e', e);
    responseModel.message = "Ocurrio un error al traer los periodos de puntos";
    response.json(responseModel);
  }
}

export async function insertResetPoints(request: Request, response: Response) {
  const { DateReset, CardCode } = request.body.parametersResetPoints;
  const responseModel = new ResponseModel();
  try {
    let model: PointsHistoryModel = new PointsHistoryModel();
    model.action = "insertResetPoints";
    model.DocDate = DateReset;
    model.CardCode = CardCode;
    let result = await PointsHistoryProcedure(model);

    if (!result || !result[0] || (result[0].id === '' || result[0].id === undefined)) {
      responseModel.message = "Error al crear el nuevo periodo de puntos";
      response.json(responseModel);
      return;
    }

    responseModel.status = 1;
    responseModel.data = { id: result[0].id };
    responseModel.message = "El nuevo periodo de puntos se creó de manera exitosa";
    response.json(responseModel);
  } catch (e) {
    logger.error(e);
    responseModel.message = "Ocurrió un error inesperado";
    //console.log('con°-°e',e );
    response.json(responseModel);
  }
}