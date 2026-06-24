import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const STYLES_URL = new URL("../styles.css", import.meta.url);

test("keeps the desktop atlas inside the viewport instead of letting the page scroll it away", () => {
  const styles = readFileSync(fileURLToPath(STYLES_URL), "utf8");

  assert.match(styles, /@media \(min-width: 961px\) \{\s*\.app-shell \{ height: 100vh; overflow: hidden; \}/);
  assert.match(styles, /\.atlas-layout \{ min-height: 0; overflow: hidden; \}/);
  assert.match(styles, /\.atlas-stage \{ height: 100%; min-height: 0; \}/);
});
