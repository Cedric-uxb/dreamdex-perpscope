# PerpScope：dreamDEX 永续市场证据扫描器

[English README](README.md) | [中文设计说明](docs/DESIGN.zh-CN.md)

PerpScope 是一个面向 dreamDEX Perps Builder Bounty 的只读检查工具。它在 Somnia Tokyo（Hideki）测试网上读取公开 RPC、永续市场元数据、链上健康快照和订单簿，并生成带时间戳的 JSON 与 Markdown 证据。

它不会要求私钥、不会签名，也不会发送交易。

## 赚钱路径

本项目优先服务反馈赛道：

- 可复现的严重或重大问题：每个被接受的问题 40 美元。
- 其他被接受的问题：每个 15 美元。
- 只有第一个有效报告会获得奖励，因此证据必须清楚、及时、可重复。

相比先做大型自动交易机器人，自动化证据采集更容易在截止前形成多个高质量反馈，也不会引入私钥和资金风险。

## 当前功能

- 校验 RPC 链 ID 和最新区块高度。
- 检查所有活跃永续市场的合约地址。
- 检查价格最小变动、数量步长和最低下单量。
- 把市场索引行价格与池子的链上实时价格差异记录为指标。
- 记录最佳买价、最佳卖价和盘口状态；只有交叉盘口会列为问题。
- 单个市场读取失败时继续扫描其他市场，并将该结果列为“不确定”。
- SDK 只返回部分市场时拒绝生成不完整报告。
- 生成机器可读 JSON、人工可读 Markdown 和待复验反馈草稿。

官方 bot kit 已说明市场索引行可能滞后；空盘口和单边盘口也可能是正常的瞬时状态。因此这些数据只作为指标保存，不会自动生成反馈草稿。市场读取失败会单独列为“不确定”，避免把网络或索引器波动误报成产品缺陷。

## 运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run check
npm run scan
```

自定义输出目录：

```bash
npm run scan -- --output artifacts
```

每次扫描会生成：

```text
artifacts/<时间戳>/
├── scan.json
├── scan.md
└── feedback-drafts/
```

`feedback-drafts/` 中的文件只是候选草稿。正式提交前必须至少再次复现两次，并对照最新官方文档确认不是已知行为。

## 测试

```bash
npm run check
```

测试包括纯规则单元测试、市场探针异常的集成测试和 CLI 冒烟测试。行、函数和分支覆盖率阈值均为 80%。

## 安全边界

- 不连接钱包。
- 不读取或保存私钥、助记词、密码。
- 不签名、不广播交易。
- 不自动公开或提交任何发现。
- 安全漏洞不得放入公开仓库，应私下发送到 `security@dreamdex.io`。

## 当前状态

- DoraHacks 报名：已于 2026 年 10 月 27 日确认成功。
- 白名单工单：`DX-0296`；提交 Build 前仍需实时确认审核状态。
- 首次真实扫描：成功检查 21 个活跃永续市场。
- 截止时间：2026 年 11 月 1 日 23:59 UTC。

## 官方资料

- [比赛页面](https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail)
- [开发者文档](https://app.testnet.dreamdex.io/docs/developers/perps-testnet)
- [官方 dreamDEX bot kit](https://github.com/somnia-chain/dreamdex-bot-kit)

## 许可证

MIT
