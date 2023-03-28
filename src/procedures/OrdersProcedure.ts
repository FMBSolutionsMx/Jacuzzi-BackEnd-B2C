import OrdersModel from "../models/OrdersModel";
import { Request, IResult, IRecordSet } from "mssql";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

/**
 * References
 *  createDocuments()
 *   @param action
 *   @param business
 *   @param table
 *   @param entry
 *  orders()
 *   @param action
 *   @param business
 *   @param table
 *   @param cardCode
 *   @param initialDate
 *   @param finalDate
 *  order()//getOrderHeader
 *   @param action
 *   @param business
 *   @param table
 *   @param cardCode
 *   @param entry
 *  order()//get OrderBody
 *   @param action
 *   @param business
 *   @param table
 *   @param entry 
 */
export default async function OrdersProcedure (model: OrdersModel) : Promise<any> {
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
            .input("action", model.action)
            .input("business", model.business)
            .input("entry", model.docEntry)
            .input("table", model.table)
            .input("cardCode", model.cardCode)
            .input("initialDate", model.initialDate)
            .input("finalDate", model.finalDate)
            .execute("Orders");
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
  
    return data.recordset;

    // const request: Request = new Request();
    // const response: IResult<any> = await request.query("EXEC [dbo].[Orders] '" + model.action + "', '" + model.business + "', '" + model.docEntry + "', '" + model.table + "', '" + model.cardCode + "', '" + model.initialDate + "', '" + model.finalDate + "'");
    // return (response.recordset);
  }else{
    const sh = new SchemaService ();
    try {
      let resHana= await sh.statements(`CALL _E_HANDEL_B2C.ORDERS('${model.action}','${model.business}','${model.docEntry}','${model.table}','${model.cardCode}','${model.initialDate}','${model.finalDate}')`);
      return resHana || [];
    } catch (error) {
      logger.error("ORDERS: ",error);
      return [];
    }
  }
}