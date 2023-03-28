import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import { SchemaService } from "../util/Schema";

export default async function FeaturedProcedure (action:string, nextNum: number, categoryType:string = '', limitSlider: number = 0 ,wareHouse: any = null,cardCode: any = null ) : Promise<any> {
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
                .input("paginas", nextNum)
                .input("categoryType", categoryType)
                .input("limitSlider", limitSlider || 0)
                .input("wareHouse", wareHouse)
                .input("CardCode", cardCode)
                .execute("Featured");
        })
        .then((result: any) => {
            return result;
        })
        .catch((err: any) => {
            logger.error("Algo salio mal en la consulta del categorias y productos",err);
            return  err ;
        });
        status = 200;
        data = result;
    } catch (e) {
        logger.error("Algo va mal con los destacados",e);
    } finally {
        await db.disconnect();
    }

  return data.recordset || [];
    }else{
        const sh = new SchemaService ();
        try {
            let resHana= await sh.statements(`CALL _E_HANDEL_B2C.FEATURED('${action}','${nextNum}','${categoryType}','${limitSlider || 0}','${wareHouse}','${cardCode}')`);
            return resHana || [];
        } catch (error) {
            logger.error("FEATURED: ",error);
            return [];
        }
    }
}