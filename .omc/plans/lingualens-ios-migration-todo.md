# LinguaLens iOS Migration — Resumable Ledger

**Detail plan:** `docs/plans/2026-05-08-ios-migration.md`
**Spec:** `docs/2026-05-08-ios-migration-design.md`
**Project root:** `/Users/tonysheng/Desktop/项目开发/08-中文教学项目/语言透镜-LinguaLens/`

Resume rule: read this file → skip every `[x]` → continue from first `[ ]`.
Mark `[!]` if blocked, with one-line reason.

## Phase A — Capacitor Wrap
- [ ] A1: write INSTALL_LOG.md + first commit
- [ ] A2: write API_KEY_AUDIT.md + commit
- [ ] A3: npm install Capacitor 6 core/ios/cli + 5 plugins + commit
- [ ] A4: vite.config.ts → base './' + target es2017 + commit
- [ ] A5: capacitor.config.ts + npm scripts + npm run build + cap add ios + cap sync + commit
- [ ] A6: Xcode open + iOS 16 deployment target + simulator smoke test + Settings persists

## Phase B — Native Bridges
- [ ] B1: src/services/storage.ts + SettingsStore route through Storage + main.tsx hydrate + sync + smoke + commit
- [ ] B2: src/services/camera.ts + SnapMode.tsx native button + sync + commit
- [ ] B3: Info.plist 3 usage strings (Camera, PhotoLibrary, Microphone) + sync + commit
- [ ] B4: main.tsx StatusBar setup + sync + commit

## Phase C — Real Device
- [ ] C1: Xcode signing team + bundle id + iPhone trust + ⌘R deploy
- [ ] C2: docs/DEVICE_TEST_LOG.md 13-module test matrix + commit
- [ ] C3: fix all P0 bugs (live module fallback rule: hide if WebSocket fails) + per-fix commits
- [ ] C3-final: re-run all 13 modules, no P0 remains

## Phase D — App Store Submission
- [ ] D1: docs/APP_STORE_ASSETS.md (metadata + EN/CN copy + privacy questionnaire) + commit
- [ ] D2: ios/App/App/PrivacyInfo.xcprivacy + add to Xcode target + commit
- [ ] D3: 5 screenshots × 6.7" + 6.5" → docs/screenshots/ + commit
- [ ] D4: Final pre-submission checklist + Xcode Archive + Distribute + App Store Connect submit

## Decision log (append as we go)
- 2026-05-08: brainstorm done, spec approved, plan written. Awaiting user choice on execution mode (subagent-driven vs inline).
