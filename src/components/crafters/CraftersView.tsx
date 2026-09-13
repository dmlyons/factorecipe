import React, { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useGame } from '../../context/GameContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { sortByName } from '../../utils/sort';
import { Crafter } from '../../types';
import { formatPower } from '../../utils/calculator';
import { Cog, Plus, Edit2, Trash2, Zap, Gauge, Layers } from 'lucide-react';

export const CraftersView: React.FC = () => {
  const { activeDatabase, addCrafter, updateCrafter, deleteCrafter } = useGame();
  const confirm = useConfirmDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrafter, setEditingCrafter] = useState<Crafter | null>(null);

  useEscapeKey(isModalOpen, () => setIsModalOpen(false));
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('⚙️');
  const [formSpeed, setFormSpeed] = useState(1.0);
  const [formPowerKW, setFormPowerKW] = useState(100);
  const [formCategory, setFormCategory] = useState('Crafting');
  const [formDescription, setFormDescription] = useState('');

  const openCreateModal = () => {
    setEditingCrafter(null);
    setFormName('');
    setFormIcon('⚙️');
    setFormSpeed(1.0);
    setFormPowerKW(100);
    setFormCategory('Crafting');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (crafter: Crafter) => {
    setEditingCrafter(crafter);
    setFormName(crafter.name);
    setFormIcon(crafter.icon);
    setFormSpeed(crafter.speed);
    setFormPowerKW(crafter.powerKW);
    setFormCategory(crafter.category);
    setFormDescription(crafter.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const data = {
      name: formName.trim(),
      icon: formIcon.trim() || '⚙️',
      speed: Number(formSpeed) || 1.0,
      powerKW: Number(formPowerKW) || 0,
      category: formCategory.trim() || 'Crafting',
      description: formDescription.trim(),
    };

    if (editingCrafter) {
      updateCrafter({ ...data, id: editingCrafter.id });
    } else {
      addCrafter(data);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cog className="w-5 h-5 text-amber-400" />
            <span>Crafters & Production Machines</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Define fabrication machines, furnaces, chemical plants, and refineries with their speed
            multipliers and energy consumption.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Machine</span>
        </button>
      </div>

      {/* Crafters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortByName(activeDatabase.crafters).map((crafter) => {
          const associatedRecipes = activeDatabase.recipes.filter(
            (r) => r.defaultCrafterId === crafter.id || r.category === crafter.category,
          );

          return (
            <div
              key={crafter.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      {crafter.icon}
                    </span>
                    <div>
                      <div className="text-base font-bold text-slate-100">{crafter.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>Category: {crafter.category}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {crafter.description && (
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {crafter.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-amber-400" />
                      <span>Craft Speed</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                      {crafter.speed}x
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span>Energy Draw</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-yellow-300 mt-0.5">
                      {formatPower(crafter.powerKW)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-500 font-mono">
                  Compatible with {associatedRecipes.length} recipe
                  {associatedRecipes.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => openEditModal(crafter)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Edit Machine"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    void (async () => {
                      const confirmed = await confirm(
                        `Delete machine "${crafter.name}"? Recipes using it will fall back to other available crafters.`,
                      );
                      if (confirmed) {
                        deleteCrafter(crafter.id);
                      }
                    })();
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                  title="Delete Machine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCrafter ? 'Edit Machine' : 'Add New Machine'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Icon/Emoji</label>
                <input
                  type="text"
                  required
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-slate-400 font-semibold mb-1">Machine Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Assembling Machine 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Speed Multiplier</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.05"
                  required
                  value={formSpeed}
                  onChange={(e) => setFormSpeed(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Power (kW)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={formPowerKW}
                  onChange={(e) => setFormPowerKW(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Category</label>
              <input
                type="text"
                required
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Crafting, Smelting, Refining"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of the building..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
              >
                Save Machine
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
