/**
 * Configuracion para conectar a base de datos
 */
export default {
    /**
     * Configuracion de usuarios maximos 
     */
    poolConfig :{
        min: 0,
        max: 40,
        log: true
    },
    /**
     * configuracion para conectar a nuestra base de datos
     */
    connectionConfig:{
        userName: 'sa',
        password: 'Solutions@2019',
        // password: 'RedHogar1.',
        server: '192.168.0.171',
        // server: '192.168.1.210'
        connectionTimeout: 2 * 60 * 1000,
        requestTimeout: 2 * 60 * 1000,
    },
    
    database : {
        user: 'sa',
        password: 'Solutions@2019',
        // password: 'RedHogar1.',
        server: '192.168.0.171',
        // server: '192.168.1.210',
        database: 'Handel_B2C_Irco',
        //database: 'Handel-B2B',
        port:1433,
        connectionTimeout: 2 * 60 * 1000,
        requestTimeout: 2 * 60 * 1000,
        pool: {
            max: 100,
            min: 0,
            idleTimeoutMillis:  2 * 60 * 1000,
            evictionRunIntervalMillis:  2 * 60 * 1000,
        },
        options: {
            //encrypt: true,
            encrypt: false,
            enableArithAbort: true
        }
    },
    
}
