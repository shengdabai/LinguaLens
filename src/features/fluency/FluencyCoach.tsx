import React, { useState, useEffect } from 'react';
import { ProficiencyLevel, Topic, PracticeMaterial, FeedbackResult } from '../../types';
import { generatePracticeMaterial, evaluatePronunciation } from '../../services/geminiService';
import { MaterialCard } from './MaterialCard';
import { AudioRecorder } from './AudioRecorder';
import { ScoreCard } from './ScoreCard';
import { ApiGate } from '../../components/ApiGate';
import { RefreshCw } from 'lucide-react';

interface FluencyCoachProps {
  onPracticeComplete?: () => void;
  onNeedApiKey?: () => void;
}

export const FluencyCoach: React.FC<FluencyCoachProps> = ({ onPracticeComplete, onNeedApiKey }) => {
  const [level, setLevel] = useState<ProficiencyLevel>(ProficiencyLevel.Beginner);
  const [topic, setTopic] = useState<Topic>(Topic.DailyLife);
  const [material, setMaterial] = useState<PracticeMaterial | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  useEffect(() => {
    if (!noApiKey) handleGenerateNew();
  }, []);

  if (noApiKey) {
    return <ApiGate onGoToSettings={onNeedApiKey ?? (() => {})} featureName="Fluency Coach" />;
  }

  const handleGenerateNew = async () => {
    setLoadingMaterial(true);
    setFeedback(null);
    try {
      const data = await generatePracticeMaterial(level, topic);
      setMaterial(data);
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error(err);
      }
    } finally {
      setLoadingMaterial(false);
    }
  };

  const handleEvaluation = async (audioBlob: Blob) => {
    if (!material) return;
    setEvaluating(true);
    setEvalError(null);
    try {
      const result = await evaluatePronunciation(material.chinese, audioBlob);
      setFeedback(result);
      if (onPracticeComplete) onPracticeComplete();
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error(err);
        setEvalError('Evaluation failed. Please try again.');
      }
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      {/* Controls */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as ProficiencyLevel)}
              className="w-full appearance-none bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors"
            >
              {Object.values(ProficiencyLevel).map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as Topic)}
              className="w-full appearance-none bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors"
            >
              {Object.values(Topic).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerateNew}
          disabled={loadingMaterial}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-medium py-2 px-5 rounded-lg transition-all active:scale-95 disabled:opacity-50 text-sm"
        >
          <RefreshCw size={14} className={loadingMaterial ? 'animate-spin' : ''} />
          {loadingMaterial ? 'Generating...' : 'New Material'}
        </button>
      </div>

      {/* Material */}
      {material && <MaterialCard material={material} isLoading={loadingMaterial} />}

      {/* Recorder + Score */}
      {!loadingMaterial && material && (
        <>
          <AudioRecorder onRecordingComplete={handleEvaluation} isEvaluating={evaluating} />
          {evalError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              {evalError}
            </div>
          )}
          {feedback && <ScoreCard result={feedback} />}
        </>
      )}
    </div>
  );
};
