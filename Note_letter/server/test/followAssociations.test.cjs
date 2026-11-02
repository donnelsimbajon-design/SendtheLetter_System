const test = require('node:test');
const assert = require('node:assert/strict');

// Model metadata can be inspected without opening a production database connection.
process.env.DATABASE_URL ||= 'postgres://test:test@127.0.0.1:5432/sendtheletter_test';

const Follow = require('../dist/models/Follow').default;
const User = require('../dist/models/User').default;

test('Follow has the associations required by followers and following endpoints', () => {
  assert.equal(Follow.associations.follower.target, User);
  assert.equal(Follow.associations.follower.foreignKey, 'followerId');
  assert.equal(Follow.associations.following.target, User);
  assert.equal(Follow.associations.following.foreignKey, 'followingId');
  assert.equal(User.associations.incomingFollows.foreignKey, 'followingId');
  assert.equal(User.associations.outgoingFollows.foreignKey, 'followerId');
});
