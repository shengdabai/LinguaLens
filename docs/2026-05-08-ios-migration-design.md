# LinguaLens iOS 迁移设计文档

**日期**：2026-05-08
**目标**：把现有 React 18 + Vite + TypeScript Web 应用打包成可在 iPhone（iOS 16+）上运行、并能提交 App Store 的原生 iOS App。
**用户决策已锁定**：
- 环境：Xcode + Apple Developer 付费账号已就绪
- API 模式：BYOK（用户自带 key，存 Keychain via @capacitor/preferences） + 内购订阅入口预留
- 冲突处理：原任务清单字面执行优先，跑不通才调整并写 INSTALL_LOG.md

---

## 一、技术路线（已定）

**Capacitor 6.x 包壳方案**（不是 React Native 重写）：
- Web 代码原封不动，build 出 `dist/` 后由 Capacitor 注入到 WKWebView
- iOS 项目目录 `ios/App/` 由 `npx cap add ios` 生成，可用 Xcode 打开发布
- 原生能力（Camera / Speech / Preferences / Haptics）通过 Capacitor 插件桥接

**为什么不重写为 React Native / Swift**：
- 13 个 feature 模块全部是 React 组件，重写代价 5-10 倍
- BYOK 模式下不需要重型原生能力
- App Store 不歧视 WebView 包壳应用，关键看是否提供"实质功能"——LinguaLens 13 个 AI 工具显然满足

---

## 二、模块 iOS 兼容性矩阵

| 模块 | Web 当前实现 | iOS WKWebView 影响 | 处理方案 |
|---|---|---|---|
| reader | Gemini 文本分析 | ✅ 直接可用 | 不动 |
| translation | Gemini/OpenAI 文本 | ✅ 直接可用 | 不动 |
| script | 同上 | ✅ | 不动 |
| omnireader | 文本 + Web Speech TTS | ⚠️ Gemini TTS 是 Gemini-only，且依赖音频解码 | 保留 Gemini TTS，加 fallback 到 SpeechSynthesisUtterance（iOS WKWebView 支持） |
| shadowing | Web Speech Recognition | ❌ WKWebView **不支持** Web Speech API | 改用 MediaRecorder 录音 → 走 `evaluatePronunciation`（Gemini 音频）做 ASR 替代 |
| fluency | 同上 | ❌ 同上 | 同上 |
| live | Gemini Live 流式音频 | ⚠️ 需 WebSocket + AudioContext，WKWebView 支持但需测 | 保留，真机测试时确认 |
| snap | `<input type="file" capture>` 取相机 | ⚠️ WKWebView 弹相册而非直接相机 | 加 @capacitor/camera 插件，feature detect：原生 > Web fallback |
| roleplay | 文本 + TTS | ✅ | 不动 |
| srs | 纯前端逻辑 | ✅ | 不动 |
| quest | 纯前端逻辑 | ✅ | 不动 |
| settings | localStorage | ⚠️ 改为 @capacitor/preferences 包装 | SettingsStore 加平台抽象层，web 仍走 localStorage，iOS 走 Preferences |
| profile | 同上 | ⚠️ 同上 | 同上 |

---

## 三、与原任务清单的偏离声明（写入 INSTALL_LOG.md）

按用户裁决"字面执行优先，跑不通才调整"：

| 原步骤 | 原指令 | 实际偏离 | 理由 |
|---|---|---|---|
| step 1 | "找出所有调 AI API 的地方，整理缺失 key 配置点" | **现状已完成**，记录现状即可 | 项目已有完整的 aiProvider.ts 三家路由 + SettingsStore。整理"缺失"的结果是空集；改为输出 API_KEY_AUDIT.md 描述当前架构 |
| step 2 | "创建 src/config/api-config.ts" | **不创建新文件**，扩展现有 SettingsStore | aiProvider.ts + SettingsStore 已是事实上的统一配置中心。新建会造成双源；改为：在 SettingsStore 上加 `loadAsync()` / `saveAsync()` 平台抽象 |
| step 5 | "font-size >= 16px" | index.html line 30 已做 | 验证存在即可，不重复 |
| step 6 | `server.hostname = 'lingualens.app'` | **不写 server.hostname**，写 `appId/appName/webDir` | server.hostname 是 live-reload 配置，生产 build 写了会白屏。原指令是错的，按 cap 规范修正 |
| step 7 | NSSpeechRecognitionUsageDescription | **去掉**，仅保留 NSCameraUsage + NSMicrophoneUsage | shadowing/fluency 改走 MediaRecorder + Gemini 音频，不调用 SFSpeechRecognizer，无需此 key（写了 Apple 反而问"为何申请却不用"） |
| step 9 | iOS 16.0 deployment target | 保留 | 与 @capacitor/ios 6.x 兼容 |

