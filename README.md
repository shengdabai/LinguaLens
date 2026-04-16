# LinguaLens

An immersive Chinese language learning toolkit with AI-powered reading, shadowing, translation, and fluency coaching. Built with React, TypeScript, and Vite.

语言透镜 -- 基于 AI 的沉浸式中文学习工具集，支持阅读、跟读、翻译和流利度训练。

## Features / 功能特性

- **Immersive Reader** -- AI-annotated Chinese text reading with instant lookup
- **Shadowing** -- Follow-along speaking practice with speech recognition
- **Translation Bridge** -- Smart translation with bilingual comparison and TTS
- **OmniReader** -- Unified reading experience across multiple input formats
- **Fluency Coach** -- AI-driven fluency assessment and feedback
- **Script Drafting** -- Chinese writing assistance with AI suggestions
- **Snap Mode** -- Quick capture and learn from any Chinese text
- **Live Session** -- Real-time conversation practice
- **SRS Review** -- Spaced repetition system for vocabulary retention
- **Quest System** -- Gamified learning challenges
- **Roleplay** -- Scenario-based conversation practice
- **Profile & Settings** -- Multi-provider AI configuration (Gemini, OpenAI, Anthropic)

## Tech Stack / 技术栈

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI Providers**: Google Gemini, OpenAI, Anthropic (user-configurable)
- **Audio**: Web Speech API + TTS

## Project Structure / 项目结构

```
src/
├── App.tsx             # Main app layout
├── features/           # Feature modules
│   ├── reader/         # Immersive reader
│   ├── shadowing/      # Speaking practice
│   ├── translation/    # Translation bridge
│   ├── omnireader/     # Universal reader
│   ├── fluency/        # Fluency coaching
│   ├── script/         # Writing assistant
│   ├── snap/           # Quick capture
│   ├── live/           # Live sessions
│   ├── srs/            # Spaced repetition
│   ├── quest/          # Learning quests
│   ├── roleplay/       # Scenario practice
│   ├── settings/       # AI provider config
│   └── profile/        # User profile
├── services/           # AI provider, audio utilities
├── components/         # Shared UI components
├── store/              # State management
├── config/             # App configuration
├── types/              # TypeScript types
└── utils/              # Helper functions
```

## Getting Started / 快速开始

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Configuration / 配置

On first launch, go to Settings to configure your AI provider API key:

- **Gemini**: Google AI Studio key (`AIza...`)
- **OpenAI**: API key (`sk-...`)
- **Anthropic**: API key (`sk-ant-...`)

Keys are stored locally in your browser and never sent to any server other than the respective AI provider.

## License

Private repository. All rights reserved.
