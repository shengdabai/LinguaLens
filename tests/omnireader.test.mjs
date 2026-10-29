import assert from 'node:assert/strict';
import test from 'node:test';
import { componentHarness, button, nodes, text } from './helpers/component-harness.mjs';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

async function reader({ speech = async () => 'audio', resume = async () => {}, decode } = {}) {
  const sources = [];
  const frames = new Map();
  let nextFrame = 0;
  const ctx = {
    state: 'suspended', currentTime: 0, destination: {}, resume,
    createBufferSource() {
      const source = {
        connect() {}, disconnect() { source.disconnected = true; },
        start(_when, offset) { source.started = true; source.offset = offset; },
        stop() { source.stopped = true; },
      };
      sources.push(source);
      return source;
    },
  };
  const harness = await componentHarness('../../src/features/omnireader/OmniReader.tsx', 'OmniReader', {
    '../../types': { VoiceName: { Zephyr: 'Zephyr' }, ReaderMode: { INPUT: 'input', PLAYER: 'player' } },
    '../../services/geminiService': { generateSpeech: speech, cleanTextContent: async value => value },
    '../../utils/audio': {
      getSharedPlaybackAudioContext: () => ctx,
      decodeBase64: value => value,
      decodeAudioData: decode ?? (async () => ({ duration: 10 })),
    },
    '../../components/ApiGate': { ApiGate: 'ApiGate' },
  }, {
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  let reads = 0;
  const render = () => harness.render({ onRead() { reads++; } });
  const input = nodes(render()).find(node => node.type === 'textarea');
  input.props.onChange({ target: { value: '合成测试文本' } });
  return { harness, render, sources, frames, ctx, reads: () => reads,
    start: () => button(render(), 'Start Listening')() };
}

test('empty speech response exits loading, preserves input and offers retry', async () => {
  const app = await reader({ speech: async () => null });
  await app.start();
  const tree = app.render();
  assert.ok(nodes(tree).some(node => node.props?.role === 'alert'));
  assert.equal(nodes(tree).find(node => node.type === 'textarea').props.value, '合成测试文本');
  assert.equal(nodes(tree).find(node => node.type === 'button' && text(node).includes('Start Listening')).props.disabled, false);
  assert.equal(app.sources.length, 0);
  assert.equal(app.reads(), 0);
});

test('Back cancels pending generation without autoplay or learning credit', async () => {
  const response = deferred();
  const app = await reader({ speech: () => response.promise });
  const pending = app.start();
  button(app.render(), 'Back')();
  response.resolve('audio');
  await pending;
  assert.ok(text(app.render()).includes('Start Listening'));
  assert.equal(app.sources.length, 0);
  assert.equal(app.reads(), 0);
});

test('unmount during decoding prevents playback', async () => {
  const decoding = deferred();
  const app = await reader({ decode: () => decoding.promise });
  const pending = app.start();
  await Promise.resolve();
  app.harness.unmount();
  decoding.resolve({ duration: 10 });
  await pending;
  assert.equal(app.sources.length, 0);
  assert.equal(app.reads(), 0);
});

test('Back during AudioContext resume prevents playback', async () => {
  const resuming = deferred();
  const app = await reader({ resume: () => resuming.promise });
  const pending = app.start();
  await new Promise(resolve => setImmediate(resolve));
  button(app.render(), 'Back')();
  resuming.resolve();
  await pending;
  assert.equal(app.sources.filter(source => source.started).length, 0);
  assert.equal(app.reads(), 0);
});

test('resume failure is handled and shown without unhandled rejection', async () => {
  const app = await reader({ resume: async () => { throw new Error('synthetic denial'); } });
  await assert.doesNotReject(app.start());
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(nodes(app.render()).some(node => node.props?.role === 'alert'));
  assert.equal(app.sources.length, 0);
  assert.equal(app.reads(), 0);
});

test('successful playback credits once and releases source and animation on Back', async () => {
  const app = await reader();
  await app.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.sources.length, 1);
  assert.equal(app.sources[0].started, true);
  assert.equal(app.reads(), 1);
  button(app.render(), 'Back')();
  assert.equal(app.sources[0].stopped, true);
  assert.equal(app.sources[0].onended, null);
  assert.equal(app.frames.size, 0);
});

test('a superseded speech response cannot replace the current audio', async () => {
  const old = deferred();
  let calls = 0;
  const app = await reader({ speech: () => ++calls === 1 ? old.promise : Promise.resolve('new audio') });
  const pending = app.start();
  button(app.render(), 'Back')();
  await app.start();
  old.resolve('old audio');
  await pending;
  assert.equal(app.sources.length, 1);
  assert.equal(app.sources[0].stopped, undefined);
  assert.equal(app.reads(), 1);
});

test('pause resumes at the previous offset and natural end resets the player', async () => {
  const app = await reader();
  await app.start();
  app.ctx.currentTime = 3;
  nodes(app.render()).find(node => node.props?.['aria-label'] === 'Pause audio').props.onClick();
  assert.equal(app.sources[0].stopped, true);
  assert.equal(app.sources[0].disconnected, true);
  const play = () => nodes(app.render()).find(node => node.props?.['aria-label'] === 'Play audio').props.onClick();
  play();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.sources[1].offset, 3);
  app.sources[1].onended();
  assert.equal(app.sources[1].disconnected, true);
  assert.equal(app.frames.size, 0);
  play();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.sources[2].offset, 0);
  app.harness.unmount();
  assert.equal(app.sources[2].stopped, true);
});

test('missing API key keeps the settings gate and never plays audio', async () => {
  const app = await reader({ speech: async () => { throw new Error('NO_API_KEY'); } });
  await app.start();
  assert.equal(app.render().type, 'ApiGate');
  assert.equal(app.sources.length, 0);
});

test('decode failure returns to input with retry enabled', async () => {
  const app = await reader({ decode: async () => { throw new Error('synthetic corrupt PCM'); } });
  await app.start();
  assert.ok(nodes(app.render()).some(node => node.props?.role === 'alert'));
  assert.ok(text(app.render()).includes('Start Listening'));
  assert.equal(app.sources.length, 0);
});
