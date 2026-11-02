import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImage } from '../services/profileImageStorage';

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
