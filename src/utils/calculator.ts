import {
  GameDatabase,
  CalculationBreakdown,
  ProductionNode,
  ProductionEdge,
  RawInputRequirement,
  IntermediateBalance,
  MachineRequirement,
  RateUnit,
} from '../types';

export function calculateProductionChain(
  targetItemId: string,
  targetRate: number,
  unit: RateUnit,
  database: GameDatabase,
  preferredRecipes: Record<string, string> = {},
  preferredCrafters: Record<string, string> = {}
): CalculationBreakdown {
  const warnings: string[] = [];

  // Convert everything internally to items per minute
  const targetRatePerMin = unit === 'per_second' ? targetRate * 60 : targetRate;

  const targetItem = database.items.find((i) => i.id === targetItemId);
  if (!targetItem) {
    return {
      targetItemId,
      targetItemName: 'Unknown',
      targetItemIcon: '❓',
      targetRatePerMin,
      unit,
      nodes: [],
      edges: [],
      rawInputs: [],
      intermediates: [],
      machineRequirements: [],
      totalPowerKW: 0,
      warnings: ['Target item not found in database.'],
    };
  }

  // Find recipes producing an item
  function getRecipeForItem(itemId: string) {
    if (preferredRecipes[itemId]) {
      const rec = database.recipes.find((r) => r.id === preferredRecipes[itemId]);
      if (rec) return rec;
    }
    return database.recipes.find((r) =>
      r.products.some((p) => p.itemId === itemId)
    );
  }

  // Find crafter for a recipe
  function getCrafterForRecipe(recipeId: string, recipeCategory: string) {
    if (preferredCrafters[recipeId]) {
      const crafter = database.crafters.find((c) => c.id === preferredCrafters[recipeId]);
      if (crafter) return crafter;
    }
    const recipe = database.recipes.find((r) => r.id === recipeId);
    if (recipe?.defaultCrafterId) {
      const crafter = database.crafters.find((c) => c.id === recipe.defaultCrafterId);
      if (crafter) return crafter;
    }
    // Match by category
    const byCat = database.crafters.find((c) => c.category === recipeCategory);
    if (byCat) return byCat;

    // Fallback to first crafter or a generic mock
    return (
      database.crafters[0] || {
        id: 'generic-crafter',
        name: 'Manual / Generic Crafter',
        icon: '⚙️',
        speed: 1.0,
        powerKW: 0,
        category: 'Crafting',
      }
    );
  }

  // Collect recipe demands
  // Map of recipeId -> required cycles per minute
  const recipeCyclesMap = new Map<string, number>();
  // Track edges between recipes: sourceRecipeId -> targetRecipeId -> { itemId, ratePerMin }
  const rawInputDemands = new Map<string, number>();
  const intermediateProduced = new Map<string, number>();
  const intermediateConsumed = new Map<string, number>();

  interface FlowEdgeRecord {
    fromRecipeId: string;
    toRecipeId: string;
    itemId: string;
    ratePerMin: number;
  }
  const flowEdges: FlowEdgeRecord[] = [];

  // Depth tracking for layout
  const recipeDepthMap = new Map<string, number>();

  function resolveItemDemand(
    itemId: string,
    rateNeededPerMin: number,
    consumerRecipeId?: string,
    currentDepth = 0,
    ancestorItemIds = new Set<string>()
  ) {
    if (rateNeededPerMin <= 0) return;

    const item = database.items.find((i) => i.id === itemId);
    if (!item) {
      warnings.push(`Item ID "${itemId}" is referenced in recipes but missing from item definitions.`);
      return;
    }

    if (ancestorItemIds.has(itemId)) {
      warnings.push(`Circular recipe dependency detected involving "${item.name}". Stopped recursion to prevent infinite loop.`);
      return;
    }

    // Check if raw or has no recipes
    const recipe = getRecipeForItem(itemId);
    if (item.isRaw || !recipe) {
      const current = rawInputDemands.get(itemId) || 0;
      rawInputDemands.set(itemId, current + rateNeededPerMin);
      if (consumerRecipeId) {
        flowEdges.push({
          fromRecipeId: `raw-${itemId}`,
          toRecipeId: consumerRecipeId,
          itemId,
          ratePerMin: rateNeededPerMin,
        });
      }
      return;
    }

    // Record consumption if it's consumed by another recipe
    if (consumerRecipeId) {
      const consumed = intermediateConsumed.get(itemId) || 0;
      intermediateConsumed.set(itemId, consumed + rateNeededPerMin);
      flowEdges.push({
        fromRecipeId: recipe.id,
        toRecipeId: consumerRecipeId,
        itemId,
        ratePerMin: rateNeededPerMin,
      });
    }

    // How much does one cycle of this recipe produce of this item?
    const productDef = recipe.products.find((p) => p.itemId === itemId);
    const amountProducedPerCycle = (productDef?.amount || 1) * (productDef?.probability ?? 1);
    if (amountProducedPerCycle <= 0) return;

    const cyclesNeeded = rateNeededPerMin / amountProducedPerCycle;

    // Accumulate recipe cycles
    const prevCycles = recipeCyclesMap.get(recipe.id) || 0;
    recipeCyclesMap.set(recipe.id, prevCycles + cyclesNeeded);

    // Track depth (longest path from raw to target)
    const existingDepth = recipeDepthMap.get(recipe.id) || 0;
    if (currentDepth > existingDepth) {
      recipeDepthMap.set(recipe.id, currentDepth);
    }

    // Track production of all products from these cycles
    for (const prod of recipe.products) {
      const prodAmount = prod.amount * (prod.probability ?? 1) * cyclesNeeded;
      const curProd = intermediateProduced.get(prod.itemId) || 0;
      intermediateProduced.set(prod.itemId, curProd + prodAmount);
    }

    // Recurse on ingredients
    const nextAncestors = new Set(ancestorItemIds);
    nextAncestors.add(itemId);

    for (const ingredient of recipe.ingredients) {
      const ingredientRateNeeded = ingredient.amount * cyclesNeeded;
      resolveItemDemand(
        ingredient.itemId,
        ingredientRateNeeded,
        recipe.id,
        currentDepth + 1,
        nextAncestors
      );
    }
  }

  // Kick off resolution from the target
  resolveItemDemand(targetItemId, targetRatePerMin, undefined, 0, new Set());

  // Invert depths so raw resources/base recipes are at depth 0, and target is highest depth
  let maxDepth = 0;
  recipeDepthMap.forEach((depth) => {
    if (depth > maxDepth) maxDepth = depth;
  });

  // Build Production Nodes
  const nodes: ProductionNode[] = [];
  let totalPowerKW = 0;
  const machineAggregator = new Map<
    string,
    { exact: number; ceil: number; crafter: ReturnType<typeof getCrafterForRecipe> }
  >();

  recipeCyclesMap.forEach((cyclesPerMin, recipeId) => {
    const recipe = database.recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const crafter = getCrafterForRecipe(recipe.id, recipe.category);
    const speed = crafter.speed || 1.0;
    const craftTime = recipe.craftTime || 1.0;

    // A single machine completes (speed / craftTime) * 60 cycles per minute
    const cyclesPerMachinePerMin = (speed / craftTime) * 60;
    const machinesExact = cyclesPerMachinePerMin > 0 ? cyclesPerMin / cyclesPerMachinePerMin : 0;
    const machinesCeil = Math.ceil(machinesExact - 0.000001); // avoid floating point round up e.g. 2.0000000001
    const nodePower = machinesExact * (crafter.powerKW || 0);
    totalPowerKW += nodePower;

    // Aggregate crafter count
    const curMachine = machineAggregator.get(crafter.id) || { exact: 0, ceil: 0, crafter };
    curMachine.exact += machinesExact;
    curMachine.ceil += machinesCeil;
    machineAggregator.set(crafter.id, curMachine);

    // Calculate inputs and outputs for this node
    const inputs = recipe.ingredients.map((ing) => {
      const item = database.items.find((i) => i.id === ing.itemId);
      return {
        itemId: ing.itemId,
        itemName: item?.name || ing.itemId,
        itemIcon: item?.icon || '📦',
        ratePerMin: ing.amount * cyclesPerMin,
      };
    });

    const outputs = recipe.products.map((prod) => {
      const item = database.items.find((i) => i.id === prod.itemId);
      return {
        itemId: prod.itemId,
        itemName: item?.name || prod.itemId,
        itemIcon: item?.icon || '📦',
        ratePerMin: prod.amount * (prod.probability ?? 1) * cyclesPerMin,
      };
    });

    const invertedDepth = maxDepth - (recipeDepthMap.get(recipe.id) || 0);

    const primaryProduct = recipe.products.find((p) => p.itemId === targetItemId) || recipe.products[0];

    nodes.push({
      id: recipe.id,
      recipeId: recipe.id,
      recipeName: recipe.name,
      primaryItemId: primaryProduct?.itemId || targetItemId,
      crafterId: crafter.id,
      crafterName: crafter.name,
      crafterIcon: crafter.icon,
      craftSpeed: speed,
      craftTime,
      cyclesPerMin,
      machinesExact,
      machinesCeil,
      powerKW: nodePower,
      inputs,
      outputs,
      depth: invertedDepth,
      isTarget: recipe.products.some((p) => p.itemId === targetItemId),
    });
  });

  // Sort nodes by depth
  nodes.sort((a, b) => a.depth - b.depth);

  // Build edges
  const edges: ProductionEdge[] = flowEdges
    .filter((e) => !e.fromRecipeId.startsWith('raw-'))
    .map((e, idx) => {
      const item = database.items.find((i) => i.id === e.itemId);
      return {
        id: `edge-${idx}-${e.fromRecipeId}-${e.toRecipeId}`,
        sourceNodeId: e.fromRecipeId,
        targetNodeId: e.toRecipeId,
        itemId: e.itemId,
        itemName: item?.name || e.itemId,
        itemIcon: item?.icon || '📦',
        ratePerMin: e.ratePerMin,
      };
    });

  // Compile raw inputs
  const rawInputs: RawInputRequirement[] = [];
  rawInputDemands.forEach((ratePerMin, itemId) => {
    const item = database.items.find((i) => i.id === itemId);
    rawInputs.push({
      itemId,
      itemName: item?.name || itemId,
      itemIcon: item?.icon || '🪨',
      ratePerMin,
      ratePerSec: ratePerMin / 60,
    });
  });
  rawInputs.sort((a, b) => b.ratePerMin - a.ratePerMin);

  // Compile intermediate balances
  const intermediates: IntermediateBalance[] = [];
  const allIntermediateItemIds = new Set([
    ...intermediateProduced.keys(),
    ...intermediateConsumed.keys(),
  ]);

  allIntermediateItemIds.forEach((itemId) => {
    if (itemId === targetItemId) return; // Target is final product
    const produced = intermediateProduced.get(itemId) || 0;
    const consumed = intermediateConsumed.get(itemId) || 0;
    const item = database.items.find((i) => i.id === itemId);
    intermediates.push({
      itemId,
      itemName: item?.name || itemId,
      itemIcon: item?.icon || '⚙️',
      producedPerMin: produced,
      consumedPerMin: consumed,
      surplusPerMin: Math.max(0, produced - consumed),
    });
  });

  // Compile machine requirements
  const machineRequirements: MachineRequirement[] = [];
  machineAggregator.forEach(({ exact, ceil, crafter }) => {
    machineRequirements.push({
      crafterId: crafter.id,
      crafterName: crafter.name,
      crafterIcon: crafter.icon,
      totalExact: exact,
      totalCeil: ceil,
      totalPowerKW: exact * (crafter.powerKW || 0),
    });
  });
  machineRequirements.sort((a, b) => b.totalExact - a.totalExact);

  return {
    targetItemId,
    targetItemName: targetItem.name,
    targetItemIcon: targetItem.icon,
    targetRatePerMin,
    unit,
    nodes,
    edges,
    rawInputs,
    intermediates,
    machineRequirements,
    totalPowerKW,
    warnings,
  };
}

// Format numbers nicely: e.g. 1.25 -> "1.25", 12.000 -> "12", 0.33333 -> "0.33"
export function formatRate(value: number, decimals = 2): string {
  if (Math.abs(value) < 0.0001) return '0';
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

// Convert kW to readable kW/MW/GW
export function formatPower(powerKW: number): string {
  if (powerKW >= 1_000_000) {
    return `${(powerKW / 1_000_000).toFixed(2)} GW`;
  }
  if (powerKW >= 1_000) {
    return `${(powerKW / 1_000).toFixed(2)} MW`;
  }
  return `${Math.round(powerKW).toLocaleString()} kW`;
}

// Belts throughput calculation (Yellow 15/s, Red 30/s, Blue 45/s)
export function getBeltRequirements(itemsPerSec: number): {
  yellowBelts: number;
  redBelts: number;
  blueBelts: number;
} {
  return {
    yellowBelts: itemsPerSec / 15,
    redBelts: itemsPerSec / 30,
    blueBelts: itemsPerSec / 45,
  };
}
