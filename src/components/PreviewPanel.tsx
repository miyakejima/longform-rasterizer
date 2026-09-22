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
  highlightedParagraph?: { pageIndex: number; paragraphIndex: number; startIndex: number; endIndex: number } | null;
  onParagraphHover?: (info: { pageIndex: number; paragraphIndex: number; startIndex: number; endIndex: number } | null) => void;
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
  highlightedParagraph = null,
  onParagraphHover,
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
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const activeCarouselIndexRef = useRef(activeCarouselIndex);
  activeCarouselIndexRef.current = activeCarouselIndex;
  const targetScrollLeftRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isWheelingRef = useRef(false);

  // Mouse drag-to-scroll & rubber-banding elasticity state
  const [isDragging, setIsDragging] = useState(false);
  const [overscrollOffset, setOverscrollOffset] = useState(0);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const dragVelocityRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const lastDragXRef = useRef(0);

  const scrollCarouselTo = useCallback((index: number) => {
    const container = carouselContainerRef.current;
    if (!container) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isWheelingRef.current = false;

    const targetChild = container.children[index] as HTMLElement | undefined;
    if (targetChild) {
      const containerWidth = container.clientWidth;
      const childLeft = targetChild.offsetLeft;
      const childWidth = targetChild.clientWidth;
      const targetScroll = Math.max(
        0,
        Math.min(container.scrollWidth - containerWidth, Math.round(childLeft - (containerWidth - childWidth) / 2))
      );

      targetScrollLeftRef.current = targetScroll;

      const startScroll = container.scrollLeft;
      const startTime = performance.now();
      const duration = 280;

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        if (carouselContainerRef.current) {
          carouselContainerRef.current.scrollLeft = startScroll + (targetScroll - startScroll) * ease;
        }
        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(animateScroll);
        } else {
          if (carouselContainerRef.current) {
            carouselContainerRef.current.scrollLeft = targetScroll;
          }
          rafIdRef.current = null;
        }
      };
      rafIdRef.current = requestAnimationFrame(animateScroll);
    }
    setActiveCarouselIndex(index);
    activeCarouselIndexRef.current = index;
    onSelectPage(index);
  }, [onSelectPage]);

  // Buttery-smooth, pure free-scrolling horizontal wheel momentum (RAF lerp)
  useEffect(() => {
    if (previewMode !== 'carousel') return;
    const panel = previewPanelRef.current;
    if (!panel) return;

    const handleWheel = (e: WheelEvent) => {
      const container = carouselContainerRef.current;
      if (!container || pages.length <= 1) return;

      // Allow natural horizontal trackpad swipes without interception
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      e.preventDefault();

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      if (!isWheelingRef.current) {
        targetScrollLeftRef.current = container.scrollLeft;
        isWheelingRef.current = true;
      }

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 33;
      else if (e.deltaMode === 2) delta *= container.clientWidth;

      // Rubber-banding detection on wheel at boundaries
      const rawTarget = targetScrollLeftRef.current + delta * 1.3;
      if (rawTarget < 0) {
        const excess = -rawTarget;
        const rubber = Math.min(48, Math.sqrt(excess) * 3.5);
        setOverscrollOffset(rubber);
        setTimeout(() => setOverscrollOffset(0), 160);
      } else if (rawTarget > maxScroll) {
        const excess = rawTarget - maxScroll;
        const rubber = -Math.min(48, Math.sqrt(excess) * 3.5);
        setOverscrollOffset(rubber);
        setTimeout(() => setOverscrollOffset(0), 160);
      }

      // Natural, buttery speed multiplier (1.3x) - smooth and fully controllable
      targetScrollLeftRef.current = Math.max(
        0,
        Math.min(maxScroll, rawTarget)
      );

      if (rafIdRef.current === null) {
        const step = () => {
          const c = carouselContainerRef.current;
          if (!c) {
            isWheelingRef.current = false;
            rafIdRef.current = null;
            return;
          }

          const current = c.scrollLeft;
          const target = targetScrollLeftRef.current;
          const diff = target - current;

          if (Math.abs(diff) < 0.5) {
            c.scrollLeft = target;
            isWheelingRef.current = false;
            rafIdRef.current = null;
            return;
          }

          c.scrollLeft = current + diff * 0.18;
          rafIdRef.current = requestAnimationFrame(step);
        };
        rafIdRef.current = requestAnimationFrame(step);
      }
    };

    panel.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      panel.removeEventListener('wheel', handleWheel);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      isWheelingRef.current = false;
    };
  }, [previewMode, pages.length]);

  // Drag-to-scroll mouse listener
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const container = carouselContainerRef.current;
    if (!container) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      isWheelingRef.current = false;
    }

    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = container.scrollLeft;
    lastDragXRef.current = e.clientX;
    lastDragTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = carouselContainerRef.current;
      if (!container) return;

      const dx = e.clientX - dragStartXRef.current;
      if (Math.abs(dx) > 4) {
        hasDraggedRef.current = true;
      }

      const now = performance.now();
      const dt = now - lastDragTimeRef.current;
      if (dt > 0) {
        dragVelocityRef.current = (e.clientX - lastDragXRef.current) / dt;
      }
      lastDragXRef.current = e.clientX;
      lastDragTimeRef.current = now;

      const target = dragStartScrollRef.current - dx;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);

      if (target < 0) {
        container.scrollLeft = 0;
        const excess = -target;
        // Apple rubber-band logarithmic/square-root resistance curve
        const rubber = Math.min(72, Math.sqrt(excess) * 4.8);
        setOverscrollOffset(rubber);
      } else if (target > maxScroll) {
        container.scrollLeft = maxScroll;
        const excess = target - maxScroll;
        const rubber = -Math.min(72, Math.sqrt(excess) * 4.8);
        setOverscrollOffset(rubber);
      } else {
        container.scrollLeft = target;
        setOverscrollOffset(0);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setOverscrollOffset(0);
      const container = carouselContainerRef.current;
      if (!container) return;

      let velocity = -dragVelocityRef.current * 18;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      if (Math.abs(velocity) > 1.5) {
        const fling = () => {
          const c = carouselContainerRef.current;
          if (!c || Math.abs(velocity) < 0.5) return;
          const nextScroll = c.scrollLeft + velocity;
          if (nextScroll < 0) {
            c.scrollLeft = 0;
            const bounce = Math.min(32, Math.abs(velocity) * 2.2);
            setOverscrollOffset(bounce);
            setTimeout(() => setOverscrollOffset(0), 120);
            return;
          } else if (nextScroll > maxScroll) {
            c.scrollLeft = maxScroll;
            const bounce = -Math.min(32, Math.abs(velocity) * 2.2);
            setOverscrollOffset(bounce);
            setTimeout(() => setOverscrollOffset(0), 120);
            return;
          }
          c.scrollLeft = nextScroll;
          velocity *= 0.92;
          requestAnimationFrame(fling);
        };
        requestAnimationFrame(fling);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
    if (closestIndex !== activeCarouselIndexRef.current && closestIndex < pages.length) {
      setActiveCarouselIndex(closestIndex);
      activeCarouselIndexRef.current = closestIndex;
      onSelectPage(closestIndex);
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
          scrollCarouselTo(Math.max(0, activeCarouselIndexRef.current - 1));
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (previewMode === 'single') {
          setInternalSingleIndex((prev) => Math.min(pages.length - 1, prev + 1));
        } else {
          scrollCarouselTo(Math.min(pages.length - 1, activeCarouselIndexRef.current + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMode, pages.length, scrollCarouselTo]);

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
      ref={previewPanelRef}
      className={`flex flex-col h-full w-full bg-[var(--bg)] no-scrollbar ${
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
            className="btn-tactile flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium transition-colors text-xs"
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
                className="btn-tactile flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-[#0c0c0e] hover:bg-[#16161c] px-2.5 py-1 rounded-[6px] border border-[#1b1b22] hover:border-[#2e2e3a] disabled:opacity-20 disabled:pointer-events-none transition-colors shadow-xs"
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
                className="btn-tactile flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-[#0c0c0e] hover:bg-[#16161c] px-2.5 py-1 rounded-[6px] border border-[#1b1b22] hover:border-[#2e2e3a] disabled:opacity-20 disabled:pointer-events-none transition-colors shadow-xs"
                title="Next page (Arrow Right)"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {(() => {
            const effectiveTypo = activeSinglePage.typography
              ? { ...typography, ...activeSinglePage.typography, textColor: typography.textColor }
              : typography;
            const singleDims = getPageCanvasDimensions(
              activeSinglePage.pageIndex,
              pages.length,
              activeSinglePage.renderedHeight,
              canvas,
              spacing,
              effectiveTypo
            );
            return (
              <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2 animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
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
                highlightedParagraphIndex={highlightedParagraph?.pageIndex === activeSinglePage.pageIndex ? highlightedParagraph.paragraphIndex : null}
                highlightRange={highlightedParagraph ? { startIndex: highlightedParagraph.startIndex, endIndex: highlightedParagraph.endIndex } : null}
                onParagraphHover={onParagraphHover}
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

          {/* Carousel Scroll Track: Free scrolling with buttery kinetic momentum */}
          <div
            ref={carouselContainerRef}
            onScroll={handleCarouselScroll}
            onMouseDown={handleMouseDown}
            onClickCapture={(e) => {
              if (hasDraggedRef.current) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
            className={`flex-1 min-h-0 w-full flex items-center overflow-x-auto py-4 px-12 gap-8 no-scrollbar ${
              isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
            style={{ scrollBehavior: 'auto' }}
          >
            {pages.map((page, idx) => {
              const effectiveTypo = page.typography
                ? { ...typography, ...page.typography, textColor: typography.textColor }
                : typography;
              const cardDims = getPageCanvasDimensions(
                page.pageIndex,
                pages.length,
                page.renderedHeight,
                canvas,
                spacing,
                effectiveTypo
              );
              return (
                <div
                  key={`preview-carousel-${page.pageIndex}`}
                  className={`h-full ${
                    isEditorCollapsed ? 'max-h-[82vh]' : 'max-h-[72vh]'
                  } min-h-[280px] shrink-0 flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in zoom-in-95`}
                  style={{
                    aspectRatio: `${cardDims.width} / ${cardDims.height}`,
                    transform: `translateX(${overscrollOffset}px)`,
                    transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform',
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
                      highlightedParagraphIndex={highlightedParagraph?.pageIndex === page.pageIndex ? highlightedParagraph.paragraphIndex : null}
                      highlightRange={highlightedParagraph ? { startIndex: highlightedParagraph.startIndex, endIndex: highlightedParagraph.endIndex } : null}
                      onParagraphHover={onParagraphHover}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 mt-2 shrink-0 select-none tracking-wide">
                    Page {page.pageIndex + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 3: 2x2 or Responsive Grid of Page Cards (Default) */}
      {previewMode === 'grid' && (
        <div className={`grid ${getGridCols()} gap-6 mx-auto w-full items-start justify-center`}>
          {pages.map((page, idx) => (
            <div key={`preview-page-${page.pageIndex}`} className="flex flex-col items-center gap-2 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in zoom-in-95">
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
                highlightedParagraphIndex={highlightedParagraph?.pageIndex === page.pageIndex ? highlightedParagraph.paragraphIndex : null}
                highlightRange={highlightedParagraph ? { startIndex: highlightedParagraph.startIndex, endIndex: highlightedParagraph.endIndex } : null}
                onParagraphHover={onParagraphHover}
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
