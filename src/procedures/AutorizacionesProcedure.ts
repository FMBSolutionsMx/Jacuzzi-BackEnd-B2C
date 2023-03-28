import { Request, IResult, IRecordSet } from "mssql";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

/**
 * References
 * 
 *   @param actions
 *   @param param1
 *   @param param2
 *   @param param3
 */
export default async function AutorizacionesProcedure (model: any) : Promise<any> {
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
            .input("actions", model.actions || null)
            .input("param1", model.param1 || null)
            .input("param2", model.param2 || null)
            .input("param3", model.param3 || null)
            .execute("Autorizaciones");
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
      let resHana= await sh.statements(`CALL _E_HANDEL_B2C.AUTORIZATION('${model.actions || null}','${model.param1 || null}','${ model.param2 || null}','${model.param3 || null}')`);
      return resHana || [];
    } catch (error) {
      logger.error("AUTORIZATION: ", error);
      return [];
    }
  }
}