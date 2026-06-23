import assert from "node:assert/strict";
import test from "node:test";

import { createReceiptCommitment } from "./receiptCommitment.js";

test("creates a deterministic public commitment for a reviewed RWA source anchor", async () => {
  const receipt = await createReceiptCommitment({
    sourceAnchorId: "US-CLAIM-01",
    timestamp: "2026-06-24T00:14:08.000Z",
  });

  assert.deepEqual(receipt, {
    canonical: "LUO_SENTINEL_RECEIPT_V1|PREPARE_TESTNET_RECEIPT|US-CLAIM-01|2026-06-24T00:14:08.000Z",
    commitment: "0x7fe848486923f1bf991a5d8e91250dff1972d191ab27445bf58861cde7a0e9c7",
  });
});

test("rejects an empty source anchor instead of making an unbound receipt", async () => {
  await assert.rejects(
    () => createReceiptCommitment({ sourceAnchorId: "", timestamp: "2026-06-24T00:14:08.000Z" }),
    /source anchor/i,
  );
});
