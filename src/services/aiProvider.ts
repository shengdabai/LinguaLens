/**
 * Unified AI provider adapter.
 * Routes text/image generation to Gemini, OpenAI, or Anthropic based on user settings.
 *
 * Always-Gemini features (Live Tutor, TTS, Pronunciation) are NOT handled here —
 * those remain in geminiService.ts using getGeminiAI() directly.
 */
import { GoogleGenAI } from '@google/genai';
import { SettingsStore } from '../store/settingsStore';
import { AIProvider } from '../types';

export interface GenerateOptions {
  /** Request JSON output. For Gemini also enforces schema; for others uses JSON mode + prompt. */
  jsonMode?: boolean;
  /** Gemini-only: native responseSchema for strong type enforcement. */
  geminiSchema?: Record<string, unknown>;
  /** Base64 image data for vision/multimodal requests. */
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  /** System instructions kept separate from user-provided content. */
  systemPrompt?: string;
  /** End-user input sent as a distinct user message/part. */
  userInput?: string;
  userInputLabel?: string;
}

function buildSystemPrompt(options: GenerateOptions): string | undefined {
  const parts: string[] = [];
  if (options.systemPrompt?.trim()) parts.push(options.systemPrompt.trim());
  if (options.jsonMode) parts.push('You must always respond with valid JSON only. No markdown, no extra text.');
  return parts.length > 0 ? parts.join('\n\n') : undefined;
}

function buildUserText(prompt: string, options: GenerateOptions): string | undefined {
  const parts: string[] = [];
  if (prompt.trim()) parts.push(prompt.trim());
  if (options.userInput !== undefined) {
    const label = options.userInputLabel?.trim();
    parts.push(label ? `${label}:\n${options.userInput}` : options.userInput);
  }
  return parts.length > 0 ? parts.join('\n\n') : undefined;
}

export async function generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
  const provider = SettingsStore.getProvider();
  const apiKey = SettingsStore.getApiKeyForProvider(provider);
  if (!apiKey) throw new Error('NO_API_KEY');
  const model = SettingsStore.getModelForProvider(provider);

  switch (provider) {
    case 'openai':
      return callOpenAI(prompt, apiKey, model, options);
    case 'anthropic':
      return callAnthropic(prompt, apiKey, model, options);
    case 'gemini':
    default:
      return callGemini(prompt, apiKey, model, options);
  }
}

async function callGemini(
  prompt: string,
  apiKey: string,
  model: string,
  options: GenerateOptions,
): Promise<string> {
  // Direct REST API call (bypasses @google/genai SDK which had compatibility issues
  // with iOS WKWebView under ES2017 target — see INSTALL_LOG 2026-05-10).
  const userText = buildUserText(prompt, options);

  const parts: Array<Record<string, unknown>> = [];
  if (userText) parts.push({ text: userText });
  if (options.imageBase64) {
    parts.push({ inlineData: { mimeType: options.imageMimeType || 'image/jpeg', data: options.imageBase64 } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    contents: [{ role: 'user', parts: parts.length > 0 ? parts : [{ text: prompt }] }],
  };

  const systemPrompt = buildSystemPrompt(options);
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generationConfig: Record<string, any> = {};
  if (options.jsonMode) generationConfig.responseMimeType = 'application/json';
  if (options.geminiSchema) generationConfig.responseSchema = options.geminiSchema;
  if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
  if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    let message = `Gemini API error ${res.status}`;
    try {
      const parsed = JSON.parse(errBody);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = (parsed as any)?.error?.message;
      if (m) message = `Gemini: ${m}`;
    } catch {
      if (errBody) message = `Gemini ${res.status}: ${errBody.slice(0, 200)}`;
    }
    throw new Error(message);
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (data as any)?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || '')
    ?.join('') || '';
  if (!text) throw new Error('No response from Gemini');
  return text;
}

async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  options: GenerateOptions,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [];
  const systemPrompt = buildSystemPrompt(options);
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  const userText = buildUserText(prompt, options) || '';
  if (options.imageBase64) {
    const content = [];
    if (userText) content.push({ type: 'text', text: userText });
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${options.imageMimeType || 'image/jpeg'};base64,${options.imageBase64}`,
        detail: 'low',
      },
    });
    messages.push({ role: 'user', content });
  } else {
    messages.push({ role: 'user', content: userText });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = { model, messages };
  if (options.jsonMode) body.response_format = { type: 'json_object' };
  if (options.temperature !== undefined) body.temperature = options.temperature;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error((err as any)?.error?.message || `OpenAI API error ${res.status}`);
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(
  _prompt: string,
  _apiKey: string,
  _model: string,
  _options: GenerateOptions,
): Promise<string> {
  throw new Error('Anthropic direct browser access is disabled for security. Configure a server-side proxy or choose another provider.');
}

/**
 * Test connectivity for any provider using a minimal request.
 */
export async function testProviderConnection(provider: AIProvider): Promise<void> {
  const apiKey = SettingsStore.getApiKeyForProvider(provider);
  if (!apiKey) throw new Error('NO_API_KEY');
  const model = SettingsStore.getModelForProvider(provider);

  switch (provider) {
    case 'openai':
      await callOpenAI('Say "ok" in one word.', apiKey, model, {});
      break;
    case 'anthropic':
      await callAnthropic('', apiKey, model, {});
      break;
    case 'gemini':
    default: {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({ model, contents: 'Say "ok" in one word.' });
      break;
    }
  }
}
