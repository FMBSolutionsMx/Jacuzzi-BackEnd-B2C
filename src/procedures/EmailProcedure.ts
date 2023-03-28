import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

export default async function EmailProcedure (action: String ) : Promise<any> {
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
                .execute("Mail");
        })
        .then((result: any) => {
        
            return  result;
        })
        .catch((err: any) => {
            logger.error("Algo salio mal en la consulta del email",err);
            return  err ;
        });
        status = 200;
        data = result;
    } catch (e) {
        logger.error("Algo va mal con el mail",e);
    } finally {
        await db.disconnect();
    }

  return data.recordset || [];
    }else{
        const sh = new SchemaService ();
        try {
            let resHana= await sh.statements(`CALL _E_HANDEL_B2C.MAIL('${action}')`);
            return resHana || [];
        } catch (error) {
            logger.error("MAIL: ",error);
            return [];
        }
    }
}