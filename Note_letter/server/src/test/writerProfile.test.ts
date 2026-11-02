import test from 'node:test';
import assert from 'node:assert/strict';

// These controller checks do not open a live database connection.
process.env.DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/unused';

const User = require('../models/User').default as typeof import('../models/User').default;
const Follow = require('../models/Follow').default as typeof import('../models/Follow').default;
const { getUserProfile } = require('../controllers/followController') as typeof import('../controllers/followController');

function fakeResponse() {
    return {
        statusCode: 200,
        body: null as any,
        status(code: number) { this.statusCode = code; return this; },
        json(body: unknown) { this.body = body; return this; },
    };
}

test('a valid writer profile is returned even when public attributes omit isActive', async () => {
    const savedFind = User.findOne;
    const savedCount = Follow.count;
    let queried: any;
    try {
        (User as any).findOne = async (options: any) => {
            queried = options;
            return {
                id: 42, username: 'juliet',
                toJSON: () => ({ id: 42, username: 'juliet', avatar: null }),
                // isActive is not a selected field, just like real Sequelize results.
            };
        };
        (Follow as any).count = async ({ where }: any) => where.followingId === 42 ? 3 : 5;
        const res = fakeResponse();
        await getUserProfile({ params: { username: 'juliet' } } as any, res as any);
        assert.equal(queried.where.isActive, true, 'database query must still filter inactive accounts');
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.username, 'juliet');
        assert.equal(res.body.followerCount, 3);
        assert.equal(res.body.followingCount, 5);
        assert.equal(res.body.isFollowing, false);
        assert.equal(res.body.isActive, undefined, 'do not expose private active-state metadata');
    } finally {
        (User as any).findOne = savedFind;
        (Follow as any).count = savedCount;
    }
});

test('unknown and inactive writers are still not found', async () => {
    const savedFind = User.findOne;
    try {
        (User as any).findOne = async () => null;
        const res = fakeResponse();
        await getUserProfile({ params: { username: 'missing-writer' } } as any, res as any);
        assert.equal(res.statusCode, 404);
    } finally {
        (User as any).findOne = savedFind;
    }
});
