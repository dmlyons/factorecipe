import React from 'react';
import { useGame } from '../../context/GameContext';
import {
  Trophy,
  Unlock,
  Lock,
  Sparkles,
  Calculator,
  Plus,
  Trash2,
} from 'lucide-react';

export const ProgressionView: React.FC = () => {
  const {
    activeDatabase,
    progression,
    toggleRecipeUnlocked,
    unlockAllRecipes,
    lockAllRecipes,
    goals,
    addGoal,
    deleteGoal,
    setActiveGoalId,
    setActiveTab,
  } = useGame();

  const totalRecipes = activeDatabase.recipes.length;
  const unlockedCount = activeDatabase.recipes.filter((r) =>
    progression.unlockedRecipeIds.includes(r.id)
  ).length;
  const percentage = totalRecipes > 0 ? Math.round((unlockedCount / totalRecipes) * 100) : 0;

  // Group recipes by category
  const categories = Array.from(new Set(activeDatabase.recipes.map((r) => r.category)));

  return (
    <div className="space-y-6">
      {/* Top Banner: Progress Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Technology & Recipe Progression</span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Factory Research Status
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Track which crafting recipes and automation processes you have researched in your game world.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-amber-400">
                {unlockedCount} / {totalRecipes}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {percentage}% unlocked
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={unlockAllRecipes}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
              >
                Unlock All
              </button>
              <button
                onClick={lockAllRecipes}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                Lock All
              </button>
            </div>
          </div>
        </div>

        {/* Industrial Progress Bar */}
        <div className="relative z-10 mt-6 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Pinned Production Targets Milestone List */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Active Production Goals</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pinned automation targets you are actively building towards.
            </p>
          </div>

          <button
            onClick={() => {
              const item = activeDatabase.items.find((i) => !i.isRaw) || activeDatabase.items[0];
              if (item) {
                addGoal(item.id, 60, 'per_minute');
              }
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((g) => {
            const item = activeDatabase.items.find((i) => i.id === g.itemId);
            return (
              <div
                key={g.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {item?.icon || '📦'}
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {item?.name}
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono font-semibold">
                      {g.targetRate} {g.unit === 'per_second' ? 'items/s' : 'items/min'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setActiveGoalId(g.id);
                      setActiveTab('calculator');
                    }}
                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-xs font-medium flex items-center gap-1"
                    title="View in Calculator"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Unlock Toggles */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Recipe Tech Tiers & Categories
        </h3>

        <div className="space-y-4">
          {categories.map((cat) => {
            const catRecipes = activeDatabase.recipes.filter((r) => r.category === cat);
            const catUnlocked = catRecipes.filter((r) =>
              progression.unlockedRecipeIds.includes(r.id)
            ).length;
            const catPercent = Math.round((catUnlocked / catRecipes.length) * 100);

            return (
              <div
                key={cat}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{cat}</span>
                    <span className="text-xs font-mono text-slate-400">
                      ({catUnlocked} / {catRecipes.length} unlocked)
                    </span>
                  </div>

                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${
                      catPercent === 100
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {catPercent}%
                  </span>
                </div>

                {/* Recipe checklist pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {catRecipes.map((r) => {
                    const isUnlocked = progression.unlockedRecipeIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleRecipeUnlocked(r.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition ${
                          isUnlocked
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/40'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">
                            {r.products[0] ? activeDatabase.items.find((i) => i.id === r.products[0].itemId)?.icon : '⚙️'}
                          </span>
                          <span className="text-xs font-semibold truncate">{r.name}</span>
                        </div>

                        {isUnlocked ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
