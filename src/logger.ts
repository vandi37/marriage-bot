import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import {Context} from "grammy";

const LOG_PATH = process.env.LOG_PATH || path.join(__dirname, 'logs');
const LOG_RETENTION_DAYS = '365d';
const LOG_MAX_SIZE = '100m';

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(
        ({ timestamp, level, message, ...meta }) =>
            `[${timestamp}] ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`
    )
);

const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

const transports = [
    new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'debug',
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
    }),
    new DailyRotateFile({
        level: 'debug',
        dirname: path.join(LOG_PATH, 'debug'),
        filename: 'debug-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: LOG_MAX_SIZE,
        maxFiles: LOG_RETENTION_DAYS,
        format: fileFormat,
    }),

    new DailyRotateFile({
        level: 'error',
        dirname: path.join(LOG_PATH, 'error'),
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: LOG_MAX_SIZE,
        maxFiles: LOG_RETENTION_DAYS,
        format: fileFormat,
    }),

    new DailyRotateFile({
        level: 'info',
        dirname: path.join(LOG_PATH, 'info'),
        filename: 'info-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: LOG_MAX_SIZE,
        maxFiles: LOG_RETENTION_DAYS,
        format: fileFormat,
    }),
];

const logger = winston.createLogger({
    level: 'debug',
    format: fileFormat,
    transports,
    exceptionHandlers: [
        new DailyRotateFile({
            dirname: path.join(LOG_PATH, 'exceptions'),
            filename: 'exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: LOG_MAX_SIZE,
            maxFiles: LOG_RETENTION_DAYS,
            format: fileFormat,
        }),
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            dirname: path.join(LOG_PATH, 'rejections'),
            filename: 'rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: LOG_MAX_SIZE,
            maxFiles: LOG_RETENTION_DAYS,
            format: fileFormat,
        }),
    ],
    exitOnError: false,
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Closing logger...');
    logger.close();
});


export default logger;

export function objByCtx(ctx: Context): object {
    return {updateId: ctx.update.update_id, id: ctx.from?.id, }
}