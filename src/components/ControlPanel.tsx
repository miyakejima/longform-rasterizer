'use client';

import React, { useRef, useState } from 'react';
import {
  Type,
  Maximize2,
  Sliders,
  Sparkles,
  Lock,
  Layers,
  Link,
  Unlink,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Download,
  FileArchive,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  AdvancedSettings,
  BalanceStrength,
  CanvasPreset,
  CanvasSettings,
  DistributionMode,
  ExportFormat,
  ExportScale,
  FontWeight,
  MarginPreset,
  SpacingSettings,
  TargetDensity,
  TextAlignment,
  TypographySettings,
} from '../types';
import { loadCustomFont } from '../engine/fontLoader';

interface ControlPanelProps {
  pageCount: number;
  onPageCountChange: (count: number) => void;
  distributionMode: DistributionMode;
  onDistributionModeChange: (mode: DistributionMode) => void;
  canvas: CanvasSettings;
  onCanvasChange: (settings: CanvasSettings) => void;
  typography: TypographySettings;
  onTypographyChange: (settings: TypographySettings) => void;
  spacing: SpacingSettings;
  onSpacingChange: (settings: SpacingSettings) => void;
  advanced: AdvancedSettings;
  onAdvancedChange: (settings: AdvancedSettings) => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  exportScale: ExportScale;
  onExportScaleChange: (scale: ExportScale) => void;
  layoutLocked: boolean;
  onExportAll: () => void;
  onExportZip: () => void;
  isExporting: boolean;
  hasOverflow: boolean;
  autoFitWarning?: string;
  customFonts: string[];
  onAddCustomFont: (fontName: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  pageCount,
  onPageCountChange,
  distributionMode,
  onDistributionModeChange,
  canvas,
  onCanvasChange,
  typography,
  onTypographyChange,
  spacing,
  onSpacingChange,
  advanced,
  onAdvancedChange,
  exportFormat,
  onExportFormatChange,
  exportScale,
  onExportScaleChange,
  layoutLocked,
  onExportAll,
  onExportZip,
  isExporting,
  hasOverflow,
  autoFitWarning,
  customFonts,
  onAddCustomFont,
}) => {
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const [fontLoadingError, setFontLoadingError] = useState<string | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pages: true,
    typography: true,
    canvas: true,
    spacing: true,
    advanced: false,
    export: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFontLoadingError(null);
    const result = await loadCustomFont(file);
    if (result.success && result.fontFamily) {
      onAddCustomFont(result.fontFamily);
      onTypographyChange({ ...typography, fontFamily: result.fontFamily });
    } else {
      setFontLoadingError(result.error || 'Failed to load font');
    }
  };

  const handleCanvasPresetChange = (preset: CanvasPreset) => {
    let width = canvas.width;
    let height = canvas.height;
    switch (preset) {
      case 'twitter': width = 1080; height = 1350; break;
      case 'square': width = 1080; height = 1080; break;
      case 'portrait': width = 1080; height = 1440; break;
      case 'story': width = 1080; height = 1920; break;
      case 'landscape': width = 1600; height = 900; break;
    }
    onCanvasChange({ ...canvas, preset, width, height });
  };

  const handleMarginPresetChange = (preset: MarginPreset) => {
    let pad = spacing.paddingTop;
    switch (preset) {
      case 'compact': pad = 60; break;
      case 'balanced': pad = 96; break;
      case 'generous': pad = 140; break;
    }
    onSpacingChange({
      ...spacing,
      preset,
      paddingTop: pad,
      paddingRight: pad,
      paddingBottom: pad,
      paddingLeft: pad,
    });
  };

  const handlePaddingChange = (
    field: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft',
    val: number
  ) => {
    if (spacing.linked) {
      onSpacingChange({
        ...spacing,
        preset: 'custom',
        paddingTop: val,
        paddingRight: val,
        paddingBottom: val,
        paddingLeft: val,
      });
    } else {
      onSpacingChange({
        ...spacing,
        preset: 'custom',
        [field]: val,
      });
    }
  };

  const fontOptions = [
    'Inter',
    'Arial',
    'Helvetica',
    'Roboto',
    'Open Sans',
    'Source Sans 3',
    'IBM Plex Sans',
    'Georgia',
    'Times New Roman',
    'system-ui',
    'serif',
    'monospace',
    ...customFonts,
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 text-xs overflow-y-auto select-none divide-y divide-zinc-800">
      {layoutLocked && (
        <div className="bg-amber-950/30 border-b border-amber-900/40 p-2.5 flex items-center gap-2 text-amber-300">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <p className="text-[11px] leading-tight">
            Design layout is frozen. Text pasting, page count and distribution mode remain active.
          </p>
        </div>
      )}

      {autoFitWarning && (
        <div className="bg-red-950/30 border-b border-red-900/50 p-2.5 flex items-center gap-2 text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
          <p className="text-[11px] leading-tight">{autoFitWarning}</p>
        </div>
      )}

      {/* SECTION 1: Pages & Distribution */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('pages')}>
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            Pages & Distribution
          </span>
          {openSections.pages ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
        </div>

        {openSections.pages && (
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-zinc-400">Number of Images</label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={pageCount}
                  onChange={(e) => onPageCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-right font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-8 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onPageCountChange(n)}
                    className={`py-1 rounded font-mono text-center transition-all ${
                      pageCount === n
                        ? 'bg-white text-black font-semibold shadow-xs'
                        : 'bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1.5">Distribution Mode</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                {(
                  [
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'paragraph-preserving', label: 'Preserve Para' },
                    { id: 'manual', label: 'Manual' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onDistributionModeChange(m.id)}
                    className={`py-1 px-1 rounded text-center truncate transition-all ${
                      distributionMode === m.id
                        ? 'bg-zinc-800 text-white font-medium shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* SECTION 2: Typography */}
      <div className={`p-3.5 space-y-3 ${layoutLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('typography')}>
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Type className="w-3.5 h-3.5 text-zinc-400" />
            Typography
          </span>
          {openSections.typography ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
        </div>

        {openSections.typography && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 p-2 rounded">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-300 font-medium">Auto-fit Font Size</span>
              </div>
              <input
                type="checkbox"
                checked={advanced.autoFit}
                onChange={(e) => onAdvancedChange({ ...advanced, autoFit: e.target.checked })}
                className="accent-white cursor-pointer w-4 h-4"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-zinc-400">Font Family</label>
                <input
                  ref={fontFileInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={handleCustomFontUpload}
                />
                <button
                  type="button"
                  onClick={() => fontFileInputRef.current?.click()}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                  title="Upload font file locally (.ttf, .otf, .woff, .woff2)"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </button>
              </div>

              <select
                value={typography.fontFamily}
                onChange={(e) => onTypographyChange({ ...typography, fontFamily: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 outline-none focus:border-zinc-600"
              >
                {fontOptions.map((f) => (
                  <option key={f} value={f} className="bg-zinc-900">
                    {f}
                  </option>
                ))}
              </select>
              {fontLoadingError && (
                <p className="text-[10px] text-red-400 mt-1">{fontLoadingError}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400">
                  Font Size {advanced.autoFit && <span className="text-amber-400">(Auto)</span>}
                </label>
                <span className="font-mono text-zinc-300">{typography.fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="96"
                value={typography.fontSize}
                disabled={advanced.autoFit}
                onChange={(e) =>
                  onTypographyChange({ ...typography, fontSize: parseInt(e.target.value) })
                }
                className="w-full accent-white cursor-pointer disabled:opacity-40"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1.5">Font Weight</label>
              <div className="grid grid-cols-5 gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 font-mono text-[11px]">
                {([300, 400, 500, 600, 700] as FontWeight[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onTypographyChange({ ...typography, fontWeight: w })}
                    className={`py-1 rounded text-center transition-all ${
                      typography.fontWeight === w
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400">Line Height</label>
                  <span className="font-mono text-zinc-300">{typography.lineHeight.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.05"
                  value={typography.lineHeight}
                  onChange={(e) =>
                    onTypographyChange({ ...typography, lineHeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400">Tracking</label>
                  <span className="font-mono text-zinc-300">{typography.letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="5"
                  step="1"
                  value={typography.letterSpacing}
                  onChange={(e) =>
                    onTypographyChange({ ...typography, letterSpacing: parseInt(e.target.value) })
                  }
                  className="w-full accent-white cursor-pointer"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400">Paragraph Spacing</label>
                <span className="font-mono text-zinc-300">{spacing.paragraphSpacing}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="2"
                value={spacing.paragraphSpacing}
                onChange={(e) =>
                  onSpacingChange({ ...spacing, paragraphSpacing: parseInt(e.target.value) })
                }
                className="w-full accent-white cursor-pointer"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1.5">Text Alignment</label>
              <div className="grid grid-cols-4 gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                {(
                  [
                    { id: 'left', icon: AlignLeft, title: 'Left' },
                    { id: 'center', icon: AlignCenter, title: 'Center' },
                    { id: 'right', icon: AlignRight, title: 'Right' },
                    { id: 'justify', icon: AlignJustify, title: 'Justify' },
                  ] as const
                ).map(({ id, icon: Icon, title }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onTypographyChange({ ...typography, alignment: id as TextAlignment })}
                    className={`py-1.5 rounded flex items-center justify-center transition-all ${
                      typography.alignment === id
                        ? 'bg-zinc-800 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={title}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Canvas & Colors */}
      <div className={`p-3.5 space-y-3 ${layoutLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('canvas')}>
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
            Canvas & Colors
          </span>
          {openSections.canvas ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
        </div>

        {openSections.canvas && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-zinc-400 block mb-1.5">Canvas Preset</label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'twitter', label: 'X Portrait' },
                    { id: 'square', label: 'Square' },
                    { id: 'portrait', label: 'Portrait' },
                    { id: 'story', label: 'Story' },
                    { id: 'landscape', label: 'Landscape' },
                    { id: 'custom', label: 'Custom' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleCanvasPresetChange(p.id)}
                    className={`py-1 px-1 rounded text-center truncate border text-[11px] transition-all ${
                      canvas.preset === p.id
                        ? 'bg-zinc-800 text-white border-zinc-600 font-medium'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-500 block mb-1">Width</label>
                <input
                  type="number"
                  value={canvas.width}
                  onChange={(e) =>
                    onCanvasChange({
                      ...canvas,
                      preset: 'custom',
                      width: Math.max(200, parseInt(e.target.value) || 1080),
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">Height</label>
                <input
                  type="number"
                  value={canvas.height}
                  onChange={(e) =>
                    onCanvasChange({
                      ...canvas,
                      preset: 'custom',
                      height: Math.max(200, parseInt(e.target.value) || 1350),
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 block mb-1">Background</label>
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded p-1">
                  <input
                    type="color"
                    value={canvas.backgroundColor}
                    onChange={(e) =>
                      onCanvasChange({ ...canvas, backgroundColor: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={canvas.backgroundColor}
                    onChange={(e) =>
                      onCanvasChange({ ...canvas, backgroundColor: e.target.value })
                    }
                    className="w-full bg-transparent font-mono text-[11px] text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Text Color</label>
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded p-1">
                  <input
                    type="color"
                    value={typography.textColor}
                    onChange={(e) =>
                      onTypographyChange({ ...typography, textColor: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={typography.textColor}
                    onChange={(e) =>
                      onTypographyChange({ ...typography, textColor: e.target.value })
                    }
                    className="w-full bg-transparent font-mono text-[11px] text-zinc-200 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Transparent Background</span>
              <input
                type="checkbox"
                checked={canvas.transparentBackground}
                onChange={(e) =>
                  onCanvasChange({ ...canvas, transparentBackground: e.target.checked })
                }
                className="accent-white cursor-pointer w-4 h-4"
              />
            </div>
          </div>
        )}
      </div>
      {/* SECTION 4: Margins / Spacing */}
      <div className={`p-3.5 space-y-3 ${layoutLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('spacing')}>
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            Margins & Padding
          </span>
          {openSections.spacing ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
        </div>

        {openSections.spacing && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-1">
              <div className="grid grid-cols-3 gap-1 flex-1">
                {(['compact', 'balanced', 'generous'] as MarginPreset[]).map((mp) => (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => handleMarginPresetChange(mp)}
                    className={`py-1 px-1 rounded text-center capitalize border text-[11px] transition-all ${
                      spacing.preset === mp
                        ? 'bg-zinc-800 text-white border-zinc-600 font-medium'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mp}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onSpacingChange({ ...spacing, linked: !spacing.linked })}
                className={`p-1.5 rounded border transition-colors ${
                  spacing.linked
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
                title={spacing.linked ? 'Margins linked' : 'Margins unlinked'}
              >
                {spacing.linked ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Top</label>
                <input
                  type="number"
                  value={spacing.paddingTop}
                  onChange={(e) => handlePaddingChange('paddingTop', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Right</label>
                <input
                  type="number"
                  value={spacing.paddingRight}
                  onChange={(e) => handlePaddingChange('paddingRight', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Bottom</label>
                <input
                  type="number"
                  value={spacing.paddingBottom}
                  onChange={(e) => handlePaddingChange('paddingBottom', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Left</label>
                <input
                  type="number"
                  value={spacing.paddingLeft}
                  onChange={(e) => handlePaddingChange('paddingLeft', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400">Min Bottom Breathing Space</label>
                <span className="font-mono text-zinc-300">{spacing.minBottomSpace}px</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[48, 72, 96].map((spaceVal) => (
                  <button
                    key={spaceVal}
                    type="button"
                    onClick={() => onSpacingChange({ ...spacing, minBottomSpace: spaceVal })}
                    className={`py-1 rounded font-mono text-center border text-[11px] ${
                      spacing.minBottomSpace === spaceVal
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {spaceVal}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: Advanced Balancing */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('advanced')}>
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Advanced Balancing
          </span>
          {openSections.advanced ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
        </div>

        {openSections.advanced && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-zinc-400 block mb-1.5">Target Page Density</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                {(['airy', 'balanced', 'dense'] as TargetDensity[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onAdvancedChange({ ...advanced, densityTarget: d })}
                    className={`py-1 rounded capitalize text-center transition-all ${
                      advanced.densityTarget === d
                        ? 'bg-zinc-800 text-white font-medium shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-zinc-400">Balance Strength</label>
                <span className="font-mono text-zinc-300 capitalize">{advanced.balanceStrength}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                {(['low', 'medium', 'high'] as BalanceStrength[]).map((bs) => (
                  <button
                    key={bs}
                    type="button"
                    onClick={() => onAdvancedChange({ ...advanced, balanceStrength: bs })}
                    className={`py-1 rounded capitalize text-center transition-all ${
                      advanced.balanceStrength === bs
                        ? 'bg-zinc-800 text-white font-medium shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {bs}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Prevent Orphan Lines</span>
              <input
                type="checkbox"
                checked={advanced.preventOrphanLines}
                onChange={(e) =>
                  onAdvancedChange({ ...advanced, preventOrphanLines: e.target.checked })
                }
                className="accent-white cursor-pointer w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-850">
              <span className="text-zinc-400">Allow Clipped Export</span>
              <input
                type="checkbox"
                checked={advanced.allowClippedExport}
                onChange={(e) =>
                  onAdvancedChange({ ...advanced, allowClippedExport: e.target.checked })
                }
                className="accent-white cursor-pointer w-4 h-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: Export Settings */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('export')}>
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            Export Settings
          </span>
          {openSections.export ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
        </div>

        {openSections.export && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-zinc-400 block mb-1.5">Export Resolution</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 font-mono">
                {([1, 2, 3] as ExportScale[]).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => onExportScaleChange(sc)}
                    className={`py-1 rounded text-center transition-all ${
                      exportScale === sc
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sc}x ({canvas.width * sc}×{canvas.height * sc})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1.5">Image Format</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 uppercase font-mono text-[11px]">
                {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => onExportFormatChange(fmt)}
                    className={`py-1 rounded text-center transition-all ${
                      exportFormat === fmt
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={onExportAll}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-medium py-2 rounded transition-colors shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export All Images'}</span>
              </button>

              <button
                type="button"
                onClick={onExportZip}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-200 py-1.5 rounded transition-colors disabled:opacity-50"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>Download All as ZIP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
