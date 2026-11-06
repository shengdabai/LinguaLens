import { beforeEach, expect, test, vi } from 'vitest';
const native = vi.hoisted(() => ({values: new Map<string,string>(), fail: false, active: 0, max: 0}));
vi.mock('@capacitor/core', () => ({Capacitor: {isNativePlatform: () => true}}));
vi.mock('@capacitor/preferences', () => ({Preferences: {
  get: async ({key}: {key:string}) => ({value: native.values.get(key) ?? null}),
  set: async ({key,value}: {key:string,value:string}) => {
    native.active++;native.max=Math.max(native.max,native.active);
    try { await new Promise(resolve=>setTimeout(resolve,2)); if(native.fail) throw Error('fixture failure'); native.values.set(key,value); }
    finally {native.active--;}
  },
  remove: async ({key}: {key:string}) => {native.values.delete(key);},
}}));
beforeEach(() => {vi.resetModules();native.values.clear();native.fail=false;native.active=0;native.max=0;});
test('failed native persistence never publishes a false cached value', async () => {
 const {Storage}=await import('../services/storage'); native.values.set('fixture','old');await Storage.hydrate(['fixture']);native.fail=true;
 await expect(Storage.set('fixture','new')).rejects.toThrow('fixture failure');expect(Storage.getSync('fixture')).toBe('old');
 native.fail=false;await Storage.set('fixture','retry');expect(Storage.getSync('fixture')).toBe('retry');
});
test('concurrent partial settings updates preserve both edits after persistence', async () => {
 const {SettingsStore}=await import('../store/settingsStore');
 await Promise.all([SettingsStore.update({modelOpenAI:'fixture-model'}),SettingsStore.update({apiKeyOpenAI:'fixture-key'})]);
 expect(SettingsStore.load().modelOpenAI).toBe('fixture-model');expect(SettingsStore.load().apiKeyOpenAI).toBe('fixture-key');expect(native.max).toBe(1);
});
