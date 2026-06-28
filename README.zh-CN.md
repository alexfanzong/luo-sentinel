# LUO Sentinel

> 面向 RWA Agent 的执行前合规控制协议。

<p align="center">
  <img src="app/public/luo-mark.png" alt="LUO Sentinel 标志" width="170" />
</p>

<p align="center">
  <a href="README.md">英文</a> ·
  <a href="https://luo-sentinel.vercel.app">在线演示</a> ·
  <a href="https://drive.google.com/file/d/1gFE7u5ghsF2feuOkzjQJBigxNHVoIOhj/view">Demo 视频</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RWA-Compliance-111827?style=for-the-badge" alt="RWA 合规" />
  <img src="https://img.shields.io/badge/AI-Agent%20Protocol-0f766e?style=for-the-badge" alt="AI Agent 协议" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Solidity-0.8.33-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity 0.8.33" />
  <img src="https://img.shields.io/badge/License-Apache--2.0-5aa000?style=for-the-badge" alt="Apache-2.0 license" />
</p>

LUO Sentinel 是一个面向 Injective RWA Agent 的执行前合规控制协议。它把经过审核的监管来源锚点组织成可视化证据地图，让 Agent 在进入链上执行前经过 Sentinel 评审、人工确认和可验证回执。

入口是上游项目方 Agent，不是人在搜索法律问题。当它准备推进一个 RWA 动作时，Sentinel 会把请求带回已审核的来源范围，保留执行前的人工确认，并在通过后生成下游 Agent 可读取的范围约束包。

LUO Sentinel 不提供法律意见，也不让 AI 直接给出“某地可以发行/转让”的法律结论。它展示的是一种更可靠的协作方式：Agent 把准备工作对齐到已审核来源，Sentinel 保留执行前的责任边界，由人确认下一步，再决定另一个 AI Agent 被允许做什么。

地图上每一格都是已审核证据包的当前快照，不是实时法律结论。监管来源变化后，相关信号必须重新审核。

## 证据地图截图

<p align="center">
  <img src="app/public/readme-evidence-map.png" alt="LUO Sentinel 四个司法辖区证据地图" width="820" />
</p>

## 演示

在线演示：[https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)

