import React from 'react';
import { UserProfile } from '../../types';
import { Award, Flame, Zap, TrendingUp, BookOpen } from 'lucide-react';

interface ProfilePageProps {
  profile: UserProfile;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile }) => {
  const xpToNextLevel = 500;
  const xpInLevel = profile.xp % xpToNextLevel;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between p-5 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
            L{profile.level}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Chinese Learner</h1>
            <p className="text-sm text-slate-500">Keep up the great work!</p>
            <div className="mt-2 w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((xpInLevel / xpToNextLevel) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-semibold mb-0.5">Total XP</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{profile.xp}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white mb-2">
            <Flame size={20} fill="currentColor" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{profile.streak}</p>
          <p className="text-xs text-slate-500 font-semibold">Day Streak</p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white mb-2">
            <Zap size={20} fill="currentColor" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{profile.quests.filter((q) => q.completed).length}</p>
          <p className="text-xs text-slate-500 font-semibold">Quests Done</p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white mb-2">
            <BookOpen size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{profile.vocab.length}</p>
          <p className="text-xs text-slate-500 font-semibold">Vocab Cards</p>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Award size={16} className="text-yellow-500" />
          Quest Progress
        </h2>
        <div className="space-y-2">
          {profile.quests.map((quest) => (
            <div
              key={quest.id}
              className={`flex items-center p-4 rounded-xl border transition-all ${
                quest.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-white dark:bg-[#1E1E1E] border-slate-100 dark:border-slate-800 opacity-70'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm mr-3 ${
                  quest.completed ? 'bg-green-500 text-white shadow-md' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {quest.completed ? '✓' : '○'}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-bold ${quest.completed ? 'text-green-900' : 'text-slate-700'}`}>
                  {quest.title}
                </h3>
                <p className="text-xs text-slate-500">{quest.description}</p>
              </div>
              <span className={`text-sm font-bold ${quest.completed ? 'text-green-600' : 'text-slate-400'}`}>
                +{quest.xpReward} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Learning curve */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
            <TrendingUp size={16} className="text-slate-400" />
            Learning Curve
          </h3>
        </div>
        <div className="h-32 flex items-end justify-between gap-1.5">
          {(() => {
            const last7 = Array.from({ length: 7 }, (_, i) => {
              const date = new Date(Date.now() - (6 - i) * 86400000);
              const key = date.toISOString().split('T')[0];
              return profile.dailyXp?.[key] ?? 0;
            });
            const maxXp = Math.max(...last7, 1);
            return last7.map((xp, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-100 rounded-t-md relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-t-md transition-all duration-700"
                    style={{ height: `${Math.min((xp / maxXp) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', {
                    weekday: 'narrow',
                  })}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};
