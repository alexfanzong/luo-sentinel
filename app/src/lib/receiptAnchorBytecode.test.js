import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { keccak256 } from "ethers";

import {
  createDeploymentTransactionPreview,
  EXPECTED_RECEIPT_ANCHOR_RUNTIME_HASH,
  verifyDeployedRuntimeBytecode,
} from "./receiptAnchorClient.js";

const artifactUrl = new URL(
  "../../../out/LUOReceiptAnchor.sol/LUOReceiptAnchor.json",
  import.meta.url,
);

function normalizeBytecode(value) {
  return value.toLowerCase().replace(/^0x/, "");
}

test("committed deployment bytecode matches the freshly compiled receipt-anchor artifact", () => {
  const artifact = JSON.parse(readFileSync(fileURLToPath(artifactUrl), "utf8"));
  const compiled = normalizeBytecode(artifact.bytecode?.object ?? "");
  assert.ok(compiled.length > 0, "Foundry artifact is missing bytecode.object — run forge build first.");

  const committed = normalizeBytecode(createDeploymentTransactionPreview().data);
  assert.equal(
    committed.length,
    compiled.length,
    `Bytecode length drift: committed ${committed.length / 2} bytes, compiled ${compiled.length / 2} bytes.`,
  );
  assert.equal(
    committed,
    compiled,
    "The committed receipt-anchor bytecode is not a clean compile of LUOReceiptAnchor.sol.",
  );
});

test("committed expected runtime hash matches the freshly compiled receipt-anchor artifact", () => {
  const artifact = JSON.parse(readFileSync(fileURLToPath(artifactUrl), "utf8"));
  const runtimeBytecode = artifact.deployedBytecode?.object ?? "";
  assert.notEqual(runtimeBytecode, "0x", "Foundry artifact is missing deployedBytecode.object — run forge build first.");
  assert.equal(
    EXPECTED_RECEIPT_ANCHOR_RUNTIME_HASH,
    keccak256(runtimeBytecode),
    "The committed runtime hash is not a clean compile of LUOReceiptAnchor.sol.",
  );
});

test("deployed receipt anchor runtime must match the reviewed artifact", async () => {
  const artifact = JSON.parse(readFileSync(fileURLToPath(artifactUrl), "utf8"));
  const runtimeBytecode = artifact.deployedBytecode?.object ?? "";
  const contractAddress = "0x1234567890123456789012345678901234567890";

  const verification = await verifyDeployedRuntimeBytecode({
    provider: { getCode: async () => runtimeBytecode },
    contractAddress,
  });

  assert.deepEqual(verification, {
    contractAddress: "0x1234567890123456789012345678901234567890",
    runtimeHash: keccak256(runtimeBytecode),
    expectedRuntimeHash: EXPECTED_RECEIPT_ANCHOR_RUNTIME_HASH,
  });
});

test("deployment verification rejects a mismatched runtime", async () => {
  await assert.rejects(
    verifyDeployedRuntimeBytecode({
      provider: { getCode: async () => "0x6000" },
      contractAddress: "0x1234567890123456789012345678901234567890",
    }),
    /does not match the reviewed receipt-anchor runtime/i,
  );
});
