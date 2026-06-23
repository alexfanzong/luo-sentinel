import test from 'node:test';
import assert from 'node:assert/strict';

import { getAppMarkup, reduceAppState } from './app.js';

test('holding for counsel never creates a receipt draft', () => {
  const result = reduceAppState({ receiptState: 'IDLE', receipt: null }, 'HOLD_FOR_COUNSEL');

  assert.deepEqual(result, { receiptState: 'HELD', receipt: null });
});

test('approval creates a clearly unrecorded testnet receipt draft', () => {
  const result = reduceAppState(
    { receiptState: 'IDLE', receipt: null },
    {
      type: 'APPROVE_TESTNET_RECEIPT',
      receipt: { canonical: 'APPROVE_TESTNET_RECEIPT|0.1|example|2026-06-23T12:00:00.000Z' },
    },
  );

  assert.equal(result.receiptState, 'DRAFT_READY');
  assert.equal(result.receipt.canonical.includes('example'), true);
  assert.equal(result.transactionHash, null);
});

test('renders the Injective testnet boundary in the demo shell', () => {
  const markup = getAppMarkup({ receiptState: 'IDLE', receipt: null });

  assert.equal(markup.includes('LUO Sentinel'), true);
  assert.equal(markup.includes('Injective Testnet'), true);
  assert.equal(markup.includes('Hold for counsel'), true);
});
