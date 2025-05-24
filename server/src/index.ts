export function foo() {}

export class Bar {}

import express, { Request, Response } from 'express';
const app = express()
const port = 3000

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

app.get('/fibonacci/:n', (req: Request, res: Response) => {
    const n = parseInt(req.params.n, 10);
    if (isNaN(n) || n < 0) {
        res.status(400).json({ error: 'Invalid input' });
        return
    }

    function fibonacci(num: number): number {
        if (num <= 1) return num;
        return fibonacci(num - 1) + fibonacci(num - 2);
    }
    const result = fibonacci(n);
    res.json({ n, fibonacci: result });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
