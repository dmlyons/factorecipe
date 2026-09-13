# FactoRecipe 🏭

An interactive, sandbox-focused recipe tracker, production tree solver, and factory chain calculator for factory simulation games (Factorio, Satisfactory, Dyson Sphere Program, Tech Mods, and custom sandbox designs).

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-teal.svg)](https://tailwindcss.com/)

---

## ✨ Features

- ⚙️ **Production Chain Calculator & DAG Solver**:
  - Automatically calculates recursive recipe trees, required machine counts (exact & ceiling), and raw input harvest rates.
  - Computes active electrical power load (kW / MW / GW).
  - Calculates transport belt throughput equivalents (e.g., Yellow Belts at 15 items/s).
  - Supports preferred crafters per recipe (e.g. Assembling Machine 1 vs 2 vs 3).
  - Detects and prevents circular recipe dependencies cleanly.

- 🗺️ **Visual Flow Graph**:
  - Interactive SVG node canvas with mouse drag / wheel zoom and touch drag / pinch-zoom controls (desktop and mobile).
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
  - Community example datasets in `examples/` (e.g. a Satisfactory 1.2 production chain) — importable via Settings → Import Sandbox without any code changes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (`^20.19.0 || ^22.13.0 || >=24`)
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

### Linting & Formatting

```bash
npm run lint          # ESLint (typescript-eslint, react-hooks, react-refresh)
npm run format:check  # Prettier check
npm run format        # Prettier write
```

### Testing

```bash
npm test
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
│   │   │   └── FlowGraph.tsx          # Interactive SVG canvas with mouse/touch pan, wheel/pinch zoom, animated DAG flow
│   │   ├── crafters/
│   │   │   └── CraftersView.tsx       # Machine speeds, power, and building manager
│   │   ├── items/
│   │   │   └── ItemsView.tsx          # Raw & crafted materials catalog
│   │   ├── layout/
│   │   │   └── Navbar.tsx             # Navigation header & sandbox switcher
│   │   ├── modals/
│   │   │   └── ImportExportModal.tsx  # Export/import JSON modal (validation preview, drag & drop)
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
│   ├── hooks/
│   │   └── useEscapeKey.ts            # Closes a modal/dropdown on Escape while it is open
│   ├── types/
│   │   └── index.ts                   # Core TypeScript types
│   ├── utils/
│   │   ├── calculator.ts              # Production graph solver & metrics helpers
│   │   ├── calculator.test.ts         # Vitest unit tests for the solver
│   │   └── sort.ts                    # Shared Intl.Collator-based alphabetical sort helpers
│   ├── App.tsx                        # Main application container
│   ├── index.css                      # Tailwind & custom keyframe styling
│   └── main.tsx                       # React DOM root entry
├── examples/
│   ├── satisfactory-1.2.json          # Example importable sandbox dataset
│   └── star-rupture.json              # Example importable sandbox dataset
├── .github/workflows/
│   ├── ci.yml                         # Lint, format-check, type-check, build, test on push/PR to main
│   └── deploy.yml                     # Build & deploy dist/ to GitHub Pages
├── eslint.config.js                   # ESLint flat config
├── .prettierrc.json                   # Prettier options
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── vitest.config.ts
```

---

## 📄 License

Licensed under the [Apache License 2.0](./LICENSE).
