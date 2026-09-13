// localStorage keys FactoRecipe persists state under. Shared by GameContext (read/write) and
// ErrorBoundary (reset-on-crash), so they live outside either component file.

export const STORAGE_KEY_DATABASES = 'factorecipe_databases_v1';
export const STORAGE_KEY_ACTIVE_DB = 'factorecipe_active_db_v1';
export const STORAGE_KEY_PROGRESSION = 'factorecipe_progression_v1';
export const STORAGE_KEY_GOALS = 'factorecipe_goals_v1';
export const STORAGE_KEY_PREF_RECIPES = 'factorecipe_pref_recipes_v1';
export const STORAGE_KEY_PREF_CRAFTERS = 'factorecipe_pref_crafters_v1';

/** Every `localStorage` key this app owns; used by `ErrorBoundary` to reset app state. */
export const STORAGE_KEYS = [
  STORAGE_KEY_DATABASES,
  STORAGE_KEY_ACTIVE_DB,
  STORAGE_KEY_PROGRESSION,
  STORAGE_KEY_GOALS,
  STORAGE_KEY_PREF_RECIPES,
  STORAGE_KEY_PREF_CRAFTERS,
];
