import React, { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useGame } from '../../context/GameContext';
import { Recipe, RecipeIngredient, RecipeProduct } from '../../types';
import {
  Search,
  Plus,
  ArrowRight,
  Clock,
  Lock,
  Unlock,
  Calculator,
  Trash2,
  Edit2,
  Cog,
} from 'lucide-react';

export const RecipeCatalog: React.FC = () => {
  const {
    activeDatabase,
    progression,
    toggleRecipeUnlocked,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addGoal,
    setActiveTab,
  } = useGame();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [unlockFilter, setUnlockFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEscapeKey(isModalOpen, () => setIsModalOpen(false));

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Crafting');
  const [formCraftTime, setFormCraftTime] = useState(1.0);
  const [formDefaultCrafterId, setFormDefaultCrafterId] = useState('');
  const [formUnlockedByDefault, setFormUnlockedByDefault] = useState(true);
  const [formIngredients, setFormIngredients] = useState<RecipeIngredient[]>([]);
  const [formProducts, setFormProducts] = useState<RecipeProduct[]>([]);

  const openCreateModal = () => {
    setEditingRecipe(null);
    setFormName('');
    setFormCategory(activeDatabase.categories[0] || 'Crafting');
    setFormCraftTime(1.0);
    setFormDefaultCrafterId(activeDatabase.crafters[0]?.id || '');
    setFormUnlockedByDefault(true);

    const firstItem = activeDatabase.items[0]?.id || '';
    setFormIngredients([{ itemId: firstItem, amount: 1 }]);
    setFormProducts([{ itemId: firstItem, amount: 1 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormName(recipe.name);
    setFormCategory(recipe.category);
    setFormCraftTime(recipe.craftTime);
    setFormDefaultCrafterId(recipe.defaultCrafterId || activeDatabase.crafters[0]?.id || '');
    setFormUnlockedByDefault(recipe.unlockedByDefault ?? true);
    setFormIngredients([...recipe.ingredients]);
    setFormProducts([...recipe.products]);
    setIsModalOpen(true);
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (formIngredients.length === 0 || formProducts.length === 0) {
      alert('Recipe must have at least one ingredient and one product.');
      return;
    }

    const recipeData = {
      name: formName.trim(),
      category: formCategory,
      craftTime: Number(formCraftTime) || 1,
      defaultCrafterId: formDefaultCrafterId,
      unlockedByDefault: formUnlockedByDefault,
      ingredients: formIngredients.filter((i) => i.amount > 0),
      products: formProducts.filter((p) => p.amount > 0),
    };

    if (editingRecipe) {
      updateRecipe({
        ...recipeData,
        id: editingRecipe.id,
      });
    } else {
      addRecipe(recipeData);
    }
    setIsModalOpen(false);
  };

  // Filter recipes
  const categories = Array.from(new Set(activeDatabase.recipes.map((r) => r.category)));

  const filteredRecipes = activeDatabase.recipes.filter((r) => {
    const isUnlocked = progression.unlockedRecipeIds.includes(r.id);
    if (unlockFilter === 'unlocked' && !isUnlocked) return false;
    if (unlockFilter === 'locked' && isUnlocked) return false;

    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchCategory = r.category.toLowerCase().includes(q);
      const matchIngredient = r.ingredients.some((ing) => {
        const item = activeDatabase.items.find((i) => i.id === ing.itemId);
        return item?.name.toLowerCase().includes(q);
      });
      const matchProduct = r.products.some((prod) => {
        const item = activeDatabase.items.find((i) => i.id === prod.itemId);
        return item?.name.toLowerCase().includes(q);
      });
      return matchName || matchCategory || matchIngredient || matchProduct;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar: Search, Category & Progression Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search recipes, ingredients, products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filters & Add Recipe Button */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          {/* Unlock Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setUnlockFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                unlockFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({activeDatabase.recipes.length})
            </button>
            <button
              onClick={() => setUnlockFilter('unlocked')}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                unlockFilter === 'unlocked'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <Unlock className="w-3 h-3" />
              <span>Unlocked</span>
            </button>
            <button
              onClick={() => setUnlockFilter('locked')}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                unlockFilter === 'locked'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Recipe</span>
          </button>
        </div>
      </div>

      {/* Categories chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
            selectedCategory === 'all'
              ? 'bg-slate-800 border-amber-400 text-amber-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              selectedCategory === cat
                ? 'bg-slate-800 border-amber-400 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => {
          const isUnlocked = progression.unlockedRecipeIds.includes(recipe.id);
          const defaultCrafter = activeDatabase.crafters.find(
            (c) => c.id === recipe.defaultCrafterId
          ) || activeDatabase.crafters[0];

          return (
            <div
              key={recipe.id}
              className={`rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg ${
                isUnlocked
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/60 border-slate-900 opacity-65 hover:opacity-100'
              }`}
            >
              {/* Card Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-start justify-between gap-2 bg-slate-950/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">
                      {recipe.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
                      {recipe.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {recipe.craftTime}s cycle
                    </span>
                  </div>
                </div>

                {/* Unlock status toggle */}
                <button
                  onClick={() => toggleRecipeUnlocked(recipe.id)}
                  className={`p-1.5 rounded-lg border transition ${
                    isUnlocked
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                  title={isUnlocked ? 'Unlocked (Click to Lock)' : 'Locked (Click to Unlock)'}
                >
                  {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Card Body: Ingredients -> Products */}
              <div className="p-4 space-y-3 flex-1">
                {/* Ingredients */}
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1.5">
                    Ingredients
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients.map((ing) => {
                      const item = activeDatabase.items.find((i) => i.id === ing.itemId);
                      return (
                        <div
                          key={ing.itemId}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200"
                        >
                          <span>{item?.icon || '📦'}</span>
                          <span className="font-semibold text-amber-400 font-mono">
                            {ing.amount}x
                          </span>
                          <span className="text-slate-300 truncate max-w-[100px]">
                            {item?.name || ing.itemId}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Crafting Arrow Divider */}
                <div className="flex items-center justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Products */}
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1.5">
                    Products
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.products.map((prod) => {
                      const item = activeDatabase.items.find((i) => i.id === prod.itemId);
                      return (
                        <div
                          key={prod.itemId}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200"
                        >
                          <span>{item?.icon || '📦'}</span>
                          <span className="font-semibold text-cyan-300 font-mono">
                            {prod.amount}x
                          </span>
                          <span className="font-medium truncate max-w-[100px]">
                            {item?.name || prod.itemId}
                          </span>
                          {prod.probability && prod.probability < 1.0 && (
                            <span className="text-[10px] text-amber-400 font-mono">
                              ({Math.round(prod.probability * 100)}%)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer: Machine info & Action buttons */}
              <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 truncate">
                  <Cog className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{defaultCrafter?.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Calculate chain */}
                  <button
                    onClick={() => {
                      const primaryProduct = recipe.products[0];
                      if (primaryProduct) {
                        addGoal(primaryProduct.itemId, 60, 'per_minute');
                        setActiveTab('calculator');
                      }
                    }}
                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1 text-[11px]"
                    title="Calculate production chain for this recipe"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Calculate</span>
                  </button>

                  <button
                    onClick={() => openEditModal(recipe)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Edit Recipe"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete recipe "${recipe.name}"?`)) {
                        deleteRecipe(recipe.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Recipe"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRecipe}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingRecipe ? 'Edit Recipe' : 'Add Custom Recipe'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scroll Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Name & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Recipe Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Iron Gear Wheel"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Crafting or Smelting"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Craft Time & Default Crafter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Crafting Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={formCraftTime}
                    onChange={(e) => setFormCraftTime(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Default Machine
                  </label>
                  <select
                    value={formDefaultCrafterId}
                    onChange={(e) => setFormDefaultCrafterId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {activeDatabase.crafters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.speed}x speed)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Ingredients Needed
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstItem = activeDatabase.items[0]?.id || '';
                      setFormIngredients((prev) => [...prev, { itemId: firstItem, amount: 1 }]);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Ingredient
                  </button>
                </div>

                {formIngredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={ing.itemId}
                      onChange={(e) => {
                        const next = [...formIngredients];
                        next[idx].itemId = e.target.value;
                        setFormIngredients(next);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                    >
                      {activeDatabase.items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.icon} {i.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={ing.amount}
                      onChange={(e) => {
                        const next = [...formIngredients];
                        next[idx].amount = parseFloat(e.target.value) || 1;
                        setFormIngredients(next);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-center font-mono"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFormIngredients((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Products List */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Products Output
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstItem = activeDatabase.items[0]?.id || '';
                      setFormProducts((prev) => [...prev, { itemId: firstItem, amount: 1 }]);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Product
                  </button>
                </div>

                {formProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={prod.itemId}
                      onChange={(e) => {
                        const next = [...formProducts];
                        next[idx].itemId = e.target.value;
                        setFormProducts(next);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                    >
                      {activeDatabase.items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.icon} {i.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={prod.amount}
                      onChange={(e) => {
                        const next = [...formProducts];
                        next[idx].amount = parseFloat(e.target.value) || 1;
                        setFormProducts(next);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-center font-mono"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFormProducts((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
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
                Save Recipe
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
