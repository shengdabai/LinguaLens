import React, { useState } from 'react';
import {
  Key, Eye, EyeOff, Check, X, Zap, Crown,
  Building2, Sparkles, RefreshCw, ExternalLink, Info,
} from 'lucide-react';
import { SettingsStore } from '../../store/settingsStore';
import { AppSettings, AIProvider } from '../../types';
import { PROVIDER_MODELS } from '../../config/constants';
import { testProviderConnection } from '../../services/aiProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

type TestState = 'idle' | 'testing' | 'ok' | 'fail';

interface ProviderConfig {
  id: AIProvider;
  name: string;
  logo: string;
  color: string;
  keyPlaceholder: string;
  keyLink: string;
  keyLinkLabel: string;
  geminiOnly?: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: '✦',
    color: 'blue',
    keyPlaceholder: 'AIza...',
    keyLink: 'https://aistudio.google.com/apikey',
    keyLinkLabel: 'Get free key →',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    logo: '⬡',
    color: 'green',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.openai.com/api-keys',
    keyLinkLabel: 'Get key →',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    logo: '◈',
    color: 'orange',
    keyPlaceholder: 'sk-ant-...',
    keyLink: 'https://console.anthropic.com/',
    keyLinkLabel: 'Get key →',
  },
];

const COLOR_CLASSES: Record<string, { badge: string; ring: string; dot: string; bg: string }> = {
  blue:   { badge: 'bg-blue-100 text-blue-700',   ring: 'ring-blue-400',   dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  green:  { badge: 'bg-green-100 text-green-700',  ring: 'ring-green-400',  dot: 'bg-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  orange: { badge: 'bg-orange-100 text-orange-700',ring: 'ring-orange-400', dot: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
};

// ─── Key accessors ─────────────────────────────────────────────────────────────

function getKey(settings: AppSettings, provider: AIProvider): string {
  if (provider === 'openai') return settings.apiKeyOpenAI;
  if (provider === 'anthropic') return settings.apiKeyAnthropic;
  return settings.apiKey;
}

function getModelKey(settings: AppSettings, provider: AIProvider): string {
  if (provider === 'openai') return settings.modelOpenAI;
  if (provider === 'anthropic') return settings.modelAnthropic;
  return settings.modelGemini;
}

function keyField(provider: AIProvider): keyof AppSettings {
  if (provider === 'openai') return 'apiKeyOpenAI';
  if (provider === 'anthropic') return 'apiKeyAnthropic';
  return 'apiKey';
}

function modelField(provider: AIProvider): keyof AppSettings {
  if (provider === 'openai') return 'modelOpenAI';
  if (provider === 'anthropic') return 'modelAnthropic';
  return 'modelGemini';
}

// ─── Provider Card ─────────────────────────────────────────────────────────────

interface ProviderCardProps {
  config: ProviderConfig;
  settings: AppSettings;
  onSettingsChange: (updated: AppSettings) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ config, settings, onSettingsChange }) => {
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(getKey(settings, config.id));
  const [saved, setSaved] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const colors = COLOR_CLASSES[config.color];
  const models = PROVIDER_MODELS[config.id];
  const currentModel = getModelKey(settings, config.id);
  const hasKey = !!keyInput.trim();

  const handleSaveKey = () => {
    const updated = SettingsStore.update({ [keyField(config.id)]: keyInput.trim() } as Partial<AppSettings>);
    onSettingsChange(updated);
    setSaved(true);
    setTestState('idle');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleModelChange = (modelId: string) => {
    const updated = SettingsStore.update({ [modelField(config.id)]: modelId } as Partial<AppSettings>);
    onSettingsChange(updated);
  };

  const handleTest = async () => {
    setTestState('testing');
    try {
      await testProviderConnection(config.id);
      setTestState('ok');
    } catch {
      setTestState('fail');
    }
  };

  const handleClear = () => {
    setKeyInput('');
    const updated = SettingsStore.update({ [keyField(config.id)]: '' } as Partial<AppSettings>);
    onSettingsChange(updated);
    setTestState('idle');
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${colors.bg}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-bold">{config.logo}</span>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{config.name}</h3>
          {hasKey && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${colors.badge}`}>
              Configured
            </span>
          )}
        </div>
        <a
          href={config.keyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          {config.keyLinkLabel} <ExternalLink size={10} />
        </a>
      </div>

      <div className="p-5 space-y-4">
        {/* API Key input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Key</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setTestState('idle'); }}
                placeholder={config.keyPlaceholder}
                className="w-full bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              className="px-3.5 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all active:scale-95 flex items-center gap-1"
            >
              {saved ? <><Check size={13} /> Saved</> : 'Save'}
            </button>
          </div>

          {/* Test / Clear row */}
          <div className="flex items-center gap-3 pt-0.5">
            <button
              onClick={handleTest}
              disabled={!hasKey || testState === 'testing'}
              className="text-xs font-medium text-slate-400 hover:text-brand-600 disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              {testState === 'testing'
                ? <><RefreshCw size={11} className="animate-spin" /> Testing...</>
                : 'Test connection'}
            </button>
            {testState === 'ok' && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Check size={11} /> Connected
              </span>
            )}
            {testState === 'fail' && (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                <X size={11} /> Invalid key
              </span>
            )}
            {hasKey && testState === 'idle' && (
              <button onClick={handleClear} className="text-xs text-slate-300 hover:text-red-400 transition-colors ml-auto">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Model selector */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model</label>
          <div className="grid grid-cols-1 gap-1.5">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModelChange(m.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${
                  currentModel === m.id
                    ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20 text-brand-800 dark:text-brand-300'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#252525] text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-[#2a2a2a]'
                }`}
              >
                <span className="font-medium">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    m.badge.includes('⭐')
                      ? 'bg-yellow-100 text-yellow-700'
                      : currentModel === m.id
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {m.badge}
                  </span>
                  {currentModel === m.id && <Check size={12} className="text-brand-500" />}
                </div>
              </button>
            ))}
          </div>
          {/* Show model note */}
          {models.find((m) => m.id === currentModel) && (
            <p className="text-[11px] text-slate-400">
              {models.find((m) => m.id === currentModel)?.note}
            </p>
          )}
        </div>

        {/* Gemini-specific note */}
        {config.id === 'gemini' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
            <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Required for:</strong> Live Tutor, Roleplay, TTS (text-to-speech), and Pronunciation Coach — these features only work with Gemini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Primary Provider Selector ─────────────────────────────────────────────────

interface PrimaryProviderProps {
  settings: AppSettings;
  onSettingsChange: (updated: AppSettings) => void;
}

const PrimaryProviderSelector: React.FC<PrimaryProviderProps> = ({ settings, onSettingsChange }) => {
  const handleChange = (provider: AIProvider) => {
    const updated = SettingsStore.update({ provider });
    onSettingsChange(updated);
  };

  const configuredProviders = PROVIDERS.filter((p) => !!getKey(settings, p.id).trim());

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#252525] flex items-center gap-2">
        <Sparkles size={15} className="text-brand-600" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Primary Analysis Provider</h3>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-xs text-slate-500">
          Which AI powers your translations, Snap analysis, Fluency Coach, and other text features?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PROVIDERS.map((p) => {
            const hasKey = !!getKey(settings, p.id).trim();
            const isActive = settings.provider === p.id;
            const colors = COLOR_CLASSES[p.color];
            return (
              <button
                key={p.id}
                onClick={() => handleChange(p.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                  isActive
                    ? `border-brand-400 bg-brand-50 dark:bg-brand-900/20 ${colors.ring} ring-2`
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#252525] hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-[#2a2a2a]'
                }`}
              >
                <span className="text-xl">{p.logo}</span>
                <span className={`text-[11px] font-bold ${isActive ? 'text-brand-700' : 'text-slate-600'}`}>
                  {p.name.split(' ')[0]}
                </span>
                {hasKey
                  ? <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${colors.badge}`}>Ready</span>
                  : <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">No key</span>
                }
              </button>
            );
          })}
        </div>
        {configuredProviders.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
            Add at least one API key above to enable AI features.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Main Settings Page ────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(SettingsStore.load());

  const hasAnyKey = PROVIDERS.some((p) => !!getKey(settings, p.id).trim());
  const hasGeminiKey = !!settings.apiKey.trim();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>

      {/* Primary Provider */}
      <PrimaryProviderSelector settings={settings} onSettingsChange={setSettings} />

      {/* Provider Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Key size={13} /> API Keys & Models
        </h2>
        {PROVIDERS.map((config) => (
          <ProviderCard
            key={config.id}
            config={config}
            settings={settings}
            onSettingsChange={setSettings}
          />
        ))}
      </section>

      {/* Current Plan */}
      <section className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#252525] flex items-center gap-2">
          <Sparkles size={16} className="text-brand-600" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Your Plan</h3>
        </div>
        <div className="p-5">
          {hasAnyKey ? (
            <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 rounded-xl">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center">
                <Key size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-brand-900 text-sm">BYOK — Full Access</p>
                <p className="text-xs text-brand-600">
                  Using your own API key{!hasGeminiKey ? ' · Add Gemini key for Live Tutor & TTS' : ' · All features unlocked'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="w-10 h-10 bg-slate-400 rounded-full flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">Free Plan</p>
                <p className="text-xs text-slate-500">Limited daily AI uses · Add an API key for full access</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Crown size={16} className="text-yellow-500" />
          Subscription Plans
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">No API key? Subscribe to use AI features powered by our platform.</p>

        <div className="grid grid-cols-1 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 transition-all ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-brand-600 to-brand-800 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white dark:bg-[#1E1E1E] border-slate-100 dark:border-slate-800 shadow-sm'
              }`}
            >
              {plan.badge && (
                <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <plan.icon size={16} className={plan.highlighted ? 'text-brand-200' : 'text-brand-600'} />
                    <h3 className={`font-bold text-sm ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                      {plan.name}
                    </h3>
                  </div>
                  <p className={`text-xs ${plan.highlighted ? 'text-brand-200' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                    {plan.price}
                  </p>
                  <p className={`text-xs ${plan.highlighted ? 'text-brand-200' : 'text-slate-400 dark:text-slate-500'}`}>{plan.period}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${plan.highlighted ? 'text-brand-100' : 'text-slate-600 dark:text-slate-400'}`}>
                    <Check size={12} className={`mt-0.5 shrink-0 ${plan.highlighted ? 'text-brand-300' : 'text-green-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  plan.highlighted
                    ? 'bg-white text-brand-700 hover:bg-brand-50'
                    : plan.id === 'free'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
                disabled={plan.id === 'free'}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 text-center pt-2">
          All paid plans include a 7-day free trial. Cancel anytime.
        </p>
      </section>
    </div>
  );
};

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try the essentials',
    price: '$0',
    period: 'forever',
    highlighted: false,
    badge: null,
    icon: Zap,
    cta: 'Current Plan',
    features: [
      '10 Snap analyses / day',
      '20 translations / day',
      '3 Fluency Coach sessions / day',
      '5-min Roleplay / day',
      '50 vocab cards',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For dedicated learners',
    price: '$9.99',
    period: '/ month',
    highlighted: false,
    badge: null,
    icon: Sparkles,
    cta: 'Subscribe to Pro',
    features: [
      '100 Snap analyses / day',
      'Unlimited translations (all languages)',
      '30 Fluency Coach sessions / day',
      '30 min Roleplay / day',
      '500 vocab cards + SRS review',
      'Shadowing & Script Drafting',
      'Multi-device sync',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Unlimited everything',
    price: '$19.99',
    period: '/ month',
    highlighted: true,
    badge: 'Most Popular',
    icon: Crown,
    cta: 'Subscribe to Premium',
    features: [
      'Everything in Pro',
      'Unlimited all AI features',
      '120 min Live Tutor / day',
      'Detailed pronunciation reports',
      'Unlimited vocab cards',
      'Personal learning report',
      'Priority email support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For organizations & schools',
    price: 'Custom',
    period: 'contact us',
    highlighted: false,
    badge: null,
    icon: Building2,
    cta: 'Contact Sales',
    features: [
      'Everything in Premium',
      'Unlimited usage for all members',
      'Custom roleplay scenarios',
      'Team learning analytics',
      'CSV/JSON data export',
      'Dedicated account manager',
    ],
  },
];
