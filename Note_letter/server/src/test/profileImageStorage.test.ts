import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImage, buildProfileUploadHeaders } from '../services/profileImageStorage';

const file = (buffer: Buffer, mimetype: string) => ({ buffer, mimetype } as Express.Multer.File);

test('accepts a PNG signature', () => {
  const bytes = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.alloc(8)]);
  assert.equal(detectImage(file(bytes, 'image/png')).extension, 'png');
});

test('rejects spoofed image content', () => {
  assert.throws(() => detectImage(file(Buffer.from('<script>alert(1)</script>'), 'image/png')));
});

test('rejects mismatched MIME claims', () => {
  const bytes = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.alloc(8)]);
  assert.throws(() => detectImage(file(bytes, 'image/jpeg')));
});

test('new sb_secret key uses apikey and never a JWT bearer header', () => {
  const headers = buildProfileUploadHeaders('sb_secret_test-only', 'image/png');
  assert.equal(headers.apikey, 'sb_secret_test-only');
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers['Content-Type'], 'image/png');
});

test('legacy service role JWT keeps bearer header for compatibility', () => {
  const headers = buildProfileUploadHeaders('eyJ-test-legacy-jwt', 'image/jpeg');
  assert.equal(headers.apikey, 'eyJ-test-legacy-jwt');
  assert.equal(headers.Authorization, 'Bearer eyJ-test-legacy-jwt');
});

test('rejects public publishable key for privileged profile upload', () => {
  assert.throws(() => buildProfileUploadHeaders('sb_publishable_not-secret', 'image/png'));
});
