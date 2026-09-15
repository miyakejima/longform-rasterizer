'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HeaderBar } from '../components/HeaderBar';
import { EditorPanel } from '../components/EditorPanel';
import { ControlPanel } from '../components/ControlPanel';
import { PreviewPanel } from '../components/PreviewPanel';
import { FullscreenModal } from '../components/FullscreenModal';
import {
  CanvasSettings,
  DocumentState,
  ExportFormat,
  ExportScale,
  SpacingSettings,
  TypographySettings,
  AdvancedSettings,
  VisualPreset,
  PaginationResult,
  DistributionMode,
} from '../types';
import {
  DEFAULT_ADVANCED,
  DEFAULT_CANVAS,
  DEFAULT_DOCUMENT,
  DEFAULT_PRESET,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
  loadStoredPresets,
  loadStoredSession,
  saveStoredPresets,
  saveStoredSession,
  clearStoredSession,
} from '../engine/presetStore';
import { paginateDocument } from '../engine/pagination';
import { autoFitFontSize } from '../engine/autoFit';
import { waitForFonts } from '../engine/fontLoader';
import { exportAllPagesAsZip, exportAllPagesSeparately } from '../engine/exportEngine';
import { FileText, Sliders } from 'lucide-react';

interface HistoryItem {
  document: DocumentState;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  advanced: AdvancedSettings;
}

