# LinguaLens iOS Migration — Install Log

Single source of truth for deviations from the original 12-step task list.
Append-only. Each entry: date / step / what changed / why.

## Deviations from original task list

| Date | Original step | What we did instead | Reason |
|---|---|---|---|
| 2026-05-08 | step 1 ("find missing API key config points") | Documented existing architecture in `API_KEY_AUDIT.md`; no missing points found | `aiProvider.ts` + `SettingsStore` already implement unified BYOK routing for Gemini/OpenAI/Anthropic |
| 2026-05-08 | step 2 ("create src/config/api-config.ts") | Did NOT create new file; extended `SettingsStore` with async storage abstraction in Phase B1 | New file would create a dual source of truth; `SettingsStore` is already the unified config layer |
| 2026-05-08 | step 6 (`server.hostname = 'lingualens.app'`) | Omitted `server.hostname`; set only `appId/appName/webDir/ios` | `server.hostname` is dev-only live-reload config; setting it in production causes white screen because WebView fails to load local bundle |
| 2026-05-08 | step 7 (NSSpeechRecognitionUsageDescription) | Omitted — kept only NSCameraUsageDescription + NSPhotoLibraryUsageDescription + NSMicrophoneUsageDescription | App does not call `SFSpeechRecognizer`; pronunciation eval uses MediaRecorder + Gemini audio analysis. Apple rejects unused-purpose strings under guideline 5.1.1 |
| 2026-05-08 | "@capacitor/speech-recognition" install | Did NOT install | iOS plugin is unmaintained and the app has no use case for it (shadowing/fluency already use MediaRecorder) |
| 2026-05-08 | step 5 ("font-size >= 16px to prevent iOS zoom") | Verified already present in `index.html` line 30 | Pre-existing `input,textarea,select { font-size: 16px }` covers requirement |

## Issue log

(append issues as encountered: date / module / symptom / resolution)

| Date | Module / Step | Symptom | Resolution |
|---|---|---|---|
| 2026-05-08 | Pre-flight env | `xcode-select` pointing to CommandLineTools, `xcodebuild` unavailable, `pod` not installed | Installed CocoaPods 1.16.2 via Homebrew; user to switch xcode-select to /Applications/Xcode.app via switch script |
