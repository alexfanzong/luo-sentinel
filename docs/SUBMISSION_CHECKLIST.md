# LUO Sentinel — Submission Checklist

Use this checklist before recording the final demo or submitting the project.

## Repository scope

- Keep the public repository focused on the LUO Sentinel prototype, contracts,
  tests, and public-safe documentation.
- Do not stage local reference folders, outside review notes, screenshots, raw
  prompts, wallet exports, `.env` files, or private keys.
- Before any commit, review the staged file list and confirm it contains only
  intended project files.

## Pre-recording checks

- Run the app from `app/` on `127.0.0.1`.
- Confirm the landing Agent request capsule opens the reviewed OUSG cross-border scope.
- Confirm an unsupported question shows the refusal branch instead of a
  fabricated map.
- Confirm the refusal branch can route to one selected jurisdiction, especially
  Hong Kong.
- Confirm the Agent Review Council appears before the human decision step.
- Confirm scorecards show the deterministic scoring basis for each agent.
- Confirm a single-jurisdiction receipt preview and handoff only bind the
  selected source scope.
- Confirm `Run bounded downstream agent` produces a scoped counsel-preparation
  checklist from the handoff.
- Confirm the receipt-anchor contract address can be verified before anchoring.
- Use only a test wallet on Injective EVM Testnet.
- Confirm every wallet preview shows `0 INJ` transfer value before signing.
- Confirm the recorded transaction link opens:
  `https://testnet.blockscout.injective.network/tx/0x17ae3d575955edb1c2e8d608641fb36d03a5c456dcacf0ca245bc0f9ed34c2eb`.

## Three-minute video path

1. Failure: an AI agent cannot turn cross-border legal divergence into one
   confident answer.
2. Refusal: LUO rejects unsupported scope and routes back to reviewed evidence.
3. Atlas Canvas: scope can be comparative or single-jurisdiction, and each
   signal stays source-bound.
4. Review Council: Scope, Source, and Risk agents score the selected evidence.
5. Human gate: a reviewer chooses Hold or prepares a Proceed receipt.
6. Injective receipt: the app shows target, fee estimate, zero value, and
   runtime-verified contract use before wallet confirmation.
7. Handoff: the downstream agent receives bounded facts, receipt proof, and
   unresolved constraints.
8. Downstream run: the bounded agent consumes the handoff and produces a
   counsel-preparation checklist without expanding scope.

## Final artifacts

- Public GitHub repository URL.
- Deployed app URL: `https://luo-sentinel.vercel.app`.
- Public deck URL: `https://alexfanzong.github.io/luo-sentinel/`.
- English deck URL: `https://alexfanzong.github.io/luo-sentinel/deck.en.html`.
- Three-minute demo video URL.
- Pitch deck or pitch deck outline.
- Testnet transaction URL for the non-value-moving receipt:
  `https://testnet.blockscout.injective.network/tx/0x17ae3d575955edb1c2e8d608641fb36d03a5c456dcacf0ca245bc0f9ed34c2eb`.

## Verification before submission

- `npm test` from `app/`.
- `npm run build` from `app/`.
- `scripts/publish-deck.sh` after any committed deck change.
- Final git status reviewed so local-only reference materials are not included.
