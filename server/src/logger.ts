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
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(myFormat(), winston.format.label({label: name}), winston.format.json()),
        transports: [new winston.transports.Console()],
    });
}