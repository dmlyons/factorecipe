# AGENTS.md — FactoRecipe Technical & Agent Operations Guide

Welcome to the **FactoRecipe** codebase. This document serves as the authoritative architectural specification and operational handbook for AI agents and human developers maintaining, refactoring, or extending this project.

---

## 1. Project Mission & Overview

**FactoRecipe** is an offline-capable, local-first factory recipe catalog, production DAG (Directed Acyclic Graph) solver, and progression tracker for factory simulation games (such as Factorio, Satisfactory, Dyson Sphere Program, Captain of Industry, Minecraft tech mods, and custom player-designed games).

### Key Pillars
1. **Custom Sandbox First**: Everything (items, machines, categories, recipes, and craft times) is user-configurable without hardcoded game lock-in.
2. **Deterministic Production Solving**: Accurate mathematical computation of required recipe cycles, building counts (fractional and ceiling), raw resource requirements, power draw, and intermediate surpluses.
3. **Interactive Visual Flow**: Responsive SVG node graph showing production hierarchies, item throughputs per minute, and animated material flows.
4. **Local-First & Zero Lock-in**: Full state persistence via `localStorage` with JSON database import/export for portability and community sharing.

---

## 2. Tech Stack & Environment

- **Language / Runtime**: TypeScript 5.7+ running on Node.js (v18+)
- **Build Tool / Bundler**: Vite 6.x
- **UI Framework**: React 18.x (functional components with React hooks)
- **Styling**: Tailwind CSS 3.x with dark-mode industrial theme (`#0b0f19` canvas, slate surfaces, amber/orange highlights, cyan outputs, emerald raw materials)
- **Icons**: `lucide-react`
- **Celebration / Gamification**: `canvas-confetti`
- **Linting & Type-Checking**: Strict TypeScript (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`)

---

## 3. Directory Layout & Key Responsibilities

```
factorecipe/
├── src/
│   ├── types/
│   │   └── index.ts                 # Canonical domain models (Item, Crafter, Recipe, CalculationBreakdown, etc.)
│   ├── data/
│   │   └── presets.ts               # Default database presets (Standard Factory Sandbox & Blank Canvas)
│   ├── utils/
│   │   └── calculator.ts            # DAG recursion engine, rate conversions, power summation, belt rates
│   ├── context/
│   │   └── GameContext.tsx          # Global state, persistence hooks, and action dispatches
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.tsx           # Global navigation header, database selector, tab navigation
│   │   ├── calculator/
│   │   │   ├── CalculatorView.tsx   # Goal rate controls, high-level metrics, view switcher (graph/table/checklist)
│   │   │   └── FlowGraph.tsx        # Interactive SVG canvas (zoom/pan, bezier flow edges, node cards)
│   │   ├── recipes/
│   │   │   └── RecipeCatalog.tsx    # Recipe search, category filtering, unlock toggles, recipe modal
│   │   ├── items/
│   │   │   └── ItemsView.tsx        # Item catalog, raw vs crafted filtering, recipe usage xref, item modal
│   │   ├── crafters/
│   │   │   └── CraftersView.tsx     # Fabrication buildings, speed multipliers, energy consumption, crafter modal
│   │   ├── progression/
│   │   │   └── ProgressionView.tsx  # Tech research progression bar, category tiers, pinned milestone goals
│   │   └── settings/
│   │       └── DatabaseSettings.tsx # Multi-sandbox manager, JSON import/export, reset presets
│   ├── App.tsx                      # Root component containing GameProvider and active tab router
│   ├── index.css                    # Tailwind root directives, keyframe animations, dark scrollbar styling
│   └── main.tsx                     # ReactDOM mounting entry
├── index.html                       # HTML wrapper with Chakra Petch & JetBrains Mono font links
├── package.json                     # NPM dependencies and script targets
├── tailwind.config.js               # Industrial color palette extensions
├── tsconfig.json                    # Compiler options and path resolutions
└── vite.config.ts                   # Vite configuration with React plugin
```

---

## 4. Core Domain Models (`src/types/index.ts`)

When working with data entities, always adhere to these types:

- **`Item`**: Represents a material or product.
  - `id`: Unique identifier (e.g. `'iron-plate'`).
  - `isRaw`: Boolean flag indicating if it is mined/extracted directly from the map without a crafting recipe.
  - `category`: Text grouping (e.g. `'Smelting & Metals'`).
  - `unit`: Optional unit label (e.g. `'plates'`, `'m³'`, `'units'`).
- **`Crafter`**: A building/machine that crafts recipes.
  - `speed`: Crafting speed multiplier (e.g. `0.75` for Assembler 1, `2.0` for Electric Furnace).
  - `powerKW`: Active power draw in kilowatts.
  - `category`: The crafting category it can execute (e.g. `'Crafting'`, `'Smelting'`).
- **`Recipe`**:
  - `craftTime`: Base crafting time in seconds.
  - `ingredients`: Array of `{ itemId, amount }`.
  - `products`: Array of `{ itemId, amount, probability? }` (supports multi-product and byproducts).
  - `defaultCrafterId`: Optional ID of preferred machine.
- **`GameDatabase`**: A complete, self-contained sandbox dataset containing `items`, `crafters`, `recipes`, and `categories`.
- **`ProductionGoal`**: An active user target (e.g., target 60 `science-pack-1` per minute).

---

## 5. Calculation Engine Logic (`src/utils/calculator.ts`)

The calculator resolves production requirements using a recursive demand resolution algorithm:

1. **Target Demand**: All inputs are normalized to units per minute:
   $$\text{TargetRate}_{\text{min}} = \begin{cases} \text{TargetRate} & \text{if unit is per\_minute} \\ \text{TargetRate} \times 60 & \text{if unit is per\_second} \end{cases}$$

2. **Cycles & Machine Count**:
   For any recipe producing amount $P$ of item with base time $T$ (seconds) in crafter with speed $S$:
   $$\text{CyclesPerMin} = \frac{\text{RequiredRate}}{P}$$
   $$\text{CyclesPerMachinePerMin} = \frac{S}{T} \times 60$$
   $$\text{Machines}_{\text{exact}} = \frac{\text{CyclesPerMin}}{\text{CyclesPerMachinePerMin}} = \frac{\text{RequiredRate} \times T}{60 \times S \times P}$$
   $$\text{Machines}_{\text{ceil}} = \lceil \text{Machines}_{\text{exact}} \rceil$$

3. **Power Load**:
   $$\text{TotalPowerKW} = \sum (\text{Machines}_{\text{exact}} \times \text{Crafter}.\text{powerKW})$$

4. **Recursion & Intermediates**:
   - If an ingredient item is marked `isRaw = true` or has no producing recipe, its demand is routed to `rawInputs`.
   - If an ingredient is crafted, the algorithm records intermediate consumption, calculates producing recipe cycles, records byproduct production, and recurses down to its child ingredients.
   - **Loop Prevention**: An ancestor set (`Set<string>`) tracks active recursion paths; if an item recurses on itself, execution breaks and appends a warning to `warnings`.

5. **Depth & Layout Hierarchy**:
   Longest path depths are tracked so nodes are rendered left-to-right from raw extraction (depth 0) to final assembly.

---

## 6. State Architecture & Persistence (`src/context/GameContext.tsx`)

Global application state is managed via React Context and automatically persisted to browser `localStorage`:

| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `factorecipe_databases_v1` | `GameDatabase[]` | User sandboxes and default presets. |
| `factorecipe_active_db_v1` | `string` | ID of the currently selected database. |
| `factorecipe_progression_v1` | `Record<string, UserProgression>` | Unlocked recipe IDs, pinned items, and completed checklist nodes per database. |
| `factorecipe_goals_v1` | `ProductionGoal[]` | Target production items and rates. |
| `factorecipe_pref_recipes_v1` | `Record<string, string>` | Preferred recipe mappings for items with multiple alternate recipes. |
| `factorecipe_pref_crafters_v1` | `Record<string, string>` | Preferred machine mappings per recipe. |

### Context Operations:
- **Sandbox Management**: `createDatabase`, `updateDatabaseMeta`, `deleteDatabase`, `resetToDefaultPreset`, `importDatabase`, `exportDatabase`.
- **Item CRUD**: `addItem`, `updateItem`, `deleteItem` (cascading cleanup on recipe ingredients).
- **Crafter CRUD**: `addCrafter`, `updateCrafter`, `deleteCrafter`.
- **Recipe CRUD**: `addRecipe`, `updateRecipe`, `deleteRecipe`.
- **Progression**: `toggleRecipeUnlocked`, `toggleItemPinned`, `toggleChecklistItem`, `unlockAllRecipes`, `lockAllRecipes`.
- **Live Calculation**: Synchronously re-computes `activeCalculation` whenever active goal, database, or preferred machines change.

---

## 7. Developer & Agent Workflow

### Terminal Commands

```bash
# Start Vite development server (hot reload on http://localhost:5173)
npm run dev

# Run strict TypeScript check and Vite production build
npm run build

# Preview production build locally
npm run preview
```

### Critical Rules for AI Agents Editing Code
1. **Maintain TypeScript Strictness**:
   - Do NOT leave unused imports or local variables (the project uses `"noUnusedLocals": true` and `"noUnusedParameters": true`).
   - Run `npm run build` after modifying files to verify that `tsc` compiles with 0 errors.
2. **Preserve User Customizations & Data Integrity**:
   - Always retain fallback handling when an item or machine is deleted from a custom sandbox.
   - When modifying recipes, ensure validation checks that at least one ingredient and one product exist.
3. **UI Consistency**:
   - Retain the industrial dark palette (`bg-[#090d16]`, `bg-slate-900`, `border-slate-800`).
   - Use `formatRate` and `formatPower` for clean numerical formatting (avoid long floating-point decimals like `1.33333333333`).
   - For icons, use standard Lucide icons and emojis consistently.

---

## 8. Extension Points & Future Enhancements

When expanding FactoRecipe, consider these planned enhancements:
- **Productivity & Speed Modules / Beacons**: Add module slots to crafters/recipes that modify speed ($S$) and add free productivity bonuses ($\Delta P$).
- **Linear Matrix Solver (Simplex / Gaussian Elimination)**: For complex loops with circular byproducts (e.g. Uranium Kovarex enrichment or heavy oil cracking loops) where recursive DAG walking cannot balance closed loops.
- **Import Presets for Official Games**: Add downloadable or built-in game preset packs for Factorio Space Age, Satisfactory 1.0, and Dyson Sphere Program.
- **Belts & Inserter Rate Limit Warnings**: Warn when a single building requires more than one full belt or exceeds standard inserter throughput limits.
