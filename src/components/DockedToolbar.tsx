'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Upload,
  Sparkles,
  Lock,
  Unlock,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Keyboard,
  Bookmark,
  Maximize2,
  MoreHorizontal,
  Wand2,
  Star,
} from 'lucide-react';
import {
  CanvasSettings,
  CanvasPreset,
  DistributionMode,
  FontWeight,
  MarginPreset,
  SpacingSettings,
  TextAlignment,
  TypographySettings,
  VerticalAlignment,
  AdvancedSettings,
} from '../types';
import { getSupportedFontWeights } from '../engine/fontLoader';
import { loadStoredFavoriteFonts, saveStoredFavoriteFonts } from '../engine/presetStore';

interface DockedToolbarProps {
  pageCount: number;
  onPageCountChange: (count: number) => void;
  distributionMode: DistributionMode;
  onDistributionModeChange: (mode: DistributionMode) => void;
  typography: TypographySettings;
  onTypographyChange: (typo: TypographySettings) => void;
  effectiveFontSize: number;
  canvas: CanvasSettings;
  onCanvasChange: (canvas: CanvasSettings) => void;
  spacing: SpacingSettings;
  onSpacingChange: (spacing: SpacingSettings) => void;
  advanced: AdvancedSettings;
  onAdvancedChange: (advanced: AdvancedSettings) => void;
  customFonts: string[];
  onCustomFontUpload: (file: File) => void;
  layoutLocked: boolean;
  onToggleLayoutLock: () => void;
  onOpenPresetsModal: () => void;
  onOpenShortcutsModal: () => void;
  onResetAll: () => void;
  onFillCanvas: () => void;
  onAuthorPreferred: () => void;
}

const BUILT_IN_FONTS = [
  'Inter',
  'SF Pro Display',
  'SF Pro Text',
  'SF Pro Rounded',
  'SF Mono',
  'New York',
  'Tw Cen MT Bold',
  'Source Sans 3',
  'Atkinson Hyperlegible Next',
  'Lato',
  'IBM Plex Sans',
  'Open Sans',
  'Roboto',
  'Georgia',
  'Dudu Calligraphy',
  'HelvetiHand',
  'Cutewritten',
  'Stay With Me',
  'Internet Friends',
  'Winkle',
  'April',
  'Reading Notes',
  'Classic Milky',
  'i eat crayons',
  'Caveat',
  'Kalam',
  'Patrick Hand',
  'Shadows Into Light',
  'Arial',
  'serif',
  'monospace',
  'system-ui',
];

export const DockedToolbar: React.FC<DockedToolbarProps> = ({
  pageCount,
  onPageCountChange,
  distributionMode,
  onDistributionModeChange,
  typography,
  onTypographyChange,
  effectiveFontSize,
  canvas,
  onCanvasChange,
  spacing,
  onSpacingChange,
  advanced,
  onAdvancedChange,
  customFonts,
  onCustomFontUpload,
  layoutLocked,
  onToggleLayoutLock,
  onOpenPresetsModal,
  onOpenShortcutsModal,
  onResetAll,
  onFillCanvas,
  onAuthorPreferred,
}) => {
  const [activePopover, setActivePopover] = useState<'pages' | 'font' | 'size' | 'format' | 'margins' | 'colors' | 'more' | null>(null);
  const [fontSearch, setFontSearch] = useState('');
  const [prevCanvas, setPrevCanvas] = useState({ width: canvas.width, height: canvas.height });
  const [customWidth, setCustomWidth] = useState(String(canvas.width));
  const [customHeight, setCustomHeight] = useState(String(canvas.height));
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize local input state when canvas dimensions change externally
  if (prevCanvas.width !== canvas.width || prevCanvas.height !== canvas.height) {
    setPrevCanvas({ width: canvas.width, height: canvas.height });
    setCustomWidth(String(canvas.width));
    setCustomHeight(String(canvas.height));
  }

  const isAutoBalanced = Boolean(
    distributionMode === 'paragraph-preserving' &&
    canvas.trimAllPages &&
    spacing.preset === 'compact' &&
    advanced.autoFit
  );

  const commitCustomDimensions = (wStr = customWidth, hStr = customHeight) => {
    const w = parseInt(wStr, 10);
    const h = parseInt(hStr, 10);
    const validW = !isNaN(w) && w >= 200 && w <= 10000 ? w : canvas.width;
    const validH = !isNaN(h) && h >= 200 && h <= 10000 ? h : canvas.height;
    setCustomWidth(String(validW));
    setCustomHeight(String(validH));
    if (validW !== canvas.width || validH !== canvas.height || canvas.preset !== 'custom') {
      onCanvasChange({
        ...canvas,
        preset: 'custom',
        width: validW,
        height: validH,
      });
    }
  };

  // Safe debounced commit: only commits if user paused typing for 500ms AND both numbers are valid full dimensions
  useEffect(() => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (!isNaN(w) && w >= 200 && w <= 10000 && !isNaN(h) && h >= 200 && h <= 10000) {
      if (w !== canvas.width || h !== canvas.height || canvas.preset !== 'custom') {
        const timer = setTimeout(() => {
          onCanvasChange({
            ...canvas,
            preset: 'custom',
            width: w,
            height: h,
          });
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [customWidth, customHeight, canvas, onCanvasChange]);

  // Close popover on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const togglePopover = (name: 'pages' | 'font' | 'size' | 'format' | 'margins' | 'colors' | 'more') => {
    setActivePopover((prev) => (prev === name ? null : name));
  };

  const handleCanvasPresetChange = (preset: CanvasPreset) => {
    let width = 1080;
    let height = 1350;
    if (preset === 'square') {
      width = 1080;
      height = 1080;
    } else if (preset === 'portrait') {
      width = 1080;
      height = 1440;
    } else if (preset === 'story') {
      width = 1080;
      height = 1920;
    } else if (preset === 'landscape') {
      width = 1600;
      height = 900;
    }
    onCanvasChange({
      ...canvas,
      preset,
      width,
      height,
    });
  };

  const handleMarginPresetChange = (preset: MarginPreset) => {
    let pad = 96;
    if (preset === 'compact') pad = 48;
    if (preset === 'generous') pad = 144;
    onSpacingChange({
      ...spacing,
      preset,
      paddingTop: pad,
      paddingRight: pad,
      paddingBottom: pad,
      paddingLeft: pad,
    });
  };

  const [favoriteFonts, setFavoriteFonts] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteFonts(loadStoredFavoriteFonts());
  }, []);

  const toggleFavorite = (font: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteFonts((prev) => {
      const next = prev.includes(font) ? prev.filter((f) => f !== font) : [...prev, font];
      saveStoredFavoriteFonts(next);
      return next;
    });
  };

  const [autoFitPulse, setAutoFitPulse] = useState(false);
  const prevFontSizeRef = useRef(effectiveFontSize);
  useEffect(() => {
    if (prevFontSizeRef.current !== effectiveFontSize && advanced.autoFit) {
      setAutoFitPulse(true);
      const timer = setTimeout(() => setAutoFitPulse(false), 320);
      prevFontSizeRef.current = effectiveFontSize;
      return () => clearTimeout(timer);
    }
    prevFontSizeRef.current = effectiveFontSize;
  }, [effectiveFontSize, advanced.autoFit]);

  const allFonts = Array.from(new Set([...customFonts, ...BUILT_IN_FONTS]));
  const filteredFonts = allFonts.filter((f) =>
    f.toLowerCase().includes(fontSearch.toLowerCase())
  );
  const sortedFonts = [...filteredFonts].sort((a, b) => {
    const aFav = favoriteFonts.includes(a);
    const bFav = favoriteFonts.includes(b);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const getFormatLabel = () => {
    let base = `${canvas.width}×${canvas.height}`;
    if (canvas.preset === 'twitter') base = '1080×1350 (4:5)';
    else if (canvas.preset === 'square') base = '1080×1080 (1:1)';
    else if (canvas.preset === 'portrait') base = '1080×1440 (3:4)';
    else if (canvas.preset === 'story') base = '1080×1920 (9:16)';
    else if (canvas.preset === 'landscape') base = '1600×900 (16:9)';

    if (canvas.trimAllPages) {
      return `${base} · Trim All`;
    }
    if (canvas.trimLastPageHeight) {
      return `${base} · Trim Last`;
    }
    return base;
  };

  const getMarginLabel = () => {
    if (spacing.preset === 'compact') return 'Compact';
    if (spacing.preset === 'generous') return 'Generous';
    return 'Balanced';
  };

  return (
    <div ref={toolbarRef} className="relative select-none flex items-center">
      {/* 4 Calm Control Groups on Dark Obsidian Surface */}
      <div className="flex items-center gap-2.5 text-xs select-none py-1">

        {/* ========================================================= */}
        {/* GROUP 1: PAGES (Editable Page Count Control)              */}
        {/* ========================================================= */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover('pages')}
            className={`btn-tactile h-8 px-3 flex items-center gap-1.5 bg-[#0c0c0e] border border-[#1b1b22] rounded-[8px] text-xs transition-colors shadow-xs ${
              activePopover === 'pages'
                ? 'bg-[#16161c] text-white border-[#2e2e3a]'
                : 'text-zinc-300 hover:bg-[#16161c] hover:text-white'
            }`}
            title="Number of pages and distribution"
          >
            <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {activePopover === 'pages' && (
            <div className="absolute bottom-full left-0 mb-3 w-68 bg-[#0c0c0e] border border-[#1b1b22] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider">Number of Pages</span>
                <span className="text-xs font-mono text-zinc-400">{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
              </div>

              {/* Quick Page Picker */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onPageCountChange(n)}
                    className={`h-7 rounded-[6px] text-xs font-mono transition-all border ${
                      pageCount === n
                        ? 'bg-[#1c1c24] text-[#f4f4f6] font-semibold border-[#2e2e3a] shadow-xs'
                        : 'bg-[#09090c] border-[#18181f] text-zinc-400 hover:text-white hover:bg-[#14141a]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Custom count input */}
              <div className="flex items-center gap-2 mb-3 pt-2 border-t border-[#18181f]">
                <span className="text-xs text-zinc-400">Custom count:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={pageCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 50) {
                      onPageCountChange(val);
                    }
                  }}
                  className="w-16 px-2 py-1 text-xs bg-[#09090c] border border-[#18181f] rounded-[6px] text-white text-center font-mono focus:outline-hidden focus:border-[#2e2e3a]"
                />
              </div>

              {/* Distribution Mode */}
              <div className="pt-2 border-t border-[#18181f]">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
                  Distribution Mode
                </span>
                <div className="relative grid grid-cols-3 gap-1 bg-[#09090c] p-1 rounded-[6px] border border-[#18181f]">
                  {/* Sliding Pill Indicator */}
                  <div
                    className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-[4px] bg-[#1c1c24] border border-[#2e2e3a] shadow-xs transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                    style={{
                      transform: `translateX(${
                        distributionMode === 'balanced'
                          ? '0%'
                          : distributionMode === 'paragraph-preserving'
                          ? '100%'
                          : '200%'
                      })`,
                    }}
                  />
                  {(['balanced', 'paragraph-preserving', 'manual'] as DistributionMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onDistributionModeChange(mode)}
                      className={`btn-tactile relative z-10 py-1 text-[10px] rounded-[4px] text-center transition-colors ${
                        distributionMode === mode
                          ? 'text-[#f4f4f6] font-medium'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode === 'balanced' ? 'Balanced' : mode === 'paragraph-preserving' ? 'Paragraph' : 'Manual'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* GROUP 2: TYPOGRAPHY (Inter + 29px + Auto-fit + Fill)       */}
        {/* ========================================================= */}
        <div className="h-8 flex items-center bg-[#0c0c0e] border border-[#1b1b22] rounded-[8px] p-0.5 gap-0.5 shadow-xs">
          {/* Font Family Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('font')}
              className={`btn-tactile h-7 px-2.5 flex items-center gap-1 text-xs rounded-[6px] transition-colors ${
                activePopover === 'font'
                  ? 'bg-[#16161c] text-white'
                  : 'text-zinc-300 hover:bg-[#16161c] hover:text-white'
              }`}
              title="Choose typography font"
            >
              <span className="max-w-[100px] truncate">{typography.fontFamily}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {activePopover === 'font' && (
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#0c0c0e] border border-[#1b1b22] rounded-xl shadow-2xl shadow-black p-3 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider">Typography</span>
                  <button
                    type="button"
                    onClick={() => fontFileInputRef.current?.click()}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
                    title="Upload .ttf, .otf, .woff, .woff2"
                  >
                    <Upload className="w-3 h-3" />
                    Upload Font
                  </button>
                  <input
                    ref={fontFileInputRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onCustomFontUpload(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Search fonts..."
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#09090c] border border-[#18181f] rounded-[6px] text-white mb-2 placeholder-zinc-600 focus:outline-hidden focus:border-[#2e2e3a]"
                />

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                  {sortedFonts.map((font) => {
                    const isFav = favoriteFonts.includes(font);
                    const isSelected = typography.fontFamily === font;
                    return (
                      <div
                        key={font}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          const supported = getSupportedFontWeights(font);
                          const newWeight = supported.includes(typography.fontWeight)
                            ? typography.fontWeight
                            : (supported.includes(400) ? 400 : supported[0]);
                          onTypographyChange({ ...typography, fontFamily: font, fontWeight: newWeight });
                          setActivePopover(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const supported = getSupportedFontWeights(font);
                            const newWeight = supported.includes(typography.fontWeight)
                              ? typography.fontWeight
                              : (supported.includes(400) ? 400 : supported[0]);
                            onTypographyChange({ ...typography, fontFamily: font, fontWeight: newWeight });
                            setActivePopover(null);
                          }
                        }}
                        className={`w-full px-2 py-1.5 rounded-[4px] text-xs text-left flex items-center justify-between transition-colors cursor-pointer group select-none ${
                          isSelected
                            ? 'bg-[#1c1c24] text-[#f4f4f6] font-medium border border-[#2e2e3a]'
                            : 'text-zinc-400 hover:text-white hover:bg-[#14141a]'
                        }`}
                        style={{ fontFamily: font }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(font, e)}
                            className={`p-0.5 rounded transition-colors ${
                              isFav
                                ? 'text-amber-400 hover:text-amber-300 opacity-100'
                                : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300'
                            }`}
                            title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          >
                            <Star
                              className={`w-3 h-3 ${
                                isFav ? 'fill-amber-400 text-amber-400' : 'text-current'
                              }`}
                            />
                          </button>
                          <span className="truncate">{font}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <span className="text-zinc-700 text-[10px] px-0.5 select-none">·</span>

          {/* Font Size Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('size')}
              className={`btn-tactile h-7 px-2.5 flex items-center gap-1 text-xs rounded-[6px] transition-colors ${
                activePopover === 'size'
                  ? 'bg-[#16161c] text-white'
                  : 'text-zinc-300 hover:bg-[#16161c] hover:text-white'
              }`}
              title="Adjust font size, weight and line height"
            >
              <span className={`inline-block transition-colors ${autoFitPulse ? 'animate-pulse-subtle text-amber-300 font-semibold' : ''}`}>
                {Number(effectiveFontSize.toFixed(1))}px
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {activePopover === 'size' && (
              <div className="absolute bottom-full left-0 mb-3 w-72 bg-[#0c0c0e] border border-[#1b1b22] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider">Font Size & Spacing</span>
                  <span className="text-xs font-mono text-zinc-400">
                    {advanced.autoFit ? `Auto (${Number(effectiveFontSize.toFixed(1))}px)` : `${typography.fontSize}px`}
                  </span>
                </div>

                {/* Auto-fit toggle inside size menu */}
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#09090c] border border-[#18181f] mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-zinc-200">Auto-fit font size</span>
                      <span className="text-[10px] text-zinc-500">Scale text to fill pages</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextAutoFit = !advanced.autoFit;
                      const nextMin = advanced.minFontSize === 18 ? 8 : (advanced.minFontSize || 8);
                      onAdvancedChange({ ...advanced, autoFit: nextAutoFit, minFontSize: nextMin });
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      advanced.autoFit ? 'bg-[#24242e] border border-[#3e3e4c]' : 'bg-[#18181f]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        advanced.autoFit ? 'translate-x-4 bg-zinc-200' : 'translate-x-0 bg-zinc-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Font size slider */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                    <span>Font Size</span>
                    <span className="font-mono">{typography.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={96}
                    value={typography.fontSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value, 10);
                      onTypographyChange({ ...typography, fontSize: newSize });
                      if (advanced.autoFit) {
                        onAdvancedChange({ ...advanced, autoFit: false });
                      }
                    }}
                    className="w-full accent-zinc-400 h-1 bg-[#18181f] rounded cursor-pointer"
                  />
                </div>

                {/* Font Weight */}
                <div className="mb-3">
                  {(() => {
                    const supportedWeights = getSupportedFontWeights(typography.fontFamily);
                    const isSingleWeight = supportedWeights.length === 1;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">Font Weight</span>
                          {isSingleWeight && (
                            <span className="text-[9px] font-mono text-zinc-500">Regular 400 only</span>
                          )}
                        </div>
                        <div className="grid grid-cols-5 gap-1 bg-[#09090c] p-1 rounded-[6px] border border-[#18181f]">
                          {([300, 400, 500, 600, 700] as FontWeight[]).map((w) => {
                            const isSupported = supportedWeights.includes(w);
                            return (
                              <button
                                key={w}
                                type="button"
                                disabled={!isSupported}
                                onClick={() => isSupported && onTypographyChange({ ...typography, fontWeight: w })}
                                className={`py-1 text-[10px] rounded-[4px] font-mono transition-colors ${
                                  !isSupported
                                    ? 'opacity-20 cursor-not-allowed text-zinc-600'
                                    : typography.fontWeight === w
                                    ? 'bg-[#1c1c24] text-[#f4f4f6] font-medium border border-[#2e2e3a]'
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                                title={!isSupported ? `${typography.fontFamily} only supports native ${supportedWeights.join(', ')}` : undefined}
                              >
                                {w}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Line Height */}
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                    <span>Line Height</span>
                    <span className="font-mono">{typography.lineHeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={2.2}
                    step={0.05}
                    value={typography.lineHeight}
                    onChange={(e) =>
                      onTypographyChange({ ...typography, lineHeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-zinc-400 h-1 bg-[#18181f] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <span className="text-zinc-700 text-[10px] px-0.5 select-none">·</span>

          {/* Auto-fit Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextAutoFit = !advanced.autoFit;
              const nextMin = advanced.minFontSize === 18 ? 8 : (advanced.minFontSize || 8);
              onAdvancedChange({ ...advanced, autoFit: nextAutoFit, minFontSize: nextMin });
            }}
            className={`btn-tactile h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] text-[11px] font-medium transition-colors ${
              advanced.autoFit
                ? 'bg-[#1c1c24] text-[#f4f4f6] border border-[#2e2e3a] shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
            }`}
            title={advanced.autoFit ? 'Auto-fit is active (click to use manual size)' : 'Enable Auto-fit to fill pages'}
          >
            <Sparkles className="w-3 h-3 text-current" />
            <span>Auto-fit</span>
          </button>

          {/* 1-Click Auto-Balance / Optimize Toggle */}
          <button
            type="button"
            onClick={onAuthorPreferred ?? onFillCanvas}
            className={`btn-tactile h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] text-[11px] font-medium transition-colors ${
              isAutoBalanced
                ? 'bg-[#1c1c24] text-[#f4f4f6] border border-[#2e2e3a] shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
            }`}
            title={
              isAutoBalanced
                ? 'Auto-Balance is ON (Compact 48px, Trim All, Whole Paragraphs) — click to disable'
                : 'Auto-Balance: 1-click snap to optimal density, compact margins, and 100% vertical fill'
            }
          >
            <Wand2 className="w-3 h-3 text-current" />
            <span>Auto-Balance</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* GROUP 3: LAYOUT (Dimensions + Alignment + Vertical)        */}
        {/* ========================================================= */}
        <div className="h-8 flex items-center bg-[#0c0c0e] border border-[#1b1b22] rounded-[8px] p-0.5 gap-0.5 shadow-xs">
          {/* Canvas Format / Ratio */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('format')}
              className={`btn-tactile h-7 px-2.5 flex items-center gap-1 text-xs rounded-[6px] transition-colors ${
                activePopover === 'format'
                  ? 'bg-[#16161c] text-white'
                  : 'text-zinc-300 hover:bg-[#16161c] hover:text-white'
              }`}
              title="Change canvas aspect ratio & dimensions"
            >
              <span>{getFormatLabel()}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {activePopover === 'format' && (
              <div className="absolute bottom-full left-0 mb-3 w-80 bg-[#0c0c0e] border border-[#1b1b22] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
                  Canvas Format
                </span>
                <div className="space-y-1.5 mb-3">
                  {[
                    { id: 'twitter', name: 'X / Twitter Portrait', dim: '1080 × 1350 (4:5)' },
                    { id: 'square', name: 'Square (Instagram/Post)', dim: '1080 × 1080 (1:1)' },
                    { id: 'portrait', name: 'Standard Portrait', dim: '1080 × 1440 (3:4)' },
                    { id: 'story', name: 'Story / Reel', dim: '1080 × 1920 (9:16)' },
                    { id: 'landscape', name: 'Landscape', dim: '1600 × 900 (16:9)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handleCanvasPresetChange(p.id as CanvasPreset);
                        setActivePopover(null);
                      }}
                      className={`w-full px-2.5 py-2 rounded-[6px] text-xs text-left flex items-center justify-between transition-colors border ${
                        canvas.preset === p.id
                          ? 'bg-[#1c1c24] border-[#2e2e3a] text-white font-medium'
                          : 'bg-[#09090c] border-[#18181f] text-zinc-400 hover:text-white hover:bg-[#14141a]'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{p.dim}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-[#18181f]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider">
                      Custom Dimensions
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">200–10000 px</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Width Input */}
                    <div className="flex items-center bg-[#09090c] border border-[#18181f] focus-within:border-[#3e3e4c] focus-within:ring-1 focus-within:ring-[#3e3e4c]/40 rounded-[6px] px-2.5 py-1.5 transition-all">
                      <span className="text-[11px] font-mono text-zinc-500 select-none mr-1.5 font-medium">W</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={customWidth}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setCustomWidth(val);
                        }}
                        onBlur={() => commitCustomDimensions()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitCustomDimensions();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        placeholder="1080"
                        className="w-full bg-transparent text-xs text-zinc-200 font-mono focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] font-mono text-zinc-600 select-none ml-1">px</span>
                    </div>

                    {/* Height Input */}
                    <div className="flex items-center bg-[#09090c] border border-[#18181f] focus-within:border-[#3e3e4c] focus-within:ring-1 focus-within:ring-[#3e3e4c]/40 rounded-[6px] px-2.5 py-1.5 transition-all">
                      <span className="text-[11px] font-mono text-zinc-500 select-none mr-1.5 font-medium">H</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={customHeight}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setCustomHeight(val);
                        }}
                        onBlur={() => commitCustomDimensions()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitCustomDimensions();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        placeholder="1350"
                        className="w-full bg-transparent text-xs text-zinc-200 font-mono focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] font-mono text-zinc-600 select-none ml-1">px</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-[#18181f] flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider">
                    Card Height Mode
                  </span>
                  <div className="relative grid grid-cols-3 gap-1 bg-[#09090c] p-1 rounded-[6px] border border-[#18181f]">
                    {/* Sliding Pill Indicator */}
                    <div
                      className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-[4px] bg-[#1c1c24] border border-[#2e2e3a] shadow-xs transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                      style={{
                        transform: `translateX(${
                          canvas.trimAllPages
                            ? '0%'
                            : canvas.trimLastPageHeight
                            ? '100%'
                            : '200%'
                        })`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onCanvasChange({ ...canvas, trimAllPages: true, trimLastPageHeight: true })}
                      className={`btn-tactile relative z-10 px-2 py-1 rounded-[4px] text-[11px] text-center font-medium transition-colors ${
                        canvas.trimAllPages
                          ? 'text-[#f4f4f6]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Auto-fit every card height to content (100% util, no empty space)"
                    >
                      Trim All
                    </button>
                    <button
                      type="button"
                      onClick={() => onCanvasChange({ ...canvas, trimAllPages: false, trimLastPageHeight: true })}
                      className={`btn-tactile relative z-10 px-2 py-1 rounded-[4px] text-[11px] text-center font-medium transition-colors ${
                        !canvas.trimAllPages && canvas.trimLastPageHeight
                          ? 'text-[#f4f4f6]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Cards 1-(N-1) stay uniform 4:5 for carousels; only last card trims"
                    >
                      Trim Last
                    </button>
                    <button
                      type="button"
                      onClick={() => onCanvasChange({ ...canvas, trimAllPages: false, trimLastPageHeight: false })}
                      className={`btn-tactile relative z-10 px-2 py-1 rounded-[4px] text-[11px] text-center font-medium transition-colors ${
                        !canvas.trimAllPages && !canvas.trimLastPageHeight
                          ? 'text-[#f4f4f6]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Strict fixed canvas dimensions for all cards"
                    >
                      Fixed
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <span className="text-zinc-700 text-[10px] px-0.5 select-none">·</span>

          {/* Horizontal Alignment */}
          <div className="flex items-center gap-0.5">
            {[
              { id: 'left', icon: AlignLeft, label: 'Left align' },
              { id: 'center', icon: AlignCenter, label: 'Center align' },
              { id: 'right', icon: AlignRight, label: 'Right align' },
              { id: 'justify', icon: AlignJustify, label: 'Justify' },
            ].map((al) => {
              const Icon = al.icon;
              const isActive = typography.alignment === al.id;
              return (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => onTypographyChange({ ...typography, alignment: al.id as TextAlignment })}
                  className={`btn-tactile h-7 w-7 flex items-center justify-center rounded-[6px] transition-colors ${
                    isActive
                      ? 'bg-[#1c1c24] text-[#f4f4f6] border border-[#2e2e3a]'
                      : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
                  }`}
                  title={al.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          <span className="text-zinc-700 text-[10px] px-0.5 select-none">·</span>

          {/* Vertical Alignment (Top / Center / Justify) */}
          <div className="flex items-center gap-0.5">
            {(['top', 'center', 'justify'] as VerticalAlignment[]).map((va) => {
              const currentVA = typography.verticalAlignment ?? spacing.verticalAlignment ?? 'center';
              const isActive = currentVA === va;
              const label = va === 'top' ? 'Top' : va === 'center' ? 'Center' : 'Justify';
              const tip = va === 'top' ? 'Top align text on canvas' : va === 'center' ? 'Center text vertically' : 'Justify text across canvas height';
              return (
                <button
                  key={va}
                  type="button"
                  onClick={() => {
                    onTypographyChange({ ...typography, verticalAlignment: va });
                    onSpacingChange({ ...spacing, verticalAlignment: va });
                  }}
                  className={`btn-tactile h-7 px-2.5 flex items-center justify-center rounded-[6px] text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1c1c24] text-[#f4f4f6] border border-[#2e2e3a] shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
                  }`}
                  title={tip}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* GROUP 4: SPACING & MORE (Compact + More)                   */}
        {/* ========================================================= */}
        <div className="h-8 flex items-center bg-[#0c0c0e] border border-[#1b1b22] rounded-[8px] p-0.5 gap-0.5 shadow-xs">
          {/* Margins Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('margins')}
              className={`btn-tactile h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] text-xs transition-colors ${
                activePopover === 'margins'
                  ? 'bg-[#16161c] text-white'
                  : 'text-zinc-300 hover:bg-[#16161c] hover:text-white'
              }`}
              title="Change margins & paragraph spacing"
            >
              <span>{getMarginLabel()}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

          {activePopover === 'margins' && (
            <div className="absolute bottom-full right-0 mb-3 w-72 bg-[#0c0c0e] border border-[#1b1b22] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
                Margins & Spacing
              </span>
              <div className="relative grid grid-cols-3 gap-1 mb-3 bg-[#09090c] p-1 rounded-[6px] border border-[#18181f]">
                {/* Sliding Pill Indicator */}
                <div
                  className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-[4px] bg-[#1c1c24] border border-[#2e2e3a] shadow-xs transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                  style={{
                    transform: `translateX(${
                      spacing.preset === 'compact'
                        ? '0%'
                        : spacing.preset === 'balanced'
                        ? '100%'
                        : '200%'
                    })`,
                  }}
                />
                {[
                  { id: 'compact', name: 'Compact', px: '48px' },
                  { id: 'balanced', name: 'Balanced', px: '96px' },
                  { id: 'generous', name: 'Generous', px: '144px' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleMarginPresetChange(m.id as MarginPreset)}
                    className={`btn-tactile relative z-10 py-1.5 px-2 rounded-[4px] text-xs flex flex-col items-center gap-0.5 transition-colors ${
                      spacing.preset === m.id
                        ? 'text-[#f4f4f6] font-medium'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-[9px] opacity-70 font-mono">{m.px}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#18181f] space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Paragraph Spacing</span>
                  <span className="font-mono">{spacing.paragraphSpacing}px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={64}
                  step={2}
                  value={spacing.paragraphSpacing}
                  onChange={(e) =>
                    onSpacingChange({ ...spacing, paragraphSpacing: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-zinc-400 h-1 bg-[#18181f] rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

        {/* ========================================================= */}
        {/* GROUP 5: COLORS (Background & Text Palette)               */}
        {/* ========================================================= */}
        <div className="h-8 flex items-center bg-[#0c0c0e] border border-[#1b1b22] rounded-[8px] p-0.5 gap-0.5 shadow-xs">
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('colors')}
              className={`btn-tactile h-7 px-2.5 flex items-center gap-2 text-xs rounded-[6px] transition-colors ${
                activePopover === 'colors'
                  ? 'bg-[#16161c] text-white'
                  : 'text-zinc-300 hover:bg-[#16161c] hover:text-white'
              }`}
              title="Change canvas background and text colors"
            >
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 block shrink-0"
                  style={{ backgroundColor: canvas.transparentBackground ? 'transparent' : canvas.backgroundColor }}
                  title={`Canvas: ${canvas.backgroundColor}`}
                />
                <span
                  className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 block shrink-0 -ml-1.5 shadow-xs"
                  style={{ backgroundColor: typography.textColor }}
                  title={`Text: ${typography.textColor}`}
                />
              </div>
              <span>Colors</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {activePopover === 'colors' && (
              <div className="absolute bottom-full right-0 mb-3 w-84 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-[#1b1b22] rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/80 p-4 text-slate-800 dark:text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/[0.06] dark:border-[#18181f]">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider">
                    Colors & Appearance
                  </span>
                  {canvas.transparentBackground && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Transparent
                    </span>
                  )}
                </div>

                {/* Quick Curated Palettes as Mini Visual Cards */}
                <div className="mb-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 block mb-2 font-medium">
                    Curated Palettes
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Dark Obsidian', subtitle: 'Black · White', bg: '#000000', text: '#FFFFFF', isLight: false },
                      { name: 'Linen Light', subtitle: 'Slate · Navy', bg: '#F8FAFC', text: '#0F172A', isLight: true },
                      { name: 'Warm Editorial', subtitle: 'Cream · Charcoal', bg: '#FBF9F5', text: '#2D2A26', isLight: true },
                      { name: 'Studio Slate', subtitle: 'Zinc · Off-white', bg: '#09090B', text: '#EDEDED', isLight: false },
                    ].map((pal) => {
                      const isActive =
                        canvas.backgroundColor.toLowerCase() === pal.bg.toLowerCase() &&
                        typography.textColor.toLowerCase() === pal.text.toLowerCase() &&
                        !canvas.transparentBackground;
                      return (
                        <button
                          key={pal.name}
                          type="button"
                          onClick={() => {
                            onCanvasChange({ ...canvas, backgroundColor: pal.bg, transparentBackground: false });
                            onTypographyChange({ ...typography, textColor: pal.text });
                          }}
                          className={`relative p-2.5 rounded-lg border text-left flex flex-col justify-between h-16 transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                            pal.isLight
                              ? 'border-black/15 hover:border-black/30'
                              : 'border-white/15 hover:border-white/30'
                          } ${isActive ? 'ring-2 ring-blue-500/80' : ''}`}
                          style={{ backgroundColor: pal.bg }}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="text-base font-serif font-bold tracking-tight leading-none"
                              style={{ color: pal.text }}
                            >
                              Aa
                            </span>
                            {isActive && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-xs"
                                style={{
                                  backgroundColor: pal.text,
                                  color: pal.bg,
                                }}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div
                              className="text-[11px] font-semibold leading-tight truncate"
                              style={{ color: pal.text }}
                            >
                              {pal.name}
                            </div>
                            <div
                              className="text-[9px] opacity-75 font-mono leading-none mt-0.5"
                              style={{ color: pal.text }}
                            >
                              {pal.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Controls */}
                <div className="pt-3 border-t border-black/[0.06] dark:border-[#18181f] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 block font-medium">
                    Custom Colors
                  </span>

                  {/* Background */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#09090c] border border-slate-200/80 dark:border-[#18181f]">
                    <div>
                      <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 block leading-tight">
                        Background
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 leading-none">
                        Card canvas fill
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-white dark:bg-[#14141a] border border-slate-200 dark:border-[#22222a] text-slate-700 dark:text-zinc-300 uppercase font-medium shadow-2xs">
                        {canvas.backgroundColor}
                      </span>
                      <label
                        className="relative w-7 h-7 rounded-md border border-black/15 dark:border-white/15 overflow-hidden shadow-xs cursor-pointer block shrink-0"
                        style={{ backgroundColor: canvas.backgroundColor }}
                      >
                        <input
                          type="color"
                          value={canvas.backgroundColor}
                          onChange={(e) => onCanvasChange({ ...canvas, backgroundColor: e.target.value })}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Pick background color"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#09090c] border border-slate-200/80 dark:border-[#18181f]">
                    <div>
                      <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 block leading-tight">
                        Text Color
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 leading-none">
                        Typography & headings
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-white dark:bg-[#14141a] border border-slate-200 dark:border-[#22222a] text-slate-700 dark:text-zinc-300 uppercase font-medium shadow-2xs">
                        {typography.textColor}
                      </span>
                      <label
                        className="relative w-7 h-7 rounded-md border border-black/15 dark:border-white/15 overflow-hidden shadow-xs cursor-pointer block shrink-0"
                        style={{ backgroundColor: typography.textColor }}
                      >
                        <input
                          type="color"
                          value={typography.textColor}
                          onChange={(e) => onTypographyChange({ ...typography, textColor: e.target.value })}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Pick text color"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Transparent Background */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#09090c] border border-slate-200/80 dark:border-[#18181f]">
                    <div>
                      <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 block leading-tight">
                        Transparent Background
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 leading-none">
                        Export with alpha channel
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCanvasChange({ ...canvas, transparentBackground: !canvas.transparentBackground })}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        canvas.transparentBackground
                          ? 'bg-slate-900 dark:bg-zinc-200 border border-slate-900 dark:border-zinc-200'
                          : 'bg-slate-300 dark:bg-[#1e1e26] border border-slate-300 dark:border-[#2a2a36]'
                      }`}
                      aria-label="Toggle transparent background"
                    >
                      <div
                        className={`w-4 h-4 rounded-full transition-transform shadow-xs ${
                          canvas.transparentBackground
                            ? 'translate-x-4 bg-white dark:bg-zinc-900'
                            : 'translate-x-0 bg-white dark:bg-zinc-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* GROUP 6: UTILITY & SYSTEM (Presets, Shortcuts, Reset)      */}
        {/* ========================================================= */}
        <div className="h-8 flex items-center bg-[#0c0c0e] border border-[#1b1b22] rounded-[8px] p-0.5 shadow-xs">
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('more')}
              className={`btn-tactile h-7 px-2 flex items-center gap-1 text-xs rounded-[6px] transition-colors cursor-pointer ${
                activePopover === 'more'
                  ? 'bg-[#16161c] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#16161c]'
              }`}
              title="More options (presets, shortcuts, lock layout, reset)"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {activePopover === 'more' && (
              <div className="absolute bottom-full right-0 mb-3 w-72 bg-[#0c0c0e] border border-[#1b1b22] rounded-xl shadow-2xl shadow-black p-3 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
                  System & Presets
                </span>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPresetsModal();
                      setActivePopover(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center gap-2 bg-[#09090c] border border-[#18181f] text-zinc-300 hover:text-white hover:bg-[#14141a] transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Visual Presets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenShortcutsModal();
                      setActivePopover(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center gap-2 bg-[#09090c] border border-[#18181f] text-zinc-300 hover:text-white hover:bg-[#14141a] transition-colors cursor-pointer"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Keyboard Shortcuts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleLayoutLock();
                      setActivePopover(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center justify-between bg-[#09090c] border border-[#18181f] text-zinc-300 hover:text-white hover:bg-[#14141a] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {layoutLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{layoutLocked ? 'Layout Locked' : 'Lock Layout'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {layoutLocked ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <div className="pt-2 border-t border-[#18181f]">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all settings to defaults?')) {
                          onResetAll();
                          setActivePopover(null);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center gap-2 bg-[#09090c] border border-[#18181f] text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                      <span>Reset All to Defaults</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        </div>
      </div>
    );
  };
