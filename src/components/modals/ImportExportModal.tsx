import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { ImportPreview } from '../../types';
import {
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  AlertTriangle,
  Layers,
  Cog,
  BookOpen,
  FileText,
  Database,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'import' | 'export';
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'export',
}) => {
  const {
    activeDatabase,
    databases,
    exportDatabaseJson,
    downloadDatabaseJson,
    exportFullBackupJson,
    downloadFullBackupJson,
    validateImportJson,
    importDatabase,
    showToast,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>(defaultTab);

  // Export state
  const [exportScope, setExportScope] = useState<'active' | 'full'>('active');
  const [copied, setCopied] = useState(false);

  // Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [importDestination, setImportDestination] = useState<'new' | 'overwrite'>('new');
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEscapeKey(isOpen, onClose);

  // Generate current export string
  const currentExportJson =
    exportScope === 'active' ? exportDatabaseJson() : exportFullBackupJson();

  // Validate on text change
  useEffect(() => {
    if (!importJsonText.trim()) {
      setPreview(null);
      return;
    }
    const result = validateImportJson(importJsonText);
    setPreview(result);
  }, [importJsonText, validateImportJson]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentExportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownload = () => {
    if (exportScope === 'active') {
      downloadDatabaseJson();
    } else {
      downloadFullBackupJson();
    }
  };

  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleExecuteImport = () => {
    if (!preview || preview.type === 'invalid') return;
    const result = importDatabase(importJsonText, importDestination);
    if (result.success) {
      void confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      setImportJsonText('');
      setPreview(null);
      onClose();
    } else {
      showToast(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Recipe Sandbox Manager</span>
              </h3>
              <p className="text-xs text-slate-400">
                Export and import factory recipe databases, custom sandboxes, or full backups.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition border-t border-x ${
              activeTab === 'export'
                ? 'bg-slate-900 border-slate-700 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition border-t border-x ${
              activeTab === 'import'
                ? 'bg-slate-900 border-slate-700 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Sandbox</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'export' ? (
            /* ================= EXPORT TAB ================= */
            <div className="space-y-4">
              {/* Scope Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportScope('active')}
                  className={`p-3 rounded-xl border text-left transition ${
                    exportScope === 'active'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
                    <span className="text-base">{activeDatabase.icon}</span>
                    <span className="truncate">Current Sandbox</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {activeDatabase.name} ({activeDatabase.items.length} items,{' '}
                    {activeDatabase.recipes.length} recipes)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('full')}
                  className={`p-3 rounded-xl border text-left transition ${
                    exportScope === 'full'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Full Workspace Backup</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    All {databases.length} Sandboxes + Progression & Goals
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json File</span>
                </button>

                <button
                  onClick={() => void handleCopy()}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy JSON Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* JSON Live Preview */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Payload Preview ({Math.round((currentExportJson.length / 1024) * 10) / 10} KB)
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">application/json</span>
                </div>
                <textarea
                  readOnly
                  value={currentExportJson}
                  rows={9}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-amber-400 resize-none selection:bg-amber-500/30"
                />
              </div>
            </div>
          ) : (
            /* ================= IMPORT TAB ================= */
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 shadow">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-300 font-semibold">
                  Drop a sandbox <span className="text-cyan-400">.json</span> file here, or click to
                  browse
                </div>
                <div className="text-[11px] text-slate-500">
                  Accepts individual factory sandbox files or full workspace backups
                </div>
              </div>

              {/* Paste Text Area */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Or Paste Raw JSON Below
                  </span>
                  {importJsonText && (
                    <button
                      onClick={() => setImportJsonText('')}
                      className="text-rose-400 hover:underline text-[11px]"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='Paste {"name": "My Factory", "items": [...], "recipes": [...]} here...'
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Preview Card */}
              {preview && (
                <div className="space-y-3">
                  {preview.type === 'invalid' ? (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/80 text-rose-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Invalid JSON or Format</span>
                      </div>
                      {preview.errors.map((err, i) => (
                        <div key={`${i}-${err}`} className="pl-5 text-[11px] text-rose-400">
                          • {err}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{preview.icon || '📦'}</span>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{preview.name || 'Unnamed Database'}</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {preview.type === 'full_backup' ? 'Full Backup' : 'Single Sandbox'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {preview.description || 'Valid factory database'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Badges */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="font-bold text-amber-300 font-mono">
                            {preview.itemCount}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                            <Layers className="w-3 h-3" />
                            <span>Items</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="font-bold text-emerald-300 font-mono">
                            {preview.recipeCount}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3" />
                            <span>Recipes</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="font-bold text-cyan-300 font-mono">
                            {preview.crafterCount}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                            <Cog className="w-3 h-3" />
                            <span>Machines</span>
                          </div>
                        </div>
                      </div>

                      {/* Destination option for single database */}
                      {preview.type === 'single_database' && (
                        <div className="pt-2 border-t border-slate-800 space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-300">
                            Import Destination:
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <label
                              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                                importDestination === 'new'
                                  ? 'bg-cyan-500/15 border-cyan-500/80 text-cyan-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="importDest"
                                checked={importDestination === 'new'}
                                onChange={() => setImportDestination('new')}
                                className="accent-cyan-400"
                              />
                              <span className="font-medium">Add as New Sandbox</span>
                            </label>

                            <label
                              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                                importDestination === 'overwrite'
                                  ? 'bg-amber-500/15 border-amber-500/80 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="importDest"
                                checked={importDestination === 'overwrite'}
                                onChange={() => setImportDestination('overwrite')}
                                className="accent-amber-400"
                              />
                              <span className="font-medium truncate">Overwrite Current</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Import Confirm Button */}
              {preview && preview.type !== 'invalid' && (
                <button
                  onClick={handleExecuteImport}
                  className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {preview.type === 'full_backup'
                      ? `Restore Full Workspace (${preview.databaseCount || 0} Sandboxes)`
                      : importDestination === 'new'
                        ? 'Import as New Sandbox'
                        : `Overwrite "${activeDatabase.name}" Sandbox`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>FactoRecipe Schema v1.0 • Offline Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
