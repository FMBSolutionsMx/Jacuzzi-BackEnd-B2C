import PointsHistoryModel from "../models/PointsHistoryModel";
import { Request, IResult, IRecordSet } from "mssql";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

export default async function ProductsProcedure(model: PointsHistoryModel): Promise<any> {
  let GlobalBusiness = JSON.parse(global.business);
  if(GlobalBusiness[0].type === 'SQL'){
    const db = new DatabaseService();
    let data: any,status = 500;
    try {
      //console.log();
      
      const result = await db
        .connect()
        .then(async (pool: any) => {
          return await pool
            .request()
            .input("action", model.action)
            .input("business", model.business)
            .input("DocEntry", model.DocEntry)
            .input("DocType", model.DocType)
            .input("DocNum", model.DocNum)
            .input("CardCode", model.CardCode)
            .input("Total", model.Total)
            .input("Type", model.Type)     
            .input("DocDate", model.DocDate)
            .input("UsedPoints", model.UsedPoints)
            .execute("PointsHistory");
        })
        .then((result: any) => {          
          return  result;
        })
        .catch((err: any) => {
          logger.error(err);
          // console.log('con°-°err', err);
          return  err ;
        });
      status = 200;
      data = result;
    } catch (e) {
      logger.error(e);
    } finally {
      await db.disconnect();
    }
  
    return data.recordset || [];

    // const request: Request = new Request();    
    // const results: IResult<any> = await request.query("EXEC [dbo].[Users] '" + model.action + "', '" + model.business + "', '" + model.arg1 + "'");
    // return results.recordset;
  }else{
    const sh = new SchemaService ();
    try {
      let resHana= await sh.statements(`CALL _E_HANDEL_B2C.POINTSHISTORY('${model.action}','${model.business}','${model.DocEntry}','${model.DocType}','${model.DocNum}','${model.CardCode}','${model.Total}','${model.Type}','${model.DocDate}','${model.UsedPoints}')`);
      return resHana || [];
    } catch (error) {
      logger.error("POINTSHISTORY: ",error);
      return [];
    }
  }
}