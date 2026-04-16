import { AppSettings, AIProvider } from '../types';
import { SETTINGS_KEY, DEFAULT_MODELS } from '../config/constants';

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  apiKey: '',
  apiKeyOpenAI: '',
  apiKeyAnthropic: '',
  modelGemini: DEFAULT_MODELS.gemini,
  modelOpenAI: DEFAULT_MODELS.openai,
  modelAnthropic: DEFAULT_MODELS.anthropic,
  modelStatic: DEFAULT_MODELS.gemini,
  subscriptionTier: 'free',
};

export const SettingsStore = {
  load(): AppSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  save(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  update(partial: Partial<AppSettings>): AppSettings {
    const current = SettingsStore.load();
    const updated = { ...current, ...partial };
    SettingsStore.save(updated);
    return updated;
  },

  getProvider(): AIProvider {
    return SettingsStore.load().provider || 'gemini';
  },

  getApiKeyForProvider(provider: AIProvider): string {
    const settings = SettingsStore.load();
    switch (provider) {
      case 'openai': return settings.apiKeyOpenAI.trim();
      case 'anthropic': return settings.apiKeyAnthropic.trim();
      case 'gemini':
      default:
        return settings.apiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY ?? '');
    }
  },

  /** Returns the active API key for the currently selected provider */
  getApiKey(): string {
    return SettingsStore.getApiKeyForProvider(SettingsStore.getProvider());
  },

  /** Returns the Gemini API key specifically (for Live, TTS, pronunciation — always Gemini) */
  getGeminiKey(): string {
    return SettingsStore.getApiKeyForProvider('gemini');
  },

  getModelForProvider(provider: AIProvider): string {
    const settings = SettingsStore.load();
    switch (provider) {
      case 'openai': return settings.modelOpenAI || DEFAULT_MODELS.openai;
      case 'anthropic': return settings.modelAnthropic || DEFAULT_MODELS.anthropic;
      case 'gemini':
      default:
        return settings.modelGemini || settings.modelStatic || DEFAULT_MODELS.gemini;
    }
  },

  getModel(): string {
    return SettingsStore.getModelForProvider(SettingsStore.getProvider());
  },

  /** True if the user has a valid API key for the current provider or a paid subscription */
  hasAccess(): boolean {
    const key = SettingsStore.getApiKey();
    if (key) return true;
    return SettingsStore.load().subscriptionTier !== 'free';
  },

  clearApiKey(): void {
    SettingsStore.update({ apiKey: '' });
  },
};
