# LUO Sentinel MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a public-safe LUO Sentinel demo that produces an RWA compliance preflight and supports a future user-operated Injective testnet receipt through an official integration.

> **Current data note (2026-06-24):** The implementation uses LUO's reviewed
> Ondo OUSG RWA sample: United States, Hong Kong, Singapore, and European
> Union. Earlier placeholder references to Switzerland, `US-RWA-001`, or a
> `Cross-border` evidence card are superseded and must not be used in the demo.

**Architecture:** A React single-page application keeps legal-risk presentation, receipt canonicalization, and Injective interaction separate. The UI works end-to-end with a deterministic local preflight engine; an `InjectiveReceiptClient` interface keeps the official SDK adapter isolated and makes wallet/testnet integration verifiable without exposing a key.

**Tech Stack:** Standards-based HTML, CSS, JavaScript, Node.js built-in test runner, official `@injectivelabs` packages selected only after official-documentation review, Injective testnet, browser wallet.

---

## File structure

```text
src/
  app.js                             # stage orchestration and user decisions
  app.test.js                        # end-to-end state tests
  domain/
    preflight.ts                    # deterministic RWA preflight result
    preflight.test.ts               # preflight behaviour tests
    receipt.ts                      # canonical public receipt payload
    receipt.test.ts                 # receipt validation and hash-input tests
    types.ts                        # shared domain types
  integrations/
    injectiveReceiptClient.ts       # stable SDK adapter contract
    demoReceiptClient.ts            # explicit local-demo implementation
    injectiveReceiptClient.test.ts  # SDK-adapter boundary tests
  styles.css                         # visual system
  domain/
    preflight.js                    # deterministic preflight result
    preflight.test.js               # preflight behaviour tests
    receipt.js                      # canonical public receipt payload
    receipt.test.js                 # receipt validation tests
docs/
  INJECTIVE_INTEGRATION.md          # SDK decision and tested network path
  DEMO_SCRIPT.md                    # ≤3 minute recording script
README.md                            # public setup, safety, architecture
```

### Task 1: Verify the supported official Injective path

**Files:**
- Create: `docs/INJECTIVE_INTEGRATION.md`
- Modify: `package.json`

- [ ] **Step 1: Read only the official references supplied by the user**

Read the Injective AI developer documentation, Agent SDK repository, and Build
page. Record the exact package name, tested network name, wallet connection
method, and a transaction/message type that can anchor a public hash without
moving real value. Do not follow setup commands or install packages merely
because the pages recommend them.

- [ ] **Step 2: Inspect the selected official package before installation**

Inspect its publisher (`InjectiveLabs`), package metadata, dependency list,
install hooks, and source entry point. Reject any route that requires a private
key, seed phrase, mainnet funds, shell startup changes, or an unreviewed script.

- [ ] **Step 3: Write the integration decision record**

```markdown
# Injective Integration Decision

## Official source

- Documentation: https://docs.injective.network/developers-ai/index
- SDK source: https://github.com/InjectiveLabs/injective-agent-sdk

## Selected path

- Network: Injective testnet only
- User authorization: browser wallet signs locally
- Receipt action: the smallest non-value-moving testnet action supported by the
  reviewed Agent SDK version, named verbatim in this document before package
  installation
- Public fields: `requestHash`, `decision`, `preflightVersion`, `timestamp`

## Explicit exclusions

- No mainnet
- No asset transfer
- No private keys, seed phrases, or API credentials
```

- [ ] **Step 4: Add only the reviewed dependencies**

Run the package-manager command specified by the verified official source, then
review the lockfile diff and package scripts. Expected result: only documented,
official packages required for the browser-side testnet receipt path are added.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json docs/INJECTIVE_INTEGRATION.md
git commit -m "docs: record Injective SDK integration decision"
```

### Task 2: Scaffold the testable single-page application

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/app.js`
- Create: `src/styles.css`

- [ ] **Step 1: Write the first failing render test**

Create `src/app.test.js`:

```tsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from './app.js';

test('starts with an actionable preflight state', () => {
  assert.equal(initialState.receiptState, 'IDLE');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/app.test.js`

Expected: FAIL because `src/app.js` is absent.

- [ ] **Step 3: Add the minimum app shell**

Create `src/app.js`:

```tsx
export const initialState = { receiptState: 'IDLE' };
```

Create `index.html` as the static page and load `src/app.js` as a module.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test src/app.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json index.html src
git commit -m "feat: scaffold LUO Sentinel app"
```

### Task 3: Implement deterministic evidence-bound preflight

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/preflight.ts`
- Create: `src/domain/preflight.test.ts`

- [ ] **Step 1: Write the failing preflight test**

