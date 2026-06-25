# LUO Sentinel

> Evidence-bound AI handoffs for RWA compliance workflows.

<p align="center">
  <img src="app/public/luo-logo.png" alt="LUO Sentinel logo" width="170" />
</p>

<p align="center">
  <a href="https://luo-sentinel.vercel.app">Live Demo</a> ·
  <a href="docs/DEMO_SCRIPT.md">Demo Script</a> ·
  <a href="docs/PITCH_DECK.md">Pitch Deck Outline</a> ·
  <a href="docs/ONCHAIN_RECEIPT_SPEC.md">Receipt Spec</a>
</p>

<p align="center">
  <a href="#中文版本">中文版本</a>
</p>

LUO Sentinel is an AI agent trust-layer demo for RWA compliance workflows. It turns reviewed regulatory source anchors into a visual evidence map, then requires scope review, a human gate, and a verifiable receipt before any downstream agent acts.

The project is not about asking AI to produce a legal conclusion such as "this asset can be issued or transferred here." It demonstrates a safer path: verify the source and its boundary first, then decide what an AI agent is allowed to do.

The map is not a live legal conclusion. It is a snapshot of a reviewed evidence pack. When regulatory sources change, affected signals must be reviewed again.

## Evidence Map Screenshot

<p align="center">
  <img src="app/public/readme-evidence-map.png" alt="LUO Sentinel four-jurisdiction evidence map" width="820" />
</p>

## English

### About The Project

LUO Sentinel demonstrates a minimal AI x Web3 compliance loop:

1. A user asks an RWA compliance question.
2. The system routes only into reviewed evidence scopes.
3. The map shows jurisdiction-specific source anchors and risk boundaries.
4. The Review Council checks whether a source is being over-interpreted.
5. A human gate decides whether to Proceed.
6. A Proceed receipt can be anchored on testnet.
7. A downstream agent can only produce a counsel-preparation checklist within the approved scope.

### Demo

- Live app: [https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)
- HK-only query: `Can we launch OUSG in Hong Kong only?`
- Cross-border query: `We're launching a tokenized US Treasury (OUSG) product, where can we legally offer and transfer it?`

### Core Features

- **Reviewed evidence map**  
  The map comes from reviewed source anchors, not live model-generated legal conclusions.

- **Cross-border / single-jurisdiction scope**  
  The demo can preserve differences across the United States, Hong Kong, Singapore, and the European Union, or narrow to a Hong Kong-only scope.

- **Agent Review Council**  
  Three reviewers check scope, source fit, claim support, and action risk. Scores are audit weights, not LLM confidence.

- **Human-gated receipt**  
  The Proceed receipt binds evidence hash, product reference hash, reviewer wallet, and timestamp.

- **Zero-value testnet anchoring**  
  Wallet confirmation is real for contract deployment and receipt anchoring, but no asset is moved.

- **Bounded downstream agent**  
  The downstream agent can only generate a counsel-preparation checklist inside the approved scope.

### How The Evidence Map Is Built

The current demo map is derived from a reviewed OUSG sample evidence pack last reviewed on `2026-06-07`.

Each jurisdiction signal contains:

- source anchor;
- signal status, such as Restricted, Conditional, or Unresolved;
- what the source supports;
- what the source does not prove.

In production, the evidence layer can connect to regulator websites, official legal databases, or trusted MCP connectors. LLMs can help extract candidate claims, but those claims should become map signals only after expert or human verification. When regulatory sources change, stale signals should be marked for re-review.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, CSS |
| Wallet / Testnet | ethers.js, MetaMask-compatible wallet |
| Smart Contract | Solidity, Foundry |
| Deployment | Vercel |

### Quick Start

