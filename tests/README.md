# Local regression checks

Install dependencies from the existing lockfile:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

## Tests that run without a browser

```sh
npm run typecheck
npm run test:audio
npm run build
```

The `test:audio` script collects all `tests/*.test.mjs`, including audio, SRS
review and OmniReader regressions. Tests use Node's built-in test runner and the
project's locked TypeScript compiler. They use synthetic cards/audio, microphone
doubles, and isolated AI service doubles, so no API key or provider requests are
needed. Component tests exercise real render functions and event handlers with
hook doubles; they do not verify React DOM integration, focus, layout or codecs.

Vite normally loads `.env` files during builds. For credential-isolated checks,
use a temporary HOME, an environment without provider credentials, and a Vite
config that imports `vite.config.ts` and overrides only `envDir` to an empty
directory. Do not copy real credentials into test fixtures.

## Browser integration checks

```sh
PLAYWRIGHT_MODULE=/path/to/an/already-installed/playwright-core/index.mjs \
  npm run test:audio-browser
```

If Playwright is available as a local package, omit `PLAYWRIGHT_MODULE`. If its
cached browser version does not match, `CHROME_HEADLESS_SHELL` may name an existing
headless-shell launcher. The runner never downloads or installs anything.

The runner opens only a local Vite fixture with the real React component. It
blocks external requests and replaces microphone capture with synthetic data.
It closes its browser and server in `finally`, including launch failure.
It does not verify real microphone codecs, iOS permissions, AI evaluation, or
device behavior. The tests do not modify operating-system permission settings.

Also check SRS with at least three due cards: grade all of them, confirm no card
is skipped, then restart against the latest due queue. For OmniReader, mock TTS
responses to test empty audio, a rejected audio resume, Back during generation,
unmount during decoding, pause/resume, natural completion, and an old response
arriving after a new request. Confirm error announcements and the play/pause
button's accessible name in the browser.

