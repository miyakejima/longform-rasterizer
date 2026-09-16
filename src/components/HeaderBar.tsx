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
  Folder,
  Save,
  FileDown,
  FileUp,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { VisualPreset, SavedProject, ExportFormat, ExportScale } from '../types';

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
  savedProjects?: SavedProject[];
  onSaveCurrentProject?: () => void;
  onLoadProject?: (project: SavedProject) => void;
  onDeleteProject?: (id: string) => void;
  onExportProjectJson?: (project?: SavedProject) => void;
  onImportProjectJson?: (file: File) => void;
  showPresetManagerModal?: boolean;
  onClosePresetManagerModal?: () => void;
  showProjectManagerModal?: boolean;
  onCloseProjectManagerModal?: () => void;
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
  savedProjects = [],
  onSaveCurrentProject,
  onLoadProject,
  onDeleteProject,
  onExportProjectJson,
  onImportProjectJson,
  showPresetManagerModal = false,
  onClosePresetManagerModal,
  showProjectManagerModal = false,
  onCloseProjectManagerModal,
  showShortcutsModal = false,
  onCloseShortcutsModal,
}) => {
  const [internalShowPresets, setInternalShowPresets] = useState(false);
  const [internalShowProjects, setInternalShowProjects] = useState(false);
  const [internalShowShortcuts, setInternalShowShortcuts] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const showPresets = showPresetManagerModal || internalShowPresets;
  const showProjects = showProjectManagerModal || internalShowProjects;
  const showShortcuts = showShortcutsModal || internalShowShortcuts;

  const closePresets = () => {
    setInternalShowPresets(false);
    onClosePresetManagerModal?.();
  };
  const closeProjects = () => {
    setInternalShowProjects(false);
    onCloseProjectManagerModal?.();
  };
  const closeShortcuts = () => {
    setInternalShowShortcuts(false);
    onCloseShortcutsModal?.();
  };

  const projectFileInputRef = useRef<HTMLInputElement>(null);
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
          className="h-8 px-3.5 rounded-lg bg-[#141418] hover:bg-[#1c1c22] border border-[#27272a] hover:border-zinc-500 text-xs font-medium text-zinc-200 hover:text-white transition-all shadow-xs flex items-center gap-1.5"
        >
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        {/* Export Options Dropdown - Matching Pure Black Aesthetic */}
        {showExportMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#000000] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-3 text-zinc-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
              Export Options
            </span>

            {hasOverflow && (
              <div className="mb-2 p-2 rounded bg-red-950/40 border border-red-900/60 text-[11px] text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Text overflows on some pages.</span>
              </div>
            )}

            <div className="space-y-1 pb-2 border-b border-[#141417]">
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportAll();
                }}
                className="w-full px-2.5 py-1.5 text-xs text-left rounded-md flex items-center justify-between bg-[#08080a] border border-[#1a1a1e] hover:bg-[#141418] text-zinc-300 hover:text-white transition-colors"
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
                  className="w-full px-2.5 py-1.5 text-xs text-left rounded-md flex items-center justify-between bg-[#08080a] border border-[#1a1a1e] hover:bg-[#141418] text-zinc-300 hover:text-white transition-colors"
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
                <div className="flex gap-1 bg-[#08080a] p-0.5 rounded border border-[#1a1a1e]">
                  {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onExportFormatChange(fmt)}
                      className={`px-2 py-0.5 text-[10px] rounded uppercase font-mono transition-colors ${
                        exportFormat === fmt ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px]">Resolution Scale</span>
                <div className="flex gap-1 bg-[#08080a] p-0.5 rounded border border-[#1a1a1e]">
                  {([1, 2, 3] as ExportScale[]).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => onExportScaleChange(sc)}
                      className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${
                        exportScale === sc ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-zinc-200'
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
          <div className="bg-[#000000] border border-[#1f1f23] text-white rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#141417] pb-3">
              <h3 className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-zinc-400" />
                Visual Presets
              </h3>
              <button
                type="button"
                onClick={closePresets}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-[#121214] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Save current preset */}
            {isSavingPreset ? (
              <div className="flex items-center gap-2 bg-[#08080a] p-2 rounded border border-[#1f1f23]">
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
                className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#08080a] hover:bg-[#121214] border border-[#1f1f23] text-zinc-200 py-1.5 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Save Current Settings as Preset
              </button>
            )}

            {/* Presets list */}
            <div className="flex-1 min-h-0 max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {presets.map((p) => {
                const isCurrent = p.id === selectedPresetId;
                const isEditing = editingPresetId === p.id;
                const isDefault = p.id === 'x-essay';

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[#121216] border-zinc-500 text-white'
                        : 'bg-[#08080a] border-[#1a1a1e] text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingPresetName}
                          onChange={(e) => setEditingPresetName(e.target.value)}
                          autoFocus
                          className="bg-[#000000] border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-white w-full outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(p.id);
                            if (e.key === 'Escape') setEditingPresetId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(p.id)}
                          className="p-1 hover:text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex-1 cursor-pointer pr-2"
                        onClick={() => {
                          onSelectPreset(p.id);
                          closePresets();
                        }}
                      >
                        <div className="font-medium flex items-center gap-2">
                          <span>{p.name}</span>
                          {isDefault && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {p.canvas.width}×{p.canvas.height} · {p.typography.fontFamily} · {p.typography.fontSize}px
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {!isEditing && !isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPresetId(p.id);
                            setEditingPresetName(p.name);
                          }}
                          className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-[#121214]"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDuplicatePreset(p.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-[#121214]"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => onDeletePreset(p.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-[#121214]"
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

      {/* Project Manager Modal */}
      {mounted && showProjects && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeProjects();
          }}
        >
          <div className="bg-[#000000] border border-[#1f1f23] text-white rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#141417] pb-3">
              <h3 className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                <Folder className="w-4 h-4 text-zinc-400" />
                Saved Documents
              </h3>
              <button
                type="button"
                onClick={closeProjects}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-[#121214] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              {onSaveCurrentProject && (
                <button
                  type="button"
                  onClick={onSaveCurrentProject}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-white text-black hover:bg-zinc-200 py-1.5 rounded font-medium transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Current Document
                </button>
              )}
              {onImportProjectJson && (
                <button
                  type="button"
                  onClick={() => projectFileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs bg-[#08080a] border border-[#1f1f23] hover:bg-[#121214] text-zinc-200 px-3 py-1.5 rounded transition-colors"
                  title="Import from JSON file"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Import
                </button>
              )}
              <input
                ref={projectFileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onImportProjectJson?.(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
            </div>

            <div className="flex-1 min-h-0 max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No saved documents yet. Click &quot;Save Current Document&quot; above.
                </div>
              ) : (
                savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#1a1a1e] bg-[#08080a] text-zinc-300 hover:border-zinc-600 transition-colors text-xs"
                  >
                    <div
                      className="flex-1 cursor-pointer pr-2"
                      onClick={() => {
                        onLoadProject?.(proj);
                        closeProjects();
                      }}
                    >
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{proj.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {proj.document.pageCount} {proj.document.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        Updated {new Date(proj.updatedAt).toLocaleDateString()} · {proj.document.text.length} chars
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onExportProjectJson && (
                        <button
                          type="button"
                          onClick={() => onExportProjectJson(proj)}
                          className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-[#121214]"
                          title="Export document as JSON"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-[#121214]"
                          title="Delete saved document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
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
          <div className="bg-[#000000] border border-[#1f1f23] text-white rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#141417] pb-3">
              <h3 className="text-sm font-medium text-zinc-100">Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={closeShortcuts}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-[#121214] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#141417]">
                <span className="text-zinc-300">Export All</span>
                <kbd className="px-2 py-0.5 bg-[#08080a] border border-[#1f1f23] rounded font-mono text-[11px]">⌘/Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141417]">
                <span className="text-zinc-300">Undo</span>
                <kbd className="px-2 py-0.5 bg-[#08080a] border border-[#1f1f23] rounded font-mono text-[11px]">⌘/Ctrl + Z</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141417]">
                <span className="text-zinc-300">Redo</span>
                <kbd className="px-2 py-0.5 bg-[#08080a] border border-[#1f1f23] rounded font-mono text-[11px]">⌘/Ctrl + Shift + Z</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141417]">
                <span className="text-zinc-300">Toggle Layout Lock</span>
                <kbd className="px-2 py-0.5 bg-[#08080a] border border-[#1f1f23] rounded font-mono text-[11px]">⌘/Ctrl + L</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-300">Fullscreen Preview</span>
                <kbd className="px-2 py-0.5 bg-[#08080a] border border-[#1f1f23] rounded font-mono text-[11px]">⌘/Ctrl + Shift + P</kbd>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
