import React, { useState } from 'react';
import { VocabCard } from '../../types';
import { Brain, CheckCircle2, Volume2, BookmarkX, RotateCcw } from 'lucide-react';
import { playBrowserTTS } from '../../utils/audio';

interface SRSReviewProps {
  cards: VocabCard[];
  onGrade: (cardId: string, grade: 'again' | 'hard' | 'good' | 'easy') => void;
}

export const SRSReview: React.FC<SRSReviewProps> = ({ cards, onGrade }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  const current = cards[currentIndex];

  const handleGrade = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return;
    onGrade(current.id, grade);
    const next = currentIndex + 1;
    if (next >= cards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(next);
      setRevealed(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setRevealed(false);
    setSessionDone(false);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">All Caught Up!</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          No cards due for review today. Add vocabulary from Snap mode or come back tomorrow.
        </p>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
          <Brain size={32} className="text-brand-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Session Complete!</h3>
        <p className="text-slate-500 text-sm mb-5">
          Reviewed {cards.length} card{cards.length !== 1 ? 's' : ''}. Great work!
        </p>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <RotateCcw size={14} /> Review Again
        </button>
      </div>
    );
  }

  const progress = currentIndex / cards.length;

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span className="font-medium">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <span className="font-medium">{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Front */}
        <div className="p-8 text-center">
          <div className="flex justify-between items-start mb-4">
            {current.hskLevel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold uppercase">
                HSK {current.hskLevel}
              </span>
            )}
            {current.sourceModule && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium ml-auto">
                {current.sourceModule}
              </span>
            )}
          </div>
          <p className="text-6xl font-chinese font-bold text-slate-900 dark:text-slate-100 mb-2 leading-none">{current.chinese}</p>
          <button
            onClick={() => playBrowserTTS(current.chinese)}
            aria-label="Listen to pronunciation"
            className="mt-3 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Volume2 size={20} />
          </button>
        </div>

        {/* Reveal button or answer */}
        {!revealed ? (
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 text-sm"
            >
              Reveal Answer
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-100 dark:border-slate-800">
            <div className="p-5 space-y-2 text-center">
              <p className="text-lg text-brand-600 font-medium">{current.pinyin}</p>
              <p className="text-slate-800 dark:text-slate-200 font-semibold">{current.english}</p>
              {current.exampleSentence && (
                <div className="mt-3 bg-slate-50 dark:bg-[#252525] rounded-xl p-3 text-left">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Example</p>
                  <p className="text-sm font-chinese text-slate-700 dark:text-slate-300">{current.exampleSentence}</p>
                </div>
              )}
            </div>

            {/* Grade buttons */}
            <div className="grid grid-cols-4 gap-2 p-4 border-t border-slate-50">
              <button
                onClick={() => handleGrade('again')}
                className="flex flex-col items-center py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors"
              >
                <BookmarkX size={16} className="mb-1" />
                <span className="text-xs font-bold">Again</span>
                <span className="text-xs text-red-400">1m</span>
              </button>
              <button
                onClick={() => handleGrade('hard')}
                className="flex flex-col items-center py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-colors"
              >
                <span className="text-sm mb-1">😓</span>
                <span className="text-xs font-bold">Hard</span>
                <span className="text-xs text-orange-400">1d</span>
              </button>
              <button
                onClick={() => handleGrade('good')}
                className="flex flex-col items-center py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors"
              >
                <span className="text-sm mb-1">👍</span>
                <span className="text-xs font-bold">Good</span>
                <span className="text-xs text-green-500">3d</span>
              </button>
              <button
                onClick={() => handleGrade('easy')}
                className="flex flex-col items-center py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors"
              >
                <span className="text-sm mb-1">⚡</span>
                <span className="text-xs font-bold">Easy</span>
                <span className="text-xs text-blue-400">7d+</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
