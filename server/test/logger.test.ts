import { describe, it, expect } from 'vitest'
import {createLogger, setContext} from "../src/logger";
const { AsyncLocalStorage } = require('node:async_hooks');

describe('logger test', () => {
    it('create logger test', async () => {
        const logger = createLogger('LoggerTest');
        setContext({requestId: '1', userId: '2'}, async () => {
            const actualLog = logger.info('info log', {bar: 1});
            const childLog = logger.child({pid: process.pid});
            childLog.info('info child logg 1')
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.info('parent logger info')
            await new Promise(resolve => setTimeout(resolve, 500));
            childLog.info('info child logg 2')
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                const response = doSomething();
            } catch (err) {

            }

        });


        logger.info('info parent log 1.1');

        // setContext({requestId: '3', userId: '4'}, async () => {
        //     const actualLog = logger.info('info log', {bar: 1});
        //     const childLog = logger.child({pid: process.pid});
        //     childLog.info('info child logg 1')
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     logger.info('parent logger info')
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     childLog.info('info child logg 2')
        //     await new Promise(resolve => setTimeout(resolve, 500));
        // });

        await new Promise(resolve => setTimeout(resolve, 3000));
        //logger.error('error log', ...meta)
    })

    it('create logger test 2', () => {
        const logger = createLogger('LoggerTest');
        logger.info('info parent log 1.2');
        //const logger = createLogger('LoggerTest');
        //const actualLog = logger.info('info log');
        //logger.error('error log', ...meta)
        foo('', 1, 2, 3)
    })

    function foo(message: string, ...meta: any[]) {
        console.info(meta);
    }

    function doSomething() {
        createLogger("doSomething").info('doSomething');
    }
})
