import { Request, Response } from "express";
import moment from "moment";
import { logger } from '../util/logger';
import { DatabaseService } from "../util/database";
import { SchemaService } from "../util/Schema";
const sh = new SchemaService ();
const logDate = moment().format('Y-MM-DD H:m:s');

class SendController {

    public async GetSlideFront(req: Request, res: Response): Promise<void> {
        let GlobalBusiness = JSON.parse(global.business);
        if(GlobalBusiness[0].type === 'SQL'){
            const db = new DatabaseService();
            let data: any,status = 500;
            try {
                const result = await db.connect()
                .then(async (pool: any) => {
                    return await pool
                        .request()
                        .input("action", "GETFRONT")
                        .input("Param1", "on")
                        .input("Param2", "off")
                        .input("Param3", "on")
                        .input("Param4", "")
                        .input("Param5", "")
                        .execute("SPBanners");
                })
                .then((result: any) => {
                    ////console.log("for here", result);
                    return  result;
                })
                .catch((err: any) => {
                    logger.error("Algo salio mal en la consulta",err);
                    return  err ;
                });
                status = 200;
                data = result.recordset;
            } catch (e) {
                logger.error("Algo vamal con SildeFront",e);
            } finally {
                await db.disconnect();
            }

            res.json(data);
        }else{
            try {
                let resHana= await sh.statements(`CALL _E_HANDEL_B2C.SPBANNERS('GETFRONT','on','off','on','','')`);
                res.json(resHana || []); 
            } catch (error) {
                logger.error("Algo vamal con SildeFront",error);
                res.json([]); 
            }
        }
    }// end function get banners for front public.

