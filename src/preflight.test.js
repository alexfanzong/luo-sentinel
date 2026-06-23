import test from 'node:test';
import assert from 'node:assert/strict';

import { createRwaPreflight } from './preflight.js';

test('preserves Switzerland as an unresolved jurisdictional signal', () => {
  const preflight = createRwaPreflight();

  assert.equal(preflight.disposition, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(preflight.evidence.length, 3);
  assert.deepEqual(
    preflight.evidence.find((item) => item.signal === 'UNRESOLVED'),
    {
      jurisdiction: 'Switzerland',
      sourceId: 'CH-RWA-003',
      signal: 'UNRESOLVED',
      summary: 'No universal eligibility conclusion is produced from this preflight.',
    },
  );
});
