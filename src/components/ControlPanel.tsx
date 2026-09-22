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
  VerticalAlignment,
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

  // Buffered custom pixel dimensions to prevent freezing during typing
  const [prevCanvas, setPrevCanvas] = useState({ width: canvas.width, height: canvas.height });
  const [customWidth, setCustomWidth] = useState<string>(canvas.width.toString());
  const [customHeight, setCustomHeight] = useState<string>(canvas.height.toString());

  if (prevCanvas.width !== canvas.width || prevCanvas.height !== canvas.height) {
    setPrevCanvas({ width: canvas.width, height: canvas.height });
    setCustomWidth(canvas.width.toString());
    setCustomHeight(canvas.height.toString());
  }

  const commitCustomDimensions = (newWStr?: string, newHStr?: string) => {
    const rawW = parseInt(newWStr ?? customWidth, 10);
    const rawH = parseInt(newHStr ?? customHeight, 10);
    const w = isNaN(rawW) ? canvas.width : Math.max(200, Math.min(10000, rawW));
    const h = isNaN(rawH) ? canvas.height : Math.max(200, Math.min(10000, rawH));
    setCustomWidth(w.toString());
    setCustomHeight(h.toString());
    if (w !== canvas.width || h !== canvas.height || canvas.preset !== 'custom') {
      onCanvasChange({
        ...canvas,
        preset: 'custom',
        width: w,
        height: h,
      });
    }
  };

  // Collapsible secondary sections - default collapsed for clean, restrained interface
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    spacing: false,
    canvasColors: false,
    typographyDetails: false,
    distribution: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
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
      case 'twitter':
        width = 1080;
        height = 1350;
        break;
      case 'square':
        width = 1080;
        height = 1080;
        break;
      case 'portrait':
        width = 1080;
        height = 1440;
        break;
      case 'story':
        width = 1080;
        height = 1920;
        break;
      case 'landscape':
        width = 1600;
        height = 900;
        break;
    }
    onCanvasChange({ ...canvas, preset, width, height });
  };

  const handleMarginPresetChange = (preset: MarginPreset) => {
    let pad = spacing.paddingTop;
    switch (preset) {
      case 'compact':
        pad = 60;
        break;
      case 'balanced':
        pad = 96;
        break;
      case 'generous':
        pad = 140;
        break;
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

  const currentVerticalAlignment: VerticalAlignment =
    typography.verticalAlignment ?? spacing.verticalAlignment ?? 'top';

  const handleVerticalAlignmentChange = (vAlign: VerticalAlignment) => {
    onTypographyChange({ ...typography, verticalAlignment: vAlign });
    if (vAlign === 'center') {
      onSpacingChange({ ...spacing, verticalAlignment: vAlign, minBottomSpace: 0 });
    } else {
      onSpacingChange({ ...spacing, verticalAlignment: vAlign });
    }
  };

  const fontOptions = [
    'Inter',
    'Dudu Calligraphy',
    'HelvetiHand',
    'Caveat',
    'Kalam',
    'Patrick Hand',
    'Shadows Into Light',
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
    <div className="flex flex-col h-full bg-[#0c0c0e] text-zinc-200 text-xs overflow-y-auto select-none divide-y divide-[#1f1f23]">
      {/* Layout Locked Notice */}
      {layoutLocked && (
        <div className="bg-[#141417] border-b border-[#1f1f23] p-2.5 px-4 flex items-center gap-2 text-zinc-300">
          <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <p className="text-[11px] leading-tight">
            Layout is frozen. Content editing and page count remain active.
          </p>
        </div>
      )}

      {/* Auto-fit Warning Alert */}
      {autoFitWarning && (
        <div className="bg-red-950/30 border-b border-red-900/50 p-2.5 px-4 flex items-center gap-2 text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
          <p className="text-[11px] leading-tight">{autoFitWarning}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. PRIMARY ESSENTIALS (Streamlined, Front-and-Center)         */}
      {/* ============================================================ */}
      <div className="p-4 space-y-4">
        {/* Number of Images (Pages) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Images
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500 font-mono">Custom:</span>
              <input
                type="number"
                min="1"
                max="32"
                value={pageCount}
                onChange={(e) => onPageCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-11 bg-[#141417] border border-[#27272a] rounded px-1.5 py-0.5 text-right font-mono text-zinc-100 outline-none focus:border-zinc-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-8 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onPageCountChange(n)}
                className={`py-1.5 rounded text-xs font-mono transition-all ${
                  pageCount === n
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'bg-[#141417] border border-[#1f1f23] text-zinc-400 hover:text-zinc-100 hover:border-[#27272a]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Format Presets */}
        <div className={layoutLocked ? 'opacity-50 pointer-events-none' : ''}>
          <label className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider block mb-1.5">
            Format
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'twitter', label: 'X Portrait', dims: '1080×1350' },
                { id: 'square', label: 'Square', dims: '1080×1080' },
                { id: 'story', label: 'Story', dims: '1080×1920' },
                { id: 'landscape', label: 'Landscape', dims: '1600×900' },
                { id: 'portrait', label: 'Portrait 3:4', dims: '1080×1440' },
                { id: 'custom', label: 'Custom', dims: `${canvas.width}×${canvas.height}` },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleCanvasPresetChange(p.id)}
                className={`py-1.5 px-2 rounded-md text-left border transition-all ${
                  canvas.preset === p.id
                    ? 'bg-[#222228] text-white border-[#38383e] font-medium shadow-xs'
                    : 'bg-[#141417] border-[#1f1f23] text-zinc-400 hover:text-zinc-200 hover:border-[#27272a]'
                }`}
              >
                <div className="text-[11px] font-medium leading-tight truncate">{p.label}</div>
                <div className="text-[9px] text-zinc-500 font-mono">{p.dims}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Typography & Sizing */}
        <div className={`space-y-3 ${layoutLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-400" />
                Font & Size
              </label>

              {/* Auto-fit toggle with clean auto-calculated size indicator */}
              <button
                type="button"
                onClick={() => onAdvancedChange({ ...advanced, autoFit: !advanced.autoFit })}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors border ${
                  advanced.autoFit
                    ? 'bg-[#222228] border-zinc-600 text-white font-medium'
                    : 'bg-[#141417] border-[#1f1f23] text-zinc-400 hover:text-zinc-200 hover:border-[#27272a]'
                }`}
                title="Automatically calculate the optimal font size to balance text across images"
              >
                <Sparkles className="w-3 h-3 text-zinc-300" />
                <span>Auto-fit</span>
                {advanced.autoFit && (
                  <span className="ml-1 text-[10px] font-mono text-zinc-300 bg-[#27272a] px-1 rounded">
                    {typography.fontSize}px
                  </span>
                )}
              </button>
            </div>

            {/* Quick Font Picker */}
            <select
              value={typography.fontFamily}
              onChange={(e) => onTypographyChange({ ...typography, fontFamily: e.target.value })}
              className="w-full bg-[#141417] border border-[#1f1f23] hover:border-[#27272a] rounded-md px-2.5 py-1.5 text-zinc-100 outline-none focus:border-zinc-500 mb-2 font-sans text-xs"
            >
              {fontOptions.map((f) => (
                <option key={f} value={f} className="bg-[#141417] text-zinc-100">
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight in Compact Single-Row Control */}
          <div className="grid grid-cols-2 gap-2">
            {!advanced.autoFit ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 text-[11px]">Font Size</label>
                  <span className="font-mono text-zinc-200 text-xs">{typography.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="96"
                  value={typography.fontSize}
                  onChange={(e) =>
                    onTypographyChange({ ...typography, fontSize: parseInt(e.target.value) })
                  }
                  className="w-full accent-white cursor-pointer mt-1"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 text-[11px]">Font Size</label>
                  <span className="font-mono text-zinc-400 text-[10px]">Auto</span>
                </div>
                <div className="py-1 px-2.5 bg-[#141417] border border-[#1f1f23] rounded-md text-center text-xs font-mono text-zinc-200">
                  {typography.fontSize}px
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 text-[11px]">Weight</label>
                <span className="font-mono text-zinc-400 text-[10px]">{typography.fontWeight}</span>
              </div>
              <div className="grid grid-cols-5 gap-0.5 bg-[#141417] p-0.5 rounded-md border border-[#1f1f23] font-mono text-[10px]">
                {([300, 400, 500, 600, 700] as FontWeight[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onTypographyChange({ ...typography, fontWeight: w })}
                    className={`py-1 rounded text-center transition-all ${
                      typography.fontWeight === w
                        ? 'bg-[#222228] text-white font-bold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alignment Controls (Horizontal + Vertical) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Horizontal Text Alignment */}
            <div>
              <label className="text-zinc-400 block mb-1 text-[11px]">Text Align</label>
              <div className="grid grid-cols-4 gap-0.5 bg-[#141417] p-0.5 rounded-md border border-[#1f1f23]">
                {(
                  [
                    { id: 'left', icon: AlignLeft, title: 'Left align' },
                    { id: 'center', icon: AlignCenter, title: 'Center align' },
                    { id: 'right', icon: AlignRight, title: 'Right align' },
                    { id: 'justify', icon: AlignJustify, title: 'Justify' },
                  ] as const
                ).map(({ id, icon: Icon, title }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      onTypographyChange({ ...typography, alignment: id as TextAlignment })
                    }
                    className={`py-1 rounded flex items-center justify-center transition-all ${
                      typography.alignment === id
                        ? 'bg-[#222228] text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={title}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Alignment (Solves the Space Below issue) */}
            <div>
              <label className="text-zinc-400 block mb-1 text-[11px]">Vertical</label>
              <div className="grid grid-cols-2 gap-0.5 bg-[#141417] p-0.5 rounded-md border border-[#1f1f23]">
                <button
                  type="button"
                  onClick={() => handleVerticalAlignmentChange('top')}
                  className={`py-1 px-2 rounded text-center text-[11px] font-medium transition-all ${
                    currentVerticalAlignment === 'top'
                      ? 'bg-[#222228] text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Align text to top padding (standard top flow)"
                >
                  Top
                </button>
                <button
                  type="button"
                  onClick={() => handleVerticalAlignmentChange('center')}
                  className={`py-1 px-2 rounded text-center text-[11px] font-medium transition-all ${
                    currentVerticalAlignment === 'center'
                      ? 'bg-[#222228] text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Center text vertically on canvas (makes top & bottom margins equal)"
                >
                  Center
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Export Actions */}
        <div className="pt-2 border-t border-[#1f1f23] space-y-2">
          {/* Quick Resolution & Format */}
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1 bg-[#141417] border border-[#1f1f23] rounded p-0.5">
              {([1, 2, 3] as ExportScale[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => onExportScaleChange(sc)}
                  className={`px-2 py-0.5 rounded font-mono transition-colors ${
                    exportScale === sc
                      ? 'bg-[#222228] text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sc}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#141417] border border-[#1f1f23] rounded p-0.5 font-mono uppercase">
              {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onExportFormatChange(fmt)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    exportFormat === fmt
                      ? 'bg-[#222228] text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {hasOverflow && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>One or more pages overflow. Text-safe export will block clipped images.</span>
            </div>
          )}

          {/* Export Buttons */}
          <button
            type="button"
            onClick={onExportAll}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold py-2 rounded-lg transition-colors shadow-xs disabled:opacity-50 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export All Images'}</span>
          </button>

          <button
            type="button"
            onClick={onExportZip}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 bg-[#141417] hover:bg-[#1a1a1e] text-zinc-200 border border-[#1f1f23] hover:border-[#27272a] py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>Download All as ZIP</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. COLLAPSIBLE SECONDARY SECTIONS (Clean & Restrained)       */}
      {/* ============================================================ */}

      {/* Accordion 1: Spacing & Breathing Room */}
      <div className={`p-4 space-y-3 ${layoutLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div
          className="flex items-center justify-between cursor-pointer py-0.5 text-zinc-300 hover:text-white transition-colors"
          onClick={() => toggleSection('spacing')}
        >
          <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Spacing & Margins
          </span>
          {openSections.spacing ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>

        {openSections.spacing && (
          <div className="space-y-3 pt-1">
            {/* Margin Presets */}
            <div className="flex items-center justify-between gap-1">
              <div className="grid grid-cols-3 gap-1 flex-1">
                {(['compact', 'balanced', 'generous'] as MarginPreset[]).map((mp) => (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => handleMarginPresetChange(mp)}
                    className={`py-1 px-1 rounded text-center capitalize border text-[11px] transition-all ${
                      spacing.preset === mp
                        ? 'bg-[#222228] text-white border-zinc-600 font-medium'
                        : 'bg-[#141417] border-[#1f1f23] text-zinc-400 hover:text-zinc-200 hover:border-[#27272a]'
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
                    ? 'bg-[#222228] border-zinc-600 text-white'
                    : 'bg-[#141417] border-[#1f1f23] text-zinc-500 hover:text-zinc-300'
                }`}
                title={spacing.linked ? 'Margins linked' : 'Margins unlinked'}
              >
                {spacing.linked ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Individual Padding Inputs */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Top</label>
                <input
                  type="number"
                  value={spacing.paddingTop}
                  onChange={(e) => handlePaddingChange('paddingTop', parseInt(e.target.value) || 0)}
                  className="w-full bg-[#141417] border border-[#1f1f23] rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Right</label>
                <input
                  type="number"
                  value={spacing.paddingRight}
                  onChange={(e) =>
                    handlePaddingChange('paddingRight', parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-[#141417] border border-[#1f1f23] rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Bottom</label>
                <input
                  type="number"
                  value={spacing.paddingBottom}
                  onChange={(e) =>
                    handlePaddingChange('paddingBottom', parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-[#141417] border border-[#1f1f23] rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Left</label>
                <input
                  type="number"
                  value={spacing.paddingLeft}
                  onChange={(e) =>
                    handlePaddingChange('paddingLeft', parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-[#141417] border border-[#1f1f23] rounded py-1 px-1 text-center font-mono text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            {/* Bottom Breathing Space (Supports 0px for exact symmetry) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 text-[11px]">Min Bottom Space</label>
                <span className="font-mono text-zinc-300 text-[11px]">{spacing.minBottomSpace}px</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 48, 72, 96].map((spaceVal) => (
                  <button
                    key={spaceVal}
                    type="button"
                    onClick={() => onSpacingChange({ ...spacing, minBottomSpace: spaceVal })}
                    className={`py-1 rounded font-mono text-center border text-[11px] transition-colors ${
                      spacing.minBottomSpace === spaceVal
                        ? 'bg-[#222228] text-white border-zinc-600 font-medium'
                        : 'bg-[#141417] border-[#1f1f23] text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={
                      spaceVal === 0
                        ? '0px: Bottom margin matches top margin exactly'
                        : `${spaceVal}px bottom breathing space`
                    }
                  >
                    {spaceVal}px
                  </button>
                ))}
              </div>
            </div>

            {/* Paragraph Spacing */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 text-[11px]">Paragraph Gap</label>
                <span className="font-mono text-zinc-300 text-[11px]">
                  {spacing.paragraphSpacing}px
                </span>
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
          </div>
        )}
      </div>

      {/* Accordion 2: Canvas Colors & Dimensions */}
      <div className={`p-4 space-y-3 ${layoutLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div
          className="flex items-center justify-between cursor-pointer py-0.5 text-zinc-300 hover:text-white transition-colors"
          onClick={() => toggleSection('canvasColors')}
        >
          <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5" />
            Colors & Dimensions
          </span>
          {openSections.canvasColors ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>

        {openSections.canvasColors && (
          <div className="space-y-3 pt-1">
            {/* Color swatches */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 block mb-1 text-[11px]">Background</label>
                <div className="flex items-center gap-1.5 bg-[#141417] border border-[#1f1f23] rounded p-1">
                  <input
                    type="color"
                    value={canvas.backgroundColor}
                    onChange={(e) =>
                      onCanvasChange({ ...canvas, backgroundColor: e.target.value })
                    }
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
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
                <label className="text-zinc-400 block mb-1 text-[11px]">Text Color</label>
                <div className="flex items-center gap-1.5 bg-[#141417] border border-[#1f1f23] rounded p-1">
                  <input
                    type="color"
                    value={typography.textColor}
                    onChange={(e) =>
                      onTypographyChange({ ...typography, textColor: e.target.value })
                    }
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
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

            {/* Transparent background toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400 text-[11px]">Transparent Background</span>
              <input
                type="checkbox"
                checked={canvas.transparentBackground}
                onChange={(e) =>
                  onCanvasChange({ ...canvas, transparentBackground: e.target.checked })
                }
                className="accent-white cursor-pointer w-4 h-4"
              />
            </div>

            {/* Custom Pixel Dimensions */}
            <div className="pt-2 border-t border-[#1f1f23]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Custom Dimensions</span>
                <span className="text-zinc-600 text-[10px] font-mono">200–10000 px</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-[#141417] border border-[#1f1f23] focus-within:border-zinc-500 rounded px-2 py-1 transition-colors">
                  <span className="text-[10px] font-mono text-zinc-500 select-none mr-1.5 font-medium">W</span>
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
                <div className="flex items-center bg-[#141417] border border-[#1f1f23] focus-within:border-zinc-500 rounded px-2 py-1 transition-colors">
                  <span className="text-[10px] font-mono text-zinc-500 select-none mr-1.5 font-medium">H</span>
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
          </div>
        )}
      </div>

      {/* Accordion 3: Typography Details & Custom Fonts */}
      <div className={`p-4 space-y-3 ${layoutLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div
          className="flex items-center justify-between cursor-pointer py-0.5 text-zinc-300 hover:text-white transition-colors"
          onClick={() => toggleSection('typographyDetails')}
        >
          <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            Typography Details & Fonts
          </span>
          {openSections.typographyDetails ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>

        {openSections.typographyDetails && (
          <div className="space-y-3 pt-1">
            {/* Line Height & Tracking in compact single row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 text-[11px]">Line Height</label>
                  <span className="font-mono text-zinc-300 text-[11px]">
                    {typography.lineHeight.toFixed(2)}
                  </span>
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
                  <label className="text-zinc-400 text-[11px]">Tracking</label>
                  <span className="font-mono text-zinc-300 text-[11px]">
                    {typography.letterSpacing}px
                  </span>
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

            {/* Custom Font Upload */}
            <div className="pt-1">
              <input
                ref={fontFileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                className="hidden"
                onChange={handleCustomFontUpload}
              />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && /\.(ttf|otf|woff|woff2)$/i.test(file.name)) {
                    setFontLoadingError(null);
                    const result = await loadCustomFont(file);
                    if (result.success && result.fontFamily) {
                      onAddCustomFont(result.fontFamily);
                      onTypographyChange({ ...typography, fontFamily: result.fontFamily });
                    } else {
                      setFontLoadingError(result.error || 'Failed to load font');
                    }
                  } else if (file) {
                    setFontLoadingError(
                      'Unsupported font format. Provide a .ttf, .otf, .woff, or .woff2 file.'
                    );
                  }
                }}
                onClick={() => fontFileInputRef.current?.click()}
                className="border border-dashed border-[#1f1f23] hover:border-zinc-600 rounded-lg p-2.5 text-center text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3 h-3 text-zinc-400" />
                <span>Upload font (.ttf, .otf, .woff, .woff2)</span>
              </div>
              {fontLoadingError && (
                <p className="text-[10px] text-red-400 mt-1">{fontLoadingError}</p>
              )}
            </div>

            {/* Auto-fit Bounds (only when Auto-fit is enabled) */}
            {advanced.autoFit && (
              <div className="bg-[#141417] border border-[#1f1f23] rounded-lg p-2.5 space-y-2">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Auto-fit Bounds
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-500 text-[10px]">Min Size</label>
                      <span className="font-mono text-zinc-300 text-[10px]">
                        {advanced.minFontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="40"
                      value={advanced.minFontSize}
                      onChange={(e) =>
                        onAdvancedChange({
                          ...advanced,
                          minFontSize: Math.min(parseInt(e.target.value), advanced.maxFontSize),
                        })
                      }
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-500 text-[10px]">Max Size</label>
                      <span className="font-mono text-zinc-300 text-[10px]">
                        {advanced.maxFontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="120"
                      value={advanced.maxFontSize}
                      onChange={(e) =>
                        onAdvancedChange({
                          ...advanced,
                          maxFontSize: Math.max(parseInt(e.target.value), advanced.minFontSize),
                        })
                      }
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accordion 4: Distribution & Advanced Balancing */}
      <div className="p-4 space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer py-0.5 text-zinc-300 hover:text-white transition-colors"
          onClick={() => toggleSection('distribution')}
        >
          <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Distribution & Balancing
          </span>
          {openSections.distribution ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>

        {openSections.distribution && (
          <div className="space-y-3 pt-1">
            {/* Distribution Mode */}
            <div>
              <label className="text-zinc-400 block mb-1.5 text-[11px]">Distribution Mode</label>
              <div className="grid grid-cols-3 gap-1 bg-[#141417] p-0.5 rounded border border-[#1f1f23]">
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
                        ? 'bg-[#222228] text-white font-medium shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Density */}
            <div>
              <label className="text-zinc-400 block mb-1.5 text-[11px]">Target Density</label>
              <div className="grid grid-cols-3 gap-1 bg-[#141417] p-0.5 rounded border border-[#1f1f23]">
                {(['airy', 'balanced', 'dense'] as TargetDensity[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onAdvancedChange({ ...advanced, densityTarget: d })}
                    className={`py-1 rounded capitalize text-center transition-all ${
                      advanced.densityTarget === d
                        ? 'bg-[#222228] text-white font-medium shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Balance Strength */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-zinc-400 text-[11px]">Balance Strength</label>
                <span className="font-mono text-zinc-300 capitalize text-[11px]">
                  {advanced.balanceStrength}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-[#141417] p-0.5 rounded border border-[#1f1f23]">
                {(['low', 'medium', 'high'] as BalanceStrength[]).map((bs) => (
                  <button
                    key={bs}
                    type="button"
                    onClick={() => onAdvancedChange({ ...advanced, balanceStrength: bs })}
                    className={`py-1 rounded capitalize text-center transition-all ${
                      advanced.balanceStrength === bs
                        ? 'bg-[#222228] text-white font-medium shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {bs}
                  </button>
                ))}
              </div>
            </div>

            {/* Prevent Orphan Lines */}
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400 text-[11px]">Prevent Orphan Lines</span>
              <input
                type="checkbox"
                checked={advanced.preventOrphanLines}
                onChange={(e) =>
                  onAdvancedChange({ ...advanced, preventOrphanLines: e.target.checked })
                }
                className="accent-white cursor-pointer w-4 h-4"
              />
            </div>

            {/* Allow Clipped Export */}
            <div className="flex items-center justify-between py-1 border-t border-[#1f1f23]">
              <span className="text-zinc-400 text-[11px]">Allow Clipped Export</span>
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
    </div>
  );
};
