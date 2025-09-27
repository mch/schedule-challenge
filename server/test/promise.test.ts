import {describe, expect, assert, it} from "vitest";

describe('promise test', () => {
    it('wait 250 ms', async () => {
        let messages = [];
        messages.push('creating promise');

        const p = new Promise((resolve, reject) => {
            messages.push('calling setTimeout');
            setTimeout(() => {
                messages.push('timeout');
                resolve("hello");
            }, 250);
            messages.push('finish calling setTimeout');
        });
        messages.push('awaiting promise');
        //const result = await p;
        messages.push('done');

        assert.sameDeepOrderedMembers(
            ["creating promise", "calling setTimeout", "finish calling setTimeout", "awaiting promise", "done"],
            messages
        )
    });

    it('should wait 250 ms for timeout', async () => {
        let messages = [];
        messages.push('creating promise');

        const p = new Promise((resolve, reject) => {
            messages.push('calling setTimeout');
            setTimeout(() => {
                messages.push('timeout');
                resolve("hello");
            }, 250);
            messages.push('finish calling setTimeout');
        });
        messages.push('awaiting promise');
        const result = await p;
        messages.push(result);
        messages.push('done');

        assert.sameDeepOrderedMembers(
            ["creating promise", "calling setTimeout", "finish calling setTimeout", "awaiting promise", 'timeout', 'hello', "done"],
            messages
        )
    });

    it('callback 250 ms', () => new Promise<void>((done, fail) => {
        let messages = []
        const callback = (result: string) => {
            messages.push('in callback');
            try {
                expect(result).eql("hello");
            } catch (err) {
                messages.push('in error', err);
                return fail(err);
            }

            messages.push("before done");
            done();
        };

        messages.push('set timeout');
        setTimeout(() => {
            messages.push('timeout');
            callback("hello");
        }, 250);

        messages.push('finish calling setTimeout');
        assert.sameDeepOrderedMembers(["set timeout", 'finish calling setTimeout'], messages)
    }));

    it('should await for the timeout', () => new Promise<void>((done, fail) => {
        let messages = []
        const callback = (result: string) => {
            messages.push('in callback');
            try {
                expect(result).eql("hello");
            } catch (err) {
                messages.push('in error', err);
                return fail(err);
            }

            messages.push("before done");
            try {
                assert.sameDeepOrderedMembers(['set timeout', 'finish calling setTimeout', 'timeout', 'in callback', 'before done'], messages)
                done();
            } catch (err) {
                return fail(err);
            }
        };

        messages.push('set timeout');
        setTimeout(() => {
            messages.push('timeout');
            callback("hello");
        }, 250);

        messages.push('finish calling setTimeout');
        assert.sameDeepOrderedMembers(["set timeout", 'finish calling setTimeout'], messages)
    }));
});