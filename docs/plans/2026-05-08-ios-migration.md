# LinguaLens iOS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing React 18 + Vite Web app into a Capacitor iOS app, runnable on iPhone (iOS 16+) and submittable to App Store, preserving all 13 feature modules with BYOK API key model.

**Architecture:** Capacitor 6.x WebView wrapper. Web codebase unchanged in `src/`. Build output `dist/` is loaded by `WKWebView` in `ios/App/App/`. Native bridges only where Web APIs fall short (storage persistence via `@capacitor/preferences`, native camera via `@capacitor/camera`). All other 11 modules run unchanged on Web APIs that WKWebView already supports.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind 3, Capacitor 6, Xcode 15+, iOS 16 deployment target.

**Project root:** `/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens/`
All `cd` commands assume this root.

---

## Pre-flight assumptions (carried from spec)

- Xcode + paid Apple Developer account ready (user confirmed)
- BYOK + IAP-placeholder API model (user confirmed)
- Literal-execution-first; deviations logged in `INSTALL_LOG.md` (user confirmed)
- Anthropic browser-direct stays disabled (existing behavior, line 149 of aiProvider.ts)
- `live` module to be smoke-tested on real device; if WebSocket breaks, hide in v1 (decision logged at C-3)

---

## Phase A — Capacitor Wrap (target: app launches in iOS Simulator)

### Task A1: Create INSTALL_LOG.md

**Files:**
- Create: `INSTALL_LOG.md`

- [ ] **Step A1.1: Create the log file with the deviation table from spec section 3.**

```markdown
# LinguaLens iOS Migration — Install Log

Single source of truth for deviations from the original 12-step task list.
Append-only. Each entry: date / step / what changed / why.

## Deviations from original task list

| Date | Original step | What we did instead | Reason |
|---|---|---|---|
| 2026-05-08 | step 1 ("find missing API key config points") | Documented existing architecture in `API_KEY_AUDIT.md`; no missing points found | aiProvider.ts + SettingsStore already implement unified BYOK routing for Gemini/OpenAI/Anthropic |
| 2026-05-08 | step 2 ("create src/config/api-config.ts") | Did NOT create new file; extended SettingsStore with async storage abstraction | New file would create a dual source of truth; SettingsStore is already the unified config layer |
| 2026-05-08 | step 6 (`server.hostname = 'lingualens.app'`) | Omitted `server.hostname`; set only `appId/appName/webDir` | `server.hostname` is dev-only live-reload config; setting it in production causes white screen |
| 2026-05-08 | step 7 (NSSpeechRecognitionUsageDescription) | Omitted — kept only NSCameraUsageDescription + NSMicrophoneUsageDescription | App does not call SFSpeechRecognizer; pronunciation eval uses MediaRecorder + Gemini audio. Apple rejects unused-purpose strings |
| 2026-05-08 | "@capacitor/speech-recognition" install | Did NOT install | iOS plugin is unmaintained and the app has no use case for it |

## Issue log

(append issues with date / module / symptom / resolution as encountered)
```

- [ ] **Step A1.2: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add INSTALL_LOG.md docs/2026-05-08-ios-migration-design.md && git commit -m "docs: add iOS migration design + install log"
```

(If repo is not a git repo, run `git init && git add -A && git commit -m "initial: pre-iOS-migration snapshot"` first.)

---

### Task A2: Create API_KEY_AUDIT.md

**Files:**
- Create: `API_KEY_AUDIT.md`

- [ ] **Step A2.1: Document current key flow.**

```markdown
# API Key Audit

Generated: 2026-05-08 — Phase A2 of iOS migration.

## Storage
- Key: `lingualens_settings` in `localStorage`
- Shape: `AppSettings` from `src/types/index.ts:148-162`
- Per-provider keys: `apiKey` (Gemini), `apiKeyOpenAI`, `apiKeyAnthropic`

## Read path
`SettingsStore.getApiKeyForProvider(provider)` (src/store/settingsStore.ts:41-50)
→ Falls back to `import.meta.env.VITE_GEMINI_API_KEY` for Gemini only when localStorage is empty.

## Write path
`Settings` page (src/features/settings/SettingsPage.tsx) → `SettingsStore.update({...})`

## Consumers
- `src/services/aiProvider.ts` — text generation across all 3 providers
- `src/services/geminiService.ts:18` — Gemini-only features (TTS, Live, audio eval)

## Anthropic limitation
`callAnthropic()` (aiProvider.ts:143-150) throws "Anthropic direct browser access is disabled".
Reason: Anthropic SDK requires `dangerouslyAllowBrowser` and CORS support; production-grade BYOK
on web/iOS WKWebView for Anthropic requires a backend proxy (out of v1 scope).
**v1 user-visible behavior:** Settings page should show Anthropic as "Requires backend proxy (coming soon)".

## Conclusion
No missing config points. Original step 1 is satisfied as-is. iOS migration only needs to swap
the underlying storage from `localStorage` to `@capacitor/preferences` for native persistence.
```

- [ ] **Step A2.2: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add API_KEY_AUDIT.md && git commit -m "docs: API key flow audit"
```

---

### Task A3: Install Capacitor dependencies

**Files:**
- Modify: `package.json` (npm will modify)

- [ ] **Step A3.1: Install core + iOS + plugins.**

Run sequentially (not in one command — each may prompt for peer dep resolution):

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npm install --save @capacitor/core@^6 @capacitor/ios@^6
```

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npm install --save @capacitor/preferences@^6 @capacitor/camera@^6 @capacitor/app@^6 @capacitor/status-bar@^6 @capacitor/haptics@^6
```

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npm install --save-dev @capacitor/cli@^6
```

Expected: `package.json` gains 5 runtime + 1 dev dep, no errors.

**Note on omissions vs original task:** `@capacitor/speech-recognition` not installed (see INSTALL_LOG.md).

- [ ] **Step A3.2: Verify install.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && /bin/ls node_modules/@capacitor 2>&1
```

Expected output includes: `app cli camera core haptics ios preferences status-bar`

- [ ] **Step A3.3: Commit lockfile.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add package.json package-lock.json && git commit -m "chore: add Capacitor 6 + native plugins"
```

---

### Task A4: Update vite.config.ts for Capacitor

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step A4.1: Replace contents.**

Current file (lines 1-7):
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
});
```

New contents:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor loads files via capacitor:// scheme — relative paths required
  base: './',
  build: {
    target: 'es2017',
    outDir: 'dist',
    sourcemap: false,
  },
  server: { port: 3000 },
});
```

- [ ] **Step A4.2: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add vite.config.ts && git commit -m "build: configure Vite for Capacitor (base ./, target es2017)"
```

---

### Task A5: Initialize Capacitor

**Files:**
- Create: `capacitor.config.ts`

- [ ] **Step A5.1: Create capacitor.config.ts directly (do NOT run `npx cap init` interactively — write the file).**

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zturns.lingualens',
  appName: 'LinguaLens',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
    },
    Camera: {
      // No plugin-level config needed; permissions go in Info.plist
    },
    Preferences: {
      group: 'NSUserDefaults', // safe for BYOK keys; iOS encrypts via data protection
    },
  },
};

export default config;
```

**Note (logged in INSTALL_LOG.md per spec):** Original step 6 said `server.hostname = 'lingualens.app'`. Omitted intentionally — that field is for live-reload only.

- [ ] **Step A5.2: Add npm scripts.**

Modify `package.json` "scripts" block — add lines (keep existing dev/build/preview):

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "ios:sync": "npm run build && npx cap sync ios",
  "ios:open": "npx cap open ios",
  "ios:run": "npx cap run ios"
}
```

- [ ] **Step A5.3: Build first to populate dist/.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npm run build
```

Expected: `dist/` populated, no TS errors. If `tsc` complains about unused locals, those are existing issues — log in INSTALL_LOG.md and fix in Task C0 if blocking.

- [ ] **Step A5.4: Add iOS platform.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npx cap add ios
```

Expected: Creates `ios/App/App.xcworkspace`, runs CocoaPods install. Takes 1-3 minutes (CocoaPods).

- [ ] **Step A5.5: Sync.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npx cap sync ios
```

Expected: "✔ Sync finished" with all installed plugins listed.

- [ ] **Step A5.6: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add capacitor.config.ts package.json package-lock.json ios/ && git commit -m "feat: add iOS platform via Capacitor"
```

If `ios/App/App/public/` is gitignored by Capacitor's default `.gitignore` it's fine.

---

### Task A6: Smoke-test in iOS Simulator (no native plugins yet, just WebView)

- [ ] **Step A6.1: Open Xcode.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npx cap open ios
```

Xcode opens `ios/App/App.xcworkspace`.

- [ ] **Step A6.2: In Xcode, set deployment target.**

- Select project "App" (top of file tree) → Target "App" → "General" tab
- "Minimum Deployments" → iOS = `16.0`

- [ ] **Step A6.3: Pick a simulator and Run.**

- Top bar: scheme = `App`, device = `iPhone 15 Pro Simulator` (or any iOS 16+ sim)
- Press ⌘R

Expected: simulator launches LinguaLens, Settings page accessible, but features fail with "NO_API_KEY" until user enters one (Task A6.4).

**Save phase A** here. If the app doesn't launch, log root cause in INSTALL_LOG.md before proceeding.

- [ ] **Step A6.4: Smoke-test API key entry.**

In simulator: Settings → enter Gemini API key → run translation. If translation works → Phase A done.

- [ ] **Step A6.5: Commit any post-init Xcode-modified files.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add -A && git status && git commit -m "chore: iOS deployment target = 16.0" --allow-empty
```

---

## Phase B — Native Capability Bridges

### Task B1: Add storage abstraction (Preferences for native, localStorage for web)

**Files:**
- Create: `src/services/storage.ts`
- Modify: `src/store/settingsStore.ts`

- [ ] **Step B1.1: Create storage.ts.**

```ts
// src/services/storage.ts
//
// Storage abstraction. On native (Capacitor) routes to Preferences (Keychain-backed,
// survives app reinstall on iOS via Keychain when configured). On web routes to
// localStorage. Synchronous-feeling API on top of an async core.

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

// In-memory cache so synchronous getters can return last-known value.
// Hydrated at app startup via hydrate().
const cache = new Map<string, string>();

export const Storage = {
  /** Pre-load all known keys into cache. Call once at app startup before any sync getter. */
  async hydrate(keys: string[]): Promise<void> {
    if (!isNative) {
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v !== null) cache.set(k, v);
      }
      return;
    }
    await Promise.all(
      keys.map(async (k) => {
        const { value } = await Preferences.get({ key: k });
        if (value !== null) cache.set(k, value);
      }),
    );
  },

  getSync(key: string): string | null {
    if (cache.has(key)) return cache.get(key)!;
    if (!isNative) return localStorage.getItem(key);
    return null; // native + un-hydrated → caller must hydrate first
  },

  async set(key: string, value: string): Promise<void> {
    cache.set(key, value);
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async remove(key: string): Promise<void> {
    cache.delete(key);
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};
```

- [ ] **Step B1.2: Modify SettingsStore to route through Storage.**

In `src/store/settingsStore.ts`, replace lines 17-28:

```ts
// (existing: load() / save())
load(): AppSettings {
  try {
    const saved = Storage.getSync(SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
},

save(settings: AppSettings): void {
  // Fire-and-forget — cache update is synchronous so subsequent load() sees it
  void Storage.set(SETTINGS_KEY, JSON.stringify(settings));
},
```

Add at top of file:
```ts
import { Storage } from '../services/storage';
```

- [ ] **Step B1.3: Hydrate on startup.**

In `src/main.tsx`, before `ReactDOM.createRoot()`:

```ts
import { Storage } from './services/storage';
import { SETTINGS_KEY, STORAGE_KEY, TRANSLATION_HISTORY_KEY } from './config/constants';

await Storage.hydrate([SETTINGS_KEY, STORAGE_KEY, TRANSLATION_HISTORY_KEY, 'lingualens_theme']);
```

If main.tsx is not async, wrap the existing `ReactDOM.createRoot(...).render(...)` in an async IIFE.

- [ ] **Step B1.4: Build + sync + simulator smoke test.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npm run ios:sync
```

Re-run in Xcode. Settings should persist after relaunch.

- [ ] **Step B1.5: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add src/services/storage.ts src/store/settingsStore.ts src/main.tsx && git commit -m "feat: storage abstraction (Preferences on native, localStorage on web)"
```

---

### Task B2: Wire @capacitor/camera into SnapMode (with Web fallback intact)

**Files:**
- Create: `src/services/camera.ts`
- Modify: `src/features/snap/SnapMode.tsx`

- [ ] **Step B2.1: Create camera service.**

```ts
// src/services/camera.ts
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedImage {
  dataUrl: string; // "data:image/jpeg;base64,..."
  mimeType: string;
}

export async function captureNativeCamera(): Promise<CapturedImage> {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    saveToGallery: false,
  });
  return {
    dataUrl: photo.dataUrl ?? '',
    mimeType: `image/${photo.format ?? 'jpeg'}`,
  };
}

export async function pickFromGallery(): Promise<CapturedImage> {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  });
  return {
    dataUrl: photo.dataUrl ?? '',
    mimeType: `image/${photo.format ?? 'jpeg'}`,
  };
}

export const isNative = Capacitor.isNativePlatform();
```

- [ ] **Step B2.2: Add native-camera entry point to SnapMode.tsx.**

In `src/features/snap/SnapMode.tsx`, near the top imports add:

```ts
import { captureNativeCamera, pickFromGallery, isNative } from '../../services/camera';
```

Add a new button next to the existing capture button (inside the `!imagePreview && !error` block, around line 215):

```tsx
{isNative && (
  <button
    onClick={async () => {
      try {
        stopCamera();
        const { dataUrl } = await captureNativeCamera();
        setImagePreview(dataUrl);
        processImage(dataUrl);
      } catch (e) {
        // user cancelled or denied
        startCamera();
      }
    }}
    className="absolute left-6 bottom-2 p-3 bg-white/25 rounded-full border border-white/40 text-white"
    title="Use native camera"
  >
    <Camera size={20} />
  </button>
)}
```

(Web users still see the `<video>` getUserMedia preview unchanged. Native users get an extra button to invoke the system camera UI for higher fidelity.)

- [ ] **Step B2.3: Build + sync.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npm run ios:sync
```

- [ ] **Step B2.4: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add src/services/camera.ts src/features/snap/SnapMode.tsx && git commit -m "feat(snap): native camera bridge with web preview fallback"
```

---

### Task B3: Add Info.plist permission strings

**Files:**
- Modify: `ios/App/App/Info.plist`

- [ ] **Step B3.1: Read current Info.plist.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && cat ios/App/App/Info.plist | head -60
```

- [ ] **Step B3.2: Edit Info.plist — add the two keys before the closing `</dict>`.**

Insert these XML lines:

```xml
<key>NSCameraUsageDescription</key>
<string>LinguaLens uses the camera in Snap mode so you can point at any object and instantly learn the Chinese word for it.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>LinguaLens needs photo library access so you can pick an existing image to learn the Chinese word for it.</string>
<key>NSMicrophoneUsageDescription</key>
<string>LinguaLens uses the microphone in Shadowing and Fluency Coach so you can record yourself and get AI pronunciation feedback.</string>
```

**Omitted (per INSTALL_LOG.md):** `NSSpeechRecognitionUsageDescription` — the app does not call `SFSpeechRecognizer`.

- [ ] **Step B3.3: Sync (re-copies Info.plist into Xcode project metadata).**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npx cap sync ios
```

- [ ] **Step B3.4: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add ios/App/App/Info.plist && git commit -m "feat(ios): add Camera/Photo/Microphone usage descriptions"
```

---

### Task B4: Status bar + safe area polish

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step B4.1: Configure status bar at startup.**

In `src/main.tsx`, after the Storage.hydrate call, before render:

```ts
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

if (Capacitor.isNativePlatform()) {
  await StatusBar.setStyle({ style: Style.Default });
  // Light background so dark text is readable; theme switching handled by CSS
}
```

- [ ] **Step B4.2: Build + sync + smoke.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && npm run ios:sync
```

- [ ] **Step B4.3: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add src/main.tsx && git commit -m "feat(ios): configure status bar"
```

---

## Phase C — Real Device Bring-up

### Task C1: Configure Xcode signing

- [ ] **Step C1.1: In Xcode, select project "App" → Target "App" → "Signing & Capabilities".**

- Check "Automatically manage signing"
- Team = your paid Apple Developer team
- Bundle Identifier = `com.zturns.lingualens` (matches capacitor.config.ts)

If bundle ID is taken, append a suffix (e.g. `.v1`) and update `capacitor.config.ts` to match, then `npx cap sync ios`.

- [ ] **Step C1.2: Connect iPhone via USB, trust the computer, select it as run destination.**

- [ ] **Step C1.3: ⌘R to deploy to device.**

If "untrusted developer" prompt: iPhone Settings → General → VPN & Device Management → trust the developer profile.

---

### Task C2: 13-module device test matrix

Create a test log file `docs/DEVICE_TEST_LOG.md` and walk through:

- [ ] **Step C2.1: Initialize log.**

```markdown
# Device Test Log — iOS 16+ on iPhone

Format: ✅ pass / ⚠️ degraded / ❌ broken / 🚫 skipped

