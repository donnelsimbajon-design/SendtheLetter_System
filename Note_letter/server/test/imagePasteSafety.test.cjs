const test = require('node:test');
const assert = require('node:assert/strict');
const { containsEncodedImageText, parseStoryPages } = require('../dist/services/storyPageValidation');

test('normal romantic letter text is valid prose', () => {
  assert.equal(containsEncodedImageText('Dear Juliet, your smile brings me peace.'), false);
  assert.equal(parseStoryPages([{ text: 'Dear Juliet, your smile brings me peace.' }]).error, undefined);
});

test('reject accidental data-image URI inside storybook text', () => {
  const bad = 'Dear Juliet, ' + 'data:image/png;base64,' + 'A'.repeat(512);
  assert.equal(containsEncodedImageText(bad), true);
  assert.match(parseStoryPages([{ text: bad }]).error, /image data/i);
});

test('reject raw encoded image blobs before they generate many pages', () => {
  const bad = 'A'.repeat(500);
  assert.equal(containsEncodedImageText(bad), true);
  assert.match(parseStoryPages([{ text: bad }]).error, /image data/i);
});
