'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  allowClippedExport?: boolean;
  onBlockedExport?: (msg: string) => void;
  previewMode?: PreviewMode;
}

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
  allowClippedExport = false,
  onBlockedExport,
  previewMode = 'grid',
}) => {
  const overflowingPages = pages.filter((p) => p.isOverflowing);
  const hasOverflow = overflowingPages.length > 0;

  const [internalSingleIndex, setInternalSingleIndex] = useState(0);

  // Compute effective single page index without needing an effect
  const effectiveSingleIndex =
    highlightedPageIndex !== null && highlightedPageIndex >= 0 && highlightedPageIndex < pages.length
      ? highlightedPageIndex
      : Math.min(Math.max(0, internalSingleIndex), Math.max(0, pages.length - 1));

  // Keyboard navigation for single mode
  useEffect(() => {
    if (previewMode !== 'single') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setInternalSingleIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setInternalSingleIndex((prev) => Math.min(pages.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMode, pages.length]);

  // Grid column class matching large card display
  const getGridCols = () => {
    if (pages.length === 1) return 'grid-cols-1 max-w-md';
    return 'grid-cols-1 xl:grid-cols-2 max-w-4xl';
  };

  const activeSinglePage = pages[effectiveSingleIndex] ?? pages[0];

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#09090b] ${
        previewMode === 'single' ? 'overflow-hidden p-3 md:p-5' : 'overflow-y-auto p-6 md:p-8'
      } select-none`}
    >
      {/* Overflow Warning Banner (if text doesn't fit) */}
      {hasOverflow && (
        <div className="max-w-4xl mx-auto w-full mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/80 flex items-center justify-between gap-3 text-xs text-red-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Text overflows on {overflowingPages.length} {overflowingPages.length === 1 ? 'page' : 'pages'}.
            </span>
          </div>
          <button
            type="button"
            onClick={onTriggerAutoFit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium transition-colors text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-fit to fix</span>
          </button>
        </div>
      )}

      {/* Mode 1: Single Focused Page View (Scales to fit viewport height with zero scrolling) */}
      {previewMode === 'single' && activeSinglePage && (
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          {pages.length > 1 && (
            <div className="flex items-center justify-between w-full max-w-sm mb-3 shrink-0 select-none">
              <button
                type="button"
                disabled={effectiveSingleIndex === 0}
                onClick={() => {
                  const nextIdx = Math.max(0, effectiveSingleIndex - 1);
                  setInternalSingleIndex(nextIdx);
                  onSelectPage(nextIdx);
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-[#0c0c0e] hover:bg-[#16161c] px-2.5 py-1 rounded-[6px] border border-[#1b1b22] hover:border-[#2e2e3a] disabled:opacity-20 disabled:pointer-events-none transition-colors shadow-xs"
                title="Previous page (Arrow Left)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-xs font-mono text-zinc-400 tracking-wide">
                Page {effectiveSingleIndex + 1} of {pages.length}
              </span>

              <button
                type="button"
                disabled={effectiveSingleIndex >= pages.length - 1}
                onClick={() => {
                  const nextIdx = Math.min(pages.length - 1, effectiveSingleIndex + 1);
                  setInternalSingleIndex(nextIdx);
                  onSelectPage(nextIdx);
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-[#0c0c0e] hover:bg-[#16161c] px-2.5 py-1 rounded-[6px] border border-[#1b1b22] hover:border-[#2e2e3a] disabled:opacity-20 disabled:pointer-events-none transition-colors shadow-xs"
                title="Next page (Arrow Right)"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2">
            <div
              className="max-h-full max-w-full relative flex items-center justify-center"
              style={{
                aspectRatio: `${canvas.width} / ${canvas.height}`,
                height: '100%',
              }}
            >
              <PageCard
                page={activeSinglePage}
                totalPages={pages.length}
                canvas={canvas}
                typography={typography}
                spacing={spacing}
                exportFormat={exportFormat}
                exportScale={exportScale}
                projectName={projectName}
                isHovered={highlightedPageIndex === effectiveSingleIndex}
                onHover={(isHovering) => onPageHover(isHovering ? effectiveSingleIndex : null)}
                onClick={() => onSelectPage(effectiveSingleIndex)}
                onEnlarge={() => onOpenFullscreen(effectiveSingleIndex)}
                allowClippedExport={allowClippedExport}
                onBlockedExport={onBlockedExport}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Horizontal Carousel Swipe Filmstrip */}
      {previewMode === 'carousel' && (
        <div className="flex-1 w-full flex items-center overflow-x-auto no-scrollbar py-6 px-4 gap-6">
          {pages.map((page, idx) => (
            <div
              key={`preview-carousel-${page.pageIndex}`}
              className="w-[320px] sm:w-[360px] md:w-[400px] shrink-0 flex flex-col items-center gap-2"
            >
              <PageCard
                page={page}
                totalPages={pages.length}
                canvas={canvas}
                typography={typography}
                spacing={spacing}
                exportFormat={exportFormat}
                exportScale={exportScale}
                projectName={projectName}
                isHovered={highlightedPageIndex === idx}
                onHover={(isHovering) => onPageHover(isHovering ? idx : null)}
                onClick={() => onSelectPage(idx)}
                onEnlarge={() => onOpenFullscreen(idx)}
                allowClippedExport={allowClippedExport}
                onBlockedExport={onBlockedExport}
              />
              <span className="text-[11px] font-mono text-zinc-500 select-none">
                Page {page.pageIndex + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Mode 3: 2x2 or Responsive Grid of Page Cards (Default) */}
      {previewMode === 'grid' && (
        <div className={`grid ${getGridCols()} gap-6 mx-auto w-full items-start justify-center`}>
          {pages.map((page, idx) => (
            <div key={`preview-page-${page.pageIndex}`} className="flex flex-col items-center gap-2 w-full">
              <PageCard
                page={page}
                totalPages={pages.length}
                canvas={canvas}
                typography={typography}
                spacing={spacing}
                exportFormat={exportFormat}
                exportScale={exportScale}
                projectName={projectName}
                isHovered={highlightedPageIndex === idx}
                onHover={(isHovering) => onPageHover(isHovering ? idx : null)}
                onClick={() => onSelectPage(idx)}
                onEnlarge={() => onOpenFullscreen(idx)}
                allowClippedExport={allowClippedExport}
                onBlockedExport={onBlockedExport}
              />
              <span className="text-[11px] font-mono text-zinc-500 select-none">
                Page {page.pageIndex + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
