import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

// Supply an already-installed Playwright module; this runner never installs packages.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({
  server: { host: '127.0.0.1', port: 0, strictPort: true },
  plugins: process.env.AUDIO_RECORDER_BASELINE ? [{
    name: 'recording-baseline',
    enforce: 'pre',
    transform(_code, id) {
      if (id.endsWith('/src/features/fluency/AudioRecorder.tsx')) {
        return readFileSync(new URL('../.omc/verification/u05-before/src/features/fluency/AudioRecorder.tsx', import.meta.url), 'utf8');
      }
    },
  }] : [],
});
let browser;

try {
  await server.listen();
  const address = server.httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_HEADLESS_SHELL ? { executablePath: process.env.CHROME_HEADLESS_SHELL } : {}),
  });
  await test('AudioRecorder browser regression suite', async t => {
    let page;
    t.beforeEach(async () => {
      page = await browser.newPage();
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
      });
      await page.addInitScript(() => {
        const state = window.recordingTest = {
          requests: 0, stoppedTracks: 0, created: [], revoked: [],
          pending: false, fail: '', empty: false, instances: [],
        };
        Object.defineProperty(navigator, 'mediaDevices', { value: {
          getUserMedia: async () => {
            state.requests++;
            if (state.fail === 'permission') throw new Error('Permission denied');
            const stream = { getTracks: () => [{ stop: () => state.stoppedTracks++ }] };
            if (state.pending) return new Promise(resolve => { state.resolveStream = () => resolve(stream); });
            return stream;
          },
        } });
        window.MediaRecorder = class {
          mimeType = 'audio/mp4';
          state = 'inactive';
          constructor() {
            if (state.fail === 'constructor') throw new Error('Unsupported recorder');
            state.instances.push(this);
          }
          start() {
            if (state.fail === 'start') throw new Error('Recorder failed to start');
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            this.ondataavailable?.({ data: new Blob(state.empty ? [] : [new Uint8Array(2048)], { type: this.mimeType }) });
            queueMicrotask(() => this.onstop?.());
          }
        };
        const create = URL.createObjectURL.bind(URL);
        const revoke = URL.revokeObjectURL.bind(URL);
        URL.createObjectURL = blob => { const url = create(blob); state.created.push(url); return url; };
        URL.revokeObjectURL = url => { state.revoked.push(url); revoke(url); };
      });
      await page.goto(`${origin}/tests/fixtures/audio-recorder.html`);
      await page.getByRole('button', { name: 'Start recording', exact: true }).waitFor();
    });
    t.afterEach(async () => { await page.close(); });

    await t.test('preserves MP4 MIME type for evaluation and stops tracks', async () => {
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      await page.getByRole('button', { name: 'Stop recording', exact: true }).click();
      await page.getByRole('button', { name: 'Evaluate', exact: true }).click();
      assert.equal(await page.getByLabel('Submitted audio type').textContent(), 'audio/mp4');
      assert.equal(await page.evaluate(() => window.recordingTest.stoppedTracks), 1);
    });
    await t.test('unmount stops an active microphone without creating a playback URL', async () => {
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      await page.getByRole('button', { name: 'Toggle recorder' }).click();
      assert.equal(await page.evaluate(() => window.recordingTest.stoppedTracks), 1);
      assert.deepEqual(await page.evaluate(() => window.recordingTest.created), []);
    });
    await t.test('late microphone access after unmount is released without starting a recorder', async () => {
      await page.evaluate(() => { window.recordingTest.pending = true; });
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      await page.getByRole('button', { name: 'Toggle recorder' }).click();
      await page.evaluate(() => window.recordingTest.resolveStream());
      assert.equal(await page.evaluate(() => window.recordingTest.stoppedTracks), 1);
      assert.equal(await page.evaluate(() => window.recordingTest.instances.length), 0);
    });
    for (const failure of ['constructor', 'start']) {
      await t.test(`${failure} failure releases tracks and displays an error`, async () => {
        await page.evaluate(fail => { window.recordingTest.fail = fail; }, failure);
        await page.getByRole('button', { name: 'Start recording', exact: true }).click();
        assert.equal(await page.evaluate(() => window.recordingTest.stoppedTracks), 1);
        assert.ok(await page.getByRole('alert').textContent());
      });
    }
    await t.test('retry and unmount revoke playback URLs', async () => {
      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: 'Start recording', exact: true }).click();
        await page.getByRole('button', { name: 'Stop recording', exact: true }).click();
        if (i === 0) await page.getByRole('button', { name: 'Retry', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Toggle recorder' }).click();
      assert.deepEqual(await page.evaluate(() => window.recordingTest.revoked), await page.evaluate(() => window.recordingTest.created));
    });
    await t.test('pending microphone access cannot be started twice', async () => {
      await page.evaluate(() => { window.recordingTest.pending = true; });
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      await page.getByRole('button', { name: 'Start recording', exact: true }).click({ force: true });
      assert.equal(await page.evaluate(() => window.recordingTest.requests), 1);
    });
    await t.test('microphone rejection is visible and permits retry', async () => {
      await page.evaluate(() => { window.recordingTest.fail = 'permission'; });
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      assert.ok(await page.getByRole('alert').textContent());
      await page.evaluate(() => { window.recordingTest.fail = ''; });
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      assert.equal(await page.getByRole('alert').count(), 0);
      await page.getByRole('button', { name: 'Stop recording', exact: true }).waitFor();
    });
    await t.test('empty recording produces an error and no playback URL', async () => {
      await page.evaluate(() => { window.recordingTest.empty = true; });
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      await page.getByRole('button', { name: 'Stop recording', exact: true }).click();
      assert.ok(await page.getByRole('alert').textContent());
      assert.deepEqual(await page.evaluate(() => window.recordingTest.created), []);
    });
  });
} finally {
  await browser?.close();
  await server.close();
}
