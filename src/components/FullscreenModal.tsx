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
  highlightRange?: { startIndex: number; endIndex: number } | null;
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
  highlightRange = null,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [prevInitialPageIndex, setPrevInitialPageIndex] = useState(initialPageIndex);
  if (initialPageIndex !== prevInitialPageIndex) {
    setPrevInitialPageIndex(initialPageIndex);
    setCurrentPageIndex(initialPageIndex);
  }
  const currentPageIndexRef = useRef(currentPageIndex);
  currentPageIndexRef.current = currentPageIndex;

  const [copied, setCopied] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('fit');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastWheelTimeRef = useRef(0);
  const wheelDeltaAccumulatorRef = useRef(0);
  const wheelResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingWheelTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag-to-flip & rubber-banding elasticity state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [rubberBandX, setRubberBandX] = useState(0);
  const rubberBandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const triggerBounce = useCallback((amount: number) => {
    if (rubberBandTimerRef.current) clearTimeout(rubberBandTimerRef.current);
    setRubberBandX(amount);
    rubberBandTimerRef.current = setTimeout(() => {
      setRubberBandX(0);
    }, 200);
  }, []);
  const triggerBounceRef = useRef(triggerBounce);
  triggerBounceRef.current = triggerBounce;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentPageIndexRef.current <= 0) {
          triggerBounceRef.current(36);
        } else {
          setCurrentPageIndex((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPageIndexRef.current >= pages.length - 1) {
          triggerBounceRef.current(-36);
        } else {
          setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (zoomLevel === '100%') return;
      if (pages.length <= 1) return;

      let delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) delta *= 28;
      else if (e.deltaMode === 2) delta *= 400;

      e.preventDefault();

      // If user reverses scroll direction, reset accumulator immediately
      if (
        (wheelDeltaAccumulatorRef.current > 0 && delta < 0) ||
        (wheelDeltaAccumulatorRef.current < 0 && delta > 0)
      ) {
        wheelDeltaAccumulatorRef.current = 0;
      }

      wheelDeltaAccumulatorRef.current += delta;
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = setTimeout(() => {
        wheelDeltaAccumulatorRef.current = 0;
      }, 120);

      const threshold = 22; // Low, highly responsive threshold for effortless page turning
      const now = Date.now();
      const cooldown = 55; // Fast enough for rapid wheel notches without swallowing inputs

      const processPageTurn = () => {
        if (Math.abs(wheelDeltaAccumulatorRef.current) >= threshold) {
          lastWheelTimeRef.current = Date.now();
          const dir = wheelDeltaAccumulatorRef.current > 0 ? 1 : -1;
          wheelDeltaAccumulatorRef.current = 0;
          if (dir > 0) {
            if (currentPageIndexRef.current >= pages.length - 1) {
              // Elastic choque / collision bounce at end
              const bounce = -Math.min(42, Math.sqrt(Math.abs(delta)) * 3.8);
              triggerBounceRef.current(bounce);
            } else {
              setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
            }
          } else {
            if (currentPageIndexRef.current <= 0) {
              // Elastic choque / collision bounce at start
              const bounce = Math.min(42, Math.sqrt(Math.abs(delta)) * 3.8);
              triggerBounceRef.current(bounce);
            } else {
              setCurrentPageIndex((prev) => Math.max(0, prev - 1));
            }
          }
        }
      };

      if (now - lastWheelTimeRef.current >= cooldown) {
        processPageTurn();
      } else {
        // Schedule pending page turn at the end of cooldown so it's NEVER swallowed
        if (pendingWheelTimerRef.current) clearTimeout(pendingWheelTimerRef.current);
        const remaining = Math.max(10, cooldown - (now - lastWheelTimeRef.current));
        pendingWheelTimerRef.current = setTimeout(() => {
          processPageTurn();
        }, remaining);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
      if (pendingWheelTimerRef.current) clearTimeout(pendingWheelTimerRef.current);
    };
  }, [isOpen, pages.length, zoomLevel, onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const activePage = pages[currentPageIndex] || pages[0];

  const effectiveTypo = activePage?.typography
    ? { ...typography, ...activePage.typography, textColor: typography.textColor }
    : typography;
  const pageDims = activePage
    ? getPageCanvasDimensions(activePage.pageIndex, pages.length, activePage.renderedHeight, canvas, spacing, effectiveTypo)
    : { width: canvas.width, height: canvas.height, isTrimmed: false };

  useEffect(() => {
    if (isOpen && canvasRef.current && activePage) {
      // High-DPI supersampling scale for maximum sharpness on Retina / 4K / High-DPI screens
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      const effectiveScale = canvas.width >= 2000 ? 1 : (dpr > 1.2 ? 2 : 1);

      renderPageToCanvas(canvasRef.current, {
        page: activePage,
        totalPages: pages.length,
        canvas,
        typography,
        spacing,
        scale: effectiveScale,
        highlightRange,
        snapToPixelGrid: true,
      });
    }
  }, [isOpen, activePage, pages.length, canvas, typography, spacing, highlightRange, zoomLevel]);

  if (!isOpen || !activePage || typeof document === 'undefined') return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(activePage.text.trim());
      setCopied(true);
      setShowShimmer(true);
      setTimeout(() => setShowShimmer(false), 700);
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
    setShowShimmer(true);
    setTimeout(() => setShowShimmer(false), 700);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel === '100%') return;
    if (pages.length <= 1) return;
    if (e.button !== 0) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diffX = e.clientX - dragStartXRef.current;
    const diffY = e.clientY - dragStartYRef.current;
    if (Math.abs(diffX) > 4 || Math.abs(diffY) > 4) {
      hasDraggedRef.current = true;
    }

    if (Math.abs(diffX) >= Math.abs(diffY)) {
      if (currentPageIndexRef.current === 0 && diffX > 0) {
        // Elastic rubber-band resistance when pulling right at first page (choque)
        const rubber = Math.min(64, Math.sqrt(diffX) * 4.5);
        setDragOffset(rubber);
      } else if (currentPageIndexRef.current >= pages.length - 1 && diffX < 0) {
        // Elastic rubber-band resistance when pulling left at last page (choque)
        const rubber = -Math.min(64, Math.sqrt(Math.abs(diffX)) * 4.5);
        setDragOffset(rubber);
      } else {
        // Natural tactile drag displacement
        setDragOffset(diffX * 0.45);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);

    const diffX = e.clientX - dragStartXRef.current;
    const diffY = e.clientY - dragStartYRef.current;
    const threshold = 40;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < -threshold) {
        if (currentPageIndexRef.current >= pages.length - 1) {
          triggerBounceRef.current(-36);
        } else {
          setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
        }
      } else if (diffX > threshold) {
        if (currentPageIndexRef.current <= 0) {
          triggerBounceRef.current(36);
        } else {
          setCurrentPageIndex((prev) => Math.max(0, prev - 1));
        }
      }
    } else {
      if (diffY < -threshold) {
        if (currentPageIndexRef.current >= pages.length - 1) {
          triggerBounceRef.current(-36);
        } else {
          setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
        }
      } else if (diffY > threshold) {
        if (currentPageIndexRef.current <= 0) {
          triggerBounceRef.current(36);
        } else {
          setCurrentPageIndex((prev) => Math.max(0, prev - 1));
        }
      }
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen Page Preview"
      className="fixed inset-0 z-50 flex flex-col bg-slate-100/95 dark:bg-[#060608]/95 backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Top action bar */}
      <div className="h-12 border-b border-black/[0.08] dark:border-[#18181f] bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none">
        {/* Left: Page counter & title */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-800 dark:text-zinc-200">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-600">|</span>
          <span className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-xs">
            {projectName || 'Untitled'}
          </span>
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom toggle */}
          <button
            type="button"
            onClick={() => setZoomLevel((z) => (z === 'fit' ? '100%' : 'fit'))}
            className="btn-tactile h-7 px-2.5 flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-[#0c0c0e] dark:hover:bg-[#16161c] border border-slate-200 dark:border-[#1b1b22] hover:border-slate-300 dark:hover:border-[#2e2e3a] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white rounded-[6px] transition-colors cursor-pointer"
            title={zoomLevel === 'fit' ? 'Zoom to 100%' : 'Fit to Window'}
          >
            {zoomLevel === 'fit' ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
            <span>{zoomLevel === 'fit' ? 'Fit' : '100%'}</span>
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopyText}
            className="btn-tactile h-7 px-2.5 flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-[#0c0c0e] dark:hover:bg-[#16161c] border border-slate-200 dark:border-[#1b1b22] hover:border-slate-300 dark:hover:border-[#2e2e3a] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white rounded-[6px] transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownloadCurrent}
            className="btn-tactile h-7 px-3 flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 dark:bg-[#1c1c24] dark:hover:bg-[#24242e] dark:text-white dark:border-[#2e2e3a] font-medium rounded-[6px] transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile h-7 w-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-[6px] bg-slate-100 hover:bg-slate-200 dark:bg-[#0c0c0e] dark:hover:bg-[#16161c] border border-slate-200 dark:border-[#1b1b22] hover:border-slate-300 dark:hover:border-[#2e2e3a] ml-1 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Display Area: Exactly 1 page centered at a time */}
      <div
        className="flex-1 relative flex items-center justify-center p-6 overflow-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setDragOffset(0);
        }}
      >
        {/* Previous page button */}
        {pages.length > 1 && (
          <button
            type="button"
            onClick={() => {
              if (currentPageIndex === 0) {
                triggerBounceRef.current(36);
              } else {
                setCurrentPageIndex((prev) => Math.max(0, prev - 1));
              }
            }}
            className={`btn-tactile absolute left-6 z-10 p-3 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-xl backdrop-blur-xs cursor-pointer ${
              currentPageIndex === 0 ? 'opacity-30 hover:opacity-50' : 'opacity-100'
            }`}
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Canvas container with Rubber-Banding Elasticity */}
        <div
          className={`shadow-2xl border border-black/[0.08] dark:border-zinc-800 flex items-center justify-center rounded-md overflow-hidden relative ${
            zoomLevel === 'fit' && pages.length > 1
              ? isDragging
                ? 'cursor-grabbing select-none'
                : 'cursor-grab'
              : ''
          }`}
          style={{
            backgroundColor: canvas.backgroundColor,
            maxHeight: zoomLevel === 'fit' ? '85vh' : 'none',
            maxWidth: zoomLevel === 'fit' ? '85vw' : 'none',
            width: zoomLevel === 'fit' ? 'auto' : `${pageDims.width}px`,
            height: zoomLevel === 'fit' ? 'auto' : `${pageDims.height}px`,
            aspectRatio: `${pageDims.width} / ${pageDims.height}`,
            transform: `translateX(${dragOffset + rubberBandX}px)`,
            transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {/* Shimmer sweep on copy/download in fullscreen */}
          {showShimmer && (
            <div className="absolute inset-0 pointer-events-none rounded-md overflow-hidden z-20">
              <div className="w-full h-full animate-shimmer-sweep" />
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="w-full h-full block pointer-events-none"
          />
        </div>

        {/* Next page button */}
        {pages.length > 1 && (
          <button
            type="button"
            onClick={() => {
              if (currentPageIndex >= pages.length - 1) {
                triggerBounceRef.current(-36);
              } else {
                setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
              }
            }}
            className={`btn-tactile absolute right-6 z-10 p-3 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-xl backdrop-blur-xs cursor-pointer ${
              currentPageIndex === pages.length - 1 ? 'opacity-30 hover:opacity-50' : 'opacity-100'
            }`}
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
              onClick={() => setCurrentPageIndex(idx)}
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

