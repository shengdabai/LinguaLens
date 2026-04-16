import React from 'react';
import { Home, Camera, Mic, BookOpen, Brain, User, Settings, Moon, Sun, LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

export type ActiveTab = 'home' | 'snap' | 'practice' | 'learn' | 'review' | 'profile' | 'settings';
export type PracticeSubTab = 'live' | 'roleplay' | 'fluency';
export type LearnSubTab = 'translation' | 'reader' | 'omnireader' | 'shadowing' | 'script';

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  practiceSubTab: PracticeSubTab;
  setPracticeSubTab: (tab: PracticeSubTab) => void;
  learnSubTab: LearnSubTab;
  setLearnSubTab: (tab: LearnSubTab) => void;
  xp: number;
  level: number;
}

const tabs: { id: ActiveTab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'snap', label: 'Snap', icon: Camera },
  { id: 'practice', label: 'Practice', icon: Mic },
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'review', label: 'Review', icon: Brain },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  practiceSubTab,
  setPracticeSubTab,
  learnSubTab,
  setLearnSubTab,
  xp,
  level,
}) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-surface-dark-card border-r border-slate-100 dark:border-slate-800 fixed left-0 top-0 h-full z-20 shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">
              中
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-none">LinguaLens</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Learn Chinese</p>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Level {level}</span>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-300">{xp} XP</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((xp % 500) / 500) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <div key={id}>
              <button
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={activeTab === id ? 'text-brand-600 dark:text-brand-300' : ''} />
                {label}
                {activeTab === id && <div className="ml-auto w-1.5 h-1.5 bg-brand-500 rounded-full" />}
              </button>

              {/* Practice sub-tabs */}
              {id === 'practice' && activeTab === 'practice' && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {([['live', 'Live Tutor'], ['roleplay', 'Roleplay'], ['fluency', 'Fluency Coach']] as const).map(
                    ([sub, subLabel]) => (
                      <button
                        key={sub}
                        onClick={() => setPracticeSubTab(sub)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          practiceSubTab === sub
                            ? 'text-brand-600 dark:text-brand-300 bg-brand-50/50 dark:bg-brand-900/30'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {subLabel}
                      </button>
                    ),
                  )}
                </div>
              )}

              {/* Learn sub-tabs */}
              {id === 'learn' && activeTab === 'learn' && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {(
                    [
                      ['translation', 'Translation'],
                      ['reader', 'Reader'],
                      ['omnireader', 'OmniReader'],
                      ['shadowing', 'Shadowing'],
                      ['script', 'Script'],
                    ] as const
                  ).map(([sub, subLabel]) => (
                    <button
                      key={sub}
                      onClick={() => setLearnSubTab(sub)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        learnSubTab === sub
                          ? 'text-brand-600 dark:text-brand-300 bg-brand-50/50 dark:bg-brand-900/30'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {subLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">Powered by AI</p>
          <button
            onClick={() => {
              const isDark = document.documentElement.classList.toggle('dark');
              localStorage.setItem('lingualens_theme', isDark ? 'dark' : 'light');
            }}
            aria-label="Toggle dark mode"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Sun size={14} className="hidden dark:block" />
            <Moon size={14} className="block dark:hidden" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-surface-dark-card/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-1 py-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-label={label}
              className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-2 rounded-lg transition-all ${
                activeTab === id ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Sub-tabs */}
      {activeTab === 'practice' && (
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white/90 dark:bg-surface-dark-card/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-1 px-4 py-2">
            {(['live', 'roleplay', 'fluency'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setPracticeSubTab(sub)}
                className={`px-4 py-2 min-h-[44px] rounded-full text-xs font-semibold transition-all ${
                  practiceSubTab === sub
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {sub === 'live' ? 'Live Tutor' : sub === 'roleplay' ? 'Roleplay' : 'Fluency Coach'}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'learn' && (
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white/90 dark:bg-surface-dark-card/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
            {(['translation', 'reader', 'omnireader', 'shadowing', 'script'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setLearnSubTab(sub)}
                className={`px-4 py-2 min-h-[44px] rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  learnSubTab === sub
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {sub === 'translation'
                  ? 'Translation'
                  : sub === 'reader'
                    ? 'Reader'
                    : sub === 'omnireader'
                      ? 'OmniReader'
                      : sub === 'shadowing'
                        ? 'Shadowing'
                        : 'Script'}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
