'use client';

import React, { useState } from 'react';
import {
  LayoutGrid,
  Square,
  GalleryHorizontal,
  Maximize2,
  AlertTriangle,
  Sparkles,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  CanvasSettings,
  ExportFormat,
  ExportScale,
  PageData,
  PreviewMode,
  SpacingSettings,
  TypographySettings,
} from '../types';
import { PageCard } from './PageCard';

interface PreviewPanelProps {
  pages: PageData[];
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  exportFormat: ExportFormat;
  exportScale: ExportScale;
  projectName: string;
  highlightedPageIndex: number | null;
  onPageHover: (index: number | null) => void;
  onSelectPage: (index: number) => void;
  onOpenFullscreen: (initialIndex: number) => void;
  onTriggerAutoFit: () => void;
  onIncreasePageCount: () => void;
  onDecreaseFontSize: () => void;
  onDecreaseMargins: () => void;
}

type ZoomLevel = 'fit' | 50 | 75 | 100 | 125;

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  pages,
  canvas,
  typography,
  spacing,
  exportFormat,
  exportScale,
  projectName,
  highlightedPageIndex,
  onPageHover,
  onSelectPage,
  onOpenFullscreen,
  onTriggerAutoFit,
  onIncreasePageCount,
  onDecreaseFontSize,
  onDecreaseMargins,
}) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('grid');
  const [zoom, setZoom] = useState<ZoomLevel>('fit');
  const [singlePageIndex, setSinglePageIndex] = useState(0);

  // Check if any page is overflowing
  const overflowingPages = pages.filter((p) => p.isOverflowing);
  const firstOverflow = overflowingPages[0];

  const getZoomScale = (): number => {
    switch (zoom) {
      case 50:
        return 0.5;
      case 75:
        return 0.75;
      case 100:
        return 1.0;
      case 125:
        return 1.25;
      case 'fit':
      default:
        return 1.0;
    }
  };

  const getGridColsClass = () => {
    if (previewMode === 'single') return 'grid-cols-1 max-w-xl mx-auto';
    if (pages.length === 1) return 'grid-cols-1 max-w-xl mx-auto';
    if (pages.length === 2) return 'grid-cols-1 md:grid-cols-2';
    if (pages.length <= 4) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
  };

  return (
    <div className="flex flex-col h-full bg-[#111113] overflow-hidden select-none">
      {/* Top Preview Toolbar */}
      <div className="h-12 border-b border-zinc-800 bg-zinc-950/60 px-4 flex items-center justify-between gap-2 shrink-0">
        {/* View mode switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5">
          <button
            type="button"
            onClick={() => setPreviewMode('grid')}
            className={`p-1.5 rounded flex items-center gap-1 text-xs transition-colors ${
              previewMode === 'grid'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewMode('single')}
            className={`p-1.5 rounded flex items-center gap-1 text-xs transition-colors ${
              previewMode === 'single'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Single page view"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Single</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewMode('carousel')}
            className={`p-1.5 rounded flex items-center gap-1 text-xs transition-colors ${
              previewMode === 'carousel'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Carousel view"
          >
            <GalleryHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Carousel</span>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded text-xs">
            {(['fit', 50, 75, 100, 125] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                className={`px-2 py-1 transition-colors ${
                  zoom === z
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {typeof z === 'number' ? `${z}%` : 'Fit'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onOpenFullscreen(0)}
            className="p-1.5 rounded text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            title="Fullscreen Preview (Cmd/Ctrl+Shift+P)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Overflow Warning Banner */}
      {firstOverflow && (
        <div className="bg-red-950/40 border-b border-red-900/60 p-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Page {firstOverflow.pageIndex + 1} overflows by approximately{' '}
              <strong className="font-mono text-red-100">{Math.round(firstOverflow.overflowPx)}px</strong>.
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={onTriggerAutoFit}
              className="flex items-center gap-1 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-700/60 px-2 py-1 rounded transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Auto-fit</span>
            </button>
            <button
              type="button"
              onClick={onIncreasePageCount}
              className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>+1 Page</span>
            </button>
            <button
              type="button"
              onClick={onDecreaseFontSize}
              className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded transition-colors"
            >
              <Minus className="w-3 h-3" />
              <span>-2px Font</span>
            </button>
            <button
              type="button"
              onClick={onDecreaseMargins}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded transition-colors"
            >
              Reduce Margins
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
        {previewMode === 'single' ? (
          /* Single Page View */
          <div className="w-full max-w-xl flex flex-col items-center space-y-3 my-auto">
            {pages.length > 1 && (
              <div className="flex items-center justify-between w-full text-xs text-zinc-400 select-none">
                <button
                  type="button"
                  disabled={singlePageIndex === 0}
                  onClick={() => setSinglePageIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span>
                  Page {singlePageIndex + 1} of {pages.length}
                </span>
                <button
                  type="button"
                  disabled={singlePageIndex === pages.length - 1}
                  onClick={() => setSinglePageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                  className="flex items-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 disabled:opacity-30"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div
              className="w-full transition-transform origin-top"
              style={{
                transform: zoom !== 'fit' ? `scale(${getZoomScale()})` : undefined,
              }}
            >
              {pages[singlePageIndex] && (
                <PageCard
                  page={pages[singlePageIndex]}
                  totalPages={pages.length}
                  canvas={canvas}
                  typography={typography}
                  spacing={spacing}
                  exportFormat={exportFormat}
                  exportScale={exportScale}
                  projectName={projectName}
                  isHovered={highlightedPageIndex === singlePageIndex}
                  onHover={(hov) => onPageHover(hov ? singlePageIndex : null)}
                  onClick={() => onSelectPage(singlePageIndex)}
                  onEnlarge={() => onOpenFullscreen(singlePageIndex)}
                />
              )}
            </div>
          </div>
        ) : previewMode === 'carousel' ? (
          /* Carousel View */
          <div className="w-full flex-1 flex items-center overflow-x-auto py-4 px-2 space-x-6">
            {pages.map((p, idx) => (
              <div
                key={idx}
                className="w-80 shrink-0 transition-transform"
                style={{
                  transform: zoom !== 'fit' ? `scale(${getZoomScale()})` : undefined,
                }}
              >
                <PageCard
                  page={p}
                  totalPages={pages.length}
                  canvas={canvas}
                  typography={typography}
                  spacing={spacing}
                  exportFormat={exportFormat}
                  exportScale={exportScale}
                  projectName={projectName}
                  isHovered={highlightedPageIndex === idx}
                  onHover={(hov) => onPageHover(hov ? idx : null)}
                  onClick={() => onSelectPage(idx)}
                  onEnlarge={() => onOpenFullscreen(idx)}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Responsive Grid View */
          <div
            className={`w-full grid ${getGridColsClass()} gap-6 transition-transform origin-top`}
            style={{
              transform: zoom !== 'fit' ? `scale(${getZoomScale()})` : undefined,
            }}
          >
            {pages.map((p, idx) => (
              <PageCard
                key={idx}
                page={p}
                totalPages={pages.length}
                canvas={canvas}
                typography={typography}
                spacing={spacing}
                exportFormat={exportFormat}
                exportScale={exportScale}
                projectName={projectName}
                isHovered={highlightedPageIndex === idx}
                onHover={(hov) => onPageHover(hov ? idx : null)}
                onClick={() => onSelectPage(idx)}
                onEnlarge={() => onOpenFullscreen(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
