# API Key Audit

Generated: 2026-05-08 — Phase A2 of iOS migration.

## Storage
- Key: `lingualens_settings` in `localStorage`
- Constant: `SETTINGS_KEY` in `src/config/constants.ts:9`
- Shape: `AppSettings` from `src/types/index.ts:148-162`
- Per-provider keys:
  - `apiKey` — Gemini (also used for Live, TTS, pronunciation eval — those are Gemini-only)
  - `apiKeyOpenAI`
  - `apiKeyAnthropic`

## Read path
`SettingsStore.getApiKeyForProvider(provider)` → `src/store/settingsStore.ts:41-50`
Falls back to `import.meta.env.VITE_GEMINI_API_KEY` for Gemini only when localStorage value is empty (dev convenience).

## Write path
Settings page (`src/features/settings/SettingsPage.tsx`) → `SettingsStore.update({...})` → `localStorage.setItem`.

## Consumers
- `src/services/aiProvider.ts` — text generation across all 3 providers (`generateText`)
- `src/services/geminiService.ts:18` — Gemini-only features (`getGeminiAI()` for TTS, Live, audio eval)
- `src/components/ApiGate.tsx` — gate component shown when `SettingsStore.hasAccess()` is false

## Anthropic limitation (existing behavior, not a regression)
`callAnthropic()` (`src/services/aiProvider.ts:143-150`) throws `"Anthropic direct browser access is disabled for security."`

Reason: the Anthropic SDK requires `dangerouslyAllowBrowser: true` and the API does not return CORS headers; production-grade BYOK on web/iOS WKWebView for Anthropic requires a backend proxy, which is out of v1 scope.

**v1 user-visible behavior:** Settings page should label Anthropic as "Requires backend proxy (coming soon)". Code change deferred to v1 polish (not blocking iOS migration).

## Conclusion
No missing key configuration points. Original task-list step 1 is satisfied as-is by the existing architecture. iOS migration only needs to swap the underlying storage from `localStorage` to `@capacitor/preferences` for native persistence — handled in Phase B1.