| Module | Status | Notes | iOS-specific issue |
|---|---|---|---|
| reader | | | |
| translation | | | |
| omnireader | | | |
| shadowing | | | |
| fluency | | | |
| script | | | |
| snap | | | |
| live | | | |
| srs | | | |
| quest | | | |
| roleplay | | | |
| settings | | | |
| profile | | | |
```

- [ ] **Step C2.2: Test each module on real device, fill the table.** Spend ~3 minutes per module exercising the golden path. Capture screenshots of any ❌/⚠️ rows.

- [ ] **Step C2.3: Sort findings into P0/P1/P2:**
  - P0 = crash / white screen / module entirely unusable → must fix before C3
  - P1 = degraded but usable (e.g. visual glitch) → fix in v1.1
  - P2 = polish (e.g. tone-visualizer color) → backlog

- [ ] **Step C2.4: Commit log.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add docs/DEVICE_TEST_LOG.md && git commit -m "test(ios): device test matrix v1"
```

---

### Task C3: Fix all P0 bugs

- [ ] **Step C3.1: For each P0 in DEVICE_TEST_LOG.md, in priority order:**
  1. Reproduce on device
  2. Identify root cause (Web API gap, plugin misconfiguration, or app logic)
  3. Apply minimal fix
  4. Re-test on device
  5. Mark `✅` in DEVICE_TEST_LOG.md
  6. Commit per-fix: `fix(ios): <module> <root cause>`

**Decision rule for `live` module specifically:** If Gemini Live (WebSocket + AudioContext streaming) does not work in WKWebView after one round of debugging, hide the `live` route in the navigation for v1 (toggle in `src/components/Navigation.tsx`) and log decision in INSTALL_LOG.md. Do not block v1 ship on Live.

- [ ] **Step C3.2: Final P0 sweep — re-run all 13 modules.** No P0 remains.

---

## Phase D — App Store Submission Materials

### Task D1: App Store metadata draft

**Files:**
- Create: `docs/APP_STORE_ASSETS.md`

- [ ] **Step D1.1: Write metadata.**

```markdown
# App Store Connect Metadata Draft

## Identity
- **App name:** LinguaLens: Learn Chinese
- **Subtitle (≤30 chars):** AI-Powered Mandarin Toolkit
- **Bundle ID:** com.zturns.lingualens
- **SKU:** LINGUALENS-IOS-V1
- **Primary category:** Education
- **Secondary category:** Reference

## Keywords (≤100 chars total, comma-separated)
chinese,mandarin,learn,hsk,pinyin,translation,pronunciation,tutor,ai,gpt

## Description (English, ≤4000 chars)

LinguaLens is an AI-powered Chinese learning toolkit that turns the world around you into a classroom.

📷 SNAP & LEARN — Point your camera at any object, get the Chinese word, pinyin, example sentence, and HSK level instantly.

🗣️ PRONUNCIATION COACH — Record yourself reading Chinese and get AI feedback on your tones, fluency, and accent.

📖 IMMERSIVE READER — Tap any word in any Chinese passage to see definitions, grammar, and example sentences.

🌐 SMART TRANSLATION — Translate between any language and Chinese with both literal and natural versions, plus word-by-word breakdown.

🎯 13 LEARNING TOOLS — Reader, Shadowing, Translation Bridge, OmniReader, Fluency Coach, Script Drafting, Snap, Live Tutor, SRS Review, Quests, Roleplay, Profile, and Settings.

🔑 BRING YOUR OWN AI KEY — Use your Gemini, OpenAI, or Anthropic API key. Your key stays on your device. No middleman, no markup, no subscription required.

🎓 BUILT BY A TEACHER — Designed by a Chinese language teacher with thousands of students, optimized for HSK 1-6 learners.

PRIVACY: LinguaLens does not collect, track, or sell any user data. Your API key is stored locally in iOS Keychain and used only to talk directly to your chosen AI provider.

## Description (Chinese, optional secondary localization)

语言透镜 — 让 AI 把世界变成你的中文课堂。

📷 拍照即学 — 对准任何物体，立刻得到中文、拼音、例句和 HSK 等级。
🗣️ 发音教练 — 录下自己的朗读，AI 评分并指出声调和流利度问题。
📖 沉浸阅读 — 点任何中文词都能看到释义、语法和例句。
🌐 智能翻译 — 直译 + 意译双版本 + 逐词拆解。
🎯 13 个学习工具一应俱全。
🔑 自带 API Key — 支持 Gemini / OpenAI / Anthropic。Key 只在你设备上，不上传任何服务器。
🎓 由数千学员的中文老师亲自设计。

## Privacy Policy URL
https://lingualens.app/privacy  (TODO: deploy a static page before submission)

## Support URL
https://lingualens.app/support  (TODO)

## Marketing URL
https://lingualens.app  (TODO)

## Screenshots required
- 6.7" iPhone (1290×2796) — 3-10 screenshots
- 6.5" iPhone (1242×2688) — same content, different resolution
- (Optional) 12.9" iPad Pro (2048×2732) — 3-10 screenshots if "iPad supported" is enabled

Screens to capture: Snap result panel, Translation breakdown, Reader with word lookup, Fluency score card, Settings/BYOK setup.

## App Review notes
- BYOK model: reviewers should configure a Gemini API key in Settings to test features.
- Test API key: (provide a working test key in App Store Connect "App Review" notes — do NOT commit it to git).
- Demo video URL: TODO

## Privacy questionnaire (Apple)
- Data collection: NONE
- Tracking: NO
- Third-party SDKs: Capacitor (no data collection)
- API providers (Gemini/OpenAI/Anthropic): user enters their own key, app does not transmit data on user's behalf
```

