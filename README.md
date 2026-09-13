# FactoRecipe 🏭

An interactive, sandbox-focused recipe tracker, production tree solver, and factory chain calculator for factory simulation games (Factorio, Satisfactory, Dyson Sphere Program, Tech Mods, and custom sandbox designs).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-cyan.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3-teal.svg)

---

## ✨ Features

- ⚙️ **Production Chain Calculator & DAG Solver**:
  - Automatically calculates recursive recipe trees, required machine counts (exact & ceiling), and raw input harvest rates.
  - Computes active electrical power load (kW / MW / GW).
  - Calculates transport belt throughput equivalents (e.g., Yellow Belts at 15 items/s).
  - Supports preferred crafters per recipe (e.g. Assembling Machine 1 vs 2 vs 3).
  - Detects and prevents circular recipe dependencies cleanly.

- 🗺️ **Visual Flow Graph**:
  - Interactive SVG node canvas with pan & zoom controls.
  - Shows animated glowing flow paths between production stages with real-time throughput numbers.
  - Displays machine counts, cycle times, input ingredients, and output rates per stage.

- 📜 **Recipe & Item Catalog**:
  - Search by recipe name, ingredient name, or product name.
  - Filter by unlocked/locked status or categories.
  - Cross-references: See all recipes that produce or consume any specific item.
  - One-click "Calculate" button to immediately model a recipe in the calculator.

- 🏆 **Progression & Factory Checklist**:
  - Track researched/unlocked recipes with instant toggle switches and milestone celebration animations.
  - Dedicated interactive Factory Construction Checklist so you can check off stages as you build them on the ground.
  - Pin active production goals (e.g., `60 Automation Science Packs / min`).

- 🛠️ **Custom Sandbox Engine**:
  - Build your own games and modded tech trees from scratch.
  - Add, edit, or delete items, crafters/machines, and recipes.
  - Full **Export / Import JSON** support to backup or share your factory databases with other players.
  - Pre-loaded with a comprehensive **Standard Factory Sandbox** (smelting, circuits, chemical refining, science) and a **Blank Sandbox** for custom ground-up setups.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (or pnpm / yarn)

### Installation

```bash
# Clone or navigate to directory
cd factorecipe

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 📐 Production Calculation Formula

For a target production rate $R$ (items/minute), recipe craft cycle time $T$ (seconds), crafter speed multiplier $S$, and product quantity per craft $P$:

$$\text{Cycles per minute for 1 machine} = \frac{S}{T} \times 60$$

$$\text{Output per machine per minute} = \frac{S}{T} \times 60 \times P$$

$$\text{Machines needed} = \frac{R}{\text{Output per machine per minute}} = \frac{R \times T}{60 \times S \times P}$$

$$\text{Ingredient consumption per minute} = \left(\frac{R}{P}\right) \times \text{Ingredient Amount}$$

$$\text{Total Power} = \sum (\text{Machines}_{\text{exact}} \times \text{Power}_{\text{crafter}})$$

---

## 📁 Project Structure

```
factorecipe/
├── src/
│   ├── components/
│   │   ├── calculator/
│   │   │   ├── CalculatorView.tsx     # Target rates, metrics, table & checklist views
│   │   │   └── FlowGraph.tsx          # Interactive SVG canvas with animated DAG flow
│   │   ├── crafters/
│   │   │   └── CraftersView.tsx       # Machine speeds, power, and building manager
│   │   ├── items/
│   │   │   └── ItemsView.tsx          # Raw & crafted materials catalog
│   │   ├── layout/
│   │   │   └── Navbar.tsx             # Navigation header & sandbox switcher
│   │   ├── progression/
│   │   │   └── ProgressionView.tsx    # Tech tree progression & pinned targets
│   │   ├── recipes/
│   │   │   └── RecipeCatalog.tsx      # Searchable recipe database & recipe editor
│   │   └── settings/
│   │       └── DatabaseSettings.tsx   # Multi-game manager & JSON import/export
│   ├── context/
│   │   └── GameContext.tsx            # Global state & LocalStorage persistence
│   ├── data/
│   │   └── presets.ts                 # Standard Factory & Blank presets
│   ├── types/
│   │   └── index.ts                   # Core TypeScript types
│   ├── utils/
│   │   └── calculator.ts              # Production graph solver & metrics helpers
│   ├── App.tsx                        # Main application container
│   ├── index.css                      # Tailwind & custom keyframe styling
│   └── main.tsx                       # React DOM root entry
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
