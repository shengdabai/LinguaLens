import React, { useState, useEffect } from 'react';
import { TranslationState, TranslationResult } from '../../types';
import { translateText, generateSpeech } from '../../services/geminiService';
import { ResultCard } from './ResultCard';
import { Loader2, ArrowRight, History, Trash2, Globe } from 'lucide-react';
import { TRANSLATION_HISTORY_KEY } from '../../config/constants';

interface TranslationBridgeProps {
  onTranslationComplete?: () => void;
  onNeedApiKey?: () => void;
  onAddVocab?: (card: { chinese: string; pinyin: string; english: string; exampleSentence: string; hskLevel: number; sourceModule: string }) => void;
}

export const TranslationBridge: React.FC<TranslationBridgeProps> = ({ onTranslationComplete, onNeedApiKey, onAddVocab }) => {
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState<TranslationState>({
    status: 'idle',
    data: null,
    audioData: null,
    error: null,
  });
  const [audioLoading, setAudioLoading] = useState(false);
  const [history, setHistory] = useState<TranslationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(TRANSLATION_HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TRANSLATION_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setState({ status: 'loading', data: null, audioData: null, error: null });

    try {
      const result = await translateText(inputText.trim());
      setState((prev) => ({ ...prev, status: 'success', data: result }));
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.original.toLowerCase() !== inputText.toLowerCase());
        return [result, ...filtered].slice(0, 20);
      });
      if (onTranslationComplete) onTranslationComplete();

      // Load audio in background
      setAudioLoading(true);
      const audio = await generateSpeech(result.chinese);
      setState((prev) => ({ ...prev, audioData: audio }));
      setAudioLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed. Please try again.';
      if (msg === 'NO_API_KEY') {
        setState({ status: 'error', data: null, audioData: null, error: 'NO_API_KEY' });
        if (onNeedApiKey) onNeedApiKey();
      } else {
        setState({ status: 'error', data: null, audioData: null, error: msg });
      }
      setAudioLoading(false);
    }
  };

  const selectFromHistory = (item: TranslationResult) => {
    setState({ status: 'success', data: item, audioData: null, error: null });
    setShowHistory(false);
    generateSpeech(item.chinese).then((audio) => {
      setState((prev) => (prev.data?.chinese === item.chinese ? { ...prev, audioData: audio } : prev));
    });
  };

  const clearHistory = () => {
    if (window.confirm('Clear all translation history?')) setHistory([]);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      {/* Input */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Globe size={12} className="text-brand-500" />
          Any Language → Chinese
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTranslate();
          }}
          placeholder="Type in any language — English, 日本語, Français, Español, 한국어, العربية..."
          className="w-full h-24 resize-none bg-slate-50 dark:bg-[#252525] rounded-xl p-3 text-slate-800 dark:text-slate-200 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm leading-relaxed dark:border-slate-700"
        />
        <button
          onClick={handleTranslate}
          disabled={state.status === 'loading' || !inputText.trim()}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-medium py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm"
        >
          {state.status === 'loading' ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Translating...
            </>
          ) : (
            <>
              Translate to Chinese <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>

      {/* History toggle */}
      {history.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-600 transition-colors"
          >
            <History size={12} />
            {showHistory ? 'Hide History' : `History (${history.length})`}
          </button>
        </div>
      )}

      {showHistory && (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-[#252525] border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Recent</span>
            <button onClick={clearHistory} className="text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => selectFromHistory(item)}
                className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors flex justify-between items-center group"
              >
                <div className="truncate pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.original}</p>
                    {item.detectedLanguage && (
                      <span className="text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        {item.detectedLanguage}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-600 font-chinese">{item.chinese}</p>
                </div>
                <span className="text-xs text-slate-300 group-hover:text-brand-400">View</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && state.error !== 'NO_API_KEY' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
          {state.error}
        </div>
      )}

      {/* Result */}
      {state.data && state.status !== 'loading' && (
        <>
          {state.data.detectedLanguage && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Globe size={12} className="text-brand-500" />
              Detected language: <span className="font-semibold text-brand-600">{state.data.detectedLanguage}</span>
            </div>
          )}
          <ResultCard result={state.data} audioData={state.audioData} audioLoading={audioLoading} onAddVocab={onAddVocab} />
        </>
      )}
    </div>
  );
};
