// Read-only production checks: no credentials, test accounts, uploads, or writes.
// Node 20+ provides fetch, assert and AbortSignal.timeout without dependencies.
import assert from 'node:assert/strict';

const API = process.env.PRODUCTION_API_URL || 'https://sendtheletter-api-s2i7.onrender.com';
const WEB = process.env.PRODUCTION_WEB_URL || 'https://sendtheletter-web-phzx.onrender.com';
const timeoutMs = 60_000;

async function request(base, path, expected = [200]) {
    let lastError;
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const response = await fetch(new URL(path, base), {
                method: 'GET',
                redirect: 'follow',
                headers: { Accept: path.startsWith('/api/') ? 'application/json' : 'text/html' },
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (response.status >= 500 && attempt < 5) {
                lastError = new Error(`${path} returned HTTP ${response.status}`);
            } else {
                assert.ok(expected.includes(response.status),
                    `${path}: expected ${expected.join(' or ')}, received ${response.status}`);
                return response;
            }
        } catch (error) {
            lastError = error;
            if (attempt === 5) throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 8_000));
    }
    throw lastError;
}

async function json(base, path, status = [200]) {
    const response = await request(base, path, status);
    assert.match(response.headers.get('content-type') || '', /application\/json/i,
        `${path}: expected JSON response`);
    return response.json();
}

function released(note) {
    for (const field of ['scheduledDate', 'openDate']) {
        if (note[field] == null) continue;
        const at = Date.parse(note[field]);
        assert.ok(Number.isFinite(at), `Public letter has an invalid ${field}`);
        assert.ok(at <= Date.now() + 60_000, `Unreleased ${field} was exposed to Community`);
    }
}

function safeLetter(note) {
    assert.ok(note && typeof note === 'object');
    assert.equal(note.isPublic, true, 'Community included a private letter');
    assert.equal(note.status, 'published', 'Community included an unpublished letter');
    assert.notEqual(note.isArchived, true, 'Community included an archived letter');
    for (const key of ['recipientAddress', 'address', 'latitude', 'longitude', 'userId', 'password', 'email', 'user']) {
        assert.ok(!(key in note), `A private field (${key}) was exposed`);
    }
    if (note.isAnonymous) {
        assert.equal(note.authorId ?? null, null);
        assert.equal(note.authorAvatar ?? null, null);
        assert.match(note.authorName, /Anonymous/i);
    }
    released(note);
}

const health = await json(API, '/api/health');
assert.equal(health.status, 'ok');
console.log('PASS: API health');

for (const route of ['/api/letters/mine', '/api/letters/drafts', '/api/letters/scheduled', '/api/letters/archived']) {
    await json(API, route, [401]);
    console.log(`PASS: private library endpoint requires authentication (${route})`);
}

const feed = await json(API, '/api/letters/public');
assert.ok(Array.isArray(feed), 'Public feed did not return a list');
feed.forEach(safeLetter);
console.log(`PASS: ${feed.length} public letters passed privacy and release checks`);

const writer = feed.find(item => !item.isAnonymous && typeof item.authorName === 'string' &&
    item.authorName.trim() && !['A Writer', 'Unknown'].includes(item.authorName));

if (writer) {
    const username = encodeURIComponent(writer.authorName);
    const profile = await json(API, `/api/users/profile/${username}`);
    assert.equal(String(profile.username).toLowerCase(), writer.authorName.toLowerCase());
    for (const key of ['email', 'password', 'passwordHash', 'tokenVersion', 'isActive']) {
        assert.ok(!(key in profile), `Writer profile revealed private field ${key}`);
    }
    const letters = await json(API, `/api/letters/user/${username}`);
    assert.ok(Array.isArray(letters), 'Writer letter collection did not return a list');
    letters.forEach(item => {
        safeLetter(item);
        assert.equal(item.isAnonymous, false, 'Anonymous letter appeared on writer profile');
    });
    console.log('PASS: public writer profile and published-letter collection');
} else {
    console.log('SKIP: no named public writer in this feed to check (no private accounts accessed)');
}

for (const route of ['/', '/dashboard/community', '/dashboard/notes']) {
    const response = await request(WEB, route);
    const html = await response.text();
    assert.match(html, /<html[\s>]/i, `${route}: frontend did not serve HTML`);
    console.log(`PASS: frontend route responds (${route})`);
}
console.log('Completed read-only production checks; no accounts or letters modified.');
