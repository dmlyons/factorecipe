import {
  GameDatabase,
  ProductionGoal,
  UserProgression,
  ImportPreview,
  FullBackupExport,
} from '../types';

/** Loosely-typed shape of user-supplied import JSON: either a single sandbox or a full backup. */
export type ImportPayload = Partial<FullBackupExport> & Partial<GameDatabase>;

/** Extracted, validated payload of a full workspace backup, ready for the caller to apply. */
export interface FullBackupRestore {
  databases: GameDatabase[];
  progression?: Record<string, UserProgression>;
  goals?: ProductionGoal[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validates one element of a `GameDatabase.items` array; returns a human-readable error or null. */
function validateItemShape(value: unknown, index: number): string | null {
  if (!value || typeof value !== 'object') return `Item at index ${index} is not an object.`;
  const item = value as Record<string, unknown>;
  if (!isNonEmptyString(item.id)) return `Item at index ${index} is missing a valid "id".`;
  if (!isNonEmptyString(item.name)) return `Item "${item.id}" is missing a valid "name".`;
  if (!isNonEmptyString(item.category)) return `Item "${item.id}" is missing a valid "category".`;
  if (typeof item.isRaw !== 'boolean') return `Item "${item.id}" is missing a boolean "isRaw".`;
  return null;
}

/** Validates one element of a `GameDatabase.crafters` array; returns a human-readable error or null. */
function validateCrafterShape(value: unknown, index: number): string | null {
  if (!value || typeof value !== 'object') return `Crafter at index ${index} is not an object.`;
  const crafter = value as Record<string, unknown>;
  if (!isNonEmptyString(crafter.id)) return `Crafter at index ${index} is missing a valid "id".`;
  if (!isNonEmptyString(crafter.name)) return `Crafter "${crafter.id}" is missing a valid "name".`;
  if (!isFiniteNumber(crafter.speed))
    return `Crafter "${crafter.id}" is missing a numeric "speed".`;
  if (!isFiniteNumber(crafter.powerKW)) {
    return `Crafter "${crafter.id}" is missing a numeric "powerKW".`;
  }
  if (!isNonEmptyString(crafter.category)) {
    return `Crafter "${crafter.id}" is missing a valid "category".`;
  }
  return null;
}

/** Validates one element of a `Recipe.ingredients`/`products` array; returns an error or null. */
function validateRecipeLineShape(
  value: unknown,
  recipeId: string,
  field: 'ingredients' | 'products',
  index: number,
): string | null {
  if (!value || typeof value !== 'object') {
    return `Recipe "${recipeId}" ${field}[${index}] is not an object.`;
  }
  const line = value as Record<string, unknown>;
  if (!isNonEmptyString(line.itemId)) {
    return `Recipe "${recipeId}" ${field}[${index}] is missing a valid "itemId".`;
  }
  if (!isFiniteNumber(line.amount)) {
    return `Recipe "${recipeId}" ${field}[${index}] is missing a numeric "amount".`;
  }
  return null;
}

/** Validates one element of a `GameDatabase.recipes` array; returns a human-readable error or null. */
function validateRecipeShape(value: unknown, index: number): string | null {
  if (!value || typeof value !== 'object') return `Recipe at index ${index} is not an object.`;
  const recipe = value as Record<string, unknown>;
  if (!isNonEmptyString(recipe.id)) return `Recipe at index ${index} is missing a valid "id".`;
  if (!isNonEmptyString(recipe.name)) return `Recipe "${recipe.id}" is missing a valid "name".`;
  if (!isFiniteNumber(recipe.craftTime)) {
    return `Recipe "${recipe.id}" is missing a numeric "craftTime".`;
  }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return `Recipe "${recipe.id}" must have a non-empty "ingredients" array.`;
  }
  if (!Array.isArray(recipe.products) || recipe.products.length === 0) {
    return `Recipe "${recipe.id}" must have a non-empty "products" array.`;
  }
  for (let i = 0; i < recipe.ingredients.length; i++) {
    const error = validateRecipeLineShape(recipe.ingredients[i], recipe.id, 'ingredients', i);
    if (error) return error;
  }
  for (let i = 0; i < recipe.products.length; i++) {
    const error = validateRecipeLineShape(recipe.products[i], recipe.id, 'products', i);
    if (error) return error;
  }
  return null;
}

/**
 * Validates every items/crafters/recipes element of one `GameDatabase`-shaped object, so a
 * recipe missing `ingredients` (which would otherwise throw deep inside the recursive DAG
 * solver in `calculator.ts`) is rejected at import time with a specific message instead.
 */
function validateDatabaseElements(parsed: {
  items?: unknown;
  crafters?: unknown;
  recipes?: unknown;
}): string[] {
  const errors: string[] = [];
  if (Array.isArray(parsed.items)) {
    for (let i = 0; i < parsed.items.length; i++) {
      const error = validateItemShape(parsed.items[i], i);
      if (error) errors.push(error);
    }
  }
  if (Array.isArray(parsed.crafters)) {
    for (let i = 0; i < parsed.crafters.length; i++) {
      const error = validateCrafterShape(parsed.crafters[i], i);
      if (error) errors.push(error);
    }
  }
  if (Array.isArray(parsed.recipes)) {
    for (let i = 0; i < parsed.recipes.length; i++) {
      const error = validateRecipeShape(parsed.recipes[i], i);
      if (error) errors.push(error);
    }
  }
  return errors;
}

/**
 * Validates user-supplied import JSON (either a single sandbox or a full workspace backup)
 * without mutating any state. The shape checks here mirror what `calculator.ts` and the rest
 * of the app assume about `GameDatabase`/`Recipe`/`Item`/`Crafter` — anything that would
 * otherwise crash the recursive DAG solver on first calculation is rejected here instead.
 */
export function validateImportJson(jsonContent: string): ImportPreview {
  try {
    const parsed = JSON.parse(jsonContent) as ImportPayload;
    if (!parsed || typeof parsed !== 'object') {
      return {
        type: 'invalid',
        itemCount: 0,
        crafterCount: 0,
        recipeCount: 0,
        errors: ['JSON payload must be an object.'],
      };
    }

    // Detect full workspace backup
    if (parsed.factorecipe_backup_version || Array.isArray(parsed.databases)) {
      const dbs = Array.isArray(parsed.databases) ? parsed.databases : [];
      const totalItems = dbs.reduce(
        (acc: number, d: GameDatabase) => acc + (d.items?.length || 0),
        0,
      );
      const totalRecipes = dbs.reduce(
        (acc: number, d: GameDatabase) => acc + (d.recipes?.length || 0),
        0,
      );
      const totalCrafters = dbs.reduce(
        (acc: number, d: GameDatabase) => acc + (d.crafters?.length || 0),
        0,
      );

      const errors: string[] = [];
      dbs.forEach((db, dbIndex) => {
        for (const error of validateDatabaseElements(db)) {
          errors.push(`Sandbox ${dbIndex + 1} ("${db.name || 'unnamed'}"): ${error}`);
        }
      });

      if (errors.length > 0) {
        return {
          type: 'invalid',
          itemCount: totalItems,
          crafterCount: totalCrafters,
          recipeCount: totalRecipes,
          errors,
        };
      }

      return {
        type: 'full_backup',
        name: 'Full Workspace Backup',
        icon: '🗄️',
        version: parsed.factorecipe_backup_version || '1.0.0',
        description: `Complete backup containing ${dbs.length} sandbox(es), unlocked progression, and pinned goals.`,
        itemCount: totalItems,
        crafterCount: totalCrafters,
        recipeCount: totalRecipes,
        databaseCount: dbs.length,
        goalCount: Array.isArray(parsed.goals) ? parsed.goals.length : 0,
        errors: [],
      };
    }

    // Single database validation
    const errors: string[] = [];
    if (!parsed.name || typeof parsed.name !== 'string') {
      errors.push('Missing "name" property (must be a non-empty string).');
    }
    if (!Array.isArray(parsed.items)) {
      errors.push('Missing or invalid "items" array.');
    }
    if (!Array.isArray(parsed.recipes)) {
      errors.push('Missing or invalid "recipes" array.');
    }
    errors.push(...validateDatabaseElements(parsed));

    if (errors.length > 0) {
      return {
        type: 'invalid',
        itemCount: Array.isArray(parsed.items) ? parsed.items.length : 0,
        crafterCount: Array.isArray(parsed.crafters) ? parsed.crafters.length : 0,
        recipeCount: Array.isArray(parsed.recipes) ? parsed.recipes.length : 0,
        errors,
      };
    }

    return {
      type: 'single_database',
      name: parsed.name,
      icon: parsed.icon || '🏭',
      version: parsed.version || '1.0.0',
      description: parsed.description || '',
      itemCount: Array.isArray(parsed.items) ? parsed.items.length : 0,
      crafterCount: Array.isArray(parsed.crafters) ? parsed.crafters.length : 0,
      recipeCount: Array.isArray(parsed.recipes) ? parsed.recipes.length : 0,
      errors: [],
    };
  } catch (e) {
    return {
      type: 'invalid',
      itemCount: 0,
      crafterCount: 0,
      recipeCount: 0,
      errors: [`JSON Syntax Error: ${(e as Error).message}`],
    };
  }
}

/**
 * Builds the `GameDatabase` to store for a single-sandbox import. Pure given its inputs except
 * for the `id` it mints for a `mode: 'new'` import (timestamp + random suffix, matching the
 * `addItem`/`addCrafter`/`addRecipe` id scheme elsewhere in the app).
 */
export function buildImportedDatabase(
  parsed: ImportPayload,
  mode: 'new' | 'overwrite',
  existingDatabaseId: string,
): GameDatabase {
  return {
    id:
      mode === 'overwrite'
        ? existingDatabaseId
        : `game-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: parsed.name || 'Imported Sandbox',
    version: parsed.version || '1.0.0',
    description: parsed.description || '',
    icon: parsed.icon || '🏭',
    categories: Array.isArray(parsed.categories) ? parsed.categories : ['Raw Resources', 'Crafted'],
    items: Array.isArray(parsed.items) ? parsed.items : [],
    crafters: Array.isArray(parsed.crafters) ? parsed.crafters : [],
    recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
  };
}

/** Extracts the databases/progression/goals to restore from a validated full-backup payload. */
export function extractFullBackupRestore(parsed: ImportPayload): FullBackupRestore {
  return {
    databases: Array.isArray(parsed.databases) ? parsed.databases : [],
    progression:
      parsed.progression && typeof parsed.progression === 'object' ? parsed.progression : undefined,
    goals: Array.isArray(parsed.goals) ? parsed.goals : undefined,
  };
}
