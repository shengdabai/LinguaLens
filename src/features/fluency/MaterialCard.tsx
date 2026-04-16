import React from 'react';
import { PracticeMaterial } from '../../types';
import { BookOpen } from 'lucide-react';

interface MaterialCardProps {
  material: PracticeMaterial;
  isLoading: boolean;
}

export const MaterialCard: React.FC<MaterialCardProps> = React.memo(({ material, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 animate-pulse flex flex-col items-center justify-center min-h-[280px]">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-6" />
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-8" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-20 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border-t-4 border-brand-500 p-6 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-slate-500">
        <BookOpen size={16} />
        <span className="text-xs font-semibold">Practice Material</span>
      </div>

      <div className="text-center mb-6">
        <p className="text-lg text-brand-600 mb-2">{material.pinyin}</p>
        <h2 className="text-5xl font-chinese font-bold text-slate-900 dark:text-slate-100 leading-tight mb-4">{material.chinese}</h2>
        <p className="text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-4">"{material.translation}"</p>
      </div>

      <div className="bg-slate-50 dark:bg-[#252525] rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-500 mb-3">Key Vocabulary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {material.vocabulary.map((vocab, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white dark:bg-[#1E1E1E] p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div>
                <span className="font-chinese font-bold text-lg text-brand-600 mr-2">{vocab.word}</span>
                <span className="text-sm text-slate-400">{vocab.pinyin}</span>
              </div>
              <span className="text-sm text-slate-600">{vocab.meaning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
