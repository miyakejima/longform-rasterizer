'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { getPageCanvasDimensions } from '../engine/canvasRenderer';

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
  isEditorCollapsed?: boolean;
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
  isEditorCollapsed = false,
}) => {
  const overflowingPages = pages.filter((p) => p.isOverflowing);
  const hasOverflow = overflowingPages.length > 0;

  const [internalSingleIndex, setInternalSingleIndex] = useState(0);

  // Compute effective single page index without needing an effect
  const effectiveSingleIndex =
    highlightedPageIndex !== null && highlightedPageIndex >= 0 && highlightedPageIndex < pages.length
      ? highlightedPageIndex
      : Math.min(Math.max(0, internalSingleIndex), Math.max(0, pages.length - 1));

  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  const scrollCarouselTo = useCallback((index: number) => {
    const container = carouselContainerRef.current;
    if (!container) return;
    const targetChild = container.children[index] as HTMLElement | undefined;
    if (targetChild) {
      const containerWidth = container.clientWidth;
      const childLeft = targetChild.offsetLeft;
      const childWidth = targetChild.clientWidth;
      const targetScroll = childLeft - (containerWidth - childWidth) / 2;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    setActiveCarouselIndex(index);
    onSelectPage(index);
  }, [onSelectPage]);

  const handleCarouselScroll = () => {
    const container = carouselContainerRef.current;
    if (!container || pages.length === 0) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }
    if (closestIndex !== activeCarouselIndex && closestIndex < pages.length) {
      setActiveCarouselIndex(closestIndex);
    }
  };

  // Keyboard navigation for single and carousel modes
  useEffect(() => {
    if (previewMode !== 'single' && previewMode !== 'carousel') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (previewMode === 'single') {
          setInternalSingleIndex((prev) => Math.max(0, prev - 1));
        } else {
          scrollCarouselTo(Math.max(0, activeCarouselIndex - 1));
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (previewMode === 'single') {
          setInternalSingleIndex((prev) => Math.min(pages.length - 1, prev + 1));
        } else {
          scrollCarouselTo(Math.min(pages.length - 1, activeCarouselIndex + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMode, pages.length, activeCarouselIndex, scrollCarouselTo]);

  // Grid column class matching large card display (adapts dynamically to collapsed studio space)
  const getGridCols = () => {
    if (isEditorCollapsed) {
      if (pages.length === 1) return 'grid-cols-1 max-w-xl';
      if (pages.length === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl xl:max-w-6xl';
      if (pages.length === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl xl:max-w-7xl';
      if (pages.length === 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl xl:max-w-6xl 2xl:max-w-7xl';
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl 2xl:max-w-[1700px]';
    }
    if (pages.length === 1) return 'grid-cols-1 max-w-md';
    return 'grid-cols-1 xl:grid-cols-2 max-w-4xl';
  };

  const activeSinglePage = pages[effectiveSingleIndex] ?? pages[0];

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#09090b] ${
        previewMode === 'single' || previewMode === 'carousel'
          ? 'p-4 justify-between items-center overflow-hidden'
          : isEditorCollapsed ? 'overflow-y-auto p-6 md:p-8 lg:p-12' : 'overflow-y-auto p-6 md:p-8'
      } relative`}
    >
      {/* Text Overflow Warning Banner */}
      {hasOverflow && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-200 flex items-center justify-between text-xs max-w-4xl w-full shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              {overflowingPages.length === 1
                ? `Page ${overflowingPages[0].pageIndex + 1} overflows by ~${Math.round(
                    overflowingPages[0].overflowPx
                  )}px.`
                : `${overflowingPages.length} pages overflow canvas bounds.`}
            </span>
          </div>
          <button
            type="button"
            onClick={onTriggerAutoFit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium transition-colors text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-fit Text
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

              <span className="text-xs font-mono font-medium text-zinc-300 tracking-wide">
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

          {(() => {
            const effectiveTypo = activeSinglePage.typography ?? typography;
            const singleDims = getPageCanvasDimensions(
              activeSinglePage.pageIndex,
              pages.length,
              activeSinglePage.renderedHeight,
              canvas,
              spacing,
              effectiveTypo
            );
            return (
              <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2">
                <div
                  className="max-h-full max-w-full relative flex items-center justify-center"
                  style={{
                    aspectRatio: `${singleDims.width} / ${singleDims.height}`,
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
            );
          })()}
        </div>
      )}

      {/* Mode 2: Horizontal Carousel with Streamlined Unified Navigation */}
      {previewMode === 'carousel' && (
        <div className="flex-1 min-h-0 w-full relative flex flex-col items-center justify-center overflow-hidden">
          {/* Carousel Scroll Track: Multi-card preview with smooth scroll snap */}
          <div
            ref={carouselContainerRef}
            onScroll={handleCarouselScroll}
            className="flex-1 min-h-0 w-full flex items-center overflow-x-auto snap-x snap-mandatory py-4 gap-6 sm:gap-8 scroll-smooth no-scrollbar"
            style={{
              paddingLeft: 'max(48px, calc(50% - 220px))',
              paddingRight: 'max(48px, calc(50% - 220px))',
            }}
          >
            {pages.map((page, idx) => {
              const effectiveTypo = page.typography ?? typography;
              const cardDims = getPageCanvasDimensions(
                page.pageIndex,
                pages.length,
                page.renderedHeight,
                canvas,
                spacing,
                effectiveTypo
              );
              const isActive = activeCarouselIndex === idx;
              return (
                <div
                  key={`preview-carousel-${page.pageIndex}`}
                  className={`h-full ${
                    isEditorCollapsed ? 'max-h-[80vh]' : 'max-h-[70vh]'
                  } min-h-[280px] shrink-0 flex flex-col items-center justify-center snap-center transition-all duration-300 ${
                    isActive
                      ? 'opacity-100 scale-100 z-10'
                      : 'opacity-40 hover:opacity-75 scale-[0.96] cursor-pointer'
                  }`}
                  style={{ aspectRatio: `${cardDims.width} / ${cardDims.height}` }}
                  onClick={() => {
                    if (!isActive) {
                      scrollCarouselTo(idx);
                    }
                  }}
                >
                  <div className="w-full h-full relative flex items-center justify-center">
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
                      onClick={() => {
                        onSelectPage(idx);
                        scrollCarouselTo(idx);
                      }}
                      onEnlarge={() => onOpenFullscreen(idx)}
                      allowClippedExport={allowClippedExport}
                      onBlockedExport={onBlockedExport}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 mt-2 shrink-0 select-none tracking-wide">
                    Page {page.pageIndex + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Streamlined Unified Navigation Pill Bar */}
          {pages.length > 1 && (
            <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/90 dark:bg-[#0c0c0e]/90 border border-zinc-200 dark:border-[#1b1b22] text-zinc-700 dark:text-zinc-300 backdrop-blur-md shrink-0 shadow-md mt-2 select-none">
              <button
                type="button"
                disabled={activeCarouselIndex === 0}
                onClick={() => scrollCarouselTo(Math.max(0, activeCarouselIndex - 1))}
                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-[#16161c] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Previous page (Arrow Left)"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[11px] font-mono font-medium px-1.5 min-w-[54px] text-center">
                {activeCarouselIndex + 1} / {pages.length}
              </span>

              <div className="w-px h-3 bg-zinc-200 dark:bg-[#18181f]" />

              <div className="flex items-center gap-1.5 px-1">
                {pages.map((p, idx) => (
                  <button
                    key={`dot-${p.pageIndex}`}
                    type="button"
                    onClick={() => scrollCarouselTo(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer focus-visible:outline-hidden ${
                      activeCarouselIndex === idx
                        ? 'w-5 bg-zinc-800 dark:bg-zinc-200'
                        : 'w-1.5 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400'
                    }`}
                    title={`Go to page ${idx + 1}`}
                    aria-label={`Go to page ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="w-px h-3 bg-zinc-200 dark:bg-[#18181f]" />

              <button
                type="button"
                disabled={activeCarouselIndex >= pages.length - 1}
                onClick={() => scrollCarouselTo(Math.min(pages.length - 1, activeCarouselIndex + 1))}
                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-[#16161c] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Next page (Arrow Right)"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
              <span className="text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 select-none tracking-wide">
                Page {page.pageIndex + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
