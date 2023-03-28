import { ConnectionPool } from "mssql";
import config from "./config";
import { logger } from "./logger";

/**
 * Ctor
 * connect()
 * disconnect()
 * Query()
 */
export class DatabaseService {
  connection!: ConnectionPool;
  /**
   * Obtiene la configuracion para conectar a base de datos
   */
  constructor() {
    this.connection = new ConnectionPool(config.database);
  }
   /**
    * Crea una conexion a base de datos
    */
  async connect(): Promise<ConnectionPool> {
    try {
      if (!this.connection.connected && !this.connection.connecting) {
        await this.connection.connect();
      }
    } catch (e) {
      logger.error(e);
    }
    return this.connection;
  }
    /**
     * Cierra conexion a base de datos
     */
  async disconnect(): Promise<boolean> {
    try {
      await this.connection.close();
      return true;
    } catch (e) {
        logger.error(e);
      return false;
    }
  }
    /**
     * 
     * Realiza consultas con sentencias sencillas
     */
  async Query(query: any): Promise<any> { 
    let data: any;

    try {
      const result = await this
      .connect()
      .then(async (pool: any) => {
        return await pool
        .query(query);
    
      })
      .then((result: any) => {
        return  result;
      })
      .catch((err: any) => {
        logger.error(err);
        return  err ;
      });
     
      data = result;
    } catch (e) {
      logger.error(e);
    } finally {
      await this.disconnect();
    }
    return  data ;
  }
}