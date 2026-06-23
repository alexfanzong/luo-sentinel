import test from 'node:test';
import assert from 'node:assert/strict';

import { createRwaPreflight } from './preflight.js';

test('uses the reviewed Ondo RWA jurisdiction set', () => {
  const preflight = createRwaPreflight();

  assert.equal(preflight.disposition, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(preflight.evidence.length, 4);
  assert.deepEqual(
    preflight.evidence.map((item) => [item.jurisdiction, item.sourceId, item.signal]),
    [
      ['United States', 'US-CLAIM-01', 'RESTRICTED'],
      ['Hong Kong', 'HK-CLAIM-01', 'CONDITIONAL'],
      ['Singapore', 'SG-CLAIM-01', 'CONDITIONAL'],
      ['European Union', 'EU-CLAIM-02', 'UNRESOLVED'],
    ],
  );
});
