import { configurableSampler } from "./instrumentation.js";
import * as api from '@opentelemetry/api';

export function foo() {}

export class Bar {}
import { profile } from './profiler.js';
import express, { Request, Response } from 'express';
const app = express()
const port = 3000

import { TraceAPI } from '@opentelemetry/api';
import {NodeTracerProvider} from "@opentelemetry/sdk-trace-node";
import {inspect} from "node:util";

process.on('unhandledRejection', (reason, promise) => {
    console.log('unhandledRejection', reason, promise);
})

process.on('uncaughtException', (reason, promise) => {
    console.log('unhandledException1', reason, promise);
})

process.on('uncaughtException', (reason, promise) => {
    console.log('unhandledException2', reason, promise);
})

import {createLogger, setContext} from "./logger.js";

const logger = createLogger('index');
logger.info("app start up");

app.use((request, response, next) => {
    const requestId = request.header('requestId');
    setContext({'requestId': requestId}, next);
})

app.get('/', async (req: Request, res: Response) => {
    const fetchNodeDocResult = await fetch('https://nodejs.org/api/documentation.json');
    let data = {};
    if (fetchNodeDocResult.ok) {
        data = await fetchNodeDocResult.json();
        logger.info(data);
    }

    logger.info(`response=${inspect(req, {depth: 3})}`);
    res.send('Hello World!')
})

app.get('/profile', async (req: Request, res: Response) => {
    res.json(await profile(20));
})

app.get('/toggle-tracing', (req: Request, res: Response) => {
    configurableSampler.enabled = !configurableSampler.enabled;
    logger.level = 'error';
    res.json({ tracingEnabled: configurableSampler.enabled });
});

app.use((req, res, next) => {
    const ctx = api.context.active();
    let userIdSymbol = api.createContextKey('userId');
    const newContext = ctx.setValue(userIdSymbol, '123');
    api.context.with(newContext, next);
});

app.use((req, res, next) => {
    api.trace.getActiveSpan()?.setAttribute('userId', '1234');
    next();
});

app.get('/fibonacci/:n', (req: Request, res: Response) => {
    //        logger.info(`starting req`);
    const n = parseInt(req.params.n, 10);
    if (isNaN(n) || n < 0) {
        logger.error(`invalid input, req=${inspect(req, {depth: 3})}`);
        res.status(400).json({ error: 'Invalid input' });
        return
    }

    function fibonacci(num: number): number {
        if (num <= 1) return num;
        return fibonacci(num - 1) + fibonacci(num - 2);
    }
    const result = fibonacci(n);
    //logger.info(`result=${inspect(result, {depth: 3})}`);
    res.json({ n, fibonacci: result });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
