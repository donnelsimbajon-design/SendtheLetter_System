import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabaseReadiness } from '../services/databaseReadiness';

test('reports success and reuses healthy state until the cache expires', async () => {
    let time = 100;
    let calls = 0;
    const ready = createDatabaseReadiness(async () => { calls += 1; }, {
        cacheMs: 5000,
        clock: () => time,
    });
    assert.equal(await ready(), true);
    assert.equal(await ready(), true);
    assert.equal(calls, 1, 'cache should avoid redundant DB probes');

    time += 5001;
    assert.equal(await ready(), true);
    assert.equal(calls, 2, 'expired cache must recheck DB');
});

test('returns unavailable without surfacing database error details', async () => {
    const ready = createDatabaseReadiness(async () => {
        throw new Error('private database credentials must not appear in responses');
    });
    assert.equal(await ready(), false);
});

test('caps a hung DB probe without blocking HTTP readiness indefinitely', async () => {
    const ready = createDatabaseReadiness(() => new Promise<void>(() => {
        // Simulate an authentication call that never returns.
    }), { timeoutMs: 10, cacheMs: 100 });
    assert.equal(await ready(), false);
    assert.equal(await ready(), false, 'unavailable status is cached briefly');
});

test('coalesces simultaneous callers onto a single database check', async () => {
    let checks = 0;
    const signal: { release?: () => void } = {};
    const ready = createDatabaseReadiness(() => {
        checks += 1;
        return new Promise<void>((resolve) => { signal.release = resolve; });
    });
    const first = ready();
    const second = ready();
    assert.equal(first, second, 'concurrent requests must share one in-flight promise');
    await Promise.resolve();
    assert.equal(checks, 1);
    assert.ok(signal.release);
    signal.release();
    assert.deepEqual(await Promise.all([first, second]), [true, true]);
});

test('rejects nonsensical readiness settings', () => {
    assert.throws(() => createDatabaseReadiness(async () => {}, { timeoutMs: 0 }), RangeError);
    assert.throws(() => createDatabaseReadiness(async () => {}, { cacheMs: -1 }), RangeError);
});
