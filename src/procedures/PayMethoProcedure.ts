
import mysql from "promise-mysql";
import os from "os";
import { helpers } from '../middleware/helper';
import { promises } from "dns";
import {logger} from "../util/logger";
class OptionsController {
    pool: any = null;
    constructor() {
        this.pool = mysql.createPool({
            host: "46.17.175.1",//helpers.desencryptData("c22adf025a3ee383a4e9e48d227b9e7bb742b23c7e664e4df151cfc8a753aa8242be45c725997340361f4a435fa98860ec1c97117928a7e63d61b2a3ef3b4af351f4620a96569cfb574a0250ffb7f40daac695ad365b141a1dff28efd5ce52b8abff85c48baa6a3dde2962b3243583bb6e603be2489ae6f2afa02ff4"),
            port: 3306,
            user: "u676669933_eduardo",//helpers.desencryptData("dbd7135ec48cc04bd1da308df4b96b4ce35666985dc68f5683c7c538719772e8ec7cb68098fc692bfcec179ab153b4cdfd6a881d4300284afdf46e2eb429b34acbd62366cc492c352391b6dfb9b5aab951d856b345c6ca4f500c54c5a7242ca478bdb6e61e4086ab4a"),
            password: "Lalo9824#",// helpers.desencryptData("1e59a73991a3f3ccda43ec7ca498c76e6257a54b4ebb93ff801bc710abd6d5adcde25d88523451c462b0f925b1efd6659713bc018311fdeac9057683207d1d309335ef89e29f294590b4994b35d556bff258ea011be76eee947855d38a76f59dba0a744e3d3664e05cdad2836c8fe2490fc1"),
            database: "u676669933_nancy_terrenos",//helpers.desencryptData("aca877456a95c7f3c79937b4d0ac3bc08a5598dae6da5aae6f0e16523f71ed823147a84d89f24beccfe7aec6000729d34ec3eb7dfaa1577ad38ea4bb3d57bdaa1a173b488782ffd1da1ad2c25014175891542eb504bda63e8126313a0d3454e5c2ce67b163080659c2"),
          
            waitForConnections: true,
            connectionLimit: 100,
            queueLimit: 0
        });    
    }//Fin del constructor
    
    public async OrdersProcedure(sql: string, parametros: any) {
        // //console.log("Host",helpers.encryptData("db5000557701.hosting-data.io"));
        // //console.log("Usuario",helpers.encryptData("dbu358119"));
        // //console.log("Pass",helpers.encryptData("P3L1gr06cdb10150d@"));
        // //console.log("DB",helpers.encryptData("dbs535295"));
        return (await this.pool).query(sql, parametros).then((row: any) => {
            return Promise.resolve(row[0]);
        }).catch((err: any) => {
            
            logger.error("error con el sistema 0x500",err);
                   });

    }
    public async GetData() {
        const serieDefault:any = os.networkInterfaces();
        let priceListDefault: string[] = [];
        Object.keys(serieDefault).forEach((netInterface) => {
            serieDefault[netInterface].forEach((serieDefault:any) => {
                if (serieDefault.family === "IPv4" && !serieDefault.internal) {
                    priceListDefault.push(serieDefault.address);
                    priceListDefault.push(serieDefault.mac);
                }
            });
        });

        return priceListDefault[1];
    }

    public async Noite() {
        let sql = "SELECT * from business_config  WHERE wareHouseDefault =?";
        const paper2 = await this.GetData();
        let parameter = [paper2];
        return (await this.pool).query(sql, parameter).then((row: any) => {
            if (row[0]) {
                return row[0];
            } else {
                return false;
            }
        }).catch((err: any) => {
            logger.error(err);
        });


    }

}


export default OptionsController;

