# Audio regression checks

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

The tests use Node's built-in test runner and the project's locked TypeScript
compiler. They use synthetic audio, microphone doubles, and an isolated Gemini
SDK double, so no API key or provider requests are needed.

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

