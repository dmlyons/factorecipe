export interface Item {
  id: string;
  name: string;
  icon: string;
  category: string;
  isRaw: boolean;
  description?: string;
  unit?: string;
}

export interface Crafter {
  id: string;
  name: string;
  icon: string;
  speed: number;
  powerKW: number;
  pollution?: number;
  category: string; // e.g. "Smelting", "Assembling", "Refining", "Mining"
  description?: string;
}

export interface RecipeIngredient {
  itemId: string;
  amount: number;
}

export interface RecipeProduct {
  itemId: string;
  amount: number;
  probability?: number; // 0 to 1, default 1.0
}

export interface Recipe {
  id: string;
  name: string;
  category: string; // matches Crafter.category or general grouping
  craftTime: number; // in seconds
  ingredients: RecipeIngredient[];
  products: RecipeProduct[];
  defaultCrafterId?: string;
  unlockedByDefault?: boolean;
  notes?: string;
}

export interface GameDatabase {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  categories: string[];
  items: Item[];
  crafters: Crafter[];
  recipes: Recipe[];
}

export type RateUnit = 'per_minute' | 'per_second';

export interface ProductionGoal {
  id: string;
  itemId: string;
  targetRate: number; // in the chosen unit
  unit: RateUnit;
  preferredRecipeId?: string;
  preferredCrafterId?: string;
  active: boolean;
  notes?: string;
}

export interface ProductionNodeOutput {
  itemId: string;
  itemName: string;
  itemIcon: string;
  ratePerMin: number;
}

export interface ProductionNodeInput {
  itemId: string;
  itemName: string;
  itemIcon: string;
  ratePerMin: number;
}

export interface ProductionNode {
  id: string;
  recipeId: string;
  recipeName: string;
  primaryItemId: string;
  crafterId: string;
  crafterName: string;
  crafterIcon: string;
  craftSpeed: number;
  craftTime: number;
  cyclesPerMin: number;
  machinesExact: number;
  machinesCeil: number;
  powerKW: number;
  inputs: ProductionNodeInput[];
  outputs: ProductionNodeOutput[];
  depth: number;
  isTarget?: boolean;
}

export interface ProductionEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  itemId: string;
  itemName: string;
  itemIcon: string;
  ratePerMin: number;
}

export interface RawInputRequirement {
  itemId: string;
  itemName: string;
  itemIcon: string;
  ratePerMin: number;
  ratePerSec: number;
}

export interface IntermediateBalance {
  itemId: string;
  itemName: string;
  itemIcon: string;
  producedPerMin: number;
  consumedPerMin: number;
  surplusPerMin: number;
}

export interface MachineRequirement {
  crafterId: string;
  crafterName: string;
  crafterIcon: string;
  totalExact: number;
  totalCeil: number;
  totalPowerKW: number;
}

export interface CalculationBreakdown {
  targetItemId: string;
  targetItemName: string;
  targetItemIcon: string;
  targetRatePerMin: number;
  unit: RateUnit;
  nodes: ProductionNode[];
  edges: ProductionEdge[];
  rawInputs: RawInputRequirement[];
  intermediates: IntermediateBalance[];
  machineRequirements: MachineRequirement[];
  totalPowerKW: number;
  warnings: string[];
}

export interface UserProgression {
  unlockedRecipeIds: string[];
  pinnedItemIds: string[];
  completedChecklistIds: string[];
}
