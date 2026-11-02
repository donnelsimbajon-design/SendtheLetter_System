import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStoryPages } from '../services/storyPageValidation';

const photo = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(20)]).toString('base64');

test('preserves safe image placement and width in saved JSONB pages', () => {
    const result = parseStoryPages([{
        text: 'A little note',
        imageData: photo,
        caption: 'A memory',
        imageX: 35, imageY: 64, imageWidth: 55, imagePlacement: 'before',
    }]);
    assert.equal(result.error, undefined);
    assert.deepEqual(result.pages?.[0], {
        text: 'A little note', imageData: photo, caption: 'A memory',
        imageX: 35, imageY: 64, imageWidth: 55, imagePlacement: 'before',
    });
});

test('accepts legacy images without any layout metadata', () => {
    const result = parseStoryPages([{ text: 'Legacy letter', imageData: photo }]);
    assert.equal(result.error, undefined);
    assert.deepEqual(result.pages?.[0], { text: 'Legacy letter', imageData: photo });
});

test('rejects unsafe positioning values', () => {
    for (const invalid of [
        { imageX: Infinity }, { imageX: -2 }, { imageY: '10' },
        { imageY: 101 }, { imageWidth: 12 }, { imageWidth: 95 },
        { imagePlacement: 'position:absolute;top:0' },
    ]) {
        const result = parseStoryPages([{ text: 'Hello', imageData: photo, ...invalid }]);
        assert.ok(result.error, JSON.stringify(invalid));
    }
});
