import React from 'react';
import { SCENARIOS, Scenario } from './scenarios';

interface ScenarioSelectionProps {
  onSelect: (scenario: Scenario) => void;
}

const difficultyColor = (d: Scenario['difficulty']) => {
  if (d === 'Beginner') return 'bg-green-100 text-green-700';
  if (d === 'Intermediate') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ onSelect }) => {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Choose a Scenario</h2>
        <p className="text-slate-500 text-sm">Pick a real-life situation and practice Chinese with an AI partner.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className="group flex flex-col items-start text-left p-4 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-brand-200 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl mb-3 group-hover:bg-brand-50 transition-colors">
              {scenario.emoji}
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-0.5">{scenario.title}</h3>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{scenario.description}</p>
            <div className="flex items-center gap-2 mt-auto">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${difficultyColor(scenario.difficulty)}`}>
                {scenario.difficulty}
              </span>
              <span className="text-xs text-slate-400 font-medium">{scenario.hskLevel}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
