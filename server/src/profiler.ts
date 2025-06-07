import {Session} from 'node:inspector/promises'
export async function profile(durationInSecond: number) {
    const session = new Session();
    session.connect();
    await session.post('Profiler.enable');
    await session.post('Profiler.start');

    await new Promise((resolve) => {
        setTimeout(resolve, durationInSecond*1000);
    });

    const result = await session.post('Profiler.stop');
    return result.profile;
}