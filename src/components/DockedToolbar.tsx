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
  AdvancedSettings,
} from '../types';

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
}

const BUILT_IN_FONTS = [
  'Inter',
  'Roboto',
  'Georgia',
  'Source Sans 3',
  'IBM Plex Sans',
  'Open Sans',
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
}) => {
  const [activePopover, setActivePopover] = useState<'pages' | 'font' | 'size' | 'format' | 'margins' | 'more' | null>(null);
  const [fontSearch, setFontSearch] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePopover = (name: 'pages' | 'font' | 'size' | 'format' | 'margins' | 'more') => {
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

  const allFonts = Array.from(new Set([...customFonts, ...BUILT_IN_FONTS]));
  const filteredFonts = allFonts.filter((f) =>
    f.toLowerCase().includes(fontSearch.toLowerCase())
  );

  const getFormatLabel = () => {
    if (canvas.preset === 'twitter') return '1080×1350 (4:5)';
    if (canvas.preset === 'square') return '1080×1080 (1:1)';
    if (canvas.preset === 'portrait') return '1080×1440 (3:4)';
    if (canvas.preset === 'story') return '1080×1920 (9:16)';
    if (canvas.preset === 'landscape') return '1600×900 (16:9)';
    return `${canvas.width}×${canvas.height}`;
  };

  const getMarginLabel = () => {
    if (spacing.preset === 'compact') return 'Compact';
    if (spacing.preset === 'generous') return 'Generous';
    return 'Balanced';
  };

  const isVerticallyCentered = (typography.verticalAlignment ?? spacing.verticalAlignment ?? 'center') === 'center';

  return (
    <div ref={toolbarRef} className="relative select-none flex items-center">
      {/* 4 Calm Control Groups on Lifted Dark Surface */}
      <div className="flex items-center gap-4 text-xs select-none py-1">

        {/* ========================================================= */}
        {/* GROUP 1: PAGES */}
        {/* ========================================================= */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover('pages')}
            className={`h-7 px-2.5 flex items-center gap-1.5 bg-[#18181C] border border-[#29292E] rounded-[6px] text-xs transition-colors ${
              activePopover === 'pages'
                ? 'bg-[#222227] text-[#E8E8EA] border-[#4A4A50]'
                : 'text-[#B5B5BA] hover:bg-[#222227] hover:text-[#E8E8EA]'
            }`}
            title="Number of pages and distribution"
          >
            <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
            <ChevronDown className="w-3 h-3 text-[#77777F]" />
          </button>

          {activePopover === 'pages' && (
            <div className="absolute bottom-full left-0 mb-3 w-68 bg-[#121216] border border-[#29292E] rounded-xl shadow-2xl shadow-black p-4 text-[#E8E8EA] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-[#77777F] uppercase font-mono tracking-wider">Number of Pages</span>
                <span className="text-xs font-mono text-[#9A9AA2]">{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
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
                        ? 'bg-[#303036] text-[#F0F0F0] font-semibold border-[#4A4A50] shadow-xs'
                        : 'bg-[#18181C] border-[#29292E] text-[#B5B5BA] hover:text-[#E8E8EA] hover:bg-[#222227]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Custom count input */}
              <div className="flex items-center gap-2 mb-3 pt-2 border-t border-[#222227]">
                <span className="text-xs text-[#9A9AA2]">Custom count:</span>
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
                  className="w-16 px-2 py-1 text-xs bg-[#18181C] border border-[#29292E] rounded-[6px] text-[#E8E8EA] text-center font-mono focus:outline-hidden focus:border-[#4A4A50]"
                />
              </div>

              {/* Distribution Mode */}
              <div className="pt-2 border-t border-[#222227]">
                <span className="text-[10px] font-semibold text-[#77777F] uppercase font-mono tracking-wider block mb-2">
                  Distribution Mode
                </span>
                <div className="grid grid-cols-3 gap-1 bg-[#18181C] p-1 rounded-[6px] border border-[#29292E]">
                  {(['balanced', 'paragraph-preserving', 'manual'] as DistributionMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onDistributionModeChange(mode)}
                      className={`py-1 text-[10px] rounded-[4px] transition-colors ${
                        distributionMode === mode
                          ? 'bg-[#303036] text-[#F0F0F0] font-medium border border-[#4A4A50]'
                          : 'text-[#77777F] hover:text-[#E8E8EA]'
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

        {/* Faint Divider between major groups */}
        <div className="w-px h-3.5 bg-[#242429]" />

        {/* ========================================================= */}
        {/* GROUP 2: TYPOGRAPHY (Font · Size · Auto-fit · Fill) */}
        {/* ========================================================= */}
        <div className="h-7 flex items-center bg-[#18181C] border border-[#29292E] rounded-[6px] p-0.5 gap-0.5">
          {/* Font Family Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('font')}
              className={`h-6 px-2 flex items-center gap-1 text-xs rounded-[4px] transition-colors ${
                activePopover === 'font'
                  ? 'bg-[#222227] text-[#E8E8EA]'
                  : 'text-[#B5B5BA] hover:bg-[#222227] hover:text-[#E8E8EA]'
              }`}
              title="Choose typography font"
            >
              <span className="max-w-[100px] truncate">{typography.fontFamily}</span>
              <ChevronDown className="w-3 h-3 text-[#77777F]" />
            </button>

            {activePopover === 'font' && (
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#121216] border border-[#29292E] rounded-xl shadow-2xl shadow-black p-3 text-[#E8E8EA] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-[#77777F] uppercase font-mono tracking-wider">Typography</span>
                  <button
                    type="button"
                    onClick={() => fontFileInputRef.current?.click()}
                    className="text-[11px] text-[#9A9AA2] hover:text-white flex items-center gap-1 hover:underline"
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
                  className="w-full px-2.5 py-1.5 text-xs bg-[#18181C] border border-[#29292E] rounded-[6px] text-[#E8E8EA] mb-2 placeholder-[#77777F] focus:outline-hidden focus:border-[#4A4A50]"
                />

                <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                  {filteredFonts.map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => {
                        onTypographyChange({ ...typography, fontFamily: font });
                        setActivePopover(null);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-[4px] text-xs text-left flex items-center justify-between transition-colors ${
                        typography.fontFamily === font
                          ? 'bg-[#303036] text-[#F0F0F0] font-medium border border-[#4A4A50]'
                          : 'text-[#B5B5BA] hover:text-[#E8E8EA] hover:bg-[#222227]'
                      }`}
                      style={{ fontFamily: font }}
                    >
                      <span>{font}</span>
                      {typography.fontFamily === font && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="text-[#77777F] text-[10px] px-0.5 select-none">·</span>

          {/* Font Size Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('size')}
              className={`h-6 px-2 flex items-center gap-1 text-xs rounded-[4px] transition-colors ${
                activePopover === 'size'
                  ? 'bg-[#222227] text-[#E8E8EA]'
                  : 'text-[#B5B5BA] hover:bg-[#222227] hover:text-[#E8E8EA]'
              }`}
              title="Adjust font size, weight and line height"
            >
              <span>{effectiveFontSize}px</span>
              <ChevronDown className="w-3 h-3 text-[#77777F]" />
            </button>

            {activePopover === 'size' && (
              <div className="absolute bottom-full left-0 mb-3 w-72 bg-[#121216] border border-[#29292E] rounded-xl shadow-2xl shadow-black p-4 text-[#E8E8EA] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold text-[#77777F] uppercase font-mono tracking-wider">Font Size & Spacing</span>
                  <span className="text-xs font-mono text-[#9A9AA2]">
                    {advanced.autoFit ? `Auto (${effectiveFontSize}px)` : `${typography.fontSize}px`}
                  </span>
                </div>

                {/* Auto-fit toggle inside size menu */}
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#18181C] border border-[#29292E] mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#9A9AA2]" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-[#E8E8EA]">Auto-fit font size</span>
                      <span className="text-[10px] text-[#77777F]">Scale text to fill pages</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdvancedChange({ ...advanced, autoFit: !advanced.autoFit })}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      advanced.autoFit ? 'bg-[#D6D6D6]' : 'bg-[#222227]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        advanced.autoFit ? 'translate-x-4 bg-[#111111]' : 'translate-x-0 bg-[#77777F]'
                      }`}
                    />
                  </button>
                </div>

                {/* Font size slider */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-[#9A9AA2] mb-1.5">
                    <span>Font Size</span>
                    <span className="font-mono">{typography.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={96}
                    value={typography.fontSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value, 10);
                      onTypographyChange({ ...typography, fontSize: newSize });
                      if (advanced.autoFit) {
                        onAdvancedChange({ ...advanced, autoFit: false });
                      }
                    }}
                    className="w-full accent-[#D6D6D6] h-1 bg-[#222227] rounded cursor-pointer"
                  />
                </div>

                {/* Font Weight */}
                <div className="mb-3">
                  <span className="text-[10px] text-[#77777F] font-mono uppercase block mb-1.5">Font Weight</span>
                  <div className="grid grid-cols-5 gap-1 bg-[#18181C] p-1 rounded-[6px] border border-[#29292E]">
                    {([300, 400, 500, 600, 700] as FontWeight[]).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => onTypographyChange({ ...typography, fontWeight: w })}
                        className={`py-1 text-[10px] rounded-[4px] font-mono transition-colors ${
                          typography.fontWeight === w
                            ? 'bg-[#303036] text-[#F0F0F0] font-medium border border-[#4A4A50]'
                            : 'text-[#77777F] hover:text-[#E8E8EA]'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Height */}
                <div>
                  <div className="flex items-center justify-between text-xs text-[#9A9AA2] mb-1.5">
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
                    className="w-full accent-[#D6D6D6] h-1 bg-[#222227] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <span className="text-[#77777F] text-[10px] px-0.5 select-none">·</span>

          {/* Auto-fit Toggle (Soft Neutral Active State #D6D6D6) */}
          <button
            type="button"
            onClick={() => onAdvancedChange({ ...advanced, autoFit: !advanced.autoFit })}
            className={`h-6 px-2 flex items-center gap-1 rounded-[4px] text-[11px] font-medium transition-colors ${
              advanced.autoFit
                ? 'bg-[#D6D6D6] text-[#111111]'
                : 'text-[#77777F] hover:text-[#B5B5BA] hover:bg-[#222227]'
            }`}
            title={advanced.autoFit ? 'Auto-fit is active (click to use manual size)' : 'Enable Auto-fit to fill pages'}
          >
            <Sparkles className={`w-3 h-3 ${advanced.autoFit ? 'text-[#111111]' : 'text-[#77777F]'}`} />
            <span>Auto-fit</span>
          </button>

          {/* Fill Canvas Optimizer */}
          <button
            type="button"
            onClick={onFillCanvas}
            className="h-6 px-2 flex items-center gap-1 rounded-[4px] text-[11px] text-[#77777F] hover:text-amber-300 hover:bg-[#222227] transition-colors"
            title="1-click: Optimize font size, line height, and spacing to maximize page fill"
          >
            <Maximize2 className="w-3 h-3 text-amber-400/80" />
            <span>Fill</span>
          </button>
        </div>

        {/* Faint Divider between major groups */}
        <div className="w-px h-3.5 bg-[#242429]" />

        {/* ========================================================= */}
        {/* GROUP 3: LAYOUT (Format · Alignment · Top/Center) */}
        {/* ========================================================= */}
        <div className="h-7 flex items-center bg-[#18181C] border border-[#29292E] rounded-[6px] p-0.5 gap-0.5">
          {/* Canvas Format / Ratio */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('format')}
              className={`h-6 px-2 flex items-center gap-1 text-xs rounded-[4px] transition-colors ${
                activePopover === 'format'
                  ? 'bg-[#222227] text-[#E8E8EA]'
                  : 'text-[#B5B5BA] hover:bg-[#222227] hover:text-[#E8E8EA]'
              }`}
              title="Change canvas aspect ratio & dimensions"
            >
              <span>{getFormatLabel()}</span>
              <ChevronDown className="w-3 h-3 text-[#77777F]" />
            </button>

            {activePopover === 'format' && (
              <div className="absolute bottom-full left-0 mb-3 w-80 bg-[#121216] border border-[#29292E] rounded-xl shadow-2xl shadow-black p-4 text-[#E8E8EA] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="text-[10px] font-semibold text-[#77777F] uppercase font-mono tracking-wider block mb-2">
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
                          ? 'bg-[#303036] border-[#4A4A50] text-[#F0F0F0] font-medium'
                          : 'bg-[#18181C] border-[#29292E] text-[#B5B5BA] hover:text-[#E8E8EA] hover:bg-[#222227]'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-[#77777F] font-mono">{p.dim}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#222227]">
                  <span className="text-[10px] text-[#77777F] font-mono uppercase block mb-1.5">Custom Dimensions</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#77777F] font-mono block mb-1">Width</label>
                      <input
                        type="number"
                        value={canvas.width}
                        onChange={(e) =>
                          onCanvasChange({
                            ...canvas,
                            width: parseInt(e.target.value, 10) || 1080,
                            preset: 'custom',
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-[#18181C] border border-[#29292E] rounded-[6px] text-[#E8E8EA] font-mono focus:outline-hidden focus:border-[#4A4A50]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#77777F] font-mono block mb-1">Height</label>
                      <input
                        type="number"
                        value={canvas.height}
                        onChange={(e) =>
                          onCanvasChange({
                            ...canvas,
                            height: parseInt(e.target.value, 10) || 1350,
                            preset: 'custom',
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-[#18181C] border border-[#29292E] rounded-[6px] text-[#E8E8EA] font-mono focus:outline-hidden focus:border-[#4A4A50]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <span className="text-[#77777F] text-[10px] px-0.5 select-none">·</span>

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
                  className={`h-6 w-6 flex items-center justify-center rounded-[4px] transition-colors ${
                    isActive
                      ? 'bg-[#303036] text-[#F0F0F0] border border-[#4A4A50]'
                      : 'text-[#77777F] hover:text-[#B5B5BA] hover:bg-[#222227]'
                  }`}
                  title={al.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          <span className="text-[#77777F] text-[10px] px-0.5 select-none">·</span>

          {/* Vertical Alignment */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                onTypographyChange({ ...typography, verticalAlignment: 'top' });
                onSpacingChange({ ...spacing, verticalAlignment: 'top' });
              }}
              className={`h-6 px-1.5 flex items-center justify-center rounded-[4px] text-[11px] font-medium transition-colors ${
                !isVerticallyCentered
                  ? 'bg-[#303036] text-[#F0F0F0] border border-[#4A4A50]'
                  : 'text-[#77777F] hover:text-[#B5B5BA] hover:bg-[#222227]'
              }`}
              title="Top align text on canvas"
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => {
                onTypographyChange({ ...typography, verticalAlignment: 'center' });
                onSpacingChange({ ...spacing, verticalAlignment: 'center' });
              }}
              className={`h-6 px-1.5 flex items-center justify-center rounded-[4px] text-[11px] font-medium transition-colors ${
                isVerticallyCentered
                  ? 'bg-[#303036] text-[#F0F0F0] border border-[#4A4A50]'
                  : 'text-[#77777F] hover:text-[#B5B5BA] hover:bg-[#222227]'
              }`}
              title="Center text vertically"
            >
              Center
            </button>
          </div>
        </div>

        {/* Faint Divider between major groups */}
        <div className="w-px h-3.5 bg-[#242429]" />

        {/* ========================================================= */}
        {/* GROUP 4: SPACING / MORE (Compact · ···) */}
        {/* ========================================================= */}
        <div className="h-7 flex items-center bg-[#18181C] border border-[#29292E] rounded-[6px] p-0.5 gap-0.5">
          {/* Margins */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('margins')}
              className={`h-6 px-2 flex items-center gap-1 text-xs rounded-[4px] transition-colors ${
                activePopover === 'margins'
                  ? 'bg-[#222227] text-[#E8E8EA]'
                  : 'text-[#B5B5BA] hover:bg-[#222227] hover:text-[#E8E8EA]'
              }`}
              title="Change margins & paragraph spacing"
            >
              <span>{getMarginLabel()}</span>
              <ChevronDown className="w-3 h-3 text-[#77777F]" />
            </button>

            {activePopover === 'margins' && (
              <div className="absolute bottom-full right-0 mb-3 w-72 bg-[#121216] border border-[#29292E] rounded-xl shadow-2xl shadow-black p-4 text-[#E8E8EA] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="text-[10px] font-semibold text-[#77777F] uppercase font-mono tracking-wider block mb-2">
                  Margins & Spacing
                </span>
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {[
                    { id: 'compact', name: 'Compact', px: '48px' },
                    { id: 'balanced', name: 'Balanced', px: '96px' },
                    { id: 'generous', name: 'Generous', px: '144px' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleMarginPresetChange(m.id as MarginPreset)}
                      className={`py-1.5 px-2 rounded-[6px] text-xs flex flex-col items-center gap-0.5 border transition-colors ${
                        spacing.preset === m.id
                          ? 'bg-[#303036] text-[#F0F0F0] font-medium border-[#4A4A50] shadow-xs'
                          : 'bg-[#18181C] border-[#29292E] text-[#B5B5BA] hover:text-[#E8E8EA] hover:bg-[#222227]'
                      }`}
                    >
                      <span>{m.name}</span>
                      <span className="text-[9px] opacity-70 font-mono">{m.px}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#222227] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#9A9AA2]">
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
                    className="w-full accent-[#D6D6D6] h-1 bg-[#222227] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <span className="text-[#77777F] text-[10px] px-0.5 select-none">·</span>

          {/* More Options (···) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('more')}
              className={`h-6 px-2 flex items-center justify-center text-xs tracking-wider rounded-[4px] transition-colors ${
                activePopover === 'more'
                  ? 'bg-[#222227] text-[#E8E8EA]'
                  : 'text-[#77777F] hover:text-[#E8E8EA] hover:bg-[#222227]'
              }`}
              title="More options (colors, presets, lock layout, reset)"
            >
              ···
            </button>

            {activePopover === 'more' && (
              <div className="absolute bottom-full right-0 mb-3 w-80 bg-[#121216] border border-[#29292E] rounded-xl shadow-2xl shadow-black p-4 text-[#E8E8EA] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="text-[10px] font-semibold text-[#77777F] uppercase font-mono tracking-wider block mb-2">
                  Colors & Appearance
                </span>
                <div className="space-y-2 mb-3 bg-[#18181C] p-2.5 rounded-[6px] border border-[#29292E]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#B5B5BA]">Background</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={canvas.backgroundColor}
                        onChange={(e) => onCanvasChange({ ...canvas, backgroundColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-[#29292E] bg-transparent"
                      />
                      <span className="text-xs font-mono text-[#9A9AA2]">{canvas.backgroundColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#B5B5BA]">Text Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={typography.textColor}
                        onChange={(e) => onTypographyChange({ ...typography, textColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-[#29292E] bg-transparent"
                      />
                      <span className="text-xs font-mono text-[#9A9AA2]">{typography.textColor}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#222227] flex items-center justify-between">
                    <span className="text-xs text-[#B5B5BA]">Transparent Background</span>
                    <input
                      type="checkbox"
                      checked={canvas.transparentBackground}
                      onChange={(e) =>
                        onCanvasChange({ ...canvas, transparentBackground: e.target.checked })
                      }
                      className="rounded border-[#29292E] text-zinc-300 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#222227]">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleLayoutLock();
                      setActivePopover(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center gap-2 bg-[#18181C] border border-[#29292E] text-[#B5B5BA] hover:text-[#E8E8EA] hover:bg-[#222227] transition-colors"
                  >
                    {layoutLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-[#77777F]" />}
                    <span>{layoutLocked ? 'Layout Locked (Click to Unlock)' : 'Lock Layout'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenPresetsModal();
                      setActivePopover(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center gap-2 bg-[#18181C] border border-[#29292E] text-[#B5B5BA] hover:text-[#E8E8EA] hover:bg-[#222227] transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#77777F]" />
                    <span>Visual Presets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenShortcutsModal();
                      setActivePopover(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center gap-2 bg-[#18181C] border border-[#29292E] text-[#B5B5BA] hover:text-[#E8E8EA] hover:bg-[#222227] transition-colors"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-[#77777F]" />
                    <span>Keyboard Shortcuts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset all settings to defaults?')) {
                        onResetAll();
                        setActivePopover(null);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] text-xs text-left flex items-center gap-2 bg-[#18181C] border border-[#29292E] text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    <span>Reset All to Defaults</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
