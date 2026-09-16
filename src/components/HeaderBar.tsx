'use client';

import React, { useState, useEffect, useSyncExternalStore, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  FileArchive,
  X,
  Bookmark,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { VisualPreset, ExportFormat, ExportScale } from '../types';

interface HeaderBarProps {
  onExportAll: () => void;
  onExportZip?: () => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  exportScale: ExportScale;
  onExportScaleChange: (scale: ExportScale) => void;
  presets: VisualPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onSaveCurrentPreset: (name: string) => void;
  onRenamePreset: (id: string, newName: string) => void;
  onDuplicatePreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  isExporting: boolean;
  hasOverflow: boolean;
  showPresetManagerModal?: boolean;
  onClosePresetManagerModal?: () => void;
  showShortcutsModal?: boolean;
  onCloseShortcutsModal?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onExportAll,
  onExportZip,
  exportFormat,
  onExportFormatChange,
  exportScale,
  onExportScaleChange,
  presets,
  selectedPresetId,
  onSelectPreset,
  onSaveCurrentPreset,
  onRenamePreset,
  onDuplicatePreset,
  onDeletePreset,
  isExporting,
  hasOverflow,
  showPresetManagerModal = false,
  onClosePresetManagerModal,
  showShortcutsModal = false,
  onCloseShortcutsModal,
}) => {
  const [internalShowPresets, setInternalShowPresets] = useState(false);
  const [internalShowShortcuts, setInternalShowShortcuts] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const showPresets = showPresetManagerModal || internalShowPresets;
  const showShortcuts = showShortcutsModal || internalShowShortcuts;

  const closePresets = () => {
    setInternalShowPresets(false);
    onClosePresetManagerModal?.();
  };
  const closeShortcuts = () => {
    setInternalShowShortcuts(false);
    onCloseShortcutsModal?.();
  };

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState('');

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      onSaveCurrentPreset(newPresetName.trim());
      setNewPresetName('');
      setIsSavingPreset(false);
    }
  };

  const handleSaveRename = (id: string) => {
    if (editingPresetName.trim()) {
      onRenamePreset(id, editingPresetName.trim());
      setEditingPresetId(null);
    }
  };

  return (
    <>
      {/* Top Right Floating / Header Export Control (Single clean button, no left navbar!) */}
      <div ref={exportMenuRef} className="relative select-none">
        <button
          type="button"
          onClick={() => setShowExportMenu((prev) => !prev)}
          disabled={isExporting}
          className={`h-8 px-3.5 rounded-[8px] bg-[#0c0c0e] hover:bg-[#16161c] border border-[#1b1b22] hover:border-[#2e2e3a] text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-xs flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-500 ${
            showExportMenu ? 'bg-[#16161c] border-[#2e2e3a] text-white' : ''
          }`}
        >
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {/* Export Options Dropdown */}
        {showExportMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#0c0c0e] border border-[#1b1b22] rounded-xl shadow-2xl shadow-black p-3 text-zinc-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
              Export Options
            </span>

            {hasOverflow && (
              <div className="mb-2 p-2 rounded bg-red-950/40 border border-red-900/60 text-[11px] text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Text overflows on some pages.</span>
              </div>
            )}

            <div className="space-y-1 pb-2 border-b border-[#18181f]">
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportAll();
                }}
                className="w-full px-2.5 py-1.5 text-xs text-left rounded-[6px] flex items-center justify-between bg-[#09090c] border border-[#18181f] hover:bg-[#14141a] text-zinc-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  Download All Images
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">PNG</span>
              </button>

              {onExportZip && (
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportZip();
                  }}
                  className="w-full px-2.5 py-1.5 text-xs text-left rounded-[6px] flex items-center justify-between bg-[#09090c] border border-[#18181f] hover:bg-[#14141a] text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileArchive className="w-3.5 h-3.5 text-zinc-400" />
                    Download as ZIP
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">.zip</span>
                </button>
              )}
            </div>

            {/* Format & Scale */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px]">Format</span>
                <div className="flex gap-1 bg-[#09090c] p-0.5 rounded-[6px] border border-[#18181f]">
                  {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onExportFormatChange(fmt)}
                      className={`px-2 py-0.5 text-[10px] rounded-[4px] uppercase font-mono transition-colors ${
                        exportFormat === fmt
                          ? 'bg-[#1c1c24] text-[#f4f4f6] font-medium border border-[#2e2e3a]'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px]">Resolution Scale</span>
                <div className="flex gap-1 bg-[#09090c] p-0.5 rounded-[6px] border border-[#18181f]">
                  {([1, 2, 3] as ExportScale[]).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => onExportScaleChange(sc)}
                      className={`px-2 py-0.5 text-[10px] rounded-[4px] font-mono transition-colors ${
                        exportScale === sc
                          ? 'bg-[#1c1c24] text-[#f4f4f6] font-medium border border-[#2e2e3a]'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {sc}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Manager Modal */}
      {mounted && showPresets && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePresets();
          }}
        >
          <div className="bg-[#0c0c0e] border border-[#1b1b22] text-white rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-zinc-400" />
                Visual Presets
              </h3>
              <button
                type="button"
                onClick={closePresets}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-[#16161c] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Save current preset */}
            {isSavingPreset ? (
              <div className="flex items-center gap-2 bg-[#09090c] p-2 rounded-[6px] border border-[#18181f]">
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
                  className="px-2.5 py-1 bg-[#1c1c24] text-[#f4f4f6] border border-[#2e2e3a] text-xs rounded-[4px] hover:bg-[#24242e] transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingPreset(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSavingPreset(true)}
                className="w-full py-1.5 border border-dashed border-[#1f1f26] hover:border-[#2e2e3a] hover:bg-[#14141a] rounded-lg text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current Layout as Preset</span>
              </button>
            )}

            {/* Preset list */}
            <div className="flex-1 min-h-0 max-h-64 overflow-y-auto space-y-1 pr-1">
              {presets.map((p) => {
                const isSelected = selectedPresetId === p.id;
                const isDefault = p.id === 'x-essay';
                const isEditing = editingPresetId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#1c1c24] border-[#2e2e3a] text-white font-medium'
                        : 'bg-[#09090c] border-[#18181f] text-zinc-400 hover:text-zinc-200 hover:bg-[#14141a]'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingPresetName}
                          onChange={(e) => setEditingPresetName(e.target.value)}
                          className="bg-[#14141a] border border-[#2e2e3a] rounded px-1.5 py-0.5 text-xs text-white flex-1 focus:outline-hidden"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(p.id);
                            if (e.key === 'Escape') setEditingPresetId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(p.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPreset(p.id);
                          closePresets();
                        }}
                        className="flex-1 text-left flex items-center gap-2"
                      >
                        <span className="font-medium text-white">{p.name}</span>
                        {isDefault && (
                          <span className="text-[10px] text-zinc-500 font-mono">Default</span>
                        )}
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      {!isDefault && !isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPresetId(p.id);
                            setEditingPresetName(p.name);
                          }}
                          className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-[#16161c]"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDuplicatePreset(p.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-[#16161c]"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => onDeletePreset(p.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-[#16161c]"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Shortcuts Modal */}
      {mounted && showShortcuts && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeShortcuts();
          }}
        >
          <div className="bg-[#0c0c0e] border border-[#1b1b22] text-white rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-medium text-zinc-100">Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={closeShortcuts}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-[#16161c] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#18181f]">
                <span className="text-zinc-300">Export All</span>
                <kbd className="px-2 py-0.5 bg-[#09090c] border border-[#18181f] rounded font-mono text-[11px] text-zinc-300">⌘/Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#18181f]">
                <span className="text-zinc-300">Undo</span>
                <kbd className="px-2 py-0.5 bg-[#09090c] border border-[#18181f] rounded font-mono text-[11px] text-zinc-300">⌘/Ctrl + Z</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#18181f]">
                <span className="text-zinc-300">Redo</span>
                <kbd className="px-2 py-0.5 bg-[#09090c] border border-[#18181f] rounded font-mono text-[11px] text-zinc-300">⌘/Ctrl + Shift + Z</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#18181f]">
                <span className="text-zinc-300">Toggle Layout Lock</span>
                <kbd className="px-2 py-0.5 bg-[#09090c] border border-[#18181f] rounded font-mono text-[11px] text-zinc-300">⌘/Ctrl + L</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-300">Fullscreen Preview</span>
                <kbd className="px-2 py-0.5 bg-[#09090c] border border-[#18181f] rounded font-mono text-[11px] text-zinc-300">⌘/Ctrl + Shift + P</kbd>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
