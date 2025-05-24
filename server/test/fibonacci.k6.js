import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 10, // number of virtual users
    duration: '10s', // test duration
};

export default function () {
    const n = Math.floor(Math.random() * 5) + 1; // random n between 1 and 20
    const res = http.get(`http://localhost:3000/fibonacci/${n}`);
    check(res, {
        'status is 200': (r) => r.status === 200,
        'body has fibonacci': (r) => JSON.parse(r.body).hasOwnProperty('fibonacci'),
    });
    sleep(1);
}

