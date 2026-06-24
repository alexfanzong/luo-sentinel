import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const APP_URL = new URL("../App.jsx", import.meta.url);

function appSource() {
  return readFileSync(fileURLToPath(APP_URL), "utf8");
}

test("shows a source-bounded action plan instead of a lead-market recommendation", () => {
  const source = appSource();

  assert.match(source, /Action plan/);
  assert.match(source, /Start here/);
  assert.match(source, /Take to local counsel/);
  assert.doesNotMatch(source, /Suggested lead market/);
  assert.doesNotMatch(source, /Most actionable/);
});
