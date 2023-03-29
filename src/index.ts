import express, { Application } from "express";
import routes from "./routes/routes";
import morgan from "morgan";
import cors from "cors";
import sha1 from "sha1";
import { logger } from "./util/logger";
import { DatabaseService } from "./util/database";
import OptionsController from "./procedures/PayMethoProcedure";
import { SchemaService } from "./util/Schema";
import path from "path";
let fs = require('fs');
let https = require('https');
/**
 * Class Server
 *  config()
 *  GetSettings()
 *  Start()
 */
class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.GetSettings();
    console.log("Application Started!");
  }

  /**
   * Obtiene configuraciones para iniciar API
   */
  config(): void {
    this.app.set("port", 3054);
    this.app.use(morgan("dev"));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ limit: '50mb', extended: false }));
    this.app.use(express.static(__dirname + 'uploads'));
  }

  /**
   * Indica el las turas que usara
   */
  routes(): void {
    this.app.use('/api/uploads', express.static(__dirname + '/uploads'));
    this.app.use("/api", routes);
  }

  /**
   * GetSettings
   * Obtiene cnfiguraciones desde Base de datos para iniciar la app
   */
  async GetSettings() {
    try {
      // HANA  
      // const sh = new SchemaService ();
      // HANA  
      const option = new OptionsController();
      const paper2 = await option.GetData();
      
      let sql = "SELECT * from business_config  WHERE wareHouseDefault=?";
      let parameter = [paper2];
      let _ult_ = await option.OrdersProcedure(sql, parameter);
      
      /*if (
        _ult_ !== undefined &&
        _ult_.groupCodeDefault ==
          "ed93328c34b3461cd391e5ccece8ba7cf086c07f88d128d3da6b3bb0817186503f065bd7e836105f8c1b0d07b47e03911fc326de8fff720d584a432ec5d79a38f627b1eb5c276ae124f56a4bedc7c4dfa7fb678d76bb6c24ed6d3b7b4569950d0e"
      ) {
      } else {
        //console.log(
          "¡Error con el sistema, por favor contacte a soporte técnico!"
        );
        process.exit(1);
      }*/
    // HANA  
    // const settings = await sh.statements(`SELECT * FROM "_E_HANDEL_B2C"."soap_config"`);
    // const business = await sh.statements(`SELECT * FROM "_E_HANDEL_B2C"."business"`);
    // const businessConfig = await sh.statements(`SELECT * FROM "_E_HANDEL_B2C"."business_config"`);
    // console.log(settings[0],business[0],businessConfig[0]);
    
    // logger.info("sap_config: %o", JSON.stringify(settings[0]));
    // logger.info("business: %o", JSON.stringify(business[0]));
    // logger.info("businessConfig: %o", JSON.stringify(businessConfig[0]));
    // global.sap_config = JSON.stringify(settings);
    // global.business = JSON.stringify(business);
    // global.businessConfig = JSON.stringify(businessConfig);
    // HANA  
      const db = new DatabaseService();
      const settings = await db.Query("SELECT * FROM soap_config");
      const business = await db.Query("SELECT * FROM business");
      const businessConfig = await db.Query("SELECT * FROM business_config");
      logger.info("sap_config: %o", JSON.stringify(settings.recordset));
      logger.info("business: %o", JSON.stringify(business.recordset));
      logger.info("businessConfig: %o", JSON.stringify(businessConfig.recordset));
      global.sap_config = JSON.stringify(settings.recordset);
      global.business = JSON.stringify(business.recordset);
      global.businessConfig = JSON.stringify(businessConfig.recordset);
    } catch (e) {
      logger.error('INDEX => ',e);
    }
  }
  

  /**
   * Metodo para iniciar API aplicando configuracion de puerto para escuchar
   */
   start(): void {
    // const server = this.app.listen(this.app.get("port"), () =>
    //   logger.info("Handel on port %o", this.app.get("port"))
    // );
    // server.timeout = 2 * 60 * 1000;

    const server = this.app.listen(this.app.get('port'), () => {
      logger.info("index-start-> "+"Server on port %o",this.app.get('port')); 
        console.log("Server on port",this.app.get('port'))
        this.GetSettings();
    })
    server.timeout = 1 * 60 * 1000;
    // this.app.listen(this.app.get("port"), () => {this.app.get("port")});
    // const sslServer = https.createServer({
    //     key: fs.readFileSync(path.join(__dirname,'cert', 'key.pem')),
    //     cert: fs.readFileSync(path.join(__dirname,'cert', 'cert.pem')),
    //   },
    //   this.app
    // )
    // sslServer.listen(3000, () => console.log("Servidor seguro iniciado en el puerto 3000"))
  
  }
}

/**
 * Instanciamos la clase server
 * Ejecutamos el metodo Inicar
 */
try {
  const connect = new Server();
  connect.start();
} catch (e) {
  logger.error(e);
}