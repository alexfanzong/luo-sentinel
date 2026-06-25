# LUO Sentinel

> 面向 RWA 合规工作流的 evidence-bound AI handoff demo。

<p align="center">
  <img src="app/public/luo-logo.png" alt="LUO Sentinel logo" width="170" />
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="https://luo-sentinel.vercel.app">Live Demo</a> ·
  <a href="docs/DEMO_SCRIPT.md">Demo Script</a> ·
  <a href="docs/PITCH_DECK.md">Pitch Deck Outline</a> ·
  <a href="docs/ONCHAIN_RECEIPT_SPEC.md">Receipt Spec</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RWA-Compliance-111827?style=for-the-badge" alt="RWA Compliance" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Solidity-0.8.33-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity 0.8.33" />
  <img src="https://img.shields.io/badge/License-Pending-6b7280?style=for-the-badge" alt="License pending" />
</p>

LUO Sentinel 是一个面向 RWA 合规工作流的 AI agent trust layer demo。它把经过审核的监管 source anchors 组织成可视化 evidence map，并在任何下游 agent 行动前加入 scope review、human gate 和可验证 receipt。

本项目的重点不是让 AI 直接给出“某地可以发行/转让”的法律结论，而是展示一条更安全的链路：先确认资料来源和适用边界，再决定 AI 被允许做什么。

地图不是实时法律结论，而是 reviewed evidence pack 的当前快照。监管来源变化后，相关 signal 必须重新审核。

## Evidence Map Screenshot

<p align="center">
  <img src="app/public/readme-evidence-map.png" alt="LUO Sentinel four-jurisdiction evidence map" width="820" />
</p>

## 项目简介

LUO Sentinel 展示了一个 AI x Web3 合规工作流的最小闭环：

1. 用户提出 RWA 合规问题。
2. 系统只允许进入已审核的 evidence scope。
3. 地图展示不同司法辖区的 source anchors 和风险边界。
4. Review Council 检查 source 是否被过度解释。
5. Human gate 决定是否 Proceed。
6. Proceed receipt 可以被锚定到 testnet。
7. Downstream agent 只能在批准范围内生成律师准备清单。

## Demo

- Live app: [https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)
- HK-only query: `Can we launch OUSG in Hong Kong only?`
- Cross-border query: `We're launching a tokenized US Treasury (OUSG) product, where can we legally offer and transfer it?`

## 核心特性

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

## Evidence Map 是怎么来的

当前 demo map 来自一个 reviewed OUSG sample evidence pack，最后审核日期为 `2026-06-07`。

每个 jurisdiction signal 包含：

- source anchor；
- signal status，例如 Restricted、Conditional、Unresolved；
- source 支持什么；
- source 不能推出什么。

在生产环境中，evidence layer 可以连接监管官网、官方法律数据库或可信 MCP connector。LLM 可以帮助抽取 candidate claims，但只有经过专家或人工验证后，claim 才能成为 map signal。监管来源变化时，旧 signal 应标记为 stale 并重新审核。

## 技术栈

| 层 | 技术 |
| --- | --- |
| Frontend | React, Vite, CSS |
| Wallet / Testnet | ethers.js, MetaMask-compatible wallet |
| Smart Contract | Solidity, Foundry |
| Deployment | Vercel |

## 快速开始

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

## 项目结构

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

## 安全边界

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

链下保留 legal source text、action-plan narrative、reviewer scorecards、downstream handoff brief 和 counsel-preparation checklist。

## 路线图

### Phase 1: Demo Closed Loop

- [x] Reviewed RWA evidence map
- [x] Single-jurisdiction and cross-border scopes
- [x] Review Council
- [x] Human Proceed receipt
- [x] Testnet contract deployment and receipt anchoring
- [x] Bounded downstream agent checklist

### Phase 2: Submission Assets

- [x] Live demo
- [x] README
- [x] Demo script
- [x] Pitch deck outline
- [ ] Three-minute demo video
- [ ] Final designed pitch deck

### Phase 3: Production Direction

- [ ] Live LLM/legal reviewer agents
- [ ] Evidence refresh pipeline
- [ ] Source-change detection and stale-signal review
- [ ] Reviewer reputation and evaluation records
- [ ] Multi-source evidence graph beyond OUSG sample data

## License

No license has been declared yet.

## Acknowledgments

- README presentation style was inspired by [web3-awesome-solana-market](https://github.com/aiyoudiao/web3-awesome-solana-market) and [Best-README-Template](https://github.com/othneildrew/Best-README-Template).
- Regulatory source anchors in this demo are scoped sample signals, not jurisdiction-wide legal conclusions.
