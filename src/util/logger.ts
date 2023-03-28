import { createLogger, format, transports } from "winston";
/**
 * Crear un archivo para guardar logs
 * Formato Fecha, etiqueta, mensaje
 * Maximo 5 archivos con un peso de 5Mb 
 */
export const logger= createLogger({
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.prettyPrint(),
    format.splat(),
    format.simple(),
    format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new transports.File({
      maxsize: 5120000,
      maxFiles: 5,
      filename: `${__dirname}/../logs/log-api.log`,
    }),
  ],
});
