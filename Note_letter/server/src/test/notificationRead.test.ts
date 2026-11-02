import test from 'node:test';
import assert from 'node:assert/strict';

// Controller unit tests run without a live database; model initialization
// needs a syntactically valid URL, but no connection is opened.
process.env.DATABASE_URL ||= 'postgresql://app:local-only@127.0.0.1:5432/unused';

const Notification = require('../models/Notification').default as typeof import('../models/Notification').default;
const { markOneAsRead } = require('../controllers/notificationController') as typeof import('../controllers/notificationController');

function fakeResponse() {
  return {
    statusCode: 200, body: null as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
}

test('markOneAsRead updates only the authenticated recipient notification', async () => {
  const original = Notification.update;
  let where: any;
  try {
    (Notification as any).update = async (_data: unknown, options: any) => { where = options.where; return [1]; };
    const response = fakeResponse();
    await markOneAsRead({ params: { id: '88' }, user: { id: 42 } } as any, response as any);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(where, { id: 88, userId: 42 });
  } finally {
    (Notification as any).update = original;
  }
});

test('markOneAsRead rejects malformed IDs without touching storage', async () => {
  const response = fakeResponse();
  await markOneAsRead({ params: { id: '88anything' }, user: { id: 42 } } as any, response as any);
  assert.equal(response.statusCode, 400);
});
