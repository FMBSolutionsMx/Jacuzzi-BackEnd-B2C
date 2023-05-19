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
    console.log("Application Started! on port: ",this.app.get('port'));
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


  async GetSettings() {
    try {
      
      const option = new OptionsController();
      const paper2 = await option.GetData();
      
      let sql = "SELECT * from business_config  WHERE wareHouseDefault=?";
      let parameter = [paper2];
      let _ult_ = await option.OrdersProcedure(sql, parameter);
      
      const db = new DatabaseService();
      const settings = await db.Query("SELECT * FROM soap_config");
      const business = await db.Query("SELECT * FROM business");
      const businessConfig = await db.Query("SELECT * FROM business_config");
      console.log('DARWIN>>config',business);

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
  

   start(): void {
    const server = this.app.listen(this.app.get('port'), () => {
      logger.info("index-start-> "+"Server on port %o",this.app.get('port')); 
        console.log("Server on port",this.app.get('port'))
    })
    server.timeout = 1 * 60 * 1000;
  }
}

try {
  const connect = new Server();
  connect.start();
} catch (e) {
  logger.error(e);
}