import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFutureRelease } from '../services/releaseSchedule';
const now = Date.parse('2026-11-02T05:00:00.000Z');

test('future UTC release accepted', () => assert.equal(validateFutureRelease('2026-11-02T06:00:00.000Z', now), null));
test('past release date rejected', () => assert.match(validateFutureRelease('2026-11-02T04:00:00.000Z', now) || '', /future/i));
test('equal time rejected', () => assert.match(validateFutureRelease(new Date(now), now) || '', /future/i));
test('nonsense rejected', () => assert.match(validateFutureRelease('not-a-date', now) || '', /invalid/i));
