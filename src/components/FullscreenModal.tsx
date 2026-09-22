'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CanvasSettings,
  ExportFormat,
  ExportScale,
  PageData,
  SpacingSettings,
  TypographySettings,
} from '../types';
import { renderPageToCanvas, getPageCanvasDimensions } from '../engine/canvasRenderer';
import { exportSinglePage } from '../engine/exportEngine';

interface FullscreenCardProps {
  page: PageData;
  totalPages: number;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  zoomLevel: 'fit' | '100%';
}

const FullscreenCard: React.FC<FullscreenCardProps> = ({
  page,
  totalPages,
  canvas,
  typography,
  spacing,
  zoomLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectiveTypo = page.typography
    ? { ...typography, ...page.typography, textColor: typography.textColor }
    : typography;
  const pageDims = getPageCanvasDimensions(
    page.pageIndex,
    totalPages,
    page.renderedHeight,
    canvas,
    spacing,
    effectiveTypo
  );

  useEffect(() => {
    if (canvasRef.current) {
      renderPageToCanvas(canvasRef.current, {
        page,
        totalPages,
        canvas,
        typography,
        spacing,
        scale: 1,
      });
    }
  }, [page, totalPages, canvas, typography, spacing]);

  return (
    <div
      className="shadow-2xl border border-black/[0.08] dark:border-zinc-800 transition-all flex items-center justify-center rounded-md overflow-hidden shrink-0 select-none"
      style={{
        backgroundColor: canvas.backgroundColor,
        height: zoomLevel === 'fit' ? '82vh' : `${pageDims.height}px`,
        aspectRatio: `${pageDims.width} / ${pageDims.height}`,
      }}
    >
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full block pointer-events-none"
      />
    </div>
  );
};

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageData[];
  initialPageIndex: number;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  exportFormat: ExportFormat;
  exportScale: ExportScale;
  projectName: string;
  allowClippedExport?: boolean;
  onBlockedExport?: (msg: string) => void;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({
  isOpen,
  onClose,
  pages,
  initialPageIndex,
  canvas,
  typography,
  spacing,
  exportFormat,
  exportScale,
  projectName,
  allowClippedExport = false,
  onBlockedExport,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const currentPageIndexRef = useRef(currentPageIndex);
  currentPageIndexRef.current = currentPageIndex;

  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('fit');
  const trackRef = useRef<HTMLDivElement>(null);

  const targetScrollLeftRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isWheelingRef = useRef(false);
  const wheelIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const dragVelocityRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const lastDragXRef = useRef(0);

  const snapToNearestCard = useCallback(() => {
    const container = trackRef.current;
    if (!container || pages.length <= 1) return;
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

    const targetChild = container.children[closestIndex] as HTMLElement | undefined;
    if (targetChild) {
      const targetCenter = targetChild.offsetLeft + targetChild.clientWidth / 2;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const targetScroll = Math.max(0, Math.min(maxScroll, Math.round(targetCenter - container.clientWidth / 2)));

      targetScrollLeftRef.current = targetScroll;
      if (rafIdRef.current === null) {
        const step = () => {
          const c = trackRef.current;
          if (!c) {
            rafIdRef.current = null;
            return;
          }
          const diff = targetScroll - c.scrollLeft;
          if (Math.abs(diff) < 0.75) {
            c.scrollLeft = targetScroll;
            rafIdRef.current = null;
            return;
          }
          c.scrollLeft += diff * 0.18;
          rafIdRef.current = requestAnimationFrame(step);
        };
        rafIdRef.current = requestAnimationFrame(step);
      }
    }
  }, [pages.length]);

  const scrollToPage = useCallback((index: number) => {
    const container = trackRef.current;
    if (!container) return;
    const targetChild = container.children[index] as HTMLElement | undefined;
    if (targetChild) {
      const containerWidth = container.clientWidth;
      const childLeft = targetChild.offsetLeft;
      const childWidth = targetChild.clientWidth;
      const targetScroll = Math.round(childLeft - (containerWidth - childWidth) / 2);
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    setCurrentPageIndex(index);
    currentPageIndexRef.current = index;
  }, []);

  // Initial centering on mount
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      scrollToPage(initialPageIndex);
    }, 40);
    return () => clearTimeout(timer);
  }, [isOpen, initialPageIndex, scrollToPage]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = Math.max(0, currentPageIndexRef.current - 1);
        scrollToPage(next);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(pages.length - 1, currentPageIndexRef.current + 1);
        scrollToPage(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pages.length, scrollToPage, onClose]);

  // Free-scrolling horizontal wheel momentum (RAF lerp) with subtle magnetic mini-lock
  useEffect(() => {
    if (!isOpen) return;
    const track = trackRef.current;
    if (!track) return;

    const handleWheel = (e: WheelEvent) => {
      if (zoomLevel === '100%') return;
      if (pages.length <= 1) return;

      // Allow natural horizontal trackpad swipes without interception
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      e.preventDefault();

      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;

      if (!isWheelingRef.current) {
        targetScrollLeftRef.current = track.scrollLeft;
        isWheelingRef.current = true;
      }

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 33;
      else if (e.deltaMode === 2) delta *= track.clientWidth;

      // Fast, fluid free-scrolling (2.2x speed)
      targetScrollLeftRef.current = Math.max(
        0,
        Math.min(maxScroll, targetScrollLeftRef.current + delta * 2.2)
      );

      // Reset magnetic lock timer
      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = setTimeout(() => {
        isWheelingRef.current = false;
        snapToNearestCard();
      }, 160);

      if (rafIdRef.current === null) {
        const step = () => {
          const c = trackRef.current;
          if (!c) {
            isWheelingRef.current = false;
            rafIdRef.current = null;
            return;
          }

          const current = c.scrollLeft;
          const target = targetScrollLeftRef.current;
          const diff = target - current;

          if (Math.abs(diff) < 0.5) {
            c.scrollLeft = Math.round(target);
            rafIdRef.current = null;
            return;
          }

          c.scrollLeft = current + diff * 0.22;
          rafIdRef.current = requestAnimationFrame(step);
        };
        rafIdRef.current = requestAnimationFrame(step);
      }
    };

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      track.removeEventListener('wheel', handleWheel);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (wheelIdleTimerRef.current) {
        clearTimeout(wheelIdleTimerRef.current);
      }
      isWheelingRef.current = false;
    };
  }, [isOpen, pages.length, zoomLevel, snapToNearestCard]);

  // Drag-to-scroll mouse listener
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const container = trackRef.current;
    if (!container) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (wheelIdleTimerRef.current) {
      clearTimeout(wheelIdleTimerRef.current);
    }
    isWheelingRef.current = false;

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
      const container = trackRef.current;
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

      container.scrollLeft = dragStartScrollRef.current - dx;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const container = trackRef.current;
      if (!container) return;

      let velocity = -dragVelocityRef.current * 26;
      if (Math.abs(velocity) > 1.5) {
        const fling = () => {
          if (!trackRef.current) return;
          if (Math.abs(velocity) < 0.8) {
            snapToNearestCard();
            return;
          }
          trackRef.current.scrollLeft += velocity;
          velocity *= 0.93;
          requestAnimationFrame(fling);
        };
        requestAnimationFrame(fling);
      } else {
        snapToNearestCard();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, snapToNearestCard]);

  // Track scroll position to update active page indicator
  const handleTrackScroll = () => {
    const container = trackRef.current;
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
    if (closestIndex !== currentPageIndexRef.current && closestIndex < pages.length) {
      setCurrentPageIndex(closestIndex);
      currentPageIndexRef.current = closestIndex;
    }
  };

  const activePage = pages[currentPageIndex] || pages[0];

  if (!isOpen || !activePage || typeof document === 'undefined') return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(activePage.text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownloadCurrent = async () => {
    if (activePage.isOverflowing && !allowClippedExport) {
      onBlockedExport?.(`Export blocked: Page ${activePage.pageIndex + 1} contains clipped text.`);
      return;
    }
    await exportSinglePage(activePage, {
      canvas,
      totalPages: pages.length,
      typography,
      spacing,
      scale: exportScale,
      format: exportFormat,
      projectName,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-[#f8fafc]/98 dark:bg-[#08080a]/98 backdrop-blur-md flex flex-col select-none transition-colors">
      {/* Top bar */}
      <div className="h-12 px-6 border-b border-black/[0.08] dark:border-[#18181f] bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md flex items-center justify-between text-slate-700 dark:text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-slate-900 dark:text-white font-mono tracking-tight">
            Page {String(currentPageIndex + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            {canvas.width} × {canvas.height} px
          </span>
          <span className="text-xs bg-slate-100 dark:bg-[#09090c] border border-slate-200 dark:border-[#18181f] text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded-[4px] font-mono">
            Util: {activePage.utilization}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle */}
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => (prev === 'fit' ? '100%' : 'fit'))}
            className="h-7 px-2.5 flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-[#0c0c0e] dark:hover:bg-[#16161c] border border-slate-200 dark:border-[#1b1b22] hover:border-slate-300 dark:hover:border-[#2e2e3a] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] transition-colors cursor-pointer"
          >
            {zoomLevel === 'fit' ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
            <span>{zoomLevel === 'fit' ? 'Fit View' : '100%'}</span>
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopyText}
            className="h-7 px-2.5 flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-[#0c0c0e] dark:hover:bg-[#16161c] border border-slate-200 dark:border-[#1b1b22] hover:border-slate-300 dark:hover:border-[#2e2e3a] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownloadCurrent}
            className="h-7 px-3 flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 dark:bg-[#1c1c24] dark:hover:bg-[#24242e] dark:text-white dark:border-[#2e2e3a] font-medium rounded-[6px] transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-[6px] bg-slate-100 hover:bg-slate-200 dark:bg-[#0c0c0e] dark:hover:bg-[#16161c] border border-slate-200 dark:border-[#1b1b22] hover:border-slate-300 dark:hover:border-[#2e2e3a] ml-1 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Display Area: Multi-card free-scrolling gallery track */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0">
        {/* Previous page button */}
        {pages.length > 1 && currentPageIndex > 0 && (
          <button
            type="button"
            onClick={() => scrollToPage(currentPageIndex - 1)}
            className="absolute left-6 z-20 p-3 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-xl backdrop-blur-xs cursor-pointer hover:scale-105 active:scale-95"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Free-scrolling track */}
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          onMouseDown={handleMouseDown}
          onClickCapture={(e) => {
            if (hasDraggedRef.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          className={`h-full w-full flex items-center overflow-x-auto py-6 px-16 gap-10 no-scrollbar ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ scrollBehavior: 'auto' }}
        >
          {pages.map((p) => (
            <FullscreenCard
              key={`fullscreen-page-${p.pageIndex}`}
              page={p}
              totalPages={pages.length}
              canvas={canvas}
              typography={typography}
              spacing={spacing}
              zoomLevel={zoomLevel}
            />
          ))}
        </div>

        {/* Next page button */}
        {pages.length > 1 && currentPageIndex < pages.length - 1 && (
          <button
            type="button"
            onClick={() => scrollToPage(currentPageIndex + 1)}
            className="absolute right-6 z-20 p-3 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-xl backdrop-blur-xs cursor-pointer hover:scale-105 active:scale-95"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom thumbnails / pagination dots */}
      {pages.length > 1 && (
        <div className="h-12 border-t border-black/[0.08] dark:border-[#18181f] bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md px-4 flex items-center justify-center gap-2">
          {pages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToPage(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentPageIndex === idx
                  ? 'w-8 bg-slate-900 dark:bg-[#f4f4f6]'
                  : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-zinc-800 dark:hover:bg-zinc-600'
              }`}
              title={`Jump to Page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
};

