import { describe, expect, it } from 'vitest';
import {
  validateImportJson,
  buildImportedDatabase,
  extractFullBackupRestore,
} from './importExport';
import type { ImportPayload } from './importExport';

function validSingleDatabase(): Record<string, unknown> {
  return {
    id: 'db-1',
    name: 'Test Sandbox',
    version: '1.0.0',
    description: 'A sandbox',
    icon: '🏭',
    categories: ['Raw', 'Crafted'],
    items: [{ id: 'ore', name: 'Ore', icon: '🪨', category: 'Raw', isRaw: true }],
    crafters: [
      { id: 'furnace', name: 'Furnace', icon: '🔥', speed: 1, powerKW: 100, category: 'Smelting' },
    ],
    recipes: [
      {
        id: 'smelt-ore',
        name: 'Smelt Ore',
        category: 'Smelting',
        craftTime: 2,
        ingredients: [{ itemId: 'ore', amount: 1 }],
        products: [{ itemId: 'plate', amount: 1 }],
      },
    ],
  };
}

describe('validateImportJson', () => {
  it('rejects malformed JSON with a syntax error message', () => {
    const preview = validateImportJson('{not json');
    expect(preview.type).toBe('invalid');
    expect(preview.errors[0]).toMatch(/JSON Syntax Error/);
  });

  it('rejects a non-object JSON payload', () => {
    const preview = validateImportJson('42');
    expect(preview.type).toBe('invalid');
    expect(preview.errors).toEqual(['JSON payload must be an object.']);
  });

  it('accepts a well-formed single database', () => {
    const preview = validateImportJson(JSON.stringify(validSingleDatabase()));
    expect(preview).toMatchObject({
      type: 'single_database',
      itemCount: 1,
      crafterCount: 1,
      recipeCount: 1,
      errors: [],
    });
  });

  it('rejects a single database missing required top-level fields', () => {
    const preview = validateImportJson(JSON.stringify({}));
    expect(preview.type).toBe('invalid');
    expect(preview.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"name"'),
        expect.stringContaining('"items"'),
        expect.stringContaining('"recipes"'),
      ]),
    );
  });

  it('rejects an item missing a required field', () => {
    const payload = validSingleDatabase();
    payload.items = [{ id: 'ore', name: 'Ore', icon: '🪨', category: 'Raw' }]; // no isRaw
    const preview = validateImportJson(JSON.stringify(payload));
    expect(preview.type).toBe('invalid');
    expect(preview.errors[0]).toMatch(/"isRaw"/);
  });

  it('rejects a recipe with no ingredients', () => {
    const payload = validSingleDatabase();
    (payload.recipes as unknown[]) = [
      {
        id: 'smelt-ore',
        name: 'Smelt Ore',
        category: 'Smelting',
        craftTime: 2,
        ingredients: [],
        products: [{ itemId: 'plate', amount: 1 }],
      },
    ];
    const preview = validateImportJson(JSON.stringify(payload));
    expect(preview.type).toBe('invalid');
    expect(preview.errors[0]).toMatch(/non-empty "ingredients"/);
  });

  it('rejects a recipe ingredient with a non-numeric amount', () => {
    const payload = validSingleDatabase();
    (payload.recipes as { ingredients: unknown[] }[])[0].ingredients = [
      { itemId: 'ore', amount: 'a lot' },
    ];
    const preview = validateImportJson(JSON.stringify(payload));
    expect(preview.type).toBe('invalid');
    expect(preview.errors[0]).toMatch(/numeric "amount"/);
  });

  it('accepts a well-formed full workspace backup', () => {
    const backup = {
      factorecipe_backup_version: '1.0.0',
      exportedAt: new Date().toISOString(),
      databases: [validSingleDatabase()],
      progression: {},
      goals: [],
    };
    const preview = validateImportJson(JSON.stringify(backup));
    expect(preview).toMatchObject({
      type: 'full_backup',
      databaseCount: 1,
      itemCount: 1,
      crafterCount: 1,
      recipeCount: 1,
    });
  });

  it('rejects a full backup with a malformed nested database', () => {
    const malformedDb = validSingleDatabase();
    malformedDb.recipes = [{ id: 'bad', name: 'Bad', category: 'X', craftTime: 1 }]; // no ingredients/products
    const backup = { factorecipe_backup_version: '1.0.0', databases: [malformedDb] };
    const preview = validateImportJson(JSON.stringify(backup));
    expect(preview.type).toBe('invalid');
    expect(preview.errors[0]).toMatch(/^Sandbox 1 /);
  });
});

describe('buildImportedDatabase', () => {
  const parsed = validSingleDatabase() as ImportPayload;

  it('mints a fresh id for a new import, distinct from the active database', () => {
    const result = buildImportedDatabase(parsed, 'new', 'existing-db-id');
    expect(result.id).not.toBe('existing-db-id');
    expect(result.name).toBe('Test Sandbox');
  });

  it('reuses the active database id when overwriting', () => {
    const result = buildImportedDatabase(parsed, 'overwrite', 'existing-db-id');
    expect(result.id).toBe('existing-db-id');
  });

  it('defaults missing optional fields', () => {
    const result = buildImportedDatabase({}, 'new', 'existing-db-id');
    expect(result).toMatchObject({
      name: 'Imported Sandbox',
      version: '1.0.0',
      description: '',
      icon: '🏭',
      categories: ['Raw Resources', 'Crafted'],
      items: [],
      crafters: [],
      recipes: [],
    });
  });
});

describe('extractFullBackupRestore', () => {
  it('extracts databases, progression, and goals from a valid backup', () => {
    const database = validSingleDatabase();
    const restored = extractFullBackupRestore({
      databases: [database],
      progression: {
        'db-1': { unlockedRecipeIds: [], pinnedItemIds: [], completedChecklistIds: [] },
      },
      goals: [{ id: 'g1', itemId: 'plate', targetRate: 60, unit: 'per_minute', active: true }],
    } as unknown as ImportPayload);
    expect(restored.databases).toEqual([database]);
    expect(restored.progression).toBeDefined();
    expect(restored.goals).toHaveLength(1);
  });

  it('omits progression and goals when absent, and defaults databases to empty', () => {
    const restored = extractFullBackupRestore({});
    expect(restored.databases).toEqual([]);
    expect(restored.progression).toBeUndefined();
    expect(restored.goals).toBeUndefined();
  });
});
