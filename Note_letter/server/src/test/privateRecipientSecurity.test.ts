import test from 'node:test';
import assert from 'node:assert/strict';
import { hashRecipientToken, isVisibleRecipientLetter } from '../services/privateRecipientSecurity';
import { privateRecipientDTO } from '../services/privateRecipientDTO';

test('recipient token stored as one-way SHA256 digest, not plaintext', () => {
    const token = 'abcd1234'.repeat(6);
    const hash = hashRecipientToken(token);
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.notEqual(hash, token);
    assert.equal(hash, hashRecipientToken(token));
    assert.notEqual(hash, hashRecipientToken(token + 'a'));
});

test('only currently available private published letters are readable with invitation', () => {
    const now = Date.parse('2026-11-04T12:00:00Z');
    const valid = { status: 'published', isPublic: false, isArchived: false, openDate: null, scheduledDate: null };
    assert.equal(isVisibleRecipientLetter(valid, now), true);
    for (const disabled of [
        { ...valid, status: 'draft' },
        { ...valid, status: 'scheduled' },
        { ...valid, status: 'archived' },
        { ...valid, isPublic: true },
        { ...valid, isArchived: true },
        { ...valid, openDate: '2026-12-01T00:00:00Z' },
        { ...valid, scheduledDate: '2026-12-01T00:00:00Z' },
        null,
    ]) assert.equal(isVisibleRecipientLetter(disabled, now), false);
    assert.equal(isVisibleRecipientLetter({ ...valid, scheduledDate: '2026-10-01T00:00:00Z' }, now), true);
});

test('recipient DTO cannot expose private addresses, location, owner IDs or public share tokens', () => {
    const raw = {
        id: 25, title: 'A private gift', content: 'Thinking of you.',
        type: 'Gratitude', status: 'published', isPublic: false, isAnonymous: false,
        letterPages: [{ text: 'Thinking of you.' }],
        shareToken: 'SHOULD_NOT_LEAK', userId: 42, authorId: 42, recipientEmail: 'hidden@example.test',
        recipientAddress: '123 Private Street', address: 'home', latitude: 1, longitude: 2,
        user: { id: 42, username: 'friendly-author', email: 'author@example.test' },
    };
    const dto = privateRecipientDTO(raw);
    assert.equal(dto.authorName, 'friendly-author');
    assert.equal(dto.title, 'A private gift');
    assert.equal(dto.content, 'Thinking of you.');
    assert.equal(dto.isPublic, false);
    for (const sensitive of ['user', 'userId', 'authorId', 'shareToken', 'recipientEmail', 'recipientAddress', 'address', 'latitude', 'longitude']) {
        assert.ok(!Object.prototype.hasOwnProperty.call(dto, sensitive), `Leaked field ${sensitive}`);
    }
    assert.equal(privateRecipientDTO({ ...raw, isAnonymous: true }).authorName, 'Anonymous Writer');
});
