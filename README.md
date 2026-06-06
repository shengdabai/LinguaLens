# 🔎🀄 LinguaLens · 语言透镜

**English | [中文](#中文)**

[![Last Commit](https://img.shields.io/github/last-commit/shengdabai/LinguaLens)](https://github.com/shengdabai/LinguaLens/commits)
[![Stars](https://img.shields.io/github/stars/shengdabai/LinguaLens?style=social)](https://github.com/shengdabai/LinguaLens/stargazers)
[![Follow](https://img.shields.io/github/followers/shengdabai?style=social)](https://github.com/shengdabai)

> **Point your AI at any Chinese text and actually understand it — then read it, say it, and remember it.**

LinguaLens is an immersive Chinese-learning toolkit that turns a single AI key into a full study studio: AI-annotated **reading**, follow-along **shadowing**, bilingual **translation**, and spoken **fluency coaching** — plus spaced repetition, roleplay, and gamified quests. Bring your own Gemini / OpenAI / Anthropic key; everything runs in your browser.

---

## Why LinguaLens?

Most Chinese-learning apps lock you into their content and their pace. LinguaLens flips that: **you bring the text** — an article, a chat, a menu, a script you wrote — and the AI becomes a tutor that annotates, explains, listens to your pronunciation, and drills you until it sticks. No accounts, no servers holding your data, no subscription. Just your key and your material.

## What it does

Drop in Chinese text (or capture it on the fly), and LinguaLens helps you move through the full learning loop: **understand → speak → review → retain**.

## ✨ Features

- **🀄 Immersive Reader** — AI-annotated Chinese text with instant pinyin, definitions, and inline lookup.
- **🎙️ Shadowing** — Follow-along speaking practice with speech recognition for pronunciation feedback.
- **🌉 Translation Bridge** — Smart bilingual translation with side-by-side comparison and TTS.
- **📖 OmniReader** — Unified reading experience across multiple input formats.
- **🗣️ Fluency Coach** — AI-driven fluency assessment with actionable feedback on your spoken Chinese.
- **✍️ Script Drafting** — Chinese writing assistant with AI suggestions.
- **📸 Snap Mode** — Quick-capture any Chinese text and start learning from it instantly.
- **💬 Live Session** — Real-time conversation practice.
- **🔁 SRS Review** — Spaced-repetition system for long-term vocabulary retention.
- **🎯 Quest System** — Gamified challenges to keep your streak alive.
- **🎭 Roleplay** — Scenario-based conversation practice.
- **⚙️ Profile & Settings** — Multi-provider AI configuration (Gemini, OpenAI, Anthropic).

## 🧱 Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **AI Providers:** Google Gemini, OpenAI, Anthropic (user-configurable, bring-your-own-key)
- **Audio:** Web Speech API + TTS

## 🚀 Quick Start

```bash
git clone https://github.com/shengdabai/LinguaLens.git
cd LinguaLens
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

To build for production:

```bash
npm run build
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

Private repository. All rights reserved.

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
npm run preview
```

## 📖 使用说明

首次启动后，打开**设置**，填入一个 AI 服务商的 API 密钥：

| 服务商 | 密钥格式 |
| --- | --- |
| **Gemini** | Google AI Studio 密钥（`AIza...`） |
| **OpenAI** | `sk-...` |
| **Anthropic** | `sk-ant-...` |

密钥**保存在你的浏览器本地**，除你选择的 AI 服务商外不会发送到任何地方。随后选一个功能 —— 把文本粘进阅读器、拍一张照片，或开始一段角色扮演 —— 即可学习。

## 🗺️ 状态

活跃的个人开发项目，在公开构建中。核心功能（阅读、跟读、翻译、流利度教练、SRS、角色扮演、任务）现已可用；工具集随 6000+ 中文学员的真实课堂反馈持续成长。

## 🤝 联系 / 关于

由 **Tony（盛）** 打造 —— 一名拥有 6000+ 学员的中文老师，在公开构建 AI + 中文教学工具。

如果语言透镜对你有用，请 **⭐ Star 本仓库** 并 **[关注 @shengdabai](https://github.com/shengdabai)**，一起见证这段旅程。

**更多在做的中文学习工具：**
- [chinese-mission](https://github.com/shengdabai/chinese-mission)
- [hsk-prep-platform](https://github.com/shengdabai/hsk-prep-platform)
- [ChineseThinking](https://github.com/shengdabai/ChineseThinking)

## 许可

私有仓库，保留所有权利。
