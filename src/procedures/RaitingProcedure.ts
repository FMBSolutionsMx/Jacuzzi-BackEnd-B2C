import PointsHistoryModel from "../models/PointsHistoryModel";
import { Request, IResult, IRecordSet } from "mssql";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

export default async function ProductsProcedure(action: any, itemCode : any, cardCode: any): Promise<any> {
  let GlobalBusiness = JSON.parse(global.business);
  if(GlobalBusiness[0].type === 'SQL'){
    const db = new DatabaseService();
    let data: any,status = 500;
    try {      
      const result = await db
        .connect()
        .then(async (pool: any) => {
          return await pool
            .request()
            .input("action", action)
            .input("itemCode", itemCode)
            .input("cardCode", cardCode)
            .execute("SP_Raiting");
        })
        .then((result: any) => {          
          return  result;
        })
        .catch((err: any) => {
          logger.error(err);
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
  }else{
    const sh = new SchemaService ();
    try {
      let resHana= await sh.statements(`CALL _E_HANDEL_B2C.SP_RAITING('${action}','${itemCode}','${cardCode}')`);
      return resHana || [];
    } catch (error) {
      logger.error("SP_RAITING: ",error);
      return [];
    }
  }
}