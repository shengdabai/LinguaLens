import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/services/geminiService.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
});

// Execute the real service with isolated SDK/storage doubles and no network API.
function service() {
  const requests = [];
  const feedback = { score: 90, feedback: 'Good', pronunciationTips: [], toneAnalysis: 'Clear' };
  const imports = {
    '@google/genai': {
      GoogleGenAI: class {
        models = {
          generateContent: async request => {
            requests.push(request);
            return { text: JSON.stringify(feedback) };
          },
        };
      },
      Type: { OBJECT: 'OBJECT', INTEGER: 'INTEGER', STRING: 'STRING', ARRAY: 'ARRAY' },
      Modality: {},
    },
    '../types': {},
    '../config/constants': {},
    '../store/settingsStore': {
      SettingsStore: {
        getGeminiKey: () => 'test-placeholder',
        getModelForProvider: () => 'test-model',
      },
    },
    './aiProvider': {},
  };
  const context = {
    exports: {},
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
      return imports[name];
    },
    FileReader: class {
      readAsDataURL(blob) {
        blob.arrayBuffer().then(bytes => {
          this.result = `data:${blob.type};base64,${Buffer.from(bytes).toString('base64')}`;
          this.onloadend();
        }, error => this.onerror(error));
      }
    },
  };
  vm.runInNewContext(outputText, context);
  return { evaluatePronunciation: context.exports.evaluatePronunciation, requests, feedback };
}

for (const [mimeType, expected] of [
  ['audio/webm;codecs=opus', 'audio/webm'],
  ['audio/ogg;codecs=opus', 'audio/ogg'],
  ['audio/mp4', 'audio/mp4'],
  ['  audio/webm ; codecs=opus', 'audio/webm'],
  ['', 'audio/webm'],
  ['   ', 'audio/webm'],
  [' ;codecs=opus', 'audio/webm'],
]) {
  test(`pronunciation request normalizes MIME ${JSON.stringify(mimeType)} to ${expected}`, async () => {
    const { evaluatePronunciation, requests, feedback } = service();
    const blob = new Blob(['synthetic audio'], { type: mimeType });
    const result = await evaluatePronunciation('你好', blob);
    assert.equal(requests.length, 1);
    const audio = requests[0].contents.parts[1].inlineData;
    assert.equal(audio.mimeType, expected);
    assert.equal(audio.data, Buffer.from('synthetic audio').toString('base64'));
    assert.equal(JSON.stringify(result), JSON.stringify(feedback));
  });
}