```bash
git clone https://github.com/alexfanzong/luo-sentinel.git
cd luo-sentinel/app
npm install --ignore-scripts
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

### Project Structure

```text
.
├── app/
│   ├── public/                  # Logo and map assets
│   ├── src/
│   │   ├── lib/                 # Evidence, receipts, review council, wallet helpers
│   │   ├── App.jsx              # Main demo flow
│   │   └── styles.css           # UI styles
│   └── package.json
├── contracts/
│   └── LUOReceiptAnchor.sol     # Receipt-anchor contract
├── docs/
│   ├── DEMO_SCRIPT.md
│   ├── INJECTIVE_INTEGRATION.md
│   ├── ONCHAIN_RECEIPT_SPEC.md
│   └── PITCH_DECK.md
├── test/
│   └── LUOReceiptAnchor.t.sol
└── vercel.json
```

### Safety Boundary

LUO Sentinel does not:

- move assets;
- make legal determinations;
- establish compliance;
- authorize token issuance or transfer;
- put private keys, seed phrases, or legal text on-chain.

On-chain, the demo anchors only:

- receipt hash;
- evidence manifest hash;
- product reference hash;
- reviewer wallet;
- decision timestamp.

Off-chain, the app keeps legal source text, action-plan narrative, reviewer scorecards, downstream handoff brief, and counsel-preparation checklist.

### Roadmap

#### Phase 1: Demo Closed Loop

- [x] Reviewed RWA evidence map
- [x] Single-jurisdiction and cross-border scopes
- [x] Review Council
- [x] Human Proceed receipt
- [x] Testnet contract deployment and receipt anchoring
- [x] Bounded downstream agent checklist

#### Phase 2: Submission Assets

- [x] Live demo
- [x] README
- [x] Demo script
- [x] Pitch deck outline
- [ ] Three-minute demo video
- [ ] Final designed pitch deck

#### Phase 3: Production Direction

- [ ] Live LLM/legal reviewer agents
- [ ] Evidence refresh pipeline
- [ ] Source-change detection and stale-signal review
- [ ] Reviewer reputation and evaluation records
- [ ] Multi-source evidence graph beyond OUSG sample data

## 中文版本

### 项目简介

LUO Sentinel 展示了一个 AI x Web3 合规工作流的最小闭环：

1. 用户提出 RWA 合规问题。
2. 系统只允许进入已审核的 evidence scope。
3. 地图展示不同司法辖区的 source anchors 和风险边界。
4. Review Council 检查 source 是否被过度解释。
5. Human gate 决定是否 Proceed。
6. Proceed receipt 可以被锚定到 testnet。
7. Downstream agent 只能在批准范围内生成律师准备清单。

### Demo

- Live app: [https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)
- HK-only query: `Can we launch OUSG in Hong Kong only?`
- Cross-border query: `We're launching a tokenized US Treasury (OUSG) product, where can we legally offer and transfer it?`

### 核心特性

- **Reviewed evidence map**  
  地图来自已审核的 source anchors，不是 LLM 现场生成的法律判断。

- **Cross-border / single-jurisdiction scope**  
  可以保留 US、Hong Kong、Singapore、EU 的差异，也可以缩小到 Hong Kong-only。

- **Agent Review Council**  
  三个 reviewer 检查 scope、source fit、claim support 和 action risk。分数是审核权重，不是 LLM confidence。

- **Human-gated receipt**  
  Proceed receipt 绑定 evidence hash、product reference hash、reviewer wallet 和 timestamp。

- **Zero-value testnet anchoring**  
  钱包真实确认合约部署和 receipt anchor，但不移动资产。

- **Bounded downstream agent**  
  下游 agent 只能基于已批准范围生成 counsel-preparation checklist。

### Evidence Map 是怎么来的

当前 demo map 来自一个 reviewed OUSG sample evidence pack，最后审核日期为 `2026-06-07`。

每个 jurisdiction signal 包含：

- source anchor；
- signal status，例如 Restricted、Conditional、Unresolved；
- source 支持什么；
- source 不能推出什么。

在生产环境中，evidence layer 可以连接监管官网、官方法律数据库或可信 MCP connector。LLM 可以帮助抽取 candidate claims，但只有经过专家或人工验证后，claim 才能成为 map signal。监管来源变化时，旧 signal 应标记为 stale 并重新审核。

### 技术栈

| 层 | 技术 |
| --- | --- |
| Frontend | React, Vite, CSS |
| Wallet / Testnet | ethers.js, MetaMask-compatible wallet |
| Smart Contract | Solidity, Foundry |
| Deployment | Vercel |

### 快速开始

```bash
git clone https://github.com/alexfanzong/luo-sentinel.git
cd luo-sentinel/app
npm install --ignore-scripts
npm run dev
```

运行测试：

```bash
npm test
```

生产构建：

```bash
npm run build
```

### 安全边界

LUO Sentinel 不会：

- 移动资产；
- 给出法律结论；
- 建立合规结论；
- 授权 token 发行或转让；
- 将私钥、助记词或法律文本上传链上。

链上只锚定：

- receipt hash；
- evidence manifest hash；
- product reference hash；
- reviewer wallet；
- decision timestamp。

## License

No license has been declared yet.

## Acknowledgments

- README presentation style was inspired by [web3-awesome-solana-market](https://github.com/aiyoudiao/web3-awesome-solana-market) and [Best-README-Template](https://github.com/othneildrew/Best-README-Template).
- Regulatory source anchors in this demo are scoped sample signals, not jurisdiction-wide legal conclusions.