评审 Deck：[https://alexfanzong.github.io/luo-sentinel/](https://alexfanzong.github.io/luo-sentinel/)

Demo 视频：[Google Drive](https://drive.google.com/file/d/1gFE7u5ghsF2feuOkzjQJBigxNHVoIOhj/view)

建议评委这样看：

1. 在 Agent 请求入口提交一个拟执行的 RWA 动作：
   `Prepare an OUSG-like tokenized treasury asset for Injective issuance or transfer.`
2. 打开地图上的司法辖区标记，检查每个信号是否跳转到对应来源锚点。
3. 依次走完行动计划、Agent 评审、人工关口、测试网锚定和协议包。
4. 运行有边界的下游 Agent，确认它生成的是律师准备清单，而不是法律结论。
5. 重新开始，提交仅限香港的范围：
   `Prepare the OUSG handoff for Hong Kong only.`
6. 确认地图缩小到香港来源范围，并且不会推断美国、新加坡或欧盟覆盖范围。
7. 再重新开始，提交一个未审核辖区：
   `Can we launch OUSG in Switzerland?`
8. 确认 Sentinel 不会编造覆盖范围，而是把评委带回已审核范围。

## 项目简介

LUO Sentinel 展示了一个 AI x Web3 Sentinel 工作流的最小闭环：

1. 上游项目方 Agent 提出一个 RWA 动作。
2. Sentinel 把动作带回已审核证据范围，并保留执行前的人工确认。
3. 系统只允许它进入已审核的证据范围。
4. 地图展示不同司法辖区的来源锚点和风险边界。
5. 评审委员会检查来源是否被过度解释。
6. 人工关口决定是否放行。
7. 有边界的 Sentinel 回执可以被锚定到测试网。
8. 下游 Agent 只能在批准范围内生成律师准备清单。

## 核心特性

- **Agent 准备，Sentinel 对齐证据，人来拍板**
  演示从一个拟执行的 Agent 动作开始；系统先完成证据审核和人签字，再释放受约束的协议包。

- **已审核证据地图**  
  地图来自已审核的来源锚点，不是 LLM 现场生成的法律判断。

- **跨境 / 单一司法辖区范围**  
  可以保留美国、香港、新加坡、欧盟的差异，也可以缩小到仅限香港。

- **Agent 评审委员会**  
  三个评审者检查范围、来源匹配度、主张支持度和行动风险。分数是审核权重，不是模型置信度。

- **人工关口回执**  
  Sentinel 回执为已批准的证据范围生成审核钱包决策记录。

- **零金额测试网锚定**  
  钱包真实确认合约部署和回执锚定，但不移动资产。

- **有边界的下游 Agent**  
  下游 Agent 只能基于已批准范围生成律师准备清单。

## 回执边界

LUO Sentinel 会在测试网上锚定一个零金额决策回执。这个回执只承诺已审核证据范围、产品引用、审核钱包和决策时间，不会把法律分析或来源文本放到链上。

它证明的是：某个钱包在审核之后接受了一个有边界的 Sentinel 决定。它不证明法律合规，不构成法律意见，也不授权任何资产交易。具体实现可以在合约和测试中查看。

## 证据地图是怎么来的

当前演示地图来自一个已审核的 OUSG 样本证据包，最后审核日期为 `2026-06-07`。

每个司法辖区信号包含：

- 来源锚点；
- 信号状态，例如 Restricted、Conditional、Unresolved；
- 来源支持什么；
- 来源不能推出什么。

在生产环境中，证据层可以连接监管官网、官方法律数据库或可信 MCP 连接器。LLM 可以帮助抽取候选主张，但只有经过专家或人工验证后，主张才能成为地图信号。监管来源变化时，旧信号应标记为过期并重新审核。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React, Vite, CSS |
| 钱包 / 测试网 | ethers.js, MetaMask 兼容钱包 |
| 智能合约 | Solidity, Foundry |
| 部署 | Vercel 应用，GitHub Pages deck |

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
│   ├── public/                  # 标志、地图资源和网页 deck
│   ├── src/
│   │   ├── lib/                 # 证据、回执、评审委员会、钱包工具
│   │   ├── App.jsx              # 主演示流程
│   │   └── styles.css           # 界面样式
│   └── package.json
├── contracts/
│   └── LUOReceiptAnchor.sol     # 回执锚定合约
├── docs/
│   ├── DEMO_SCRIPT.md
│   └── INJECTIVE_INTEGRATION.md
├── test/
│   └── LUOReceiptAnchor.t.sol
└── vercel.json
```

## 安全边界

LUO Sentinel 不会：

- 移动资产；
- 给出法律结论；
- 建立合规结论；
- 授权代币发行或转让；
- 将私钥、助记词或法律文本上传链上。

链上只锚定：

- 回执哈希；
- 证据清单哈希；
- 产品引用哈希；
- 审核钱包；
- 决策时间戳。

链下保留法律来源文本、行动计划叙述、评审打分卡、下游协议包摘要和律师准备清单。

新加坡部分以官方《Securities and Futures Act 2001》作为主来源锚点。MAS 的数字代币指引可以作为二级实务阅读材料，但不会被当成授权 RWA 发行或转让的主来源。

## 产品路线图

### 1. 证据基础设施

- 连接监管官网、官方法律数据库或可信 MCP 连接器。
- 增加来源变更检测、过期信号标记和重新审核工作流。
- 从 OUSG 样本扩展到可复用的 RWA 证据图谱。

### 2. Agent 评审层

- 用真实 LLM / 法律评审 Agent 替换确定性的演示评审者。
- 记录评审者声誉、评估记录和分歧历史。
- 支持来源匹配、司法辖区范围、主张支持度和行动风险的多 Agent 审核。

### 3. 合规控制和回执协议

- 标准化下游 Agent 可读取的机器可读协议包。
- 增加回执验证端点和更适合区块浏览器展示的回执视图。
- 支持人工批准范围之后的策略控制型 Agent 执行。

### 4. 产品化

- 为团队、律师和合规评审者增加工作区功能。
- 增加案件历史、审计轨迹和证据刷新提醒。
- 支持法律、合规和 RWA 运营团队的企业部署模式。

## 开源协议

源代码采用 Apache License 2.0。详见 [LICENSE](LICENSE)。

LUO Sentinel 是黑客松研究演示。LUO Sentinel 的名称、标志、演示证据包、监管来源摘要、证据地图和合规流程叙事，不构成法律、合规、商标、商业背书、投资建议或授权许可。该演示不能替代持牌律师或受监管合规专业人士的意见。

## 联系

Alex Fan  
Cornell Law School  
可编程合规架构师  
X: [@itsAlexFan](https://x.com/itsAlexFan)