    public async GetAllRecords(req: Request, res: Response): Promise<void> {
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
                        .input("action", "GETALLADMIN")
                        .input("Param1", "")
                        .input("Param2", "")
                        .input("Param3", "")
                        .input("Param4", "")
                        .input("Param5", "")
                        .execute("SPBanners");
                })
                .then((result: any) => {
                    ////console.log("Cosulta inicio",result);
                    return  result;
                })
                .catch((err: any) => {
                    ////console.log(err);
                    logger.error("Algo salio mal en la consulta",err);
                    return  err ;
                });
                status = 200;
                data = result.recordset;
            } catch (e) {
                ////console.log(e);
                logger.error("Algo vamal con ALL Records",e);
            } finally {
                await db.disconnect();
            }
            res.json(data);
        }else{
            try {
                let resHana= await sh.statements(`CALL _E_HANDEL_B2C.SPBANNERS('GETALLADMIN','','','','','')`);
                res.json(resHana || []); 
            } catch (error) {
                logger.error("GETALLADMIN: ",error);
                res.json([]); 
            }
        }
    }// end function get banners for front admin.

    public async GetRecord(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
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
                        .input("action", "GETBANNER")
                        .input("Param1", id)
                        .input("Param2", "")
                        .input("Param3", "")
                        .input("Param4", "")
                        .input("Param5", "")
                        .execute("SPBanners");
                })
                .then((result: any) => {
                
                    return  result;
                })
                .catch((err: any) => {
                    logger.error("Algo salio mal en la consulta",err);
                    return  err ;
                });
                status = 200;
                data = result.recordset;
            } catch (e) {
                logger.error("Algo vamal con los banners",e);
            } finally {
                await db.disconnect();
            }

            res.json(data);
        }else{
            try {
                let resHana= await sh.statements(`CALL _E_HANDEL_B2C.SPBANNERS('GETBANNER','${id}','','','','')`);
                res.json(resHana || []); 
            } catch (error) {
                logger.error("GETBANNER: ",error);
                res.json([]); 
            }
        }
    }// end function get banners for front admin.

    public async Store(req: Request, res: Response): Promise<void> {
        const { user_id, slug, title, url, image, content, items, valid_from, valid_to, active, is_date,  order_item } = req.body;
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
                        .input("p1", user_id)
                        .input("p2", slug)
                        .input("p3", title)
                        .input("p4", url)
                        .input("p5", image)
                        .input("p6", content)
                        .input("p7", items)
                        .input("p8", valid_from === '' ? logDate : valid_from)
                        .input("p9", valid_to === '' ? logDate : valid_to)
                        .input("p10", active)
                        .input("p11", is_date)
                        .input("p12", order_item)
                        .input("p13", logDate)
                        .query("INSERT INTO handel_banners (userid, slug, title, url, image, contents, items, validFrom, validTo, active, isDate, orderBanner, createdAt) VALUES(@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13)");
                })
                .then((result: any) => {
                
                    return  result;
                })
                .catch((err: any) => {
                    logger.error("Algo salio mal en la inserción",err);
                    return  err ;
                });
                status = 200;
                data = result;
            } catch (e) {
                logger.error("Algo vamal con la inserción",e);
            } finally {
                await db.disconnect();
            }

            res.json(data);
        }else{
            try {
                let resHana= await sh.statements(`INSERT INTO "handel_banners" ("userId", "slug", "title", "url", "image", "contents", "items", "validFrom", "validTo", "active", "isDate", "orderBanner", "createdAt") VALUES('${user_id}', '${slug}', '${title}', '${url}', '${image}', '${content}', '${items}', '${valid_from === '' ? logDate : valid_from}', '${valid_to === '' ? logDate : valid_to}', '${active}', '${is_date}', '${order_item}', '${logDate}')`);
                res.json(resHana || []); 
            } catch (error) {
                logger.error("INSERT handel_banners: ", error);
                res.json([]); 
            }
        }
    }// end function get banners add new element

    public async Update(req: Request, res: Response): Promise<void> {
        const { user_id, slug, title, url, image, content, items, valid_from, valid_to, active, is_date, id, order_item } = req.body;
        let GlobalBusiness = JSON.parse(global.business);
        if(GlobalBusiness[0].type === 'SQL'){
            const db = new DatabaseService();
            ////console.log(req.body);
            let data: any,status = 500;
            try {
                const result = await db
                .connect()
                .then(async (pool: any) => {
                    return await pool
                        .request()
                        .input("p1", user_id)
                        .input("p2", slug)
                        .input("p3", title)
                        .input("p4", url)
                        .input("p5", image)
                        .input("p6", content)
                        .input("p7", items)
                        .input("p8", valid_from === '' ? logDate : valid_from)
                        .input("p9", valid_to === '' ? logDate : valid_to)
                        .input("p10", active)
                        .input("p11", is_date)
                        .input("p12", order_item)
                        .input("p13", id)
                        .query("UPDATE handel_banners SET userid=@p1, slug=@p2, title=@p3, url=@p4, image=@p5, contents=@p6, items=@p7, validFrom=@p8, validTo=@p9, active=@p10, isDate=@p11, orderBanner=@p12 WHERE id=@p13");
                })
                .then((result: any) => {
                
                    return  result;
                })
                .catch((err: any) => {
                    logger.error("Algo salio mal en la actualización",err);
                    return  err ;
                });
                status = 200;
                data = result;
            } catch (e) {
                logger.error("Algo vamal con la actualización",e);
            } finally {
                await db.disconnect();
            }

            res.json(data);
        }else{
            try {
                let resHana= await sh.statements(`UPDATE "handel_banners" SET "userId"='${user_id}', "slug"='${slug}', "title"='${title}', "url"='${url}', "image"='${image}', "contents"='${content}', "items"='${items}', "validFrom"='${valid_from === '' ? logDate : valid_from}', "validTo"='${valid_to === '' ? logDate : valid_to}',"active"='${active}', "isDate"='${is_date}', "orderBanner"='${order_item}' WHERE "id"='${id}'`);
                res.json(resHana || []); 
            } catch (error) {
                logger.error("UPDATE handel_banners: ",error);
                res.json([]); 
            }
        }
    }// end function get banners add new element

    public async Delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
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
                        .input("action", "DELETE")
                        .input("Param1", id)
                        .input("Param2", "")
                        .input("Param3", "")
                        .input("Param4", "")
                        .input("Param5", "")
                        .execute("SPBanners");
                })
                .then((result: any) => {
                
                    return  result;
                })
                .catch((err: any) => {
                    logger.error("Algo salio mal al momento de eliminar",err);
                    return  err ;
                });
                status = 200;
                data = result;
            } catch (e) {
                logger.error("Algo vamal con para eliminar",e);
            } finally {
                await db.disconnect();
            }

            res.json(data);
        }else{
            try {
                let resHana= await sh.statements(`CALL _E_HANDEL_B2C.SPBANNERS('DELETE','${id}','','','','')`);
                res.json(resHana || []); 
            } catch (error) {
                logger.error("DELETE SPBANNERS: ",error);
                res.json([]); 
            }
        }
    }// end function get banners for front admin.
}// end class Banner controllers

const sendController = new SendController();
export default sendController;