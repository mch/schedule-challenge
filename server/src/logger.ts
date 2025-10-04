import winston, {format} from 'winston';
import {AsyncLocalStorage} from "node:async_hooks";

const asyncLocalStorage = new AsyncLocalStorage();

const myFormat = format((info, option) => {
    info.store = asyncLocalStorage.getStore()
    return info;
})

export function setContext(context: any, callback: any) {
    asyncLocalStorage.run(context, callback);
}

export function createLogger(name: string) {
    let format = winston.format.combine(myFormat(), winston.format.label({label: name}), winston.format.json());
    if (process.env.NODE_ENV === 'development') {
        format = winston.format.combine(myFormat(), winston.format.label({label: name}), winston.format.simple());
    }

    return winston.createLogger({
        level: 'info',
        format: format,
        transports: [new winston.transports.Console()],
    });
}