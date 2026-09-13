import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Database,
  Download,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  FileJson,
  Layers,
  Cog,
  BookOpen,
} from 'lucide-react';

export const DatabaseSettings: React.FC = () => {
  const {
    databases,
    activeDatabase,
    activeDatabaseId,
    setActiveDatabaseId,
    createDatabase,
    deleteDatabase,
    resetToDefaultPreset,
    importDatabase,
    exportDatabase,
  } = useGame();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('🏭');

  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createDatabase(newName.trim(), newDesc.trim(), newIcon.trim() || '🏭');
    setIsCreatingNew(false);
    setNewName('');
    setNewDesc('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = importDatabase(content);
        if (ok) {
          setShowImportModal(false);
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!importJsonText.trim()) return;
    const ok = importDatabase(importJsonText.trim());
    if (ok) {
      setImportJsonText('');
      setShowImportModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <span>Factory Database & Sandbox Manager</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Switch between different factory games, create blank sandbox environments, import/export community databases, or reset presets.
        </p>
      </div>

      {/* Active Database Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              {activeDatabase.icon}
            </span>
            <div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span>{activeDatabase.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  v{activeDatabase.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeDatabase.description || 'Custom factory sandbox database'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportDatabase}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
              title="Download database JSON file"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
              title="Import JSON database"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Database Content Stats */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
            <div className="text-xl font-bold font-mono text-amber-400">
              {activeDatabase.items.length}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Layers className="w-3 h-3 text-slate-500" />
              <span>Items & Resources</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
            <div className="text-xl font-bold font-mono text-cyan-400">
              {activeDatabase.crafters.length}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Cog className="w-3 h-3 text-slate-500" />
              <span>Machines / Crafters</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
            <div className="text-xl font-bold font-mono text-emerald-400">
              {activeDatabase.recipes.length}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <BookOpen className="w-3 h-3 text-slate-500" />
              <span>Recipes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Databases Switcher */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            All Sandboxes & Game Presets ({databases.length})
          </h3>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Sandbox</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {databases.map((db) => {
            const isActive = db.id === activeDatabaseId;
            return (
              <div
                key={db.id}
                onClick={() => setActiveDatabaseId(db.id)}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{db.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{db.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {db.items.length} items • {db.recipes.length} recipes • {db.crafters.length} machines
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {databases.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete database "${db.name}"? This cannot be undone.`)) {
                          deleteDatabase(db.id);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                      title="Delete database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset Presets */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Need to restore original default sandbox datasets?
          </span>
          <button
            onClick={() => {
              if (confirm('Reset to standard presets? Your custom modifications will be replaced.')) {
                resetToDefaultPreset();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restore Factory Presets</span>
          </button>
        </div>
      </div>

      {/* Create New Sandbox Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNew}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Custom Game Sandbox</h3>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Icon</label>
                <input
                  type="text"
                  required
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-slate-400 font-semibold mb-1">Game / Sandbox Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dyson Sphere Program or Modded Setup"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                placeholder="Brief notes about this factory ruleset..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
              >
                Create Sandbox
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileJson className="w-5 h-5 text-amber-400" />
                <span>Import Game Database JSON</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Upload .JSON file
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-4 text-slate-600 uppercase text-[10px]">Or paste JSON</span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              <div>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  rows={6}
                  placeholder="Paste JSON database structure here..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasteImport}
                disabled={!importJsonText.trim()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
