import React from 'react';
import { Key, Crown, ArrowRight } from 'lucide-react';
import { SettingsStore } from '../store/settingsStore';
import { AIProvider } from '../types';

const PROVIDER_INFO: Record<AIProvider, { name: string; url: string; label: string }> = {
  gemini: { name: 'Gemini', url: 'https://aistudio.google.com/apikey', label: 'aistudio.google.com' },
  openai: { name: 'OpenAI', url: 'https://platform.openai.com/api-keys', label: 'platform.openai.com' },
  anthropic: { name: 'Anthropic', url: 'https://console.anthropic.com/', label: 'console.anthropic.com' },
};

interface ApiGateProps {
  onGoToSettings: () => void;
  featureName?: string;
}

/**
 * Shown when user attempts an AI feature without API key or subscription.
 */
export const ApiGate: React.FC<ApiGateProps> = ({ onGoToSettings, featureName }) => {
  const provider = SettingsStore.getProvider();
  const info = PROVIDER_INFO[provider] || PROVIDER_INFO.gemini;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <Key className="text-white" size={32} />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">AI Access Required</h2>
      <p className="text-slate-500 max-w-xs mb-8 leading-relaxed text-sm">
        {featureName ? `"${featureName}" uses` : 'This feature uses'} {info.name} AI. Add your own API key or subscribe to unlock
        full access.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={onGoToSettings}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold py-3 px-5 rounded-xl transition-all active:scale-95 text-sm"
        >
          <Key size={14} />
          Add API Key
          <ArrowRight size={14} />
        </button>
      </div>

      <button
        onClick={onGoToSettings}
        className="mt-3 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        <Crown size={14} />
        View subscription plans
      </button>

      <p className="mt-6 text-xs text-slate-400 max-w-xs">
        Get a free {info.name} API key at{' '}
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 hover:underline"
        >
          {info.label}
        </a>
      </p>
    </div>
  );
};
