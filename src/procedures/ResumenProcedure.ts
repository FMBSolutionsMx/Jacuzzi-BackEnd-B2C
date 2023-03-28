import resumenModel from "../models/resumenModel";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";

export default async function Quotation (model: resumenModel) : Promise<any> {
  return [];
    // const db = new DatabaseService();
    // let data: any,status = 500;
    // try {
    //   const result = await db
    //     .connect()
    //     .then(async (pool: any) => {
    //       return await pool
    //         .request()
    //         .input("action", model.action)
    //         .input("business", model.business)
    //         .input("wareHouse", model.wareHouse)
    //         .input("cardCode", model.cardCode)
    //         .input("key", model.key)
    //         .input("itemCode", model.itemCode)
    //         .input("nextNumber", model.nextNumber) 
    //         .execute("Products");
    //     })
    //     .then((result: any) => {
          
    //       return  result;
    //     })
    //     .catch((err: any) => {
    //       logger.error(err);
    //       return  err ;
    //     });
    //   status = 200;
    //   data = result;
    // } catch (e) {
    //   logger.error(e);
    // } finally {
    //   await db.disconnect();
    // }
  
    // return data.recordset || [];

}