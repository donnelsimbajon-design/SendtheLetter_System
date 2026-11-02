const test = require('node:test');
const assert = require('node:assert/strict');
const { validateFutureRelease } = require('../dist/services/releaseSchedule');

test('draft publication may publish immediately when no future release is chosen', () => {
    assert.equal(validateFutureRelease(null, Date.UTC(2026,10,2)), null);
});
test('past scheduled dates do not silently publish drafts immediately', () => {
    assert.match(validateFutureRelease('2020-01-01T00:00:00Z', Date.UTC(2026,10,2)), /future/i);
});
test('valid future time capsule date is allowed', () => {
    assert.equal(validateFutureRelease('2026-11-16T16:00:00+08:00', Date.UTC(2026,10,2)), null);
});
test('invalid dates are rejected rather than treated as instant publishing', () => {
    assert.match(validateFutureRelease('not-a-date', Date.UTC(2026,10,2)), /invalid/i);
});
