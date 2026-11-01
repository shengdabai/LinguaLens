import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/services/audioRecording.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { AudioRecordingSession } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

function recording(options = {}) {
  const observed = { requests: 0, tracksStopped: 0, started: 0, stopped: 0, blobs: [], errors: [], recorders: [] };
  const stream = { getTracks: () => [{ stop: () => observed.tracksStopped++ }] };
  class Recorder {
    mimeType = options.mimeType ?? 'audio/mp4';
    state = 'inactive';
    constructor() {
      if (options.fail === 'constructor') throw new Error('Unsupported');
      observed.recorders.push(this);
    }
    start() {
      if (options.fail === 'start') throw new Error('Start failed');
      this.state = 'recording';
    }
    stop() {
      if (options.fail === 'stop') throw new Error('Stop failed');
      this.state = 'inactive';
      const onData = this.ondataavailable;
      const onStop = this.onstop;
      queueMicrotask(() => {
        onData?.({ data: new Blob(options.empty ? [] : ['audio'], { type: options.chunkType ?? 'audio/mp4' }) });
        onStop?.();
      });
    }
  }
  const session = new AudioRecordingSession({
    onStarted: () => observed.started++,
    onStopped: () => observed.stopped++,
    onComplete: blob => observed.blobs.push(blob),
    onError: message => observed.errors.push(message),
  }, {
    requestStream: async () => {
      observed.requests++;
      if (options.fail === 'permission') throw new Error('Denied');
      if (options.pending) return new Promise(resolve => { observed.resolveStream = () => resolve(stream); });
      return stream;
    },
    createRecorder: () => new Recorder(),
  });
  return { session, observed, options };
}

test('preserves MP4 recorder MIME type and releases the microphone after stop', async () => {
  const { session, observed } = recording();
  await session.start();
  session.stop();
  await Promise.resolve();
  assert.equal(observed.blobs[0].type, 'audio/mp4');
  assert.equal(await observed.blobs[0].text(), 'audio');
  assert.equal(observed.tracksStopped, 1);
  assert.equal(observed.started, 1);
  assert.equal(observed.stopped, 1);
  assert.deepEqual(observed.errors, []);
  session.dispose();
  assert.equal(observed.tracksStopped, 1);
});

test('uses the chunk MIME type when the recorder does not report one', async () => {
  const { session, observed } = recording({ mimeType: '', chunkType: 'audio/webm;codecs=opus' });
  await session.start();
  session.stop();
  await Promise.resolve();
  assert.equal(observed.blobs[0].type, 'audio/webm;codecs=opus');
});

test('disposal stops active recording, discards data and is idempotent', async () => {
  const { session, observed } = recording();
  await session.start();
  session.dispose();
  session.dispose();
  await Promise.resolve();
  assert.equal(observed.tracksStopped, 1);
  assert.equal(observed.recorders[0].state, 'inactive');
  assert.equal(observed.recorders[0].onstop, null);
  assert.deepEqual(observed.blobs, []);
  assert.deepEqual(observed.errors, []);
});

test('late microphone access after disposal is released without a recorder or callbacks', async () => {
  const { session, observed } = recording({ pending: true });
  const starting = session.start();
  session.dispose();
  observed.resolveStream();
  await starting;
  assert.equal(observed.tracksStopped, 1);
  assert.equal(observed.recorders.length, 0);
  assert.equal(observed.started, 0);
  assert.equal(observed.stopped, 0);
});

test('concurrent starts share one pending microphone request', async () => {
  const { session, observed } = recording({ pending: true });
  const starting = session.start();
  await session.start();
  assert.equal(observed.requests, 1);
  observed.resolveStream();
  await starting;
  assert.equal(observed.recorders.length, 1);
  session.dispose();
});

for (const fail of ['constructor', 'start', 'stop']) {
  test(`${fail} failure releases microphone tracks and reports a retryable error`, async () => {
    const { session, observed, options } = recording({ fail });
    await session.start();
    if (fail === 'stop') session.stop();
    assert.equal(observed.tracksStopped, 1);
    assert.equal(observed.errors.length, 1);
    assert.deepEqual(observed.blobs, []);
    options.fail = '';
    await session.start();
    assert.equal(observed.recorders.at(-1).state, 'recording');
    session.dispose();
    assert.equal(observed.tracksStopped, 2);
  });
}

test('microphone rejection reports an error and permits another request', async () => {
  const { session, observed, options } = recording({ fail: 'permission' });
  await session.start();
  assert.equal(observed.errors.length, 1);
  assert.equal(observed.tracksStopped, 0);
  options.fail = '';
  await session.start();
  assert.equal(observed.started, 1);
  session.dispose();
});

test('runtime recorder error releases tracks without delivering partial audio', async () => {
  const { session, observed } = recording();
  await session.start();
  observed.recorders[0].onerror();
  await Promise.resolve();
  assert.equal(observed.tracksStopped, 1);
  assert.equal(observed.stopped, 1);
  assert.equal(observed.errors.length, 1);
  assert.deepEqual(observed.blobs, []);
});

test('empty recordings produce a visible-error message rather than an audio blob', async () => {
  const { session, observed } = recording({ empty: true });
  await session.start();
  session.stop();
  await Promise.resolve();
  assert.equal(observed.tracksStopped, 1);
  assert.match(observed.errors[0], /No audio/);
  assert.deepEqual(observed.blobs, []);
});

test('disposal while final data is queued suppresses stale completion callbacks', async () => {
  const { session, observed } = recording();
  await session.start();
  session.stop();
  session.dispose();
  await Promise.resolve();
  assert.equal(observed.tracksStopped, 1);
  assert.deepEqual(observed.blobs, []);
  assert.equal(observed.stopped, 0);
});

test('a completed session can record again without reusing previous chunks', async () => {
  const { session, observed } = recording();
  for (let i = 0; i < 2; i++) {
    await session.start();
    session.stop();
    await Promise.resolve();
  }
  assert.equal(observed.blobs.length, 2);
  assert.equal(await observed.blobs[1].text(), 'audio');
  assert.equal(observed.tracksStopped, 2);
});
