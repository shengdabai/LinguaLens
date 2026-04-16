import React from 'react';
import { FeedbackResult } from '../../types';
import { CheckCircle2, AlertCircle, Trophy, Sparkles } from 'lucide-react';

interface ScoreCardProps {
  result: FeedbackResult;
}

export const ScoreCard: React.FC<ScoreCardProps> = React.memo(({ result }) => {
  const getScoreStyle = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const scoreStyle = getScoreStyle(result.score);

  return (
    <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-500" />
            Evaluation Result
          </h3>
          <span className={`px-4 py-1 rounded-full text-sm font-bold border ${scoreStyle}`}>
            {result.score}/100
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-5 mb-6">
          <div className={`flex-shrink-0 w-24 h-24 rounded-full border-4 flex items-center justify-center ${scoreStyle} mx-auto md:mx-0`}>
            <Trophy size={36} />
          </div>
          <div className="flex-grow">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-3">"{result.feedback}"</p>
            <div className="bg-slate-50 dark:bg-[#252525] rounded-lg p-3 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <AlertCircle size={12} /> Tone Analysis
              </h4>
              <p className="text-slate-600 text-sm">{result.toneAnalysis}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="text-green-500" />
            Improvements & Tips
          </h4>
          <div className="space-y-2">
            {result.pronunciationTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm"
              >
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="text-slate-600 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
