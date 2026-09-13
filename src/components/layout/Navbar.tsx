import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Cog,
  Calculator,
  BookOpen,
  Layers,
  Trophy,
  Database,
  ChevronDown,
  ArrowUpDown,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    databases,
    activeDatabase,
    setActiveDatabaseId,
    activeTab,
    setActiveTab,
    openImportExportModal,
  } = useGame();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryTabs: {
    id: 'calculator' | 'recipes' | 'items' | 'crafters' | 'progression';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'recipes', label: 'Recipes', icon: BookOpen },
    { id: 'items', label: 'Items', icon: Layers },
    { id: 'crafters', label: 'Crafters', icon: Cog },
    { id: 'progression', label: 'Progression', icon: Trophy },
  ];

  const handleTabClick = (tabId: 'calculator' | 'recipes' | 'items' | 'crafters' | 'progression' | 'settings') => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c121e]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Sandbox Selector */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black text-xl">
                🏭
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-white">
                    Facto<span className="text-amber-400">Recipe</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Sandbox
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono -mt-0.5 hidden sm:block">
                  Production DAG & Recipe Tracker
                </div>
              </div>
            </div>

            {/* Sandbox Database Selector */}
            <div className="hidden md:flex items-center pl-3 border-l border-slate-800 flex-shrink-0">
              <div className="relative">
                <select
                  value={activeDatabase.id}
                  onChange={(e) => {
                    if (e.target.value === '__manage__') {
                      setActiveTab('settings');
                    } else {
                      setActiveDatabaseId(e.target.value);
                    }
                  }}
                  className="appearance-none bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold text-slate-200 py-1.5 pl-7 pr-8 rounded-lg cursor-pointer focus:outline-none focus:border-amber-400 transition"
                  title="Switch sandbox or manage databases"
                >
                  {databases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.icon} {db.name}
                    </option>
                  ))}
                  <option value="__manage__">⚙️ Manage Sandboxes...</option>
                </select>
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
                  {activeDatabase.icon}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Desktop Navigation & Utilities (>= 768px) */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Primary Tabs */}
            <nav className="flex items-center gap-1">
              {primaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="h-5 w-[1px] bg-slate-800 mx-1" />

            {/* Sandboxes / Database Settings */}
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title="Manage factory sandboxes and presets"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sandboxes</span>
            </button>

            {/* Import / Export Action */}
            <button
              onClick={() => openImportExportModal('export')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition shadow-sm whitespace-nowrap"
              title="Import or Export Recipe Sandboxes & Backups"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Import / Export</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle (< 768px) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition focus:outline-none border border-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown (< 768px) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-[#0c121e]/98 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl animate-in fade-in duration-150">
          {/* Mobile Database Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Active Sandbox Database
            </label>
            <div className="relative">
              <select
                value={activeDatabase.id}
                onChange={(e) => {
                  if (e.target.value === '__manage__') {
                    handleTabClick('settings');
                  } else {
                    setActiveDatabaseId(e.target.value);
                  }
                }}
                className="w-full appearance-none bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 py-2 pl-8 pr-8 rounded-xl focus:outline-none focus:border-amber-400"
              >
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.icon} {db.name}
                  </option>
                ))}
                <option value="__manage__">⚙️ Manage Sandboxes...</option>
              </select>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
                {activeDatabase.icon}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-1 gap-1 pt-1">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Sandboxes Tab */}
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>Sandboxes & Presets</span>
            </button>
          </div>

          {/* Mobile Import / Export */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openImportExportModal('export');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700/80 hover:border-amber-400 text-slate-200 hover:text-amber-300 transition shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4 text-amber-400" />
              <span>Import / Export Sandboxes</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

