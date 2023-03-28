import { Request, Response } from "express";
import moment from "moment";
import path from 'path';
import formidable from 'formidable';
import fs from 'fs';
import fsE from 'fs-extra';
import { logger } from '../util/logger';
import { DatabaseService } from "../util/database";

const upload_path = path.join(__dirname, '../uploads/');
const logDate = moment().format('Y-MM-DD H:m:s');

class SendController {

    public async UploadFile(req: Request, res: Response): Promise<void> {
        const { distine, nameFile } = req.params;
        var form = new formidable.IncomingForm();
        ////console.log('vars', distine, nameFile);
        const destination = distine + "/";
        form.parse(req, async function (err: any, fields: any, files: any) {
            ////console.log('Files Helper:', files);
            var oldpath = files.file.path;
            var fileSave = destination + nameFile;
            var newpath = upload_path + fileSave;
            var path = upload_path + destination;
            if (!fs.existsSync(path)) {
                //!fs.existsSync(path) && fs.mkdirSync(path, { recursive: true });
                await fsE.ensureDirSync(path);
                ////console.log(create);
            }
            ////console.log('oldpath',oldpath);
            ////console.log('newpath',newpath);
            fs.rename(oldpath, newpath, function (err) {
                if (err) {
                    res.json({ 'status': 'error', 'msg': 'Error:' + err.message });
                } else {
                    res.json({ 'status': 'success', 'url': fileSave });
                }
            });
        });
    }
    public async DeleteFile(req: Request, res: Response): Promise<void> {
        const { distine, nameFile } = req.params;
        const destination = distine + "/";
        var fileSave = destination + nameFile;
        var newpath = upload_path + fileSave;
        fs.unlinkSync(newpath);
        res.json({ 'status': 'success', 'url': fileSave });
    }

    public async ProfileAdmin(req: Request, res: Response): Promise<void> {
        const { cardcode } = req.params;
        const db = new DatabaseService();
        let data: any,status = 500;
        try {
            const result = await db
            .connect()
            .then(async (pool: any) => {
                return await pool
                    .request()
                    .input("action", "ADMINCTION")
                    .input("business", cardcode)
                    .input("arg1", "")
                    .execute("Users");
            })
            .then((result: any) => {
            
                return  result;
            })
            .catch((err: any) => {
                logger.error("Algo salio mal en la consulta",err);
                return  err ;
            });
            status = 200;
            data = result;
        } catch (e) {
            logger.error("Algo vamal con el mail",e);
        } finally {
            await db.disconnect();
        }

    return data.recordset || [];
    }// end function get banners for front admin.
}

const sendController = new SendController();
export default sendController;