"use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Configuracion para conectar a base de datos
 */
export default {
    /**
     * Configuracion de usuarios maximos
     */
    poolConfig: {
        min: 0,
        max: 40,
        log: true
    },
    /**
     * configuracion para conectar a nuestra base de datos
     */
    connectionConfig: {
		// LOCAL 
        server: '192.168.0.171',
        userName: 'sa',
        password: 'Solutions@2019',
		
		// CLIENTE
        // server: 'WINSQLJACUZZI',
        // userName: 'sa',
        // password: 'Jacuzzi2020*',
		
        connectionTimeout: 2 * 60 * 1000,
        requestTimeout: 2 * 60 * 1000,
    },
    database: {
		// LOCAL
		server: '192.168.0.171',
		database: 'Handel_B2C_Jacuzzi',
        user: 'sa',
        password: 'Solutions@2019',
		
		// CLIENTE
		// server: 'WINSQLJACUZZI',
		// database: 'Handel_B2C_Jacuzzi',
        // user: 'sa',
        // password: 'Jacuzzi2020*',
      
        port: 1433,
        connectionTimeout: 2 * 60 * 1000,
        requestTimeout: 2 * 60 * 1000,
        pool: {
            max: 100,
            min: 0,
            idleTimeoutMillis: 2 * 60 * 1000,
            evictionRunIntervalMillis: 2 * 60 * 1000,
        },
        options: {
            //encrypt: true,
            encrypt: false,
            enableArithAbort: true
        }
    },
};
