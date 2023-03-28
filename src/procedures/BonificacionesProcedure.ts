import CategoriesModel from "../models/CategoriesModel";
import { Request, IResult, IRecordSet } from "mssql";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

/**
 * References
 *  getCategories()
 *    @param action
 *    @param idRegistro
 *    @param param
 */
export default async function BonificacionesProcedure (model: CategoriesModel) : Promise<any> {
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
          .input("param1", model.action)
          .input("param2", model.idRegistro)
          .input("param3", model.param || null)
          .input("param4", null)
          .input("param5", null)
          .input("param6", null)
          .input("param7", null) 
          .input("param8", null) 
          .input("param9", null) 
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
    // const response: IResult<any> = await request.query("EXEC [dbo].[Categories] '" + model.action + "', '" + model.business + "'");
    // return (response.recordset || []);
  }else{
    const sh = new SchemaService ();
    try {
      let resHana= await sh.statements(`CALL _E_HANDEL_B2C.BONIFICACIONES('${model.action}','${model.idRegistro}','${model.param || null}','','','','','','')`);
      
      return resHana || [];
    } catch (error) {
      logger.error("BONIFICACIONES: ", error);
      return [];
    }
  }
}