'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, useSyncExternalStore } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { HeaderBar } from '../components/HeaderBar';
import { EditorPanel } from '../components/EditorPanel';
import { DockedToolbar } from '../components/DockedToolbar';
import { PreviewPanel } from '../components/PreviewPanel';
import { FullscreenModal } from '../components/FullscreenModal';
import {
  CanvasSettings,
  DocumentState,
  ExportFormat,
  ExportScale,
  PreviewMode,
  SpacingSettings,
  TypographySettings,
  AdvancedSettings,
  VisualPreset,
  PaginationResult,
} from '../types';
import { GridModeIcon, SingleModeIcon, CarouselModeIcon } from '../components/icons/ViewModeIcons';
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
  SessionState,
} from '../engine/presetStore';
import { paginateDocument } from '../engine/pagination';
import { autoFitFontSize } from '../engine/autoFit';
import { optimizeCanvasFill } from '../engine/canvasFillOptimizer';
import { waitForFonts } from '../engine/fontLoader';
import { exportAllPagesAsZip, exportAllPagesSeparately } from '../engine/exportEngine';

interface HistoryItem {
  document: DocumentState;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  advanced: AdvancedSettings;
}

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function Workspace() {
  // Initial session from localStorage (restored lazily)
  const [initialSession] = useState<SessionState | null>(() =>
    typeof window !== 'undefined' ? loadStoredSession() : null
  );

  // State
  const [doc, setDoc] = useState<DocumentState>(() => initialSession?.document ?? DEFAULT_DOCUMENT);
  const [canvas, setCanvas] = useState<CanvasSettings>(() => initialSession?.canvas ?? DEFAULT_CANVAS);
  const [typography, setTypography] = useState<TypographySettings>(() => initialSession?.typography ?? DEFAULT_TYPOGRAPHY);
  const [spacing, setSpacing] = useState<SpacingSettings>(() => initialSession?.spacing ?? DEFAULT_SPACING);
  const [advanced, setAdvanced] = useState<AdvancedSettings>(() => initialSession?.advanced ?? DEFAULT_ADVANCED);
  const [exportScale, setExportScale] = useState<ExportScale>(() => initialSession?.exportScale ?? 2);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [presets, setPresets] = useState<VisualPreset[]>(() =>
    typeof window !== 'undefined' ? loadStoredPresets() : [DEFAULT_PRESET]
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => initialSession?.selectedPresetId ?? 'x-essay');
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [highlightedPageIndex, setHighlightedPageIndex] = useState<number | null>(null);
  const [fullscreenPageIndex, setFullscreenPageIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('grid');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportWarning, setExportWarning] = useState<string | null>(null);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Undo / Redo history
  const historyRef = useRef<HistoryItem[]>([]);
  const historyIndexRef = useRef<number>(-1);

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
  }, []);

  // Debounced pushHistory for text typing to protect history buffer
  const textHistoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleTextChange = useCallback(
    (newText: string) => {
      setDoc((prev) => ({ ...prev, text: newText }));
      if (textHistoryTimeoutRef.current) {
        clearTimeout(textHistoryTimeoutRef.current);
      }
      if (newText === '' || Math.abs(newText.length - doc.text.length) > 15) {
        pushHistory({ ...doc, text: newText }, canvas, typography, spacing, advanced);
      } else {
        textHistoryTimeoutRef.current = setTimeout(() => {
          pushHistory({ ...doc, text: newText }, canvas, typography, spacing, advanced);
        }, 600);
      }
    },
    [doc, canvas, typography, spacing, advanced, pushHistory]
  );

  // Debounced text for smooth editing performance
  const [debouncedText, setDebouncedText] = useState(doc.text);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(doc.text);
    }, 120);
    return () => clearTimeout(timer);
  }, [doc.text]);

  // Push initial session into history and wait for fonts on mount
  useEffect(() => {
    pushHistory(doc, canvas, typography, spacing, advanced);
    waitForFonts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced session saving to prevent synchronous disk/localStorage serialization lag during typing and color picking
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStoredSession({
        document: doc,
        canvas,
        typography,
        spacing,
        advanced,
        exportScale,
        selectedPresetId,
      });
    }, 500);
    return () => clearTimeout(timer);
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

  // Automated 1-click Canvas Fill Optimizer (Wasted Space Eliminator)
  const handleFillCanvas = useCallback(() => {
    const optimized = optimizeCanvasFill(doc, canvas, typography, spacing, advanced);
    setTypography(optimized.typography);
    setSpacing(optimized.spacing);
    setCanvas(optimized.canvas);
    setAdvanced((prev) => ({ ...prev, autoFit: false }));
    pushHistory(doc, optimized.canvas, optimized.typography, optimized.spacing, { ...advanced, autoFit: false });
  }, [doc, canvas, typography, spacing, advanced, pushHistory]);

  // Layout primitives for zero-overhead color adjustments and strict debounced typing
  const {
    pageCount: docPageCount,
    distributionMode: docDistributionMode,
    manualBreaks: docManualBreaks,
    layoutLocked: docLayoutLocked,
    projectName: docProjectName,
  } = doc;

  const { width: canvasWidth, height: canvasHeight, trimLastPageHeight: canvasTrimLast } = canvas;

  const {
    fontFamily: typoFamily,
    fontSize: typoFontSize,
    fontWeight: typoWeight,
    lineHeight: typoLineHeight,
    letterSpacing: typoLetterSpacing,
    alignment: typoAlign,
    verticalAlignment: typoVAlign,
  } = typography;

  const {
    paddingTop: spaceTop,
    paddingRight: spaceRight,
    paddingBottom: spaceBottom,
    paddingLeft: spaceLeft,
    paragraphSpacing: spacePara,
    minBottomSpace: spaceMinBottom,
    verticalAlignment: spaceVAlign,
  } = spacing;

  const {
    autoFit: advAutoFit,
    minFontSize: advMinFont,
    maxFontSize: advMaxFont,
    densityTarget: advDensity,
    balanceStrength: advBalance,
    preventOrphanLines: advOrphan,
  } = advanced;

  // Run pagination & auto-fit strictly when layout-affecting properties or debouncedText change
  const paginationResult: PaginationResult = useMemo(() => {
    const effectiveDoc: DocumentState = {
      text: debouncedText,
      projectName: docProjectName,
      pageCount: docPageCount,
      distributionMode: docDistributionMode,
      manualBreaks: docManualBreaks,
      layoutLocked: docLayoutLocked,
    };

    const layoutCanvas: CanvasSettings = {
      ...canvas,
      width: canvasWidth,
      height: canvasHeight,
    };

    const layoutTypo: TypographySettings = {
      ...typography,
      fontFamily: typoFamily,
      fontSize: typoFontSize,
      fontWeight: typoWeight,
      lineHeight: typoLineHeight,
      letterSpacing: typoLetterSpacing,
      alignment: typoAlign,
      verticalAlignment: typoVAlign,
    };

    const layoutSpacing: SpacingSettings = {
      ...spacing,
      paddingTop: spaceTop,
      paddingRight: spaceRight,
      paddingBottom: spaceBottom,
      paddingLeft: spaceLeft,
      paragraphSpacing: spacePara,
      minBottomSpace: spaceMinBottom,
      verticalAlignment: spaceVAlign,
    };

    const layoutAdv: AdvancedSettings = {
      ...advanced,
      autoFit: advAutoFit,
      minFontSize: advMinFont,
      maxFontSize: advMaxFont,
      densityTarget: advDensity,
      balanceStrength: advBalance,
      preventOrphanLines: advOrphan,
    };

    if (advAutoFit && !docLayoutLocked) {
      return autoFitFontSize(effectiveDoc, {
        canvas: layoutCanvas,
        typography: layoutTypo,
        spacing: layoutSpacing,
        advanced: layoutAdv,
      });
    }

    return paginateDocument(effectiveDoc, {
      canvas: layoutCanvas,
      typography: layoutTypo,
      spacing: layoutSpacing,
      advanced: layoutAdv,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally decoupling layout primitives from non-layout visual colors (backgroundColor, textColor) to eliminate color picker lag
  }, [
    debouncedText,
    docProjectName,
    docPageCount,
    docDistributionMode,
    docManualBreaks,
    docLayoutLocked,
    canvasWidth,
    canvasHeight,
    canvasTrimLast,
    typoFamily,
    typoFontSize,
    typoWeight,
    typoLineHeight,
    typoLetterSpacing,
    typoAlign,
    typoVAlign,
    spaceTop,
    spaceRight,
    spaceBottom,
    spaceLeft,
    spacePara,
    spaceMinBottom,
    spaceVAlign,
    advAutoFit,
    advMinFont,
    advMaxFont,
    advDensity,
    advBalance,
    advOrphan,
  ]);

  // Derive guaranteed effective typography matching pagination result
  const effectiveTypography = useMemo(
    () => ({ ...typography, fontSize: paginationResult.effectiveFontSize }),
    [typography, paginationResult.effectiveFontSize]
  );

  const hasOverflow = paginationResult.pages.some((p) => p.isOverflowing);

  // Export handlers with strict text-safety checks
  const handleExportAll = useCallback(async () => {
    const overflowing = paginationResult.pages.filter((p) => p.isOverflowing);
    if (overflowing.length > 0 && !advanced.allowClippedExport) {
      const pageNumbers = overflowing.map((p) => p.pageIndex + 1).join(', ');
      setExportWarning(`Export blocked: Page ${pageNumbers} contains clipped text.`);
      return;
    }
    setExportWarning(null);
    setIsExporting(true);
    try {
      await exportAllPagesSeparately(paginationResult.pages, {
        canvas,
        typography: effectiveTypography,
        spacing,
        scale: exportScale,
        format: exportFormat,
        projectName: doc.projectName,
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    paginationResult.pages,
    advanced.allowClippedExport,
    canvas,
    effectiveTypography,
    spacing,
    exportScale,
    exportFormat,
    doc.projectName,
  ]);

  const handleExportZip = useCallback(async () => {
    const overflowing = paginationResult.pages.filter((p) => p.isOverflowing);
    if (overflowing.length > 0 && !advanced.allowClippedExport) {
      const pageNumbers = overflowing.map((p) => p.pageIndex + 1).join(', ');
      setExportWarning(`Export blocked: Page ${pageNumbers} contains clipped text.`);
      return;
    }
    setExportWarning(null);
    setIsExporting(true);
    try {
      await exportAllPagesAsZip(paginationResult.pages, {
        canvas,
        typography: effectiveTypography,
        spacing,
        scale: exportScale,
        format: exportFormat,
        projectName: doc.projectName,
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    paginationResult.pages,
    advanced.allowClippedExport,
    canvas,
    effectiveTypography,
    spacing,
    exportScale,
    exportFormat,
    doc.projectName,
  ]);
  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Single key 'F' or 'f' toggles fullscreen on hovered page (or page 0)
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setFullscreenPageIndex((prev) => {
          if (prev !== null) return null;
          return highlightedPageIndex !== null && highlightedPageIndex >= 0 ? highlightedPageIndex : 0;
        });
        return;
      }

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
      } else if (isCmdOrCtrl && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        setIsEditorCollapsed((prev) => !prev);
      } else if (isCmdOrCtrl && (e.key === 'Z' || e.key === 'z') && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCmdOrCtrl && (e.shiftKey && (e.key === 'Z' || e.key === 'z') || e.key === 'Y' || e.key === 'y')) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleExportAll, highlightedPageIndex]);

  const wordCount = doc.text.trim().length === 0 ? 0 : doc.text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = doc.text.length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0c0c0e] text-[#ededed]">
      {/* Export Blocked Notification Banner */}
      {exportWarning && (
        <div className="bg-red-950/80 border-b border-red-800 p-2.5 px-4 flex items-center justify-between text-xs text-red-200 shrink-0 z-40">
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

      {/* Main 2-Column Responsive Workspace: 30% Editor, 70% Previews (Collapsible) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-[#0c0c0e]">
        {/* Left Column: Distraction-Free Editorial Text Editor (Zero navbar!) */}
        <div
          className={`w-full md:w-[30%] h-1/2 md:h-full flex flex-col bg-[#0c0c0e] overflow-hidden ${
            isEditorCollapsed ? 'hidden' : ''
          }`}
        >
          <EditorPanel
            text={doc.text}
            onTextChange={handleTextChange}
            pages={paginationResult.pages}
            distributionMode={doc.distributionMode}
            manualBreaks={doc.manualBreaks}
            onManualBreaksChange={(breaks) => {
              const updatedPageCount = Math.max(1, breaks.length + 1);
              setDoc((prev) => ({
                ...prev,
                manualBreaks: breaks,
                pageCount: updatedPageCount,
              }));
              pushHistory(
                { ...doc, manualBreaks: breaks, pageCount: updatedPageCount },
                canvas,
                typography,
                spacing,
                advanced
              );
            }}
            highlightedPageIndex={highlightedPageIndex}
            onSelectPage={(pIdx) => setHighlightedPageIndex(pIdx)}
            typography={effectiveTypography}
          />
        </div>

        {/* Center 1px Divider Line */}
        {!isEditorCollapsed && <div className="w-px bg-[#18181c] hidden md:block shrink-0" />}

        {/* Right Column: Clean Live Preview Cards Grid + Single Top-Right Export Pill */}
        <div
          className={`w-full ${
            isEditorCollapsed ? 'w-full h-full' : 'md:w-[70%] h-1/2 md:h-full'
          } flex flex-col bg-[#09090b] overflow-hidden transition-all duration-200`}
        >
          {/* Top Header above Previews: Symmetrical 3-Zone Studio Layout */}
          <div className="h-14 px-4 md:px-8 flex items-center justify-between shrink-0 bg-[#09090b] border-b border-[#18181c]/60 z-20">
            {/* Left Zone: Sidebar Toggle & Page Breadcrumb */}
            <div className="flex items-center gap-3 select-none flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setIsEditorCollapsed((prev) => !prev)}
                className={`h-7 w-7 rounded-[6px] bg-[#0c0c0e] border border-[#1b1b22] hover:border-[#2e2e3a] hover:bg-[#16161c] text-zinc-400 hover:text-white transition-all flex items-center justify-center shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-500 ${
                  isEditorCollapsed ? 'border-zinc-500/40 text-white' : ''
                }`}
                title={isEditorCollapsed ? 'Show editor (Ctrl+B)' : 'Collapse editor / Focus preview (Ctrl+B)'}
                aria-label={isEditorCollapsed ? 'Show editor' : 'Collapse editor'}
              >
                {isEditorCollapsed ? (
                  <PanelLeft className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                )}
              </button>

              <span className="text-zinc-700 text-xs select-none">/</span>

              {/* Refined Page Count Context (clean editorial status) */}
              <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 select-none">
                <span className="text-zinc-200 font-semibold">{doc.pageCount}</span>
                <span className="text-zinc-500">{doc.pageCount === 1 ? 'page' : 'pages'}</span>
              </div>
            </div>

            {/* Center Zone: Symmetrical View Mode Segmented Control */}
            <div className="flex items-center justify-center select-none shrink-0">
              <div className="h-7 p-0.5 rounded-[6px] bg-[#0c0c0e] border border-[#1b1b22] flex items-center gap-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('grid')}
                  className={`h-6 px-2.5 rounded-[4px] flex items-center gap-1.5 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-500 ${
                    previewMode === 'grid'
                      ? 'bg-[#1c1c24] text-[#f4f4f6] font-medium border border-[#2e2e3a] shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
                  }`}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <GridModeIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('single')}
                  className={`h-6 px-2.5 rounded-[4px] flex items-center gap-1.5 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-500 ${
                    previewMode === 'single'
                      ? 'bg-[#1c1c24] text-[#f4f4f6] font-medium border border-[#2e2e3a] shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
                  }`}
                  title="Single page view"
                  aria-label="Single page view"
                >
                  <SingleModeIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Single</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('carousel')}
                  className={`h-6 px-2.5 rounded-[4px] flex items-center gap-1.5 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-500 ${
                    previewMode === 'carousel'
                      ? 'bg-[#1c1c24] text-[#f4f4f6] font-medium border border-[#2e2e3a] shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
                  }`}
                  title="Carousel swipe view"
                  aria-label="Carousel view"
                >
                  <CarouselModeIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Carousel</span>
                </button>
              </div>
            </div>

            {/* Right Zone: Primary Action (Export Pill) */}
            <div className="flex items-center justify-end select-none flex-1 min-w-0">
              <HeaderBar
                onExportAll={handleExportAll}
                onExportZip={handleExportZip}
                exportFormat={exportFormat}
                onExportFormatChange={setExportFormat}
                exportScale={exportScale}
                onExportScaleChange={setExportScale}
                presets={presets}
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
                onSaveCurrentPreset={handleSaveCurrentPreset}
                onRenamePreset={handleRenamePreset}
                onDuplicatePreset={handleDuplicatePreset}
                onDeletePreset={handleDeletePreset}
                isExporting={isExporting}
                hasOverflow={hasOverflow}
                showPresetManagerModal={showPresetsModal}
                onClosePresetManagerModal={() => setShowPresetsModal(false)}
                showShortcutsModal={showShortcutsModal}
                onCloseShortcutsModal={() => setShowShortcutsModal(false)}
              />
            </div>
          </div>

          {/* Previews Grid */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <PreviewPanel
              pages={paginationResult.pages}
              canvas={canvas}
              typography={effectiveTypography}
              spacing={spacing}
              exportFormat={exportFormat}
              exportScale={exportScale}
              projectName={doc.projectName}
              highlightedPageIndex={highlightedPageIndex}
              onPageHover={setHighlightedPageIndex}
              onSelectPage={(idx) => setHighlightedPageIndex(idx)}
              onOpenFullscreen={(idx) => setFullscreenPageIndex(idx)}
              onTriggerAutoFit={() => setAdvanced((prev) => ({ ...prev, autoFit: true }))}
              allowClippedExport={advanced.allowClippedExport}
              onBlockedExport={(msg) => setExportWarning(msg)}
              previewMode={previewMode}
              isEditorCollapsed={isEditorCollapsed}
            />
          </div>
        </div>
      </div>

      {/* Bottom Shelf: Docked Toolbar + Stats */}
      <footer className="h-14 border-t border-[#18181f] px-6 flex items-center justify-between bg-[#0c0c0e] shrink-0 select-none z-30">
        {/* Left: Docked Minimalist Toolbar (4 pages | Inter ⌵ | 48 ⌵ | ···) */}
        <DockedToolbar
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
          typography={typography}
          onTypographyChange={(newTypo) => {
            setTypography(newTypo);
            pushHistory(doc, canvas, newTypo, spacing, advanced);
          }}
          effectiveFontSize={paginationResult.effectiveFontSize}
          canvas={canvas}
          onCanvasChange={(newCanvas) => {
            setCanvas(newCanvas);
            pushHistory(doc, newCanvas, typography, spacing, advanced);
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
          customFonts={customFonts}
          onCustomFontUpload={async (file) => {
            const fontName = file.name.replace(/\.[^/.]+$/, '');
            try {
              const buffer = await file.arrayBuffer();
              const fontFace = new FontFace(fontName, buffer);
              await fontFace.load();
              document.fonts.add(fontFace);
              setCustomFonts((prev) => [...prev, fontName]);
              setTypography((prev) => ({ ...prev, fontFamily: fontName }));
            } catch (err) {
              console.error('Failed to load font:', err);
            }
          }}
          layoutLocked={doc.layoutLocked}
          onToggleLayoutLock={() => setDoc((prev) => ({ ...prev, layoutLocked: !prev.layoutLocked }))}
          onOpenPresetsModal={() => setShowPresetsModal(true)}
          onOpenShortcutsModal={() => setShowShortcutsModal(true)}
          onResetAll={handleResetAll}
          onFillCanvas={handleFillCanvas}
        />

        {/* Right: Crisp Doc Stats */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono select-none">
          <span>
            {wordCount} words · {charCount} chars
          </span>
        </div>
      </footer>

      {/* Fullscreen Modal */}
      {fullscreenPageIndex !== null && (
        <FullscreenModal
          key={fullscreenPageIndex}
          isOpen={true}
          onClose={() => setFullscreenPageIndex(null)}
          pages={paginationResult.pages}
          initialPageIndex={fullscreenPageIndex}
          canvas={canvas}
          typography={effectiveTypography}
          spacing={spacing}
          exportFormat={exportFormat}
          exportScale={exportScale}
          projectName={doc.projectName}
          allowClippedExport={advanced.allowClippedExport}
          onBlockedExport={(msg) => setExportWarning(msg)}
        />
      )}
    </div>
  );
}

export default function Home() {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-zinc-500 font-mono text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white text-black font-bold flex items-center justify-center rounded-xs text-[10px]">
            T
          </div>
          <span>Loading workspace...</span>
        </div>
      </div>
    );
  }

  return <Workspace />;
}