export default function Home() {
  // State
  const [doc, setDoc] = useState<DocumentState>(DEFAULT_DOCUMENT);
  const [canvas, setCanvas] = useState<CanvasSettings>(DEFAULT_CANVAS);
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [spacing, setSpacing] = useState<SpacingSettings>(DEFAULT_SPACING);
  const [advanced, setAdvanced] = useState<AdvancedSettings>(DEFAULT_ADVANCED);
  const [exportScale, setExportScale] = useState<ExportScale>(2);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [presets, setPresets] = useState<VisualPreset[]>([DEFAULT_PRESET]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('x-essay');
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [highlightedPageIndex, setHighlightedPageIndex] = useState<number | null>(null);
  const [fullscreenPageIndex, setFullscreenPageIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportWarning, setExportWarning] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'editor' | 'controls'>('editor');

  // Undo / Redo history
  const historyRef = useRef<HistoryItem[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((newDoc: DocumentState, newCanvas: CanvasSettings, newTypo: TypographySettings, newSpacing: SpacingSettings, newAdv: AdvancedSettings) => {
    const item: HistoryItem = {
      document: { ...newDoc },
      canvas: { ...newCanvas },
      typography: { ...newTypo },
      spacing: { ...newSpacing },
      advanced: { ...newAdv },
    };
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(item);
    if (nextHistory.length > 50) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Debounced text for smooth editing performance
  const [debouncedText, setDebouncedText] = useState(doc.text);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(doc.text);
    }, 120);
    return () => clearTimeout(timer);
  }, [doc.text]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedSession = loadStoredSession();
    const storedPresets = loadStoredPresets();
    setPresets(storedPresets);

    if (storedSession) {
      setDoc(storedSession.document);
      setCanvas(storedSession.canvas);
      setTypography(storedSession.typography);
      setSpacing(storedSession.spacing);
      setAdvanced(storedSession.advanced);
      setExportScale(storedSession.exportScale);
      setSelectedPresetId(storedSession.selectedPresetId);
      pushHistory(storedSession.document, storedSession.canvas, storedSession.typography, storedSession.spacing, storedSession.advanced);
    } else {
      pushHistory(DEFAULT_DOCUMENT, DEFAULT_CANVAS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ADVANCED);
    }

    waitForFonts();
  }, [pushHistory]);

  // Save session on changes
  useEffect(() => {
    saveStoredSession({
      document: doc,
      canvas,
      typography,
      spacing,
      advanced,
      exportScale,
      selectedPresetId,
    });
  }, [doc, canvas, typography, spacing, advanced, exportScale, selectedPresetId]);
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      setDoc(prev.document);
      setCanvas(prev.canvas);
      setTypography(prev.typography);
      setSpacing(prev.spacing);
      setAdvanced(prev.advanced);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      setDoc(next.document);
      setCanvas(next.canvas);
      setTypography(next.typography);
      setSpacing(next.spacing);
      setAdvanced(next.advanced);
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  const handleResetAll = () => {
    if (window.confirm('Reset all text, canvas and visual settings to factory defaults?')) {
      clearStoredSession();
      setDoc(DEFAULT_DOCUMENT);
      setCanvas(DEFAULT_CANVAS);
      setTypography(DEFAULT_TYPOGRAPHY);
      setSpacing(DEFAULT_SPACING);
      setAdvanced(DEFAULT_ADVANCED);
      setSelectedPresetId('x-essay');
      pushHistory(DEFAULT_DOCUMENT, DEFAULT_CANVAS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ADVANCED);
    }
  };

  // Preset operations
  const handleSelectPreset = (presetId: string) => {
    const found = presets.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(presetId);
    if (!doc.layoutLocked) {
      setCanvas({ ...found.canvas });
      setTypography({ ...found.typography });
      setSpacing({ ...found.spacing });
      setAdvanced({ ...found.advanced });
      setExportScale(found.exportScale);
      pushHistory(doc, found.canvas, found.typography, found.spacing, found.advanced);
    }
  };

  const handleSaveCurrentPreset = (name: string) => {
    const newPreset: VisualPreset = {
      id: `preset-${Date.now()}`,
      name,
      canvas: { ...canvas },
      typography: { ...typography },
      spacing: { ...spacing },
      advanced: { ...advanced },
      exportScale,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    setSelectedPresetId(newPreset.id);
    saveStoredPresets(updated);
  };

  const handleRenamePreset = (id: string, newName: string) => {
    const updated = presets.map((p) => (p.id === id ? { ...p, name: newName } : p));
    setPresets(updated);
    saveStoredPresets(updated);
  };

  const handleDuplicatePreset = (id: string) => {
    const found = presets.find((p) => p.id === id);
    if (!found) return;
    const duplicated: VisualPreset = {
      ...found,
      id: `preset-${Date.now()}`,
      name: `${found.name} (Copy)`,
    };
    const updated = [...presets, duplicated];
    setPresets(updated);
    saveStoredPresets(updated);
  };

  const handleDeletePreset = (id: string) => {
    if (id === 'x-essay') return; // Cannot delete default preset
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    if (selectedPresetId === id) {
      setSelectedPresetId('x-essay');
    }
    saveStoredPresets(updated);
  };

  // Run pagination & auto-fit
  const paginationResult: PaginationResult = useMemo(() => {
    const effectiveDoc: DocumentState = {
      ...doc,
      text: debouncedText,
    };

    if (advanced.autoFit) {
      return autoFitFontSize(effectiveDoc, {
        canvas,
        typography,
        spacing,
        advanced,
      });
    }

    return paginateDocument(effectiveDoc, {
      canvas,
      typography,
      spacing,
      advanced,
    });
  }, [debouncedText, doc, canvas, typography, spacing, advanced]);

  // Synchronize effective font size if auto-fit adjusted it
  useEffect(() => {
    if (advanced.autoFit && paginationResult.effectiveFontSize !== typography.fontSize) {
      setTypography((prev) => ({
        ...prev,
        fontSize: paginationResult.effectiveFontSize,
      }));
    }
  }, [advanced.autoFit, paginationResult.effectiveFontSize, typography.fontSize]);

  const hasOverflow = paginationResult.pages.some((p) => p.isOverflowing);

  // Export handlers
  const handleExportAll = async () => {
    if (hasOverflow && !advanced.allowClippedExport) {
      setExportWarning('Export blocked: One or more pages contain overflowing text. Please adjust page count, font size, or enable Auto-fit.');
      return;
    }
    setExportWarning(null);
    setIsExporting(true);
    try {
      await exportAllPagesSeparately(paginationResult.pages, {
        canvas,
        typography,
        spacing,
        scale: exportScale,
        format: exportFormat,
        projectName: doc.projectName,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZip = async () => {
    if (hasOverflow && !advanced.allowClippedExport) {
      setExportWarning('Export blocked: One or more pages contain overflowing text. Please adjust page count, font size, or enable Auto-fit.');
      return;
    }
    setExportWarning(null);
    setIsExporting(true);
    try {
      await exportAllPagesAsZip(paginationResult.pages, {
        canvas,
        typography,
        spacing,
        scale: exportScale,
        format: exportFormat,
        projectName: doc.projectName,
      });
    } finally {
      setIsExporting(false);
    }
  };
  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleExportAll();
      } else if (isCmdOrCtrl && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setFullscreenPageIndex((prev) => (prev !== null ? null : 0));
      } else if (isCmdOrCtrl && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setDoc((prev) => ({ ...prev, layoutLocked: !prev.layoutLocked }));
      } else if (isCmdOrCtrl && (e.key === 'Z' || e.key === 'z') && !e.shiftKey) {
        if ((e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCmdOrCtrl && (e.shiftKey && (e.key === 'Z' || e.key === 'z') || e.key === 'Y' || e.key === 'y')) {
        if ((e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleExportAll]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#111113] text-[#ededed]">
      {/* Header bar */}
      <HeaderBar
        projectName={doc.projectName}
        onProjectNameChange={(name) => setDoc((prev) => ({ ...prev, projectName: name }))}
        layoutLocked={doc.layoutLocked}
        onToggleLock={() => setDoc((prev) => ({ ...prev, layoutLocked: !prev.layoutLocked }))}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetAll={handleResetAll}
        onExportAll={handleExportAll}
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onSaveCurrentPreset={handleSaveCurrentPreset}
        onRenamePreset={handleRenamePreset}
        onDuplicatePreset={handleDuplicatePreset}
        onDeletePreset={handleDeletePreset}
        isExporting={isExporting}
        hasOverflow={hasOverflow}
      />

      {/* Export Blocked Notification Banner */}
      {exportWarning && (
        <div className="bg-red-950/80 border-b border-red-800 p-2.5 px-4 flex items-center justify-between text-xs text-red-200">
          <span>{exportWarning}</span>
          <button
            type="button"
            onClick={() => setExportWarning(null)}
            className="text-red-400 hover:text-white px-2 py-0.5 rounded font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Panel: Editor and Controls with tabs */}
        <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col border-r border-zinc-800 bg-zinc-950/80 shrink-0 h-1/2 lg:h-full">
          {/* Sub-header navigation tabs for Left Panel */}
          <div className="h-10 border-b border-zinc-800 bg-zinc-950 px-3 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLeftTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                  leftTab === 'editor'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('controls')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                  leftTab === 'controls'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Typography & Layout</span>
              </button>
            </div>

            {/* Quick page count indicator */}
            <div className="text-[11px] text-zinc-500 font-mono">
              {paginationResult.pages.length} {paginationResult.pages.length === 1 ? 'Page' : 'Pages'}
            </div>
          </div>

          {/* Tab content area */}
          <div className="flex-1 overflow-hidden">
            {leftTab === 'editor' ? (
              <EditorPanel
                text={doc.text}
                onTextChange={(newText) => {
                  setDoc((prev) => ({ ...prev, text: newText }));
                  pushHistory({ ...doc, text: newText }, canvas, typography, spacing, advanced);
                }}
                pages={paginationResult.pages}
                distributionMode={doc.distributionMode}
                manualBreaks={doc.manualBreaks}
                onManualBreaksChange={(breaks) => {
                  setDoc((prev) => ({ ...prev, manualBreaks: breaks }));
                  pushHistory({ ...doc, manualBreaks: breaks }, canvas, typography, spacing, advanced);
                }}
                highlightedPageIndex={highlightedPageIndex}
                onSelectPage={(pIdx) => setHighlightedPageIndex(pIdx)}
              />
            ) : (
              <ControlPanel
                pageCount={doc.pageCount}
                onPageCountChange={(cnt) => {
                  setDoc((prev) => ({ ...prev, pageCount: cnt }));
                  pushHistory({ ...doc, pageCount: cnt }, canvas, typography, spacing, advanced);
                }}
                distributionMode={doc.distributionMode}
                onDistributionModeChange={(m) => {
                  setDoc((prev) => ({ ...prev, distributionMode: m }));
                  pushHistory({ ...doc, distributionMode: m }, canvas, typography, spacing, advanced);
                }}
                canvas={canvas}
                onCanvasChange={(newCanvas) => {
                  setCanvas(newCanvas);
                  pushHistory(doc, newCanvas, typography, spacing, advanced);
                }}
                typography={typography}
                onTypographyChange={(newTypo) => {
                  setTypography(newTypo);
                  pushHistory(doc, canvas, newTypo, spacing, advanced);
                }}
                spacing={spacing}
                onSpacingChange={(newSpacing) => {
                  setSpacing(newSpacing);
                  pushHistory(doc, canvas, typography, newSpacing, advanced);
                }}
                advanced={advanced}
                onAdvancedChange={(newAdv) => {
                  setAdvanced(newAdv);
                  pushHistory(doc, canvas, typography, spacing, newAdv);
                }}
                exportFormat={exportFormat}
                onExportFormatChange={setExportFormat}
                exportScale={exportScale}
                onExportScaleChange={setExportScale}
                layoutLocked={doc.layoutLocked}
                onExportAll={handleExportAll}
                onExportZip={handleExportZip}
                isExporting={isExporting}
                hasOverflow={hasOverflow}
                autoFitWarning={paginationResult.autoFitWarning}
                customFonts={customFonts}
                onAddCustomFont={(name) => setCustomFonts((prev) => [...prev, name])}
              />
            )}
          </div>
        </div>

        {/* Right Panel: Live Previews */}
        <div className="flex-1 flex flex-col overflow-hidden h-1/2 lg:h-full">
          <PreviewPanel
            pages={paginationResult.pages}
            canvas={canvas}
            typography={typography}
            spacing={spacing}
            exportFormat={exportFormat}
            exportScale={exportScale}
            projectName={doc.projectName}
            highlightedPageIndex={highlightedPageIndex}
            onPageHover={setHighlightedPageIndex}
            onSelectPage={(idx) => {
              setHighlightedPageIndex(idx);
              setLeftTab('editor');
            }}
            onOpenFullscreen={(idx) => setFullscreenPageIndex(idx)}
            onTriggerAutoFit={() => setAdvanced((prev) => ({ ...prev, autoFit: true }))}
            onIncreasePageCount={() =>
              setDoc((prev) => ({ ...prev, pageCount: prev.pageCount + 1 }))
            }
            onDecreaseFontSize={() =>
              setTypography((prev) => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 2) }))
            }
            onDecreaseMargins={() =>
              setSpacing((prev) => ({
                ...prev,
                paddingTop: Math.max(20, prev.paddingTop - 16),
                paddingRight: Math.max(20, prev.paddingRight - 16),
                paddingBottom: Math.max(20, prev.paddingBottom - 16),
                paddingLeft: Math.max(20, prev.paddingLeft - 16),
              }))
            }
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenPageIndex !== null && (
        <FullscreenModal
          isOpen={true}
          onClose={() => setFullscreenPageIndex(null)}
          pages={paginationResult.pages}
          initialPageIndex={fullscreenPageIndex}
          canvas={canvas}
          typography={typography}
          spacing={spacing}
          exportFormat={exportFormat}
          exportScale={exportScale}
          projectName={doc.projectName}
        />
      )}
    </div>
  );
}
