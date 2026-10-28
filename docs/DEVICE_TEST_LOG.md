# LinguaLens iOS Simulator QA Log

**Device:** iPhone 17 Pro Simulator (UDID `71EF77DB-E903-41BC-93F7-1EDE59E71A94`)
**iOS:** 26.4.1
**App:** com.zturns.lingualens (commit at test time: see "tested at" column)
**Tester:** automated via Claude Code

## Legend
- ✅ pass — works as expected
- ⚠️ degraded — works partially or with non-blocking issue
- ❌ broken — feature unusable
- 🚫 simulator-limit — known Apple simulator restriction, must be re-tested on real device
- ⏳ not yet tested

## QA Matrix

| # | Module | Status | Tested at commit | iOS-specific notes | Severity |
|---|---|---|---|---|---|
| 1 | settings | ⏳ | - | enter API key + persist across relaunch | - |
| 2 | profile | ⏳ | - | XP / streak / vocab list display | - |
| 3 | translation | ⏳ | - | EN→ZH translate, breakdown, TTS | - |
| 4 | reader | ⏳ | - | paste Chinese, tap word for analysis | - |
| 5 | omnireader | ⏳ | - | paste/file input + AI clean + TTS | - |
| 6 | snap | ⏳ | - | native camera launch + photo pick + AI analyze | - |
| 7 | shadowing | ⏳ | - | generate text + listen | - |
| 8 | fluency | ⏳ | - | generate practice + record (mic) + AI score | - |
| 9 | script | ⏳ | - | rough draft → polished Chinese output | - |
| 10 | live | ⏳ | - | Gemini Live audio session (WebSocket) | - |
| 11 | roleplay | ⏳ | - | scenario list + dialogue session | - |
| 12 | srs | ⏳ | - | vocab review queue, SM-2 spaced repetition | - |
| 13 | quest | ⏳ | - | gamified task list + completion tracking | - |

## P0 Bug List (must fix for v1)
(none yet — populated as testing reveals)

## P1 Bug List (fix before App Store submit but won't block)
(none yet)

## P2 / Polish (backlog)
(none yet)

## Console log captures
(append per-module raw log slices below as testing happens)
