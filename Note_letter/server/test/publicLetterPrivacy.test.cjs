const test = require('node:test');
const assert = require('node:assert/strict');
const { publicLetterDTO } = require('../dist/services/publicLetterDTO');

const sample = {
  id: 11, title: 'Example', content: 'Text', isPublic: true,
  status: 'published', shareToken: 'a'.repeat(48),
  userId: 9, recipientAddress: 'PRIVATE POSTAL ADDRESS',
  address: 'PRIVATE LOCATION', latitude: 13.8, longitude: 122.3,
  user: { id: 9, username: 'SecretAuthor', avatar: '/private.jpg', email: 'secret@example.com' },
  password_hash: 'never-expose', someFutureSensitiveField: 'private',
};

test('public letter DTO never leaks owner, recipient address or future fields', () => {
  const data = publicLetterDTO(sample);
  for (const key of ['userId', 'recipientAddress', 'address', 'latitude', 'longitude', 'user', 'password_hash', 'someFutureSensitiveField']) {
    assert.equal(Object.hasOwn(data, key), false, key);
  }
  assert.equal(data.authorId, 9);
  assert.equal(data.title, 'Example');
});

test('anonymous public letters keep author identity private through reposts', () => {
  const data = publicLetterDTO({ ...sample, isAnonymous: true });
  assert.equal(data.authorId, null);
  assert.equal(data.authorAvatar, null);
  assert.equal(data.authorName, 'Anonymous Writer');
  assert.equal(JSON.stringify(data).includes('SecretAuthor'), false);
});
