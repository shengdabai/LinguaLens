# LinguaLens

🔎🀄 LinguaLens 语言透镜 — AI Chinese-learning toolkit: immersive reading, shadowing, translation & fluency coaching. Bring your own key. (React + TS + Vite)

## Business Context

- **Category:** education product
- **Audience:** learners, teachers, parents, and education operators who need a clearer learning or exam-prep workflow.
- **Repository status:** Public repository. Keep examples, docs, and issues free of credentials, private data, and machine-specific paths.
- **Topics:** ai, chinese-learning, language-learning, learn-chinese, react, tailwindcss, typescript, vite

## What This Project Is For

- 🔎🀄 LinguaLens 语言透镜 — AI Chinese-learning toolkit: immersive reading, shadowing, translation & fluency coaching. Bring your own key. (React + TS + Vite).
- Give users a concrete learning workflow instead of a loose collection of content.
- Make practice, feedback, review, or recommendation steps easier to repeat.

## Where It Fits

This repository supports productized learning workflows: diagnostic input, guided practice, review loops, and clearer handoff between learner, teacher, and software.

## Technical Overview

- **Primary language:** TypeScript
- **Detected stack:** TypeScript, Node.js, Vite, React, Tailwind CSS
- **Default branch:** `main`
- **Visibility:** `PUBLIC`
- **License:** MIT License

## Repository Map

- `src`
- `LICENSE`
- `README.md`
- `SECURITY.md`
- `index.html`
- `package-lock.json`
- `package.json`
- `postcss.config.js`
- `tailwind.config.js`
- `tsconfig.json`
- `vite.config.ts`
- `中文学习产品开发技术文档.md`

## Quick Start

Use the commands that match the current project state:

```bash
npm install
npm run dev
npm run preview
```

## 📖 Usage

On first launch, open **Settings** and add an AI provider API key:

| Provider | Key format |
| --- | --- |
| **Gemini** | Google AI Studio key (`AIza...`) |
| **OpenAI** | `sk-...` |
| **Anthropic** | `sk-ant-...` |

Keys are stored **locally in your browser** and are never sent anywhere except the AI provider you choose. Then pick any feature — paste text into the Reader, snap a photo, or start a Roleplay — and start learning.

## 🗺️ Status

Active, single-developer project, built in public. Core features (Reader, Shadowing, Translation, Fluency Coach, SRS, Roleplay, Quests) are usable today; the toolkit grows alongside real classroom feedback from 6,000+ Chinese learners.

## 🤝 Connect / About

Built by **Tony (Sheng)** — a Chinese-language teacher with 6,000+ students, building AI + Chinese-teaching tools in public.

