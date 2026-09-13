import React, { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useGame } from '../../context/GameContext';
import { sortByName, sortStrings } from '../../utils/sort';
import { Item } from '../../types';
import { Search, Plus, Edit2, Trash2, Calculator, Tag } from 'lucide-react';

export const ItemsView: React.FC = () => {
  const { activeDatabase, addItem, updateItem, deleteItem, addGoal, setActiveTab } = useGame();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'raw' | 'crafted'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEscapeKey(isModalOpen, () => setIsModalOpen(false));
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📦');
  const [formCategory, setFormCategory] = useState('Raw Resources');
  const [formIsRaw, setFormIsRaw] = useState(false);
  const [formUnit, setFormUnit] = useState('units');

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormIcon('📦');
    setFormCategory(activeDatabase.categories[0] || 'Intermediates');
    setFormIsRaw(false);
    setFormUnit('units');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormIcon(item.icon);
    setFormCategory(item.category);
    setFormIsRaw(item.isRaw);
    setFormUnit(item.unit || 'units');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      updateItem({
        id: editingItem.id,
        name: formName.trim(),
        icon: formIcon.trim() || '📦',
        category: formCategory.trim(),
        isRaw: formIsRaw,
        unit: formUnit.trim() || 'units',
      });
    } else {
      addItem({
        name: formName.trim(),
        icon: formIcon.trim() || '📦',
        category: formCategory.trim(),
        isRaw: formIsRaw,
        unit: formUnit.trim() || 'units',
      });
    }
    setIsModalOpen(false);
  };

  const filteredItems = activeDatabase.items.filter((item) => {
    if (filterType === 'raw' && !item.isRaw) return false;
    if (filterType === 'crafted' && item.isRaw) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });
  const sortedItems = sortByName(filteredItems);

  const categories = sortStrings(Array.from(new Set(activeDatabase.items.map((i) => i.category))));

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter Type & Add Item */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({activeDatabase.items.length})
            </button>
            <button
              onClick={() => setFilterType('raw')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'raw'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Raw Only
            </button>
            <button
              onClick={() => setFilterType('crafted')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'crafted'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              Crafted Only
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
            categoryFilter === 'all'
              ? 'bg-slate-800 border-amber-400 text-amber-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              categoryFilter === cat
                ? 'bg-slate-800 border-amber-400 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedItems.map((item) => {
          const recipesProducing = activeDatabase.recipes.filter((r) =>
            r.products.some((p) => p.itemId === item.id),
          );
          const recipesConsuming = activeDatabase.recipes.filter((r) =>
            r.ingredients.some((ing) => ing.itemId === item.id),
          );

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-lg group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                      {item.icon}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-100">{item.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-500" />
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>

                  {item.isRaw ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Raw
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Crafted
                    </span>
                  )}
                </div>

                {/* Recipe Usage Stats */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span>Produced by:</span>
                    <span className="text-slate-200 font-semibold">
                      {recipesProducing.length} recipe{recipesProducing.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Used in:</span>
                    <span className="text-slate-200 font-semibold">
                      {recipesConsuming.length} recipe{recipesConsuming.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    addGoal(item.id, 60, 'per_minute');
                    setActiveTab('calculator');
                  }}
                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1 text-[11px] font-medium"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Set as Goal</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Delete "${item.name}"? This will also remove it from any recipes referencing it.`,
                        )
                      ) {
                        deleteItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Edit Item' : 'Add New Item'}
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
                <label className="block text-slate-400 font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Copper Cable"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Intermediates"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="e.g. units, m³, ore"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Raw Harvest Resource</div>
                <div className="text-[11px] text-slate-400">
                  Directly mined or extracted from natural deposits without crafting recipes.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formIsRaw}
                onChange={(e) => setFormIsRaw(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
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
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
