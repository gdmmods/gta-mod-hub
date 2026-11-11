import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGta5ModsRating } from '../lib/ratings/gta5mods-rating.mjs';

assert.deepEqual(parseGta5ModsRating(readFileSync(new URL('../gta5mods-sample.html', import.meta.url), 'utf8')), {
  status: 'success', value: 4.86, count: 11,
});
assert.deepEqual(parseGta5ModsRating('<html>No rating here</html>'), { status: 'unavailable' });
assert.deepEqual(parseGta5ModsRating('<script type="application/ld+json">{</script>'), { status: 'invalid' });
console.log('GTA5-Mods structured rating checks passed.');