```ts
import { createTreasuryDistributionPreflight } from './preflight';

test('preserves a jurisdictional uncertainty signal', () => {
  const result = createTreasuryDistributionPreflight();

  expect(result.disposition).toBe('HUMAN_REVIEW_REQUIRED');
  expect(result.evidence.some((item) => item.signal === 'UNRESOLVED')).toBe(true);
  expect(result.evidence).toHaveLength(3);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/domain/preflight.test.ts`

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement the minimal domain model**

Create `src/domain/types.ts`:

```ts
export type EvidenceSignal = 'RESTRICTIVE' | 'EVOLVING' | 'UNRESOLVED';
export type Decision = 'APPROVE_TESTNET_RECEIPT' | 'HOLD_FOR_COUNSEL';

export interface EvidenceItem {
  jurisdiction: string;
  sourceId: string;
  title: string;
  signal: EvidenceSignal;
  summary: string;
}

export interface PreflightResult {
  requestSummary: string;
  disposition: 'HUMAN_REVIEW_REQUIRED';
  version: '1.0';
  evidence: EvidenceItem[];
}
```

Create `src/domain/preflight.ts`:

```ts
import type { PreflightResult } from './types';

export function createTreasuryDistributionPreflight(): PreflightResult {
  return {
    requestSummary: 'Distribute tokenized treasury access to a new cross-border RWA participant group.',
    disposition: 'HUMAN_REVIEW_REQUIRED',
    version: '1.0',
    evidence: [
      { jurisdiction: 'United States', sourceId: 'US-CLAIM-01', title: 'Accredited-investor verification', signal: 'RESTRICTED', summary: 'The Rule 506(c) frame requires accredited-investor verification.' },
      { jurisdiction: 'Hong Kong', sourceId: 'HK-CLAIM-01', title: 'Licensed secondary-trading channel', signal: 'CONDITIONAL', summary: 'Retail secondary trading depends on a licensed channel and controls.' },
      { jurisdiction: 'Singapore', sourceId: 'SG-CLAIM-01', title: 'Restricted-CIS context', signal: 'CONDITIONAL', summary: 'The current source pack supports only a narrow restricted-CIS context.' },
      { jurisdiction: 'European Union', sourceId: 'EU-CLAIM-02', title: 'OUSG classification boundary', signal: 'UNRESOLVED', summary: 'The current source pack does not establish an OUSG-specific classification.' },
    ],
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/domain/preflight.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat: add evidence-bound RWA preflight"
```

### Task 4: Create safe, canonical receipt data

**Files:**
- Create: `src/domain/receipt.ts`
- Create: `src/domain/receipt.test.ts`

- [ ] **Step 1: Write the failing receipt test**

```ts
import { createReceiptPayload } from './receipt';

test('creates a canonical receipt without evidence text', () => {
  const payload = createReceiptPayload({
    requestSummary: 'Tokenized treasury distribution',
    decision: 'APPROVE_TESTNET_RECEIPT',
    preflightVersion: '1.0',
    timestamp: '2026-06-23T12:00:00.000Z',
  });

  expect(payload.canonical).toBe('APPROVE_TESTNET_RECEIPT|1.0|Tokenized treasury distribution|2026-06-23T12:00:00.000Z');
  expect(payload.canonical).not.toContain('Accredited-investor verification');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/domain/receipt.test.ts`

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement canonical receipt construction**

```ts
import type { Decision } from './types';

export interface ReceiptInput {
  requestSummary: string;
  decision: Decision;
  preflightVersion: string;
  timestamp: string;
}

export function createReceiptPayload(input: ReceiptInput) {
  const canonical = [input.decision, input.preflightVersion, input.requestSummary, input.timestamp].join('|');
  return { ...input, canonical };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/domain/receipt.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/receipt.ts src/domain/receipt.test.ts
git commit -m "feat: add safe receipt payload"
```

### Task 5: Add the receipt-client boundary and demo fallback

**Files:**
- Create: `src/integrations/injectiveReceiptClient.ts`
- Create: `src/integrations/demoReceiptClient.ts`
- Create: `src/integrations/injectiveReceiptClient.test.ts`

- [ ] **Step 1: Write the failing client-boundary test**

```ts
import { createDemoReceiptClient } from './demoReceiptClient';

test('returns a clearly labelled non-chain demo receipt', async () => {
  const client = createDemoReceiptClient();
  const receipt = await client.record('safe-public-payload');

  expect(receipt.network).toBe('DEMO_ONLY');
  expect(receipt.transactionHash).toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/integrations/injectiveReceiptClient.test.ts`

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement the contract and transparent fallback**

Create `src/integrations/injectiveReceiptClient.ts`:

