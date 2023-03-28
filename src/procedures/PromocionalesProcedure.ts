import { Request, IResult, IRecordSet } from "mssql";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

/**
 * References
 * 
 *   @param param1
 *   @param param2
 *   @param param3
 *   @param param4
 *   @param param5
 *   @param param6
 *   @param param7
 *   @param param8
 *   @param param9
 */
export default async function PromocionalesProcedure (model: any) : Promise<any> {
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
            .input("param1", model.param1)
            .input("param2", model.param2 || null)
            .input("param3", model.param3 || null)
            .input("param4", model.param4 || null)
            .input("param5", model.param5 || null)
            .input("param6", model.param6 || null)
            .input("param7", model.param7 || null) 
            .input("param8", model.param8 || null) 
            .input("param9", model.param9 || null) 
            .execute("Bonificaciones");
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

    // const request: Request = new Request();
    // const response: IResult<any> = await request.query("EXEC [dbo].[Products] '" + model.action + "', '" + model.business + "', '" + model.wareHouse + "', '" + model.cardCode + "', '" + model.key + "',  '" + model.itemCode + "'");
    // return (response.recordset || []);
  }else{
    const sh = new SchemaService ();
    try {
      let resHana= await sh.statements(`CALL _E_HANDEL_B2C.BONIFICACIONES('${model.param1}','${model.param2 || null}','${model.param3 || null}','${ model.param4 || null}','${ model.param5 || null}','${ model.param6 || null}','${ model.param7 || null}','${ model.param8 || null}','${ model.param9 || null}')`);
      return resHana || [];
    } catch (error) {
      logger.error("BONIFICACIONES: ",error);
      return [];
    }
  }
}