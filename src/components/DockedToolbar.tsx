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
  Folder,
  Keyboard,
  Bookmark,
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
  onOpenProjectsModal: () => void;
  onOpenShortcutsModal: () => void;
  onResetAll: () => void;
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
  onOpenProjectsModal,
  onOpenShortcutsModal,
  onResetAll,
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
    <div ref={toolbarRef} className="relative select-none">
      {/* Popovers - Strict Pure Black Theme */}
      {activePopover === 'pages' && (
        <div className="absolute bottom-full left-0 mb-3 w-72 bg-[#000000] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
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
                className={`h-8 rounded-lg text-xs font-mono transition-all border ${
                  pageCount === n
                    ? 'bg-white text-black font-semibold border-white shadow-xs'
                    : 'bg-[#08080a] border-[#1a1a1e] text-zinc-400 hover:text-white hover:bg-[#121216]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Custom count input */}
          <div className="flex items-center gap-2 mb-3 pt-2 border-t border-[#141417]">
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
              className="w-16 px-2 py-1 text-xs bg-[#08080a] border border-[#1a1a1e] rounded text-white text-center font-mono focus:outline-hidden focus:border-zinc-500"
            />
          </div>

          {/* Distribution Mode */}
          <div className="pt-2 border-t border-[#141417]">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
              Distribution Mode
            </span>
            <div className="grid grid-cols-3 gap-1 bg-[#08080a] p-1 rounded-lg border border-[#1a1a1e]">
              {(['balanced', 'paragraph-preserving', 'manual'] as DistributionMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onDistributionModeChange(mode)}
                  className={`py-1 text-[10px] rounded transition-colors ${
                    distributionMode === mode
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode === 'balanced' ? 'Balanced' : mode === 'paragraph-preserving' ? 'Paragraph' : 'Manual'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activePopover === 'font' && (
        <div className="absolute bottom-full left-16 mb-3 w-64 bg-[#000000] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-3 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
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
            className="w-full px-2.5 py-1.5 text-xs bg-[#08080a] border border-[#1a1a1e] rounded-lg text-white mb-2 focus:outline-hidden focus:border-zinc-500"
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
                className={`w-full px-2.5 py-1.5 rounded-md text-xs text-left flex items-center justify-between transition-colors ${
                  typography.fontFamily === font
                    ? 'bg-[#141418] text-white font-medium border border-[#27272a]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#0a0a0c]'
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

      {activePopover === 'size' && (
        <div className="absolute bottom-full left-32 mb-3 w-72 bg-[#000000] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider">Font Size & Spacing</span>
            <span className="text-xs font-mono text-zinc-400">
              {advanced.autoFit ? `Auto (${effectiveFontSize}px)` : `${typography.fontSize}px`}
            </span>
          </div>

          {/* Auto-fit toggle */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#08080a] border border-[#1a1a1e] mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-200">Auto-fit font size</span>
                <span className="text-[10px] text-zinc-500">Scale text to fill pages</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAdvancedChange({ ...advanced, autoFit: !advanced.autoFit })}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                advanced.autoFit ? 'bg-white' : 'bg-[#1f1f23]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform ${
                  advanced.autoFit ? 'translate-x-4 bg-black' : 'translate-x-0 bg-zinc-500'
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
              className="w-full accent-white h-1 bg-[#1a1a1e] rounded cursor-pointer"
            />
          </div>

          {/* Font Weight */}
          <div className="mb-3">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1.5">Font Weight</span>
            <div className="grid grid-cols-5 gap-1 bg-[#08080a] p-1 rounded-lg border border-[#1a1a1e]">
              {([300, 400, 500, 600, 700] as FontWeight[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onTypographyChange({ ...typography, fontWeight: w })}
                  className={`py-1 text-[10px] rounded font-mono transition-colors ${
                    typography.fontWeight === w
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
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
              className="w-full accent-white h-1 bg-[#1a1a1e] rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Popover: Canvas Format & Dimensions */}
      {activePopover === 'format' && (
        <div className="absolute bottom-full left-32 md:left-48 mb-3 w-80 bg-[#000000] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
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
                className={`w-full px-2.5 py-2 rounded-lg text-xs text-left flex items-center justify-between transition-colors border ${
                  canvas.preset === p.id
                    ? 'bg-[#18181c] border-zinc-500 text-white font-medium'
                    : 'bg-[#08080a] border-[#1a1a1e] text-zinc-400 hover:text-white hover:bg-[#121216]'
                }`}
              >
                <span>{p.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{p.dim}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#141417]">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1.5">Custom Dimensions</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">Width</label>
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
                  className="w-full px-2 py-1 text-xs bg-[#08080a] border border-[#1a1a1e] rounded text-white font-mono focus:outline-hidden focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">Height</label>
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
                  className="w-full px-2 py-1 text-xs bg-[#08080a] border border-[#1a1a1e] rounded text-white font-mono focus:outline-hidden focus:border-zinc-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popover: Margins & Padding */}
      {activePopover === 'margins' && (
        <div className="absolute bottom-full left-48 md:left-96 mb-3 w-72 bg-[#000000] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
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
                className={`py-1.5 px-2 rounded-lg text-xs flex flex-col items-center gap-0.5 border transition-colors ${
                  spacing.preset === m.id
                    ? 'bg-white text-black font-semibold border-white shadow-xs'
                    : 'bg-[#08080a] border-[#1a1a1e] text-zinc-400 hover:text-white'
                }`}
              >
                <span>{m.name}</span>
                <span className="text-[9px] opacity-70 font-mono">{m.px}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#141417] space-y-2">
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
              className="w-full accent-white h-1 bg-[#1a1a1e] rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Popover: More Settings (Colors, Presets, Reset) */}
      {activePopover === 'more' && (
        <div className="absolute bottom-full right-0 md:left-auto mb-3 w-80 bg-[#000000] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-4 text-zinc-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono tracking-wider block mb-2">
            Colors & Appearance
          </span>
          <div className="space-y-2 mb-3 bg-[#08080a] p-2.5 rounded-lg border border-[#1a1a1e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-300">Background</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={canvas.backgroundColor}
                  onChange={(e) => onCanvasChange({ ...canvas, backgroundColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[#1a1a1e] bg-transparent"
                />
                <span className="text-xs font-mono text-zinc-400">{canvas.backgroundColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-300">Text Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={typography.textColor}
                  onChange={(e) => onTypographyChange({ ...typography, textColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[#1a1a1e] bg-transparent"
                />
                <span className="text-xs font-mono text-zinc-400">{typography.textColor}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#141417] flex items-center justify-between">
              <span className="text-xs text-zinc-300">Transparent Background</span>
              <input
                type="checkbox"
                checked={canvas.transparentBackground}
                onChange={(e) =>
                  onCanvasChange({ ...canvas, transparentBackground: e.target.checked })
                }
                className="rounded border-[#1a1a1e] text-white focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#141417]">
            <button
              type="button"
              onClick={() => {
                onToggleLayoutLock();
                setActivePopover(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-md text-xs text-left flex items-center gap-2 bg-[#08080a] border border-[#1a1a1e] text-zinc-300 hover:text-white hover:bg-[#121214] transition-colors"
            >
              {layoutLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{layoutLocked ? 'Layout Locked (Click to Unlock)' : 'Lock Layout'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenPresetsModal();
                setActivePopover(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-md text-xs text-left flex items-center gap-2 bg-[#08080a] border border-[#1a1a1e] text-zinc-300 hover:text-white hover:bg-[#121214] transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
              <span>Visual Presets</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenProjectsModal();
                setActivePopover(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-md text-xs text-left flex items-center gap-2 bg-[#08080a] border border-[#1a1a1e] text-zinc-300 hover:text-white hover:bg-[#121214] transition-colors"
            >
              <Folder className="w-3.5 h-3.5 text-zinc-400" />
              <span>Saved Documents</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenShortcutsModal();
                setActivePopover(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-md text-xs text-left flex items-center gap-2 bg-[#08080a] border border-[#1a1a1e] text-zinc-300 hover:text-white hover:bg-[#121214] transition-colors"
            >
              <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
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
              className="w-full px-2.5 py-1.5 rounded-md text-xs text-left flex items-center gap-2 bg-[#08080a] border border-[#1a1a1e] text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>Reset All to Defaults</span>
            </button>
          </div>
        </div>
      )}

      {/* Sleek Docked Toolbar Bar: Pages | Font | Size | Auto-fit | Format | Align | Vertical Position | Margins | ··· */}
      <div className="flex items-center gap-3 text-xs font-normal text-zinc-400 select-none overflow-x-auto py-1">
        {/* 1. Page Count */}
        <button
          type="button"
          onClick={() => togglePopover('pages')}
          className={`flex items-center gap-1 transition-colors hover:text-white px-2 py-1 rounded-md hover:bg-[#18181c] ${
            activePopover === 'pages' ? 'text-white bg-[#18181c]' : 'text-zinc-300'
          }`}
          title="Number of pages and distribution"
        >
          <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

        <span className="text-zinc-700 font-light">|</span>

        {/* 2. Font Family */}
        <button
          type="button"
          onClick={() => togglePopover('font')}
          className={`flex items-center gap-1.5 transition-colors hover:text-white px-2 py-1 rounded-md hover:bg-[#18181c] ${
            activePopover === 'font' ? 'text-white bg-[#18181c]' : 'text-zinc-300'
          }`}
          title="Choose typography font"
        >
          <span>{typography.fontFamily}</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

        <span className="text-zinc-700 font-light">|</span>

        {/* 3. Font Size */}
        <button
          type="button"
          onClick={() => togglePopover('size')}
          className={`flex items-center gap-1.5 transition-colors hover:text-white px-2 py-1 rounded-md hover:bg-[#18181c] ${
            activePopover === 'size' ? 'text-white bg-[#18181c]' : 'text-zinc-300'
          }`}
          title="Adjust font size, weight and line height"
        >
          <span>{effectiveFontSize}px</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

        {/* 4. Instant Auto-fit Toggle */}
        <button
          type="button"
          onClick={() => onAdvancedChange({ ...advanced, autoFit: !advanced.autoFit })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
            advanced.autoFit
              ? 'bg-white text-black border-white shadow-xs font-semibold'
              : 'bg-[#121216] border-[#222228] text-zinc-400 hover:text-white hover:border-zinc-500'
          }`}
          title={advanced.autoFit ? 'Auto-fit is active (click to use manual size)' : 'Enable Auto-fit to fill pages'}
        >
          <Sparkles className="w-3 h-3" />
          <span>Auto-fit</span>
        </button>

        <span className="text-zinc-700 font-light">|</span>

        {/* 5. Canvas Format / Ratio */}
        <button
          type="button"
          onClick={() => togglePopover('format')}
          className={`flex items-center gap-1.5 transition-colors hover:text-white px-2 py-1 rounded-md hover:bg-[#18181c] ${
            activePopover === 'format' ? 'text-white bg-[#18181c]' : 'text-zinc-300'
          }`}
          title="Change canvas aspect ratio & dimensions"
        >
          <span>{getFormatLabel()}</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

        <span className="text-zinc-700 font-light">|</span>

        {/* 6. Horizontal Alignment Icons */}
        <div className="flex items-center bg-[#121216] p-0.5 rounded-lg border border-[#222228]">
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
                className={`p-1.5 rounded transition-colors ${
                  isActive ? 'bg-white text-black shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
                title={al.label}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        <span className="text-zinc-700 font-light">|</span>

        {/* 7. Vertical Alignment Toggle (Top vs Center - eliminates empty bottom space!) */}
        <div className="flex items-center bg-[#121216] p-0.5 rounded-lg border border-[#222228]">
          <button
            type="button"
            onClick={() => {
              onTypographyChange({ ...typography, verticalAlignment: 'top' });
              onSpacingChange({ ...spacing, verticalAlignment: 'top' });
            }}
            className={`px-2 py-1 text-[11px] rounded transition-colors ${
              !isVerticallyCentered ? 'bg-white text-black font-semibold shadow-xs' : 'text-zinc-400 hover:text-white'
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
            className={`px-2 py-1 text-[11px] rounded transition-colors ${
              isVerticallyCentered ? 'bg-white text-black font-semibold shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
            title="Center text vertically (balances top and bottom empty space)"
          >
            Center
          </button>
        </div>

        <span className="text-zinc-700 font-light">|</span>

        {/* 8. Margins */}
        <button
          type="button"
          onClick={() => togglePopover('margins')}
          className={`flex items-center gap-1.5 transition-colors hover:text-white px-2 py-1 rounded-md hover:bg-[#18181c] ${
            activePopover === 'margins' ? 'text-white bg-[#18181c]' : 'text-zinc-300'
          }`}
          title="Change margins & paragraph spacing"
        >
          <span>{getMarginLabel()} margins</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

        <span className="text-zinc-700 font-light">|</span>

        {/* 9. More (···) */}
        <button
          type="button"
          onClick={() => togglePopover('more')}
          className={`transition-colors hover:text-white text-sm tracking-widest px-2 py-1 rounded-md hover:bg-[#18181c] ${
            activePopover === 'more' ? 'text-white bg-[#18181c]' : 'text-zinc-400'
          }`}
          title="More options (colors, presets, lock layout, reset)"
        >
          ···
        </button>
      </div>
    </div>
  );
};
