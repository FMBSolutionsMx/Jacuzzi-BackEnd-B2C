import { logger } from "./logger";
import axios from 'axios';
const request = require('request');
const client = require("@sap/hana-client");
const hanaOptions = {
    host: "172.16.0.25",
    port: "30015",
    user: "SYSTEM",
    password: "Q1w2e3r4",
    schema: "_E_HANDEL_B2C", //BASE PRODUCTIVA E_PRODUCTIVO_B2B
    encrypt: "true",
    sslValidateCertificate: "false"
}

export class SchemaService {
  async statements(data: any): Promise<any>{
  try {
    let _conn = client.createConnection();
   
    let options = {
        url: "http://172.16.0.246:4000/api/sqlHana", //4040
        method: "POST",
        json: {sqlHana : data},
        postheaders: {"Content-Type":"application/json"}
    } 
    return new Promise( (resolve, reject) => {
      try {
        _conn.connect({serverNode: hanaOptions.host+ ":" +hanaOptions.port,uid: hanaOptions.user,
        pwd: hanaOptions.password,CURRENTSCHEMA: hanaOptions.schema},(err: any) =>{
                if(err){reject(err)}
                _conn.exec(data,function (err: any, result: any) {
                    if (err){_conn.disconnect();
                      reject(err);
                    }else{_conn.disconnect();
                      resolve(result);}
                  }
                );
            });
      } catch (e) {
        logger.error(e);
      }
    });    
  } catch (e) {
    logger.error(e);
    return null;
  }
  }

  async NewOrderService(_docType: any, _data: any): Promise<any>{    
    let options: any = {
        url: "http://172.16.0.246:4000/api/newDocument", //4040
        method: 'POST',
        json:{docType: _docType, data:_data} ,
        postheaders: {'Content-Type': 'application/json; charset=utf-8' }
    };
    let response: any;
    try {
      return new Promise( (resolve, reject) => {
        try {
          
          request.post(options, (err: any,response: { body: any; },body: any) => {
            if(err){
              reject(err);
              
            } else{
              resolve(response.body);
            }   
          });
        } catch (e) {
          logger.error(e);
        }
      }); 
    } catch (e) {
      logger.error(e);
    }
    return response;
        
  }

  async UpdatePartner(_docType: any, _data: any): Promise<any>{
    let options: any = {
        url: "http://172.16.0.246:4000/api/patchDocument", //4040
        method: 'POST',
        json:{docType: _docType, data:_data} ,
        postheaders: {'Content-Type': 'application/json; charset=utf-8' }
    };
    let response: any;
    try {
      return new Promise( (resolve, reject) => {
        try {
          
          request.post(options, (err: any,response: { body: any; },body: any) => {
            if(err){
              reject(err);
              
            } else{
              resolve(response.body);
            }   
          });
        } catch (e) {
          logger.error(e);
        }
      }); 
    } catch (e) {
      logger.error(e);
    }
    return response;
  }

  async UpdateAutorization(_docType: any, _data: any): Promise<any>{
    let options: any = {
        url: "http://172.16.0.246:4000/api/patchDocument", //4040
        method: 'POST',
        json:{docType: _docType, data:_data} ,
        postheaders: {'Content-Type': 'application/json; charset=utf-8' }
    };
    let response: any;
    try {
      return new Promise( (resolve, reject) => {
        try {
          
          request.post(options, (err: any,response: { body: any; },body: any) => {
            if(err){
              reject(err);
              
            } else{
              resolve(response.body);
            }   
          });
        } catch (e) {
          logger.error(e);
        }
      }); 
    } catch (e) {
      logger.error(e);
    }
    return response;
  }

  async getDocument(_docType: any, _data: any): Promise<any>{
    let options: any = {
        url: "http://172.16.0.246:4000/api/getDocument", //4040
        method: 'POST',
        json:{docType: _docType, data:_data} ,
        postheaders: {'Content-Type': 'application/json; charset=utf-8' }
    };
    let response: any;
    try {
      return new Promise( (resolve, reject) => {
        try {
          
          request.post(options, (err: any,response: { body: any; },body: any) => {
            if(err){
              reject(err);
              
            } else{
              resolve(response.body);
            }   
          });
        } catch (e) {
          logger.error(e);
        }
      }); 
    } catch (e) {
      logger.error(e);
    }
    return response;
  }

}