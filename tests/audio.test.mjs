import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Use the project's locked compiler; no runtime test dependency is required.
const source = await readFile(new URL('../src/utils/audio.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { decodeAudioData, float32ToPCM16, base64ToFloat32Array, arrayBufferToBase64 } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

function audioContext() {
  return {
    createBuffer(channels, frames, sampleRate) {
      const data = Array.from({ length: channels }, () => new Float32Array(frames));
      return { length: frames, sampleRate, getChannelData: channel => data[channel] };
    },
  };
}

test('decodes only the selected PCM bytes, even at an odd backing-buffer offset', async () => {
  const bytes = new Uint8Array([99, 0, 128, 255, 127, 99]);
  const decoded = await decodeAudioData(bytes.subarray(1, 5), audioContext());
  assert.equal(decoded.length, 2);
  assert.deepEqual([...decoded.getChannelData(0)], [-1, 32767 / 32768]);
});

test('deinterleaves stereo PCM16 samples in little-endian order', async () => {
  const bytes = new Uint8Array([0, 128, 255, 127, 0, 64, 0, 192]);
  const decoded = await decodeAudioData(bytes, audioContext(), 16000, 2);
  assert.equal(decoded.sampleRate, 16000);
  assert.equal(decoded.length, 2);
  assert.deepEqual([...decoded.getChannelData(0)], [-1, 0.5]);
  assert.deepEqual([...decoded.getChannelData(1)], [32767 / 32768, -0.5]);
});

test('rejects truncated PCM samples and incomplete multichannel frames', async () => {
  await assert.rejects(decodeAudioData(new Uint8Array([0]), audioContext()), /PCM/);
  await assert.rejects(decodeAudioData(new Uint8Array([0, 0, 0, 0, 0, 0]), audioContext(), 24000, 2), /PCM/);
});

test('rejects invalid audio channel and sample-rate settings before allocation', async () => {
  for (const channels of [0, -1, 1.5, NaN]) {
    await assert.rejects(decodeAudioData(new Uint8Array([0, 0]), audioContext(), 24000, channels), /channel/i);
  }
  for (const rate of [0, -1, NaN, Infinity]) {
    await assert.rejects(decodeAudioData(new Uint8Array([0, 0]), audioContext(), rate), /sample rate/i);
  }
});

test('PCM encoding clamps samples and survives a base64 round trip', () => {
  const encoded = float32ToPCM16(new Float32Array([-2, -1, 0, 1, 2]));
  const roundTrip = base64ToFloat32Array(arrayBufferToBase64(encoded.buffer));
  assert.deepEqual([...roundTrip], [-1, -1, 0, 32767 / 32768, 32767 / 32768]);
});
