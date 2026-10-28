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
const pending = new Map<string, Promise<void>>();
function serialWrite(key: string, write: () => Promise<void>): Promise<void> {
  const next = (pending.get(key) ?? Promise.resolve()).catch(() => {}).then(write);
  pending.set(key, next);
  void next.finally(() => { if (pending.get(key) === next) pending.delete(key); }).catch(() => {});
  return next;
}

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

  /** Publish to cache only after persistence succeeds; preserve per-key write order. */
  async set(key: string, value: string): Promise<void> {
    await serialWrite(key, async () => {
      if (isNative) await Preferences.set({ key, value });
      else localStorage.setItem(key, value);
      cache.set(key, value);
    });
  },

  /** For callers with no success UI; failures are explicitly reported. */
  setFireAndForget(key: string, value: string): void {
    void Storage.set(key, value).catch(() => console.error('Failed to persist settings'));
  },

  async remove(key: string): Promise<void> {
    await serialWrite(key, async () => {
      if (isNative) await Preferences.remove({ key });
      else localStorage.removeItem(key);
      cache.delete(key);
    });
  },
};

export const isNativePlatform = isNative;
