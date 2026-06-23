import { createRwaPreflight } from './preflight.js';
import { createReceiptDraft } from './receipt.js';

export function reduceAppState(state, action) {
  if (action === 'HOLD_FOR_COUNSEL') {
    return { receiptState: 'HELD', receipt: null };
  }

  if (action.type === 'APPROVE_TESTNET_RECEIPT') {
    return {
      receiptState: 'DRAFT_READY',
      receipt: action.receipt,
      transactionHash: null,
    };
  }

  return state;
}

export function getAppMarkup(state) {
  const preflight = createRwaPreflight();
  const evidenceCards = preflight.evidence.map((item) => `
    <article class="evidence-card evidence-card--${item.signal.toLowerCase()}">
      <div class="evidence-card__meta"><span>${item.jurisdiction}</span><span>${item.signal}</span></div>
      <h3>${item.sourceId}</h3>
      <p>${item.summary}</p>
    </article>
  `).join('');

  const status = state.receiptState === 'HELD'
    ? '<p class="status status--hold">No receipt recorded. Route this action to jurisdiction-specific counsel.</p>'
    : state.receiptState === 'DRAFT_READY'
      ? `<p class="status status--draft">Receipt draft ready. Wallet connection is intentionally disabled until an official browser-wallet testnet path is verified.</p>
         <code>${state.receipt.canonical}</code>`
      : '<p class="status">No legal conclusion is produced. A human decision is required before any testnet action.</p>';

  return `
    <main class="shell">
      <header class="masthead">
        <div class="brand">LUO <span>SENTINEL</span></div>
        <div class="network"><i></i> Injective Testnet · safe demo mode</div>
      </header>
      <section class="hero">
        <p class="eyebrow">EVIDENCE-BOUND COMPLIANCE PREFLIGHT</p>
        <h1>Do not let an agent<br>manufacture certainty.</h1>
        <p class="lede">LUO Sentinel maps jurisdictional divergence before an AI-initiated RWA action reaches Injective.</p>
      </section>
      <section class="request-card">
        <div><p class="eyebrow">AGENT REQUEST</p><h2>${preflight.request.action}</h2><p>${preflight.request.target}</p></div>
        <span class="chip">${preflight.disposition.replaceAll('_', ' ')}</span>
      </section>
      <section class="section-head"><p class="eyebrow">01 / EVIDENCE PREFLIGHT</p><h2>Three signals. No fabricated consensus.</h2></section>
      <section class="evidence-grid">${evidenceCards}</section>
      <section class="decision-panel">
        <div><p class="eyebrow">02 / HUMAN AUTHORIZATION</p><h2>The decision stays with a person.</h2><p>Approve only a future testnet receipt—not asset movement, eligibility, or legal advice.</p></div>
        <div class="decision-actions">
          <button class="button button--quiet" data-action="hold">Hold for counsel</button>
          <button class="button" data-action="approve">Prepare testnet receipt</button>
        </div>
        <div class="status-area">${status}</div>
      </section>
      <footer><span>LUO Sentinel · RWA preflight for Injective</span><span>Private keys never enter this application.</span></footer>
    </main>
  `;
}

export function mountApp(root) {
  let state = { receiptState: 'IDLE', receipt: null };

  function render() {
    root.innerHTML = getAppMarkup(state);
    root.querySelector('[data-action="hold"]').addEventListener('click', () => {
      state = reduceAppState(state, 'HOLD_FOR_COUNSEL');
      render();
    });
    root.querySelector('[data-action="approve"]').addEventListener('click', () => {
      const receipt = createReceiptDraft({
        decision: 'APPROVE_TESTNET_RECEIPT',
        requestLabel: 'Tokenized treasury distribution',
        preflightVersion: '0.1',
        timestamp: new Date().toISOString(),
      });
      state = reduceAppState(state, { type: 'APPROVE_TESTNET_RECEIPT', receipt });
      render();
    });
  }

  render();
}
