import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/layout/Navbar';
import { CalculatorView } from './components/calculator/CalculatorView';
import { RecipeCatalog } from './components/recipes/RecipeCatalog';
import { ItemsView } from './components/items/ItemsView';
import { CraftersView } from './components/crafters/CraftersView';
import { ProgressionView } from './components/progression/ProgressionView';
import { DatabaseSettings } from './components/settings/DatabaseSettings';

const MainContent: React.FC = () => {
  const { activeTab } = useGame();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeTab === 'calculator' && <CalculatorView />}
      {activeTab === 'recipes' && <RecipeCatalog />}
      {activeTab === 'items' && <ItemsView />}
      {activeTab === 'crafters' && <CraftersView />}
      {activeTab === 'progression' && <ProgressionView />}
      {activeTab === 'settings' && <DatabaseSettings />}
    </main>
  );
};

export function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <div className="flex-1">
          <MainContent />
        </div>
        <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              FactoRecipe • Custom Factory Recipe & DAG Calculator
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Local-first & Offline ready</span>
              <span>•</span>
              <span>Fully customizable sandboxes</span>
            </div>
          </div>
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;
