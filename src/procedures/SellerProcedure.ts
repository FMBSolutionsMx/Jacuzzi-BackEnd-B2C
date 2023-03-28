import UsersModel from "../models/UsersModel";
import { Request, IResult, IRecordSet } from "mssql";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

export default async function SellerProcedure(model: UsersModel): Promise<any> {
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
            .input("arg1", model.arg1) 
            .input("paginas", model.nextNumber || 0) 
            .execute("Seller");
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
      let resHana= await sh.statements(`CALL _E_HANDEL_B2C.SELLER('${model.action}','${model.business}','${model.arg1}','${model.nextNumber || 0}')`);
      return resHana || [];
    } catch (error) {
      logger.error("SELLER: ",error);
      return [];
    }
  }
}