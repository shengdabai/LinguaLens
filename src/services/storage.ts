// Storage abstraction for LinguaLens.
//
// Native (Capacitor iOS): @capacitor/preferences — persists in iOS app sandbox via NSUserDefaults
// (encrypted by Data Protection class), survives app launches and updates.
// Web: window.localStorage.
//
// The async core is wrapped with a synchronous-feeling cache so existing code
// (`SettingsStore.load(): AppSettings`) keeps working without becoming async.
// Call `Storage.hydrate([keys])` once at app startup to pre-load known keys
// before any synchronous reader runs.

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

const cache = new Map<string, string>();
let hydrated = false;

export const Storage = {
  /** Pre-load known keys into the in-memory cache. Idempotent. */
  async hydrate(keys: string[]): Promise<void> {
    if (!isNative) {
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v !== null) cache.set(k, v);
      }
      hydrated = true;
      return;
    }
    await Promise.all(
      keys.map(async (k) => {
        const { value } = await Preferences.get({ key: k });
        if (value !== null) cache.set(k, value);
      }),
    );
    hydrated = true;
  },

  isHydrated(): boolean {
    return hydrated;
  },

  /** Synchronous read. On web, transparently reads localStorage if cache miss. On native, returns null if un-hydrated. */
  getSync(key: string): string | null {
    if (cache.has(key)) return cache.get(key)!;
    if (!isNative) {
      const v = localStorage.getItem(key);
      if (v !== null) cache.set(key, v);
      return v;
    }
    return null;
  },

  /** Async write. Updates cache immediately so subsequent getSync sees the new value. */
  async set(key: string, value: string): Promise<void> {
    cache.set(key, value);
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  /** Fire-and-forget write. Use only when caller cannot await. */
  setFireAndForget(key: string, value: string): void {
    cache.set(key, value);
    if (isNative) {
      void Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async remove(key: string): Promise<void> {
    cache.delete(key);
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};

export const isNativePlatform = isNative;
