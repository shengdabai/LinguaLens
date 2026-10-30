# LinguaLens — AI-Powered Immersive Chinese Learning Toolkit

> **13 个 AI 工具，一个应用搞定。** 沉浸式中文学习的全能工具箱。

[![React](https://img.shields.io/badge/React-18-61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)]()
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)]()
[![License](https://img.shields.io/badge/license-Private-lightgrey)]()

---

## What Is LinguaLens?

LinguaLens 是全球学习者的**沉浸式中文学习工具箱**：AI 标注阅读、跟读练习、实时对话、发音评估、沉浸阅读、流利度训练等 13 个功能模块集成一体。

### 为什么选 LinguaLens？

- **13 个学习工具**，覆盖听、说、读、写全流程
- **BYOK 模式** — 自带 AI API Key，边际成本趋零
- **多 AI 供应商** — Gemini / OpenAI / Anthropic 任选
- **跨平台** — Web + iOS (Capacitor)
- **隐私优先** — API Key 本地存储，不上传任何服务器

## 13 大功能模块

| 模块 | 功能 |
|------|------|
| **Immersive Reader** | AI 标注中文阅读，即点即查 |
| **Shadowing** | 跟读练习，语音识别 + 发音评估 |
| **Translation Bridge** | 智能翻译，双语对比 + TTS |
| **OmniReader** | 统一阅读体验，支持多种输入格式 |
| **Fluency Coach** | AI 流利度评估和反馈 |
| **Script Drafting** | 中文写作辅助，AI 建议 |
| **Snap Mode** | 快速捕获任何中文文本学习 |
| **Live Session** | 实时对话练习 |
| **SRS Review** | 间隔重复系统，词汇记忆 |
| **Quest System** | 游戏化学习挑战 |
| **Roleplay** | 场景对话练习 |
| **Profile & Settings** | 多 AI 供应商配置 |
| **AI Provider Router** | Gemini/OpenAI/Anthropic 智能路由 |

## 定价方案（v2 规划）

| 功能 | Free | Pro (¥68/月) | Enterprise |
|------|------|-------------|------------|
| 基础工具 (Reader, Translation) | ✓ | ✓ | ✓ |
| 高级工具 (Shadowing, Fluency) | 每日 5 次 | 无限 | 无限 |
| AI 供应商 | 自带 Key | 自带 Key + 官方代理 | 官方代理 + 团队管理 |
| iOS App | - | ✓ | ✓ |
| SRS 系统 | 基础 | 完整 | 完整 |
| 教师后台 | - | - | ✓ (班级管理) |
| Site License | - | - | 按需定价 |

### BYOK vs 官方代理

| 模式 | 适合 | 成本 |
|------|------|------|
| **BYOK** (用户自带 Key) | 个人学习者，有 API Key | 用户承担 AI 费用 |
| **官方代理** (Pro+) | 不想管理 Key 的用户 | 含在订阅中 |

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173

### 配置 AI

首次启动进入 Settings 配置 AI 供应商和 Key：
- **Gemini**: Google AI Studio key (`AIza...`)
- **OpenAI**: API key (`sk-...`)
- **Anthropic**: API key (`sk-ant-...`)

Key 存储在本地浏览器，不会发送到其他服务器。

## 技术架构

```
React 18 + TypeScript + Vite
├── Web Speech API (语音识别/合成)
├── MediaRecorder API (音频录制)
├── Capacitor 6.x (iOS 打包)
└── AI Provider Router (Gemini/OpenAI/Anthropic)
```

- **框架**: React 18 + TypeScript + Vite 5.4
- **样式**: Tailwind CSS 3.4
- **AI**: Google Gemini / OpenAI / Anthropic (用户可配置)
- **跨平台**: Capacitor 6.x (iOS)
- **音频**: Web Speech API + TTS + PCM 编码

## 品牌定位

- **名称**: LinguaLens (语言透镜)
- **Slogan**: "See Chinese clearly. Speak it naturally."
- **目标用户**: 全球中文学习者（16-40 岁）
- **竞品差异**: 不是单一工具，是**工具箱** — 13 个功能模块化集成

## iOS 迁移进度

- [x] Phase A: Capacitor 配置 + 项目初始化
- [x] Phase B1: WKWebView 兼容性修复 (Gemini REST fetch 替代 SDK)
- [x] Phase B2: 原生权限配置 (麦克风、语音识别)
- [ ] Phase C: 真机测试 (iPhone 16+)
- [ ] Phase D: App Store 提交

## 项目结构

```
src/
├── features/           # 13 个功能模块
│   ├── reader/         # Immersive Reader
│   ├── shadowing/      # 跟读练习
│   ├── translation/    # 翻译桥
│   ├── fluency/        # 流利度训练
│   ├── roleplay/       # 场景对话
│   └── ...             # 其他 8 个模块
├── services/           # AI 供应商路由、音频工具
├── components/         # 共享 UI 组件
├── store/              # 状态管理
├── config/             # 应用配置
├── types/              # TypeScript 类型定义
└── utils/              # 工具函数
```

## Roadmap

- [ ] iOS 真机测试 + App Store 首次上线
- [ ] Pro 订阅内购接入
- [ ] 教师后台 (B2B2C)
- [ ] E2E 测试覆盖
- [ ] CI/CD (GitHub Actions + TestFlight)

---

**Private repository. All rights reserved.**
