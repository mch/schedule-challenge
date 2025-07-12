import { configurableSampler } from "./instrumentation.js";

export function foo() {}

export class Bar {}
import { profile } from './profiler.js';
import express, { Request, Response } from 'express';
const app = express()
const port = 3000
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
});
import { TraceAPI } from '@opentelemetry/api';
import {NodeTracerProvider} from "@opentelemetry/sdk-trace-node";
import {inspect} from "node:util";

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

app.get('/fibonacci/:n', (req: Request, res: Response) => {
    logger.info(`req=${inspect(req, {depth: 3})}`);
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
    logger.info(`result=${inspect(result, {depth: 3})}`);
    res.json({ n, fibonacci: result });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
