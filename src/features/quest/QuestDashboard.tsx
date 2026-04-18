import React from 'react';
import { Trophy, CheckCircle2, Circle, Star } from 'lucide-react';
import { Quest } from '../../types';

interface QuestDashboardProps {
  quests: Quest[];
  xp: number;
  level: number;
}

export const QuestDashboard: React.FC<QuestDashboardProps> = ({ quests, xp, level }) => {
  const completed = quests.filter((q) => q.completed).length;
  const xpToNextLevel = 500;
  const xpInCurrentLevel = xp % xpToNextLevel;

  return (
    <div className="space-y-4 px-4 py-4 max-w-2xl mx-auto">
      {/* Level & XP card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white shadow-lg shadow-brand-500/20 overflow-hidden">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="min-w-0">
            <p className="text-brand-200 text-xs font-semibold tracking-wide mb-0.5">Current Level</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{level}</span>
              <span className="text-brand-300 text-sm">/ ∞</span>
            </div>
          </div>
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Star size={32} className="text-yellow-300" fill="currentColor" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-brand-200 gap-1">
            <span>{xpInCurrentLevel} XP</span>
            <span>{xpToNextLevel} XP to next level</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${Math.min((xpInCurrentLevel / xpToNextLevel) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily quests */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Daily Quests</h3>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {completed}/{quests.length} done
          </span>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`flex items-center px-5 py-3.5 transition-colors ${
                quest.completed ? 'bg-green-50/50 dark:bg-green-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex-shrink-0 mr-3">
                {quest.completed ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <Circle size={20} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-semibold truncate ${
                    quest.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {quest.title}
                </h4>
                <p className="text-xs text-slate-500 truncate">{quest.description}</p>
                {quest.totalRequired && quest.totalRequired > 1 && (
                  <div className="mt-1.5">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-24">
                      <div
                        className="h-full bg-brand-400 rounded-full transition-all"
                        style={{
                          width: `${Math.min(((quest.progress || 0) / quest.totalRequired) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 ml-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    quest.completed
                      ? 'bg-green-100 text-green-600'
                      : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                  }`}
                >
                  +{quest.xpReward} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
