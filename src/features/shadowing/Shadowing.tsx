import React, { useState } from 'react';
import { generateShadowingText } from '../../services/geminiService';
import { Volume2, RefreshCw } from 'lucide-react';
import { playBrowserTTS } from '../../utils/audio';
import { ApiGate } from '../../components/ApiGate';

const TOPICS = ['Daily Life', 'Nature', 'Technology', 'Business', 'Travel', 'Food'];

interface ShadowingProps {
  onNeedApiKey?: () => void;
}

export const Shadowing: React.FC<ShadowingProps> = ({ onNeedApiKey }) => {
  const [topic, setTopic] = useState('Daily Life');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);

  if (noApiKey) {
    return <ApiGate onGoToSettings={onNeedApiKey ?? (() => {})} featureName="Shadowing Practice" />;
  }

  const generate = async () => {
    setLoading(true);
    try {
      const text = await generateShadowingText(topic);
      setContent(text);
    } catch (e) {
      if (e instanceof Error && e.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Shadowing Practice</h2>
        <p className="text-sm text-slate-500">Focus on rhythm, tones, and thought groups.</p>
      </div>

      {/* Topic pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              topic === t
                ? 'bg-rose-100 border-rose-300 text-rose-800'
                : 'bg-white dark:bg-[#1E1E1E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-60 text-sm font-medium"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating...' : 'Generate Material'}
        </button>
      </div>

      {content && (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-semibold text-slate-500">Shadowing Text</p>
            <button
              onClick={() => playBrowserTTS(content, 'zh-CN')}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-medium text-sm transition-colors"
            >
              <Volume2 size={16} /> Listen & Shadow
            </button>
          </div>
          <div className="text-lg font-chinese leading-loose text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{content}</div>
        </div>
      )}

      {!content && !loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Volume2 size={20} className="text-slate-400" />
          </div>
          <p className="text-sm">Select a topic and generate material to start shadowing.</p>
        </div>
      )}
    </div>
  );
};