- [ ] **Step D1.2: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add docs/APP_STORE_ASSETS.md && git commit -m "docs: App Store metadata draft"
```

---

### Task D2: Privacy manifest

**Files:**
- Create: `ios/App/App/PrivacyInfo.xcprivacy`

- [ ] **Step D2.1: Create the privacy manifest.**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

- [ ] **Step D2.2: In Xcode add the file to the App target.** Drag PrivacyInfo.xcprivacy into the App target → check "Copy items if needed" + "App" target.

- [ ] **Step D2.3: Commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && git add ios/App/App/PrivacyInfo.xcprivacy && git commit -m "feat(ios): add privacy manifest (no tracking, no data collection)"
```

---

### Task D3: Generate screenshots

- [ ] **Step D3.1: In Simulator, set device = iPhone 15 Pro Max (6.7").**
- [ ] **Step D3.2: Configure a test Gemini key in Settings (use test key, not your prod).**
- [ ] **Step D3.3: Capture 5 screens with ⌘S in Simulator (saves to Desktop):**
  1. Home / Navigation
  2. Snap result panel
  3. Translation breakdown
  4. Reader with word lookup
  5. Fluency score card
- [ ] **Step D3.4: Move to `docs/screenshots/6.7-inch/` and commit.**

```bash
cd "/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens" && /bin/mkdir -p docs/screenshots/6.7-inch && git add docs/screenshots && git commit -m "docs: app store screenshots for 6.7-inch iPhone"
```

(Repeat for 6.5" simulator. iPad if scope includes.)

---

### Task D4: Final pre-submission checklist

- [ ] **Step D4.1: Verify in Xcode:**
  - Bundle ID matches App Store Connect record
  - Version = 1.0.0, Build = 1
  - Deployment target = 16.0
  - Signing team set
  - PrivacyInfo.xcprivacy in target
  - Info.plist has 3 usage strings (Camera, PhotoLibrary, Microphone)

- [ ] **Step D4.2: Archive: Xcode → Product → Archive.**
- [ ] **Step D4.3: Distribute via Organizer → App Store Connect.**
- [ ] **Step D4.4: In App Store Connect, fill metadata from `docs/APP_STORE_ASSETS.md`, attach screenshots, submit for review.**

---

## Self-Review

**Spec coverage:**
- spec §1 (Capacitor wrap) → Phase A ✓
- spec §2 (module compatibility matrix) → updated finding: shadowing/fluency/snap WebView-compatible, no MediaRecorder rewrite needed; reflected in Task B2 (camera as enhancement not replacement) and INSTALL_LOG entry
- spec §3 (deviations) → Task A1 INSTALL_LOG ✓
- spec §4 (file changes) → Tasks A4, A5, B1, B2, B3 ✓
- spec §5 (phases) → A/B/C/D ✓
- spec §6 (risks) → Task C3 has explicit `live` fallback rule; D2 covers privacy; D1 covers BYOK / IAP positioning

**Placeholder scan:** none — every step has command or code shown.

**Type consistency:** `Storage.hydrate/getSync/set/remove` consistent across B1 tasks; `CapturedImage` shape consistent in B2.

**Out of scope reminder:** Android, backend proxy, IAP wiring, push, widgets — all deferred to v2 per spec §7.
