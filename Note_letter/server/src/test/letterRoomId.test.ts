import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLetterRoomId } from '../services/letterRoomId';

test('accepts real positive numeric letter IDs for join and leave events', () => {
    assert.equal(parseLetterRoomId('1'), 1);
    assert.equal(parseLetterRoomId('123456'), 123456);
    assert.equal(parseLetterRoomId(17), 17);
    assert.equal(parseLetterRoomId(String(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);
});

test('rejects malformed or unsupported realtime room IDs', () => {
    for (const invalid of [
        undefined, null, {}, [], true, false, 0, -1,
        '0', '-5', '1.5', 1.5, '1.0', '1e4', ' 5', '5 ',
        '\\d+', 'abc', '', '0002', Number.MAX_SAFE_INTEGER + 1,
        String(Number.MAX_SAFE_INTEGER + 1),
    ]) assert.equal(parseLetterRoomId(invalid), null, `Accepted ${String(invalid)}`);
});
