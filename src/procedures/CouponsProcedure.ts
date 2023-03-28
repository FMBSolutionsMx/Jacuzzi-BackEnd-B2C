import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import CouponsModel from "../models/CouponsModel";
import { SchemaService } from "../util/Schema";

export default async function CouponsProcedure (model: CouponsModel) : Promise<any> {
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
                .input("coupon", model.coupon)
                .execute("Coupons");
        })
        .then((result: any) => {
            return result;
        })
        .catch((err: any) => {
            logger.error("Algo salio mal en los cupones",err);
            return  err ;
        });
        status = 200;
        data = result;
    } catch (e) {
        logger.error("Algo va mal con los cupones",e);
    } finally {
        await db.disconnect();
    }

  return data.recordset || [];
    }else{
        const sh = new SchemaService ();
        try {
            let resHana= await sh.statements(`CALL _E_HANDEL_B2C.COUPONS('${model.action}','${model.business}','${model.coupon}')`);
            return resHana || [];
        } catch (error) {
            logger.error("COUPONS: ",error);
            return [];
        }
    }
}