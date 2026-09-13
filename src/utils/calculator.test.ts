import { describe, expect, it } from 'vitest';
import { calculateProductionChain, formatPower, formatRate, getBeltRequirements } from './calculator';
import { Crafter, GameDatabase, Item, Recipe } from '../types';

function item(id: string, overrides: Partial<Item> = {}): Item {
  return { id, name: id, icon: '📦', category: 'Test', isRaw: false, ...overrides };
}

function crafter(id: string, overrides: Partial<Crafter> = {}): Crafter {
  return { id, name: id, icon: '⚙️', speed: 1, powerKW: 100, category: 'Crafting', ...overrides };
}

function recipe(id: string, overrides: Partial<Recipe> = {}): Recipe {
  return {
    id,
    name: id,
    category: 'Crafting',
    craftTime: 1,
    ingredients: [],
    products: [],
    ...overrides,
  };
}

function db(partial: Partial<GameDatabase>): GameDatabase {
  return {
    id: 'test-db',
    name: 'Test DB',
    version: '1.0.0',
    description: '',
    icon: '🧪',
    categories: ['Test'],
    items: [],
    crafters: [],
    recipes: [],
    ...partial,
  };
}

describe('calculateProductionChain', () => {
  it('returns a not-found result with a warning when the target item does not exist', () => {
    const result = calculateProductionChain('missing-item', 60, 'per_minute', db({}));
    expect(result.nodes).toEqual([]);
    expect(result.warnings).toEqual(['Target item not found in database.']);
  });

  it('routes demand for an item with no recipe straight to raw inputs', () => {
    const database = db({ items: [item('ore', { isRaw: true })] });
    const result = calculateProductionChain('ore', 120, 'per_minute', database);
    expect(result.nodes).toEqual([]);
    expect(result.rawInputs).toEqual([
      expect.objectContaining({ itemId: 'ore', ratePerMin: 120, ratePerSec: 2 }),
    ]);
  });

  it('converts a per_second target rate to per-minute before solving', () => {
    const database = db({ items: [item('ore', { isRaw: true })] });
    const result = calculateProductionChain('ore', 2, 'per_second', database);
    expect(result.targetRatePerMin).toBe(120);
    expect(result.rawInputs[0].ratePerMin).toBe(120);
  });

  it('computes exact/ceil machine counts and power draw for a simple recipe', () => {
    // 1 cycle takes 2s, crafter speed 1 -> 30 cycles/min/machine, each cycle yields 1 plate from 1 ore.
    const database = db({
      items: [item('ore', { isRaw: true }), item('plate')],
      crafters: [crafter('furnace', { speed: 1, powerKW: 150 })],
      recipes: [
        recipe('smelt-plate', {
          craftTime: 2,
          ingredients: [{ itemId: 'ore', amount: 1 }],
          products: [{ itemId: 'plate', amount: 1 }],
          defaultCrafterId: 'furnace',
        }),
      ],
    });
    // Target 45/min needs 45 cycles/min; one machine does 30 cycles/min -> 1.5 exact, 2 ceil.
    const result = calculateProductionChain('plate', 45, 'per_minute', database);
    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0];
    expect(node.cyclesPerMin).toBeCloseTo(45);
    expect(node.machinesExact).toBeCloseTo(1.5);
    expect(node.machinesCeil).toBe(2);
    expect(node.powerKW).toBeCloseTo(1.5 * 150);
    expect(result.totalPowerKW).toBeCloseTo(225);
    expect(result.rawInputs).toEqual([
      expect.objectContaining({ itemId: 'ore', ratePerMin: 45 }),
    ]);
  });

  it('does not round a machine count just under an integer up to the next one', () => {
    // craftTime 1, speed 1 -> 60 cycles/min/machine. Target rate chosen so machinesExact is
    // 2.0 minus float noise (e.g. from repeated division), which must still ceil to 2, not 3.
    const database = db({
      items: [item('ore', { isRaw: true }), item('plate')],
      crafters: [crafter('furnace', { speed: 1 })],
      recipes: [
        recipe('smelt-plate', {
          craftTime: 1,
          ingredients: [{ itemId: 'ore', amount: 1 }],
          products: [{ itemId: 'plate', amount: 1 }],
          defaultCrafterId: 'furnace',
        }),
      ],
    });
    const result = calculateProductionChain('plate', 119.9999999, 'per_minute', database);
    expect(result.nodes[0].machinesCeil).toBe(2);
  });

  it('recurses through intermediates, aggregating raw inputs and per-item consumption/production', () => {
    // gear (target) <- plate <- ore (raw); 1 gear needs 2 plates, 1 plate needs 1 ore.
    const database = db({
      items: [item('ore', { isRaw: true }), item('plate'), item('gear')],
      crafters: [crafter('machine')],
      recipes: [
        recipe('smelt-plate', {
          ingredients: [{ itemId: 'ore', amount: 1 }],
          products: [{ itemId: 'plate', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
        recipe('craft-gear', {
          ingredients: [{ itemId: 'plate', amount: 2 }],
          products: [{ itemId: 'gear', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
      ],
    });
    const result = calculateProductionChain('gear', 30, 'per_minute', database);

    expect(result.nodes).toHaveLength(2);
    expect(result.rawInputs).toEqual([
      expect.objectContaining({ itemId: 'ore', ratePerMin: 60 }),
    ]);
    expect(result.intermediates).toEqual([
      expect.objectContaining({ itemId: 'plate', producedPerMin: 60, consumedPerMin: 60, surplusPerMin: 0 }),
    ]);
    // gear is the target item; it must not appear in the intermediates list.
    expect(result.intermediates.some((i) => i.itemId === 'gear')).toBe(false);
    // Edge from the plate recipe into the gear recipe.
    expect(result.edges).toEqual([
      expect.objectContaining({ sourceNodeId: 'smelt-plate', targetNodeId: 'craft-gear', itemId: 'plate', ratePerMin: 60 }),
    ]);
  });

  it('records excess byproduct output as surplus rather than clamping demand', () => {
    // Recipe produces 2 gear per cycle but only 1 gear/min is demanded downstream via a second
    // recipe that also needs gear, plus direct byproduct overproduction shows up as surplus.
    const database = db({
      items: [item('ore', { isRaw: true }), item('gear'), item('scrap')],
      crafters: [crafter('machine')],
      recipes: [
        // Every cycle yields 1 gear (needed) AND 1 scrap (byproduct, unconsumed).
        recipe('craft-gear', {
          ingredients: [{ itemId: 'ore', amount: 1 }],
          products: [{ itemId: 'gear', amount: 1 }, { itemId: 'scrap', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
      ],
    });
    const result = calculateProductionChain('gear', 30, 'per_minute', database);
    const scrap = result.intermediates.find((i) => i.itemId === 'scrap');
    expect(scrap).toEqual(
      expect.objectContaining({ producedPerMin: 30, consumedPerMin: 0, surplusPerMin: 30 })
    );
  });

  it('breaks circular recipe dependencies and warns instead of recursing infinitely', () => {
    const database = db({
      items: [item('a'), item('b')],
      crafters: [crafter('machine')],
      recipes: [
        recipe('make-a', {
          ingredients: [{ itemId: 'b', amount: 1 }],
          products: [{ itemId: 'a', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
        recipe('make-b', {
          ingredients: [{ itemId: 'a', amount: 1 }],
          products: [{ itemId: 'b', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
      ],
    });
    const result = calculateProductionChain('a', 60, 'per_minute', database);
    expect(result.warnings).toEqual([
      expect.stringContaining('Circular recipe dependency detected involving "a"'),
    ]);
  });

  it('warns when a recipe ingredient references an undefined item', () => {
    const database = db({
      items: [item('gear')],
      crafters: [crafter('machine')],
      recipes: [
        recipe('craft-gear', {
          ingredients: [{ itemId: 'ghost-ore', amount: 1 }],
          products: [{ itemId: 'gear', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
      ],
    });
    const result = calculateProductionChain('gear', 60, 'per_minute', database);
    expect(result.warnings).toEqual([
      expect.stringContaining('"ghost-ore" is referenced in recipes but missing from item definitions'),
    ]);
  });

  it('prefers the recipe named in preferredRecipes over the first declared match', () => {
    const database = db({
      items: [item('ore', { isRaw: true }), item('gear')],
      crafters: [crafter('machine')],
      recipes: [
        recipe('cheap-gear', {
          ingredients: [{ itemId: 'ore', amount: 1 }],
          products: [{ itemId: 'gear', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
        recipe('costly-gear', {
          ingredients: [{ itemId: 'ore', amount: 5 }],
          products: [{ itemId: 'gear', amount: 1 }],
          defaultCrafterId: 'machine',
        }),
      ],
    });
    const result = calculateProductionChain('gear', 10, 'per_minute', database, { gear: 'costly-gear' });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].recipeId).toBe('costly-gear');
    expect(result.rawInputs[0].ratePerMin).toBe(50);
  });

  it('prefers the crafter named in preferredCrafters over the category/default match', () => {
    const database = db({
      items: [item('ore', { isRaw: true }), item('plate')],
      crafters: [
        crafter('slow-furnace', { speed: 1, powerKW: 50 }),
        crafter('fast-furnace', { speed: 2, powerKW: 300 }),
      ],
      recipes: [
        recipe('smelt-plate', {
          craftTime: 1,
          ingredients: [{ itemId: 'ore', amount: 1 }],
          products: [{ itemId: 'plate', amount: 1 }],
          defaultCrafterId: 'slow-furnace',
        }),
      ],
    });
    const result = calculateProductionChain('plate', 60, 'per_minute', database, {}, { 'smelt-plate': 'fast-furnace' });
    expect(result.nodes[0].crafterId).toBe('fast-furnace');
    // speed 2, craftTime 1 -> 120 cycles/min/machine; 60 cycles needed -> 0.5 machines exact.
    expect(result.nodes[0].machinesExact).toBeCloseTo(0.5);
    expect(result.machineRequirements).toEqual([
      expect.objectContaining({ crafterId: 'fast-furnace', totalExact: 0.5, totalCeil: 1 }),
    ]);
  });

  it('applies product probability when computing effective yield per cycle', () => {
    // 50% chance of an extra byproduct per cycle; only the guaranteed product drives raw ore demand.
    const database = db({
      items: [item('ore', { isRaw: true }), item('gem'), item('dust')],
      crafters: [crafter('machine')],
      recipes: [
        recipe('mine-gem', {
          ingredients: [{ itemId: 'ore', amount: 1 }],
          products: [
            { itemId: 'gem', amount: 1 },
            { itemId: 'dust', amount: 1, probability: 0.5 },
          ],
          defaultCrafterId: 'machine',
        }),
      ],
    });
    const result = calculateProductionChain('gem', 60, 'per_minute', database);
    expect(result.rawInputs[0].ratePerMin).toBe(60);
    const dust = result.intermediates.find((i) => i.itemId === 'dust');
    expect(dust?.producedPerMin).toBeCloseTo(30);
  });
});

describe('formatRate', () => {
  it('rounds to the requested decimal places and rounds tiny values to zero', () => {
    expect(formatRate(0.00001)).toBe('0');
    expect(formatRate(1.005, 2)).toBe('1');
    expect(formatRate(12.0)).toBe('12');
    expect(formatRate(0.333333, 2)).toBe('0.33');
  });
});

describe('formatPower', () => {
  it('scales the unit by magnitude', () => {
    expect(formatPower(500)).toBe('500 kW');
    expect(formatPower(1500)).toBe('1.50 MW');
    expect(formatPower(2_500_000)).toBe('2.50 GW');
  });
});

describe('getBeltRequirements', () => {
  it('divides throughput by each belt tier capacity', () => {
    const result = getBeltRequirements(60);
    expect(result.yellowBelts).toBeCloseTo(4);
    expect(result.redBelts).toBeCloseTo(2);
    expect(result.blueBelts).toBeCloseTo(60 / 45);
  });
});
