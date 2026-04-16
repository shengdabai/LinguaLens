import { AIProvider } from '../types';

export const MODEL_STATIC = 'gemini-2.5-flash';
export const MODEL_TTS = 'gemini-2.5-flash-preview-tts';
export const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const APP_NAME = 'LinguaLens';
export const STORAGE_KEY = 'lingualens_profile';
export const TRANSLATION_HISTORY_KEY = 'lingualens_translation_history';
export const SETTINGS_KEY = 'lingualens_settings';

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-6',
};

export const PROVIDER_MODELS = {
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Best Value ⭐', note: 'Fast & affordable' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', badge: 'Most Capable', note: 'Complex reasoning' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', badge: 'Fast', note: 'Low latency' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', badge: 'Budget', note: 'Lightweight' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', badge: 'Best Value ⭐', note: 'Fast & affordable' },
    { id: 'gpt-4.1', label: 'GPT-4.1', badge: 'Most Capable', note: 'Flagship quality' },
    { id: 'gpt-4o', label: 'GPT-4o', badge: 'Balanced', note: 'Multimodal' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', badge: 'Budget', note: 'Very cheap' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', badge: 'Best Value ⭐', note: 'Great for long text' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', badge: 'Most Capable', note: 'Highest intelligence' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', badge: 'Budget', note: 'Ultra fast & cheap' },
  ],
} as const;

// Legacy - kept for components that haven't migrated yet
export const AVAILABLE_MODELS = PROVIDER_MODELS.gemini;
export type StaticModelId = string;

// Valid model name reference whitelist (update when adding new providers/models):
// Gemini:    gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, gemini-1.5-flash
// OpenAI:    gpt-4o-mini, gpt-4o, gpt-4.1, gpt-3.5-turbo  (note: gpt-4.1-mini is NOT a real model — use gpt-4o-mini)
// Anthropic: claude-sonnet-4-6, claude-opus-4-6, claude-haiku-4-5-20251001
