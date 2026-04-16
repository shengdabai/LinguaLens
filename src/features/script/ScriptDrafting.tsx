import React, { useState } from 'react';
import { refineScript } from '../../services/geminiService';
import { Sparkles, RefreshCw, PenTool } from 'lucide-react';
import { ApiGate } from '../../components/ApiGate';

interface ScriptDraftingProps {
  onNeedApiKey?: () => void;
}

export const ScriptDrafting: React.FC<ScriptDraftingProps> = ({ onNeedApiKey }) => {
  const [context, setContext] = useState('Self Introduction');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);

  if (noApiKey) {
    return <ApiGate onGoToSettings={onNeedApiKey ?? (() => {})} featureName="Script Drafting" />;
  }

  const handleRefine = async () => {
    if (!draft.trim()) return;
    setIsRefining(true);
    try {
      const refined = await refineScript(draft, context);
      setResult(refined);
    } catch (e) {
      if (e instanceof Error && e.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error(e);
      }
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <PenTool size={18} className="text-emerald-600" />
          Script Drafting
        </h2>
        <p className="text-sm text-slate-500">Write your draft in English or broken Chinese — AI refines it into natural Mandarin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Context / Scenario
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#252525] border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
              placeholder="e.g. Job interview, ordering food..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Your Draft
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-52 p-3 bg-white dark:bg-[#252525] border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
              placeholder="Write in English, broken Chinese, or mix — e.g. 'I want order food, no spicy please, how much money?'"
            />
          </div>
          <button
            onClick={handleRefine}
            disabled={isRefining || !draft.trim()}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium"
          >
            {isRefining ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {isRefining ? 'Refining...' : 'Refine with AI'}
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-[#252525] border border-slate-100 dark:border-slate-800 rounded-2xl p-5 min-h-[320px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-500 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
            Refined Chinese Script
          </h3>
          {result ? (
            <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-sm font-chinese">{result}</div>
          ) : (
            <div className="text-slate-400 text-center mt-16 text-sm italic">
              Your refined script with grammar notes will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
