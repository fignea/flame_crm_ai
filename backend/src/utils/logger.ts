import winston from 'winston';

// Configuración del logger
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Crear logger
export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: logFormat,
  transports: [
    // Log a consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Log a archivo
    new winston.transports.File({
      filename: process.env['LOG_FILE'] || './logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Log de errores
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Logger para desarrollo
if (process.env['NODE_ENV'] !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
} 