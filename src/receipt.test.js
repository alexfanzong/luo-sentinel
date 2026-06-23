import test from 'node:test';
import assert from 'node:assert/strict';

import { createReceiptDraft } from './receipt.js';

test('creates a public receipt draft without embedding evidence text', () => {
  const receipt = createReceiptDraft({
    decision: 'APPROVE_TESTNET_RECEIPT',
    requestLabel: 'Tokenized treasury distribution',
    preflightVersion: '0.1',
    timestamp: '2026-06-23T12:00:00.000Z',
  });

  assert.equal(
    receipt.canonical,
    'APPROVE_TESTNET_RECEIPT|0.1|Tokenized treasury distribution|2026-06-23T12:00:00.000Z',
  );
  assert.equal(receipt.canonical.includes('US-RWA-001'), false);
});
