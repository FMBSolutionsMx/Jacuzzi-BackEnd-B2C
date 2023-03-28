import { Request, Response } from "express";
import moment from "moment";
import { logger } from '../util/logger';
import { DatabaseService } from "../util/database";
import { SchemaService } from "../util/Schema";
const logDate = moment().format('Y-MM-DD H:m:s');
const sh = new SchemaService ();
class SendController {

    public async GetSlideFront(req: Request, res: Response): Promise<void> {
        const { fechaInicio, fechaFinal } = req.params;
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
                        .input("action", "GETFRONT")
                        .input("Param1", "on")
                        .input("Param2", "off")
                        .input("Param3", "on")
                        .input("Param4", fechaInicio)
                        .input("Param5", fechaFinal)
                        .execute("SPNewsBlog");
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
                let resHana= await sh.statements(`CALL _E_HANDEL_B2B.SPNEWSBLOG('GETFRONT','on','off','on','${fechaInicio}','${fechaFinal}')`);
                res.json(resHana || []);
            } catch (error) {
                logger.error("SPNEWSBLOG GetSlideFront: ", error);
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
                        .execute("SPNewsBlog");
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
                let resHana= await sh.statements(`CALL _E_HANDEL_B2B.SPNEWSBLOG('GETALLADMIN','','','','','')`);
                res.json(resHana || []);
            } catch (error) {
                logger.error("SPNEWSBLOG GetAllRecords: ", error);
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
                        .execute("SPNewsBlog");
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
                let resHana= await sh.statements(`CALL _E_HANDEL_B2B.SPNEWSBLOG('GETBANNER','${id}','','','','')`);
                res.json(resHana || []);
            } catch (error) {
                logger.error("SPNEWSBLOG GetRecord: ", error);
                res.json([]); 
            }
        }
    }// end function get banners for front admin.

    public async Store(req: Request, res: Response): Promise<void> {
        const { user_id, title, image, intro, content, valid_from, active, valid_to, is_date } = req.body;
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
                        .input("p1", image)
                        .input("p2", title)
                        .input("p3", intro)
                        .input("p4", content)
                        .input("p5", valid_from === '' ? logDate : valid_from)
                        .input("p6", active)
                        .input("p7", user_id)
                        .input("p8", valid_to === '' ? logDate : valid_to)
                        .input("p9", is_date)
                        .query("INSERT INTO NewsBlog (image, title, introduction, new, date, active, creator, hasta, isDate) VALUES(@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)");
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
                let resHana= await sh.statements(`INSERT INTO "NewsBlog" ("image", "title", "introduction", "new", "date", "active", "creator", "hasta", "isDate") VALUES('${image}', '${title}', '${intro}', '${content}', '${valid_from === '' ? logDate : valid_from}', '${active}', '${user_id}', '${valid_to === '' ? logDate : valid_to}', '${is_date}')`);
                console.log("con<<< INSERT NEWS", resHana)
                res.json(resHana || []); 
            } catch (error) {
                logger.error("INSERT NewsBlog: ", error);
                res.json([]); 
            }
        }
    }// end function get banners add new element

    public async Update(req: Request, res: Response): Promise<void> {
        // const { slug, url, items, valid_to, is_date, id, order_item } = req.body;
        const { id , user_id, title, image, intro, content, valid_from, active, valid_to, is_date } = req.body;
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
                        .input("p1", image)
                        .input("p2", title)
                        .input("p3", intro)
                        .input("p4", content)
                        .input("p5", valid_from === '' ? logDate : valid_from)
                        .input("p6", active)
                        .input("p7", user_id)
                        .input("p8", id)
                        .input("p9", valid_to === '' ? logDate : valid_to)
                        .input("p10", is_date)
                        // .query("INSERT INTO NewsBlog (image, title, introduction, new, date, active, creator) VALUES(@p1, @p2, @p3, @p4, @p5, @p6, @p7)");
                        .query("UPDATE NewsBlog SET image=@p1, title=@p2, introduction=@p3, new=@p4, date=@p5, active=@p6, creator=@p7 ,hasta=@p9 ,isDate=@p10 WHERE id=@p8");
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
                let resHana= await sh.statements(`UPDATE "NewsBlog" SET "image"= '${image}', "title"= '${title}', "introduction"= '${intro}', "new"= '${content}', "date"= '${valid_from === '' ? logDate : valid_from}', "active"= '${active}', "creator"= '${user_id}' ,"hasta"= '${valid_to === '' ? logDate : valid_to}' ,"isDate"= '${is_date}' WHERE "id"= '${id}'`);
                res.json(resHana || []); 
            } catch (error) {
                logger.error("UPDATE NewsBlog: ", error);
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
                        .execute("SPNewsBlog");
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
                let resHana= await sh.statements(`CALL _E_HANDEL_B2B.SPNEWSBLOG('DELETE','${id}','','','','')`);
                res.json(resHana || []);
            } catch (error) {
                logger.error("SPNEWSBLOG GetRecord: ", error);
                res.json([]); 
            }
        }
    }// end function get banners for front admin.

}// end class Banner controllers

const sendController = new SendController();
export default sendController;