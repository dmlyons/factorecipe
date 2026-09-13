import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { FlowGraph } from './FlowGraph';
import { formatRate, formatPower, getBeltRequirements } from '../../utils/calculator';
import {
  Zap,
  Cog,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowDownUp,
  LayoutGrid,
  ListOrdered,
  Share2,
} from 'lucide-react';

export const CalculatorView: React.FC = () => {
  const {
    activeDatabase,
    goals,
    activeGoal,
    addGoal,
    updateGoal,
    deleteGoal,
    setActiveGoalId,
    activeCalculation,
    progression,
    toggleChecklistItem,
    preferredCrafters,
    setPreferredCrafter,
  } = useGame();

  const [displayMode, setDisplayMode] = useState<'graph' | 'table' | 'checklist'>('graph');
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemPickerSearch, setItemPickerSearch] = useState('');
  const [editingNodeRecipeId, setEditingNodeRecipeId] = useState<string | null>(null);

  useEscapeKey(showItemPicker, () => setShowItemPicker(false));
  useEscapeKey(editingNodeRecipeId !== null, () => setEditingNodeRecipeId(null));

  if (!activeGoal || !activeCalculation) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/60 rounded-2xl border border-slate-800 text-center max-w-lg mx-auto mt-10">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4">
          ⚙️
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">No Active Production Goal</h3>
        <p className="text-sm text-slate-400 mb-6">
          Pick an item and target rate to calculate the complete factory production line, building count, and raw materials.
        </p>
        <button
          onClick={() => {
            const firstCraftedItem =
              activeDatabase.items.find((i) => !i.isRaw) || activeDatabase.items[0];
            if (firstCraftedItem) {
              addGoal(firstCraftedItem.id, 60, 'per_minute');
            }
          }}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" /> Start Production Goal
        </button>
      </div>
    );
  }

  const targetItem = activeDatabase.items.find((i) => i.id === activeGoal.itemId);

  const totalCeilMachines = activeCalculation.machineRequirements.reduce(
    (acc, m) => acc + m.totalCeil,
    0
  );

  const totalRawItemsPerMin = activeCalculation.rawInputs.reduce(
    (acc, r) => acc + r.ratePerMin,
    0
  );

  // Quick rate adjustment presets
  const applyQuickRate = (rate: number, unit: 'per_minute' | 'per_second') => {
    updateGoal({
      ...activeGoal,
      targetRate: rate,
      unit,
    });
  };

  return (
    <div className="space-y-6">
      {/* Pinned Production Goals Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 max-w-full">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
            Goals:
          </span>
          {goals.map((g) => {
            const item = activeDatabase.items.find((i) => i.id === g.itemId);
            const isActive = g.id === activeGoal.id;
            return (
              <div
                key={g.id}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
                onClick={() => setActiveGoalId(g.id)}
              >
                <span>{item?.icon || '📦'}</span>
                <span className="font-medium truncate max-w-[120px]">
                  {item?.name || 'Item'}
                </span>
                <span className="font-mono text-[11px] opacity-80">
                  {g.targetRate}/{g.unit === 'per_second' ? 's' : 'm'}
                </span>

                {goals.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGoal(g.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition"
                    title="Remove goal"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => {
              const crafted = activeDatabase.items.find((i) => !i.isRaw) || activeDatabase.items[0];
              if (crafted) {
                addGoal(crafted.id, 30, 'per_minute');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-300 text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target</span>
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setDisplayMode('graph')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
              displayMode === 'graph'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Flow Graph</span>
          </button>
          <button
            onClick={() => setDisplayMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
              displayMode === 'table'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Breakdown Table</span>
          </button>
          <button
            onClick={() => setDisplayMode('checklist')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
              displayMode === 'checklist'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Factory Checklist</span>
          </button>
        </div>
      </div>

      {/* Target Setting & Rate Configurator */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        {/* Target Item Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowItemPicker(true)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-400 transition text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl group-hover:scale-105 transition">
              {targetItem?.icon || '📦'}
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Target Product
              </div>
              <div className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>{targetItem?.name || 'Select Item'}</span>
                <span className="text-xs text-amber-400 font-normal">Change</span>
              </div>
            </div>
          </button>

          {/* Rate Controls */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <div className="px-2">
              <div className="text-[9px] uppercase font-semibold text-slate-400">
                Target Rate
              </div>
              <input
                type="number"
                min="0.1"
                step="any"
                value={activeGoal.targetRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    updateGoal({ ...activeGoal, targetRate: val });
                  }
                }}
                className="w-24 bg-transparent text-amber-300 font-mono font-bold text-lg focus:outline-none"
              />
            </div>

            {/* Unit Switcher */}
            <div className="flex flex-col gap-1 border-l border-slate-800 pl-2 pr-1">
              <button
                onClick={() =>
                  updateGoal({
                    ...activeGoal,
                    unit: activeGoal.unit === 'per_minute' ? 'per_second' : 'per_minute',
                  })
                }
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono font-semibold flex items-center gap-1"
                title="Switch between items/min and items/sec"
              >
                <ArrowDownUp className="w-3 h-3 text-amber-400" />
                <span>{activeGoal.unit === 'per_second' ? '/ sec' : '/ min'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Rate Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Presets:</span>
          <button
            onClick={() => applyQuickRate(30, 'per_minute')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
          >
            30/m
          </button>
          <button
            onClick={() => applyQuickRate(60, 'per_minute')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
          >
            60/m (1/s)
          </button>
          <button
            onClick={() => applyQuickRate(120, 'per_minute')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
          >
            120/m (2/s)
          </button>
          <button
            onClick={() => applyQuickRate(15, 'per_second')}
            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition"
            title="15/s = 1 Full Yellow Belt"
          >
            1 Yellow Belt (15/s)
          </button>
        </div>
      </div>

      {/* High-Level Production Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Power</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-yellow-300">
            {formatPower(activeCalculation.totalPowerKW)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Active electricity load
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Machines Needed</span>
            <Cog className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {totalCeilMachines}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Across {activeCalculation.nodes.length} recipe stages
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Raw Input Rate</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {formatRate(totalRawItemsPerMin)}
            <span className="text-xs text-slate-400 font-normal"> /min</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {activeCalculation.rawInputs.length} raw resource kinds
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Intermediates</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {activeCalculation.intermediates.length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Internal factory streams
          </div>
        </div>
      </div>

      {/* Warnings Banner if circular reference or missing ingredient */}
      {activeCalculation.warnings.length > 0 && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <span>⚠️ Production Warning:</span>
          </div>
          {activeCalculation.warnings.map((w, idx) => (
            <div key={idx} className="pl-4">
              • {w}
            </div>
          ))}
        </div>
      )}

      {/* Active Display Mode Content */}
      {displayMode === 'graph' && (
        <FlowGraph
          calculation={activeCalculation}
          onSelectRecipe={(recipeId) => setEditingNodeRecipeId(recipeId)}
        />
      )}

      {displayMode === 'table' && (
        <div className="space-y-6">
          {/* Machines Breakdown */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cog className="w-4 h-4 text-amber-400" />
              <span>Required Factory Buildings</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Building</th>
                    <th className="py-2 px-3">Exact Needed</th>
                    <th className="py-2 px-3">Recommended (Ceil)</th>
                    <th className="py-2 px-3">Power Draw</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeCalculation.machineRequirements.map((m) => (
                    <tr key={m.crafterId} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 flex items-center gap-2 text-slate-200 font-sans">
                        <span className="text-xl">{m.crafterIcon}</span>
                        <span className="font-semibold">{m.crafterName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-300">
                        {formatRate(m.totalExact, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-white font-bold">
                        {m.totalCeil} units
                      </td>
                      <td className="py-2.5 px-3 text-yellow-400">
                        {formatPower(m.totalPowerKW)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Inputs Breakdown */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Raw Resource Ingestion & Transport</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Resource</th>
                    <th className="py-2 px-3">Per Minute</th>
                    <th className="py-2 px-3">Per Second</th>
                    <th className="py-2 px-3">Transport Belts (15/s yellow)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeCalculation.rawInputs.map((raw) => {
                    const belts = getBeltRequirements(raw.ratePerSec);
                    return (
                      <tr key={raw.itemId} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 flex items-center gap-2 text-slate-200 font-sans">
                          <span className="text-xl">{raw.itemIcon}</span>
                          <span className="font-semibold">{raw.itemName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold">
                          {formatRate(raw.ratePerMin)} /min
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {formatRate(raw.ratePerSec)} /s
                        </td>
                        <td className="py-2.5 px-3 text-amber-300">
                          {formatRate(belts.yellowBelts, 2)} belts ({formatRate(belts.yellowBelts * 100, 0)}% of belt)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Intermediate Balances */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Intermediate Product Flow</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Intermediate Item</th>
                    <th className="py-2 px-3">Produced / min</th>
                    <th className="py-2 px-3">Consumed / min</th>
                    <th className="py-2 px-3">Surplus / min</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeCalculation.intermediates.map((item) => (
                    <tr key={item.itemId} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 flex items-center gap-2 text-slate-200 font-sans">
                        <span className="text-xl">{item.itemIcon}</span>
                        <span className="font-semibold">{item.itemName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300">
                        +{formatRate(item.producedPerMin)}
                      </td>
                      <td className="py-2.5 px-3 text-rose-300">
                        -{formatRate(item.consumedPerMin)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {item.surplusPerMin > 0.01 ? `+${formatRate(item.surplusPerMin)}` : '0 (Balanced)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {displayMode === 'checklist' && (
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-amber-400" />
                <span>Factory Construction Checklist</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Check off production stages and machines as you construct them in your game world.
              </p>
            </div>
            <div className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
              Goal: {targetItem?.name} ({activeGoal.targetRate}/{activeGoal.unit === 'per_second' ? 's' : 'm'})
            </div>
          </div>

          <div className="space-y-2.5">
            {activeCalculation.nodes.map((node) => {
              const checkKey = `goal-${activeGoal.id}-node-${node.id}`;
              const isChecked = progression.completedChecklistIds.includes(checkKey);

              return (
                <div
                  key={node.id}
                  onClick={() => toggleChecklistItem(checkKey)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                      : 'bg-slate-800/40 border-slate-700/80 hover:border-amber-400/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-amber-400">
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <div>
                      <div
                        className={`text-sm font-semibold flex items-center gap-2 ${
                          isChecked ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        <span>{node.crafterIcon}</span>
                        <span>
                          Build {node.machinesCeil}x {node.crafterName} for {node.recipeName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span>Rate: {formatRate(node.cyclesPerMin)} cycles/min</span>
                        <span>•</span>
                        <span>Power: {formatPower(node.powerKW)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono hidden sm:block">
                    <div className="text-slate-400">
                      Inputs: {node.inputs.map((i) => `${formatRate(i.ratePerMin)} ${i.itemName}`).join(', ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target Item Selection Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Select Production Goal</h3>
                <p className="text-xs text-slate-400">
                  Pick which item you want the factory to calculate and optimize for.
                </p>
              </div>
              <button
                onClick={() => setShowItemPicker(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-slate-800">
              <input
                type="text"
                placeholder="Search items by name or category..."
                value={itemPickerSearch}
                onChange={(e) => setItemPickerSearch(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Modal Item Grid */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {activeDatabase.items
                .filter(
                  (item) =>
                    item.name.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
                    item.category.toLowerCase().includes(itemPickerSearch.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      updateGoal({ ...activeGoal, itemId: item.id });
                      setShowItemPicker(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                      item.id === activeGoal.itemId
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="overflow-hidden">
                      <div className="text-sm font-semibold truncate text-slate-100">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.category} {item.isRaw ? '(Raw)' : ''}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Crafter Selection Modal for a specific node */}
      {editingNodeRecipeId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cog className="w-5 h-5 text-amber-400" />
                <span>Select Preferred Crafter</span>
              </h3>
              <button
                onClick={() => setEditingNodeRecipeId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Choose which machine type should fabricate this recipe. Higher speed crafters reduce the number of buildings needed.
            </p>

            <div className="space-y-2">
              {activeDatabase.crafters.map((c) => {
                const currentPref = preferredCrafters[editingNodeRecipeId];
                const isSelected = currentPref === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setPreferredCrafter(editingNodeRecipeId, c.id);
                      setEditingNodeRecipeId(null);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{c.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="text-amber-300 font-mono font-bold">{c.speed}x speed</span>
                          <span>•</span>
                          <span className="text-yellow-400 font-mono">{c.powerKW} kW</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