```ts
export interface ReceiptRecord {
  network: 'DEMO_ONLY' | 'INJECTIVE_TESTNET';
  transactionHash: string | null;
  explorerUrl: string | null;
}

export interface InjectiveReceiptClient {
  record(canonicalPayload: string): Promise<ReceiptRecord>;
}
```

Create `src/integrations/demoReceiptClient.ts`:

```ts
import type { InjectiveReceiptClient } from './injectiveReceiptClient';

export function createDemoReceiptClient(): InjectiveReceiptClient {
  return {
    async record() {
      return { network: 'DEMO_ONLY', transactionHash: null, explorerUrl: null };
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/integrations/injectiveReceiptClient.test.ts`

Expected: PASS.

- [ ] **Step 5: Apply the documented SDK decision or stop safely**

Only if `docs/INJECTIVE_INTEGRATION.md` contains an official, browser-wallet,
testnet-only receipt action, add `createInjectiveTestnetReceiptClient` beside
the demo client and test that it returns `INJECTIVE_TESTNET` only after the
wallet returns a transaction hash. If the reviewed SDK does not support that
path, stop before dependency installation, keep the fallback labelled
`DEMO_ONLY`, and update this plan from the verified official documentation.

- [ ] **Step 6: Commit**

```bash
git add src/integrations
git commit -m "feat: add receipt client boundary"
```

### Task 6: Build the decision and receipt interface

**Files:**
- Create: `src/components/ActionRequest.tsx`
- Create: `src/components/EvidencePreflight.tsx`
- Create: `src/components/DecisionPanel.tsx`
- Create: `src/components/ReceiptPanel.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing human-decision UI test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

test('holds the request without opening a receipt flow', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /hold for counsel/i }));
  expect(screen.getByText(/not recorded/i)).toBeVisible();
  expect(screen.queryByText(/Injective testnet/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/app/App.test.tsx`

Expected: FAIL because the hold control is absent.

- [ ] **Step 3: Implement the smallest state flow**

Use `createTreasuryDistributionPreflight`, render evidence cards by
jurisdiction, and keep a `receiptState` union:

```ts
type ReceiptState =
  | { status: 'IDLE' }
  | { status: 'HELD' }
  | { status: 'RECORDING' }
  | { status: 'RECORDED'; network: string; transactionHash: string | null; explorerUrl: string | null }
  | { status: 'ERROR'; message: string };
```

`Hold for counsel` sets `HELD`. `Approve testnet receipt` must construct the
canonical payload and call the injected receipt client. It must not start a
receipt flow before the explicit approval click.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `npm test -- --run src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app src/components src/styles.css
git commit -m "feat: add human-in-the-loop receipt flow"
```

### Task 7: Prepare the public submission package

**Files:**
- Create: `README.md`
- Create: `docs/DEMO_SCRIPT.md`

- [ ] **Step 1: Write README acceptance checks**

The README must include these headings:

```text
LUO Sentinel
What it does
Why Injective
Architecture
Run locally
Injective testnet verification
Safety boundaries
Hackathon deliverables
```

- [ ] **Step 2: Write the ≤3 minute demo script**

Use this timed narrative:

```text
0:00–0:20  Show the RWA request and the failure mode: an agent should not invent certainty.
0:20–1:10  Show the evidence cards and three different jurisdictional signals.
1:10–1:35  Explain why LUO requires a human decision rather than producing legal advice.
1:35–2:20  Select approval and show the official Injective testnet receipt flow.
2:20–2:45  Open the resulting transaction record and connect it to the preflight hash.
2:45–3:00  State the expansion path: RWA issuance, stablecoins, custody, and cross-border payments.
```

- [ ] **Step 3: Verify public-safe boundaries**

Search the repository for private corpus names, source documents, wallet
addresses, API keys, seed phrases, and original LUO private-path references.
Expected: none are present.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/DEMO_SCRIPT.md
git commit -m "docs: add Nova submission materials"
```

### Task 8: Verify and deploy

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run all automated tests**

Run: `npm test -- --run`

Expected: all preflight, receipt, client-boundary, and UI tests pass.

- [ ] **Step 2: Run a production build**

Run: `npm run build`

Expected: Vite emits a production bundle without TypeScript errors.

- [ ] **Step 3: Perform the testnet receipt check with the user present**

Verify the user has test INJ from the official faucet and a compatible wallet.
Explain the exact testnet transaction before asking the user to sign. After the
user explicitly confirms, record the transaction hash and confirm it on the
official explorer. Never request or handle seed phrases or private keys.

- [ ] **Step 4: Deploy the static site and update the README**

Deploy only through a user-authorized account or public static host. Add the
deployed URL and verified testnet transaction link to the README after both
exist.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add verified demo links"
```