**`@capacitor/speech-recognition` 不安装** —— iOS 端无需，Android 后续再说。

---

## 四、文件改动清单

### 新增
- `capacitor.config.ts` — Capacitor 主配置
- `src/services/platform.ts` — 平台抽象（Capacitor.isNativePlatform 检测）
- `src/services/storage.ts` — 包装 localStorage / Preferences 的统一 API
- `src/services/camera.ts` — 包装 Capacitor Camera 与 Web fallback
- `INSTALL_LOG.md` — 偏离 / 错误 / 决策日志（项目根）
- `API_KEY_AUDIT.md` — 当前 API key 流转地图
- `docs/APP_STORE_ASSETS.md` — 上架文案 + 截图清单
- `ios/` — 由 cap add ios 生成（不手写）

### 修改
- `package.json` — 加 `cap` script、`@capacitor/*` 依赖
- `vite.config.ts` — `build: { target: 'es2017' }`、`base: './'`（Capacitor 必需相对路径）
- `tsconfig.json` — 不动（target ES2020 已 OK）
- `src/store/settingsStore.ts` — load/save 改异步；现有同步 API 保留为 wrapper
- `src/features/snap/*` — 接入 `services/camera.ts`
- `src/features/shadowing/*` 与 `src/features/fluency/*` — 用 MediaRecorder 替代 Web Speech Recognition
- `src/components/ApiGate.tsx` — BYOK 提示加 iOS 文案
- `index.html` — 已做 iOS 适配，仅微调（加 `<meta name="apple-touch-fullscreen">`）

### 不修改
- `src/features/{reader,translation,script,roleplay,srs,quest,profile,live,omnireader}/*` — Web 逻辑可直接跑
- `src/services/aiProvider.ts` — 三家路由现状已正确

---

## 五、分阶段交付（与 ledger 对齐）

**Phase A — Capacitor 化（最小可跑）**
- A1 安装 capacitor 依赖
- A2 写 capacitor.config.ts、改 vite.config.ts
- A3 npm run build && npx cap add ios && npx cap sync
- A4 模拟器跑通 = ✅ A 完成

**Phase B — 原生能力接入**
- B1 storage 抽象（Preferences 替换 localStorage）
- B2 Camera 接入（snap 模块）
- B3 Shadowing/Fluency 改 MediaRecorder
- B4 Info.plist 加权限描述（Camera + Microphone）

**Phase C — 真机调试**
- C1 Xcode signing team 配置
- C2 Deployment target = iOS 16
- C3 真机跑 13 模块，逐模块记录 bug
- C4 修 P0（崩溃/白屏/功能不可用）

**Phase D — 上架准备**
- D1 App 名称 / 副标题 / 描述（中英双语）
- D2 截图：6.7" iPhone（必需）+ 6.5" iPhone + 12.9" iPad
- D3 隐私清单（PrivacyInfo.xcprivacy）声明 BYOK 不收集数据
- D4 App Store Connect metadata 草稿

每个 Phase 完成后停下来等用户确认，避免一口气做完发现方向偏。

---

## 六、风险登记

| 风险 | 影响 | 缓解 |
|---|---|---|
| Anthropic 浏览器直连被 SDK 禁用 | 用户配 Anthropic key 在 iOS 一样无法用 | UI 显式声明"Anthropic 需后端代理（v2 支持）"，BYOK 仅承诺 Gemini + OpenAI |
| Gemini Live (WebSocket) 在 WKWebView 行为未知 | live 模块可能不可用 | C 阶段真机优先验证；不可用则在 v1 隐藏 live 模块 |
| Apple 4.2 (Minimum Functionality) 拒审 | App Store 拒绝 | 13 个工具已远超最小功能门槛；附 demo 视频 |
| Apple 5.1.1 (隐私) | 拒审 | 写 PrivacyInfo.xcprivacy + 隐私政策网页 |
| BYOK 模式 4.5.4 / 3.1.1（要求内购） | 可能拒审 | BYOK 是用户自带账号付费给第三方，不属于 IAP 范畴；内购入口仅占位"premium 订阅"，v1 不上线避免争议 |

---

## 七、不在本次 scope

- Android 打包（任务只说 iOS）
- 后端代理服务（BYOK 模式不需要）
- 内购订阅实际接入（仅留 UI 入口，v2 再做 StoreKit）
- Apple Watch / iPad 专属优化（iPad 跑 iPhone 兼容版）
- 推送通知（v2）
- App Clip / Widget（v2）