If LinguaLens is useful to you, **⭐ Star this repo** and **[Follow @shengdabai](https://github.com/shengdabai)** to follow the journey.

**More Chinese-learning tools in the works:**
- [chinese-mission](https://github.com/shengdabai/chinese-mission)
- [hsk-prep-platform](https://github.com/shengdabai/hsk-prep-platform)
- [ChineseThinking](https://github.com/shengdabai/ChineseThinking)

## License

MIT © [shengdabai](https://github.com/shengdabai)

---

<a name="中文"></a>

# 🔎🀄 LinguaLens · 语言透镜

**[English](#-lingualens--语言透镜) | 中文**

> **把 AI 对准任何中文，真正读懂它 —— 然后读出来、说出来、记下来。**

语言透镜是一套沉浸式中文学习工具集，用你自己的一把 AI 密钥就能开一间学习工作室：AI 标注**阅读**、跟读**口语练习**、双语**翻译**、口语**流利度教练**，再加上间隔重复、角色扮演和游戏化任务。自带 Gemini / OpenAI / Anthropic 密钥，全部在浏览器本地运行。

---

## 为什么用语言透镜？

大多数中文 App 把你锁进它们的内容和节奏。语言透镜反过来：**素材由你提供** —— 一篇文章、一段聊天记录、一张菜单、你自己写的稿子 —— AI 化身导师，为你标注、讲解、听你的发音，并反复操练直到记牢。无需账号、不在服务器留存你的数据、没有订阅。只要你的密钥和你的素材。

## 它能做什么

放入中文文本（或随手拍下），语言透镜带你走完完整学习闭环：**读懂 → 开口 → 复习 → 记牢**。

## ✨ 功能特性

- **🀄 沉浸式阅读** —— AI 标注中文，即时拼音、释义与划词查询。
- **🎙️ 跟读练习** —— 配合语音识别的跟读，给出发音反馈。
- **🌉 翻译桥** —— 智能双语翻译，并排对照 + TTS 朗读。
- **📖 全能阅读器** —— 多种输入格式的统一阅读体验。
- **🗣️ 流利度教练** —— AI 评估口语流利度，给出可操作的改进建议。
- **✍️ 写作起草** —— AI 辅助的中文写作助手。
- **📸 速拍模式** —— 随手捕捉任意中文，立即开始学习。
- **💬 实时会话** —— 实时对话练习。
- **🔁 间隔重复（SRS）** —— 间隔重复系统，长期记忆词汇。
- **🎯 任务系统** —— 游戏化挑战，保持学习连续性。
- **🎭 角色扮演** —— 基于场景的对话练习。
- **⚙️ 个人资料与设置** —— 多服务商 AI 配置（Gemini、OpenAI、Anthropic）。

## 🧱 技术栈

- **框架：** React 18 + TypeScript + Vite
- **样式：** Tailwind CSS
- **AI 服务商：** Google Gemini、OpenAI、Anthropic（用户自配，自带密钥）
- **音频：** Web Speech API + TTS

## 🚀 快速开始

```bash
git clone https://github.com/shengdabai/LinguaLens.git
cd LinguaLens
npm install
npm run dev
```

在浏览器打开 **http://localhost:5173**。

构建生产版本：

```bash
npm run build
```

| Command | Purpose |
|---|---|
| `npm install` | Install project dependencies. |
| `npm run dev` | vite |
| `npm run preview` | vite preview |
| `npm run build` | tsc && vite build |

## Operating Notes

- Keep real credentials out of the repository. Use local environment files, GitHub repository secrets, or the deployment platform secret manager.
- If a `.env.example` file exists, treat it as documentation only; never commit filled-in `.env` files.
- Before publishing screenshots, demos, or client examples, remove private names, internal paths, account IDs, and API endpoints.
- The `Repository Hygiene` workflow is a lightweight guardrail, not a replacement for product-specific tests.

## Delivery Checklist

- [ ] README describes the user, business outcome, and operating boundary.
- [ ] Setup or preview commands are current and do not rely on private machine state.
- [ ] No real secrets, private user data, or machine-local state are tracked.
- [ ] Screenshots, demos, or sample outputs are safe to share publicly when the repository is public.
- [ ] Product-specific tests or smoke checks are documented before production use.

## Roadmap

- Tighten the fastest path from clone to useful demo.
- Add project-specific screenshots, sample outputs, or a short walkthrough where useful.
- Promote repeated manual steps into scripts, tests, or documented workflows.
- Keep security, privacy, and licensing boundaries explicit as the project evolves.

## Maintainer Notes

Maintained by [Tony Sheng](https://github.com/shengdabai). This README is written as a business-facing handoff: it should help a future collaborator, client, or reviewer understand why the repository exists, how to inspect it, and what must be true before it is reused or shipped.

如果语言透镜对你有用，请 **⭐ Star 本仓库** 并 **[关注 @shengdabai](https://github.com/shengdabai)**，一起见证这段旅程。

**更多在做的中文学习工具：**
- [chinese-mission](https://github.com/shengdabai/chinese-mission)
- [hsk-prep-platform](https://github.com/shengdabai/hsk-prep-platform)
- [ChineseThinking](https://github.com/shengdabai/ChineseThinking)

## 许可

MIT © [shengdabai](https://github.com/shengdabai)
