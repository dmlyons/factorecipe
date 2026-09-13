import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GameDatabase,
  Item,
  Crafter,
  Recipe,
  ProductionGoal,
  UserProgression,
  CalculationBreakdown,
} from '../types';
import { STARTER_PRESET, PRESETS } from '../data/presets';
import { calculateProductionChain } from '../utils/calculator';
import confetti from 'canvas-confetti';

interface GameContextType {
  databases: GameDatabase[];
  activeDatabase: GameDatabase;
  activeDatabaseId: string;
  setActiveDatabaseId: (id: string) => void;

  // Database actions
  createDatabase: (name: string, description: string, icon: string) => void;
  updateDatabaseMeta: (name: string, description: string, icon: string) => void;
  deleteDatabase: (id: string) => void;
  resetToDefaultPreset: () => void;
  importDatabase: (jsonContent: string) => boolean;
  exportDatabase: () => void;

  // Item actions
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => void;

  // Crafter actions
  addCrafter: (crafter: Omit<Crafter, 'id'>) => void;
  updateCrafter: (crafter: Crafter) => void;
  deleteCrafter: (crafterId: string) => void;

  // Recipe actions
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;

  // Progression
  progression: UserProgression;
  toggleRecipeUnlocked: (recipeId: string) => void;
  toggleItemPinned: (itemId: string) => void;
  toggleChecklistItem: (key: string) => void;
  unlockAllRecipes: () => void;
  lockAllRecipes: () => void;

  // Production Goals & Calculator
  goals: ProductionGoal[];
  activeGoal: ProductionGoal | null;
  addGoal: (itemId: string, targetRate: number, unit?: 'per_minute' | 'per_second') => void;
  updateGoal: (goal: ProductionGoal) => void;
  deleteGoal: (goalId: string) => void;
  setActiveGoalId: (goalId: string | null) => void;

  // Calculator Preferences
  preferredRecipes: Record<string, string>;
  setPreferredRecipe: (itemId: string, recipeId: string) => void;
  preferredCrafters: Record<string, string>;
  setPreferredCrafter: (recipeId: string, crafterId: string) => void;

  // Live active calculation
  activeCalculation: CalculationBreakdown | null;

  // Navigation tab
  activeTab: 'calculator' | 'recipes' | 'items' | 'crafters' | 'progression' | 'settings';
  setActiveTab: (tab: 'calculator' | 'recipes' | 'items' | 'crafters' | 'progression' | 'settings') => void;

  // Search/Filter helper
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const STORAGE_KEY_DATABASES = 'factorecipe_databases_v1';
const STORAGE_KEY_ACTIVE_DB = 'factorecipe_active_db_v1';
const STORAGE_KEY_PROGRESSION = 'factorecipe_progression_v1';
const STORAGE_KEY_GOALS = 'factorecipe_goals_v1';
const STORAGE_KEY_PREF_RECIPES = 'factorecipe_pref_recipes_v1';
const STORAGE_KEY_PREF_CRAFTERS = 'factorecipe_pref_crafters_v1';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load databases
  const [databases, setDatabases] = useState<GameDatabase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATABASES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse databases from storage', e);
      }
    }
    return PRESETS;
  });

  const [activeDatabaseId, setActiveDatabaseId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_DB);
    return saved || STARTER_PRESET.id;
  });

  const activeDatabase =
    databases.find((db) => db.id === activeDatabaseId) || databases[0] || STARTER_PRESET;

  // Progression per database
  const [allProgressions, setAllProgressions] = useState<Record<string, UserProgression>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROGRESSION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse progression', e);
      }
    }
    // Default unlock initial recipes
    const starterUnlocked = STARTER_PRESET.recipes
      .filter((r) => r.unlockedByDefault)
      .map((r) => r.id);
    return {
      [STARTER_PRESET.id]: {
        unlockedRecipeIds: starterUnlocked,
        pinnedItemIds: ['science-pack-1', 'electronic-circuit'],
        completedChecklistIds: [],
      },
    };
  });

  const progression: UserProgression = allProgressions[activeDatabase.id] || {
    unlockedRecipeIds: activeDatabase.recipes.filter((r) => r.unlockedByDefault).map((r) => r.id),
    pinnedItemIds: [],
    completedChecklistIds: [],
  };

  // Goals
  const [goals, setGoals] = useState<ProductionGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GOALS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse goals', e);
      }
    }
    return [
      {
        id: 'goal-demo-science-1',
        itemId: 'science-pack-1',
        targetRate: 60,
        unit: 'per_minute',
        active: true,
      },
    ];
  });

  const [activeGoalId, setActiveGoalId] = useState<string | null>(
    goals.length > 0 ? goals[0].id : null
  );

  // Preferred recipes & crafters
  const [preferredRecipes, setPreferredRecipes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREF_RECIPES);
    return saved ? JSON.parse(saved) : {};
  });

  const [preferredCrafters, setPreferredCrafters] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREF_CRAFTERS);
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTab, setActiveTab] = useState<
    'calculator' | 'recipes' | 'items' | 'crafters' | 'progression' | 'settings'
  >('calculator');
  const [searchQuery, setSearchQuery] = useState('');

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATABASES, JSON.stringify(databases));
  }, [databases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_DB, activeDatabaseId);
  }, [activeDatabaseId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROGRESSION, JSON.stringify(allProgressions));
  }, [allProgressions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREF_RECIPES, JSON.stringify(preferredRecipes));
  }, [preferredRecipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREF_CRAFTERS, JSON.stringify(preferredCrafters));
  }, [preferredCrafters]);

  // Helper to update active database
  const updateActiveDatabase = (updater: (db: GameDatabase) => GameDatabase) => {
    setDatabases((prev) =>
      prev.map((db) => (db.id === activeDatabase.id ? updater(db) : db))
    );
  };

  // Database Management
  const createDatabase = (name: string, description: string, icon: string) => {
    const newDb: GameDatabase = {
      id: `game-${Date.now()}`,
      name,
      version: '1.0.0',
      description,
      icon: icon || '🏭',
      categories: ['Raw Resources', 'Crafted'],
      crafters: [
        {
          id: `crafter-${Date.now()}`,
          name: 'Standard Crafter',
          icon: '⚙️',
          speed: 1.0,
          powerKW: 100,
          category: 'Crafting',
        },
      ],
      items: [
        { id: `raw-1`, name: 'Raw Material', icon: '🪨', category: 'Raw Resources', isRaw: true },
      ],
      recipes: [],
    };
    setDatabases((prev) => [...prev, newDb]);
    setActiveDatabaseId(newDb.id);
  };

  const updateDatabaseMeta = (name: string, description: string, icon: string) => {
    updateActiveDatabase((db) => ({
      ...db,
      name,
      description,
      icon,
    }));
  };

  const deleteDatabase = (id: string) => {
    if (databases.length <= 1) {
      alert('Cannot delete the last remaining factory database.');
      return;
    }
    const remaining = databases.filter((db) => db.id !== id);
    setDatabases(remaining);
    if (activeDatabaseId === id) {
      setActiveDatabaseId(remaining[0].id);
    }
  };

  const resetToDefaultPreset = () => {
    setDatabases(PRESETS);
    setActiveDatabaseId(STARTER_PRESET.id);
  };

  const importDatabase = (jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.name || !Array.isArray(parsed.items) || !Array.isArray(parsed.recipes)) {
        alert('Invalid format: Missing name, items, or recipes array.');
        return false;
      }
      const importedDb: GameDatabase = {
        ...parsed,
        id: `imported-${Date.now()}`,
      };
      setDatabases((prev) => [...prev, importedDb]);
      setActiveDatabaseId(importedDb.id);
      return true;
    } catch (e) {
      alert(`Import error: ${(e as Error).message}`);
      return false;
    }
  };

  const exportDatabase = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeDatabase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeDatabase.name.toLowerCase().replace(/\s+/g, '_')}_factorecipe.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Item CRUD
  const addItem = (itemData: Omit<Item, 'id'>) => {
    const newItem: Item = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    updateActiveDatabase((db) => ({
      ...db,
      items: [...db.items, newItem],
      categories: db.categories.includes(newItem.category)
        ? db.categories
        : [...db.categories, newItem.category],
    }));
  };

  const updateItem = (updatedItem: Item) => {
    updateActiveDatabase((db) => ({
      ...db,
      items: db.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
      categories: db.categories.includes(updatedItem.category)
        ? db.categories
        : [...db.categories, updatedItem.category],
    }));
  };

  const deleteItem = (itemId: string) => {
    updateActiveDatabase((db) => ({
      ...db,
      items: db.items.filter((i) => i.id !== itemId),
      recipes: db.recipes
        .filter((r) => !r.products.some((p) => p.itemId === itemId))
        .map((r) => ({
          ...r,
          ingredients: r.ingredients.filter((ing) => ing.itemId !== itemId),
        })),
    }));
  };

  // Crafter CRUD
  const addCrafter = (crafterData: Omit<Crafter, 'id'>) => {
    const newCrafter: Crafter = {
      ...crafterData,
      id: `crafter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    updateActiveDatabase((db) => ({
      ...db,
      crafters: [...db.crafters, newCrafter],
    }));
  };

  const updateCrafter = (updatedCrafter: Crafter) => {
    updateActiveDatabase((db) => ({
      ...db,
      crafters: db.crafters.map((c) => (c.id === updatedCrafter.id ? updatedCrafter : c)),
    }));
  };

  const deleteCrafter = (crafterId: string) => {
    updateActiveDatabase((db) => ({
      ...db,
      crafters: db.crafters.filter((c) => c.id !== crafterId),
    }));
  };

  // Recipe CRUD
  const addRecipe = (recipeData: Omit<Recipe, 'id'>) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    updateActiveDatabase((db) => ({
      ...db,
      recipes: [...db.recipes, newRecipe],
    }));
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    updateActiveDatabase((db) => ({
      ...db,
      recipes: db.recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)),
    }));
  };

  const deleteRecipe = (recipeId: string) => {
    updateActiveDatabase((db) => ({
      ...db,
      recipes: db.recipes.filter((r) => r.id !== recipeId),
    }));
  };

  // Progression handlers
  const updateActiveProgression = (updater: (p: UserProgression) => UserProgression) => {
    setAllProgressions((prev) => {
      const current = prev[activeDatabase.id] || {
        unlockedRecipeIds: activeDatabase.recipes.filter((r) => r.unlockedByDefault).map((r) => r.id),
        pinnedItemIds: [],
        completedChecklistIds: [],
      };
      return {
        ...prev,
        [activeDatabase.id]: updater(current),
      };
    });
  };

  const toggleRecipeUnlocked = (recipeId: string) => {
    updateActiveProgression((p) => {
      const isUnlocked = p.unlockedRecipeIds.includes(recipeId);
      const next = isUnlocked
        ? p.unlockedRecipeIds.filter((id) => id !== recipeId)
        : [...p.unlockedRecipeIds, recipeId];

      if (!isUnlocked) {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
        });
      }

      return {
        ...p,
        unlockedRecipeIds: next,
      };
    });
  };

  const toggleItemPinned = (itemId: string) => {
    updateActiveProgression((p) => {
      const isPinned = p.pinnedItemIds.includes(itemId);
      return {
        ...p,
        pinnedItemIds: isPinned
          ? p.pinnedItemIds.filter((id) => id !== itemId)
          : [...p.pinnedItemIds, itemId],
      };
    });
  };

  const toggleChecklistItem = (key: string) => {
    updateActiveProgression((p) => {
      const isDone = p.completedChecklistIds.includes(key);
      const next = isDone
        ? p.completedChecklistIds.filter((k) => k !== key)
        : [...p.completedChecklistIds, key];

      if (!isDone) {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.85 },
        });
      }

      return {
        ...p,
        completedChecklistIds: next,
      };
    });
  };

  const unlockAllRecipes = () => {
    updateActiveProgression((p) => ({
      ...p,
      unlockedRecipeIds: activeDatabase.recipes.map((r) => r.id),
    }));
  };

  const lockAllRecipes = () => {
    updateActiveProgression((p) => ({
      ...p,
      unlockedRecipeIds: [],
    }));
  };

  // Goals
  const addGoal = (itemId: string, targetRate: number, unit: 'per_minute' | 'per_second' = 'per_minute') => {
    const newGoal: ProductionGoal = {
      id: `goal-${Date.now()}`,
      itemId,
      targetRate,
      unit,
      active: true,
    };
    setGoals((prev) => [newGoal, ...prev]);
    setActiveGoalId(newGoal.id);
  };

  const updateGoal = (updatedGoal: ProductionGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    if (activeGoalId === goalId) {
      const remaining = goals.filter((g) => g.id !== goalId);
      setActiveGoalId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const setPreferredRecipe = (itemId: string, recipeId: string) => {
    setPreferredRecipes((prev) => ({ ...prev, [itemId]: recipeId }));
  };

  const setPreferredCrafter = (recipeId: string, crafterId: string) => {
    setPreferredCrafters((prev) => ({ ...prev, [recipeId]: crafterId }));
  };

  // Active goal & calculation
  const activeGoal = goals.find((g) => g.id === activeGoalId) || (goals.length > 0 ? goals[0] : null);

  const activeCalculation: CalculationBreakdown | null = activeGoal
    ? calculateProductionChain(
        activeGoal.itemId,
        activeGoal.targetRate,
        activeGoal.unit,
        activeDatabase,
        preferredRecipes,
        preferredCrafters
      )
    : null;

  return (
    <GameContext.Provider
      value={{
        databases,
        activeDatabase,
        activeDatabaseId,
        setActiveDatabaseId,
        createDatabase,
        updateDatabaseMeta,
        deleteDatabase,
        resetToDefaultPreset,
        importDatabase,
        exportDatabase,
        addItem,
        updateItem,
        deleteItem,
        addCrafter,
        updateCrafter,
        deleteCrafter,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        progression,
        toggleRecipeUnlocked,
        toggleItemPinned,
        toggleChecklistItem,
        unlockAllRecipes,
        lockAllRecipes,
        goals,
        activeGoal,
        addGoal,
        updateGoal,
        deleteGoal,
        setActiveGoalId,
        preferredRecipes,
        setPreferredRecipe,
        preferredCrafters,
        setPreferredCrafter,
        activeCalculation,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
