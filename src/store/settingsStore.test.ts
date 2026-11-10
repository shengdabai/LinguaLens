import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/storage', () => ({
  Storage: { getSync: vi.fn(() => null) },
}));

import { Storage } from '../services/storage';
import { SettingsStore } from './settingsStore';

beforeEach(() => {
  vi.stubEnv('VITE_GEMINI_API_KEY', 'fixture-build-key');
  vi.mocked(Storage.getSync).mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Gemini key source', () => {
  it('does not use a build-time key in production', () => {
    vi.stubEnv('DEV', false);
    expect(SettingsStore.getGeminiKey()).toBe('');
    expect(SettingsStore.hasAccess()).toBe(false);
  });

  it('keeps the development-only environment fallback', () => {
    vi.stubEnv('DEV', true);
    expect(SettingsStore.getGeminiKey()).toBe('fixture-build-key');
  });

  it('uses the user key in production', () => {
    vi.stubEnv('DEV', false);
    vi.mocked(Storage.getSync).mockReturnValue(JSON.stringify({ apiKey: 'fixture-user-key' }));
    expect(SettingsStore.getGeminiKey()).toBe('fixture-user-key');
  });
});
