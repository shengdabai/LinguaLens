import React, { useState } from 'react';
import { TranslationResult } from '../../types';
import { Volume2, Copy, Check, Loader2, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { playPCMAudio } from '../../utils/audio';

interface ResultCardProps {
  result: TranslationResult;
  audioData: string | null;
  audioLoading?: boolean;
  onAddVocab?: (card: { chinese: string; pinyin: string; english: string; exampleSentence: string; hskLevel: number; sourceModule: string }) => void;
}

export const ResultCard: React.FC<ResultCardProps> = React.memo(({ result, audioData, audioLoading, onAddVocab }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePlay = () => {
    if (audioData) playPCMAudio(audioData);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${result.chinese}\n${result.pinyin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Original */}
      <div className="bg-slate-50 dark:bg-[#252525] px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <p className="text-slate-500 text-xs font-semibold tracking-wide">Original</p>
      </div>
      <div className="px-6 py-4">
        <p className="text-lg text-slate-700 dark:text-slate-300">{result.original}</p>
      </div>

      {/* Translation header */}
      <div className="bg-brand-50/50 px-5 py-3 border-y border-brand-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          <p className="text-brand-600 text-xs font-semibold tracking-wide">Translation</p>
        </div>
        <div className="flex items-center gap-2">
          {onAddVocab && (
            <button
              onClick={() => {
                if (saved) return;
                onAddVocab({
                  chinese: result.chineseDirect || result.chinese,
                  pinyin: result.pinyin,
                  english: result.original,
                  exampleSentence: result.chineseNatural || result.chineseDirect || result.chinese,
                  hskLevel: 0,
                  sourceModule: 'translation',
                });
                setSaved(true);
              }}
              className={`p-2 rounded-full transition-colors ${saved ? 'text-emerald-600' : 'text-brand-600/70 hover:text-brand-700 hover:bg-brand-100'}`}
              title={saved ? 'Added to SRS' : 'Add to SRS Review'}
            >
              {saved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-2 text-brand-600/70 hover:text-brand-700 hover:bg-brand-100 rounded-full transition-colors"
            title="Copy"
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={handlePlay}
            disabled={!audioData}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              audioData
                ? 'bg-brand-100 text-brand-700 hover:bg-brand-200 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {audioLoading ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
            {audioLoading ? 'Loading...' : audioData ? 'Pronounce' : 'Audio...'}
          </button>
        </div>
      </div>

      {/* Chinese & Pinyin */}
      <div className="px-6 py-6 space-y-4">
        {result.chineseDirect ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-slate-500">Direct Translation</p>
              <h2 className="text-4xl md:text-5xl font-chinese font-bold text-slate-900 dark:text-slate-100 leading-tight">{result.chineseDirect}</h2>
            </div>
            {result.chineseNatural && result.chineseNatural !== result.chineseDirect && (
              <div className="text-center space-y-1 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-brand-400">Natural Expression</p>
                <p className="text-2xl md:text-3xl font-chinese font-semibold text-brand-700 leading-tight">{result.chineseNatural}</p>
              </div>
            )}
            <p className="text-center text-lg text-brand-600 font-medium">{result.pinyin}</p>
          </>
        ) : (
          <>
            <h2 className="text-4xl md:text-5xl font-chinese font-bold text-slate-900 dark:text-slate-100 leading-tight text-center">{result.chinese}</h2>
            <p className="text-xl text-brand-600 font-medium text-center">{result.pinyin}</p>
          </>
        )}
      </div>

      {/* Breakdown */}
      <div className="bg-slate-50 dark:bg-[#252525] px-6 py-5 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-semibold text-slate-500 mb-4">Literal Breakdown</h3>
        <div className="flex flex-wrap gap-2 mb-5">
          {result.breakdown.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center bg-white dark:bg-[#1E1E1E] p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-brand-200 transition-all min-w-[72px]"
            >
              <span className="text-2xl font-chinese font-bold text-slate-800 dark:text-slate-200 mb-1">{item.chinese}</span>
              <span className="text-xs font-medium text-brand-600 mb-1.5">{item.pinyin}</span>
              <div className="h-px w-6 bg-slate-200 mb-1.5" />
              <span className="text-xs text-slate-500 text-center leading-tight max-w-[80px]">{item.literal}</span>
            </div>
          ))}
        </div>

        {(result.usageNote || result.culturalNote) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.usageNote && (
              <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-500 mb-1">Usage Tip</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{result.usageNote}</p>
              </div>
            )}
            {result.culturalNote && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <h4 className="text-xs font-semibold text-amber-600 mb-1">
                  Cultural Context
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">{result.culturalNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
