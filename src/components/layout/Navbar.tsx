import React from 'react';
import { useGame } from '../../context/GameContext';
import {
  Cog,
  Calculator,
  BookOpen,
  Layers,
  Trophy,
  Database,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    databases,
    activeDatabase,
    setActiveDatabaseId,
    activeTab,
    setActiveTab,
    progression,
  } = useGame();

  const totalRecipes = activeDatabase.recipes.length;
  const unlockedCount = activeDatabase.recipes.filter((r) =>
    progression.unlockedRecipeIds.includes(r.id)
  ).length;

  const tabs: {
    id: 'calculator' | 'recipes' | 'items' | 'crafters' | 'progression' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    { id: 'calculator', label: 'Calculator & Flow', icon: Calculator },
    {
      id: 'recipes',
      label: 'Recipe Catalog',
      icon: BookOpen,
      badge: activeDatabase.recipes.length,
    },
    { id: 'items', label: 'Items & Ores', icon: Layers, badge: activeDatabase.items.length },
    { id: 'crafters', label: 'Crafters & Machines', icon: Cog, badge: activeDatabase.crafters.length },
    {
      id: 'progression',
      label: 'Progression',
      icon: Trophy,
      badge: `${unlockedCount}/${totalRecipes}`,
    },
    { id: 'settings', label: 'Sandboxes', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c121e]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black text-xl">
                🏭
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-white">
                    Facto<span className="text-amber-400">Recipe</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Sandbox
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono -mt-0.5">
                  Production DAG & Recipe Tracker
                </div>
              </div>
            </div>

            {/* Sandbox Database Selector */}
            <div className="hidden md:flex items-center pl-3 border-l border-slate-800">
              <div className="relative">
                <select
                  value={activeDatabase.id}
                  onChange={(e) => setActiveDatabaseId(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold text-slate-200 py-1.5 pl-7 pr-8 rounded-lg cursor-pointer focus:outline-none focus:border-amber-400"
                >
                  {databases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.icon} {db.name}
                    </option>
                  ))}
                </select>
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
                  {activeDatabase.icon}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
