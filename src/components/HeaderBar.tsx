'use client';

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Download,
  RotateCcw,
  Keyboard,
  Bookmark,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { VisualPreset } from '../types';

interface HeaderBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  layoutLocked: boolean;
  onToggleLock: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  onExportAll: () => void;
  presets: VisualPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onSaveCurrentPreset: (name: string) => void;
  onRenamePreset: (id: string, newName: string) => void;
  onDuplicatePreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  isExporting: boolean;
  hasOverflow: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  projectName,
  onProjectNameChange,
  layoutLocked,
  onToggleLock,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  onExportAll,
  presets,
  selectedPresetId,
  onSelectPreset,
  onSaveCurrentPreset,
  onRenamePreset,
  onDuplicatePreset,
  onDeletePreset,
  isExporting,
  hasOverflow,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState('');

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    onSaveCurrentPreset(newPresetName.trim());
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  const handleStartRename = (preset: VisualPreset) => {
    setEditingPresetId(preset.id);
    setEditingPresetName(preset.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingPresetName.trim()) {
      onRenamePreset(id, editingPresetName.trim());
    }
    setEditingPresetId(null);
    setEditingPresetName('');
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Left: Brand & Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white text-black font-mono font-bold text-xs flex items-center justify-center rounded-sm">
            T
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100 hidden sm:inline">
            TypePost
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-zinc-500 hidden md:inline">Project:</span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="document-name"
            className="text-xs font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded px-2 py-1 text-zinc-200 outline-none w-32 sm:w-44 truncate transition-colors"
            title="File name prefix for exports"
          />
        </div>

        {/* Lock Layout Toggle */}
        <button
          type="button"
          onClick={onToggleLock}
          className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            layoutLocked
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-sm'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title="Lock Layout (Cmd/Ctrl+L): Freezes canvas, typography and margin settings so you can rapidly paste and paginate text."
        >
          {layoutLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{layoutLocked ? 'Layout Locked' : 'Lock Layout'}</span>
        </button>
      </div>

      {/* Center: Presets */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-2 py-1 gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            disabled={layoutLocked}
            className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1 disabled:opacity-50"
            title={layoutLocked ? 'Layout locked' : 'Choose preset'}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-200">
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowPresetManager(true)}
            className="text-zinc-400 hover:text-zinc-100 text-xs px-1 hover:bg-zinc-800 rounded transition-colors"
            title="Manage Presets"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
            title="Undo (Cmd/Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shortcuts */}
        <button
          type="button"
          onClick={() => setShowShortcuts(true)}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Reset All */}
        <button
          type="button"
          onClick={onResetAll}
          className="p-1.5 rounded text-zinc-400 hover:text-red-400 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
          title="Reset to Factory Defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Quick Export All */}
        <button
          type="button"
          onClick={onExportAll}
          disabled={isExporting}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-all shadow-sm ${
            hasOverflow
              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
              : 'bg-white text-black hover:bg-zinc-200 border border-transparent'
          }`}
          title="Export All Pages (Cmd/Ctrl+Enter)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export All'}</span>
        </button>
      </div>

      {/* Preset Manager Modal */}
      {showPresetManager && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-zinc-400" />
                Manage Presets
              </h3>
              <button
                type="button"
                onClick={() => setShowPresetManager(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Save current preset */}
            {isSavingPreset ? (
              <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="New preset name..."
                  autoFocus
                  className="bg-transparent text-xs text-zinc-200 outline-none flex-1 px-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePreset();
                    if (e.key === 'Escape') setIsSavingPreset(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="bg-white text-black text-xs px-2 py-1 rounded font-medium hover:bg-zinc-200"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingPreset(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs px-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSavingPreset(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Save Current Settings as Preset
              </button>
            )}

            {/* Presets list */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {presets.map((p) => {
                const isCurrent = p.id === selectedPresetId;
                const isEditing = editingPresetId === p.id;
                const isDefault = p.id === 'x-essay';

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded border text-xs ${
                      isCurrent
                        ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingPresetName}
                          onChange={(e) => setEditingPresetName(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-xs text-white outline-none flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(p.id);
                            if (e.key === 'Escape') setEditingPresetId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(p.id)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPresetId(null)}
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1"
                        onClick={() => {
                          onSelectPreset(p.id);
                          setShowPresetManager(false);
                        }}
                      >
                        <span className="font-medium">{p.name}</span>
                        {isDefault && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded">
                            Default
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-400 font-mono">Active</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onDuplicatePreset(p.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-200"
                        title="Duplicate preset"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRename(p)}
                        className="p-1 text-zinc-400 hover:text-zinc-200"
                        title="Rename preset"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => onDeletePreset(p.id)}
                          className="p-1 text-zinc-400 hover:text-red-400"
                          title="Delete preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPresetManager(false)}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-zinc-400" />
                Keyboard Shortcuts
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Export All Pages</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-mono">⌘/Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Toggle Fullscreen Preview</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-mono">⌘/Ctrl + Shift + P</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Toggle Layout Lock</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-mono">⌘/Ctrl + L</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Undo</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-mono">⌘/Ctrl + Z</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Redo</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-mono">⌘/Ctrl + Shift + Z</kbd>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
