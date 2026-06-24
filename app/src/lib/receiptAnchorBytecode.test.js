import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createDeploymentTransactionPreview } from "./receiptAnchorClient.js";

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
