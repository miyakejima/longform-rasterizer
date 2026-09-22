'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  const [prevInitialPageIndex, setPrevInitialPageIndex] = useState(initialPageIndex);
  if (initialPageIndex !== prevInitialPageIndex) {
    setPrevInitialPageIndex(initialPageIndex);
    setCurrentPageIndex(initialPageIndex);
  }
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('fit');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastWheelTimeRef = useRef(0);
  const wheelDeltaAccumulatorRef = useRef(0);
  const wheelResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentPageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (zoomLevel === '100%') return;
      if (pages.length <= 1) return;

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      e.preventDefault();

      wheelDeltaAccumulatorRef.current += delta;
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = setTimeout(() => {
        wheelDeltaAccumulatorRef.current = 0;
      }, 150);

      const threshold = 35;
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 110) return;

      if (Math.abs(wheelDeltaAccumulatorRef.current) >= threshold) {
        lastWheelTimeRef.current = now;
        const dir = wheelDeltaAccumulatorRef.current > 0 ? 1 : -1;
        wheelDeltaAccumulatorRef.current = 0;
        setCurrentPageIndex((prev) =>
          dir > 0 ? Math.min(pages.length - 1, prev + 1) : Math.max(0, prev - 1)
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
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
      renderPageToCanvas(canvasRef.current, {
        page: activePage,
        totalPages: pages.length,
        canvas,
        typography,
        spacing,
        scale: 1,
      });
    }
  }, [isOpen, activePage, pages.length, canvas, typography, spacing]);

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

      {/* Main Display Area: Exactly 1 page centered at a time */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-auto">
        {/* Previous page button */}
        {pages.length > 1 && (
          <button
            type="button"
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            className="absolute left-6 z-10 p-3 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-xl backdrop-blur-xs cursor-pointer hover:scale-105 active:scale-95"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Canvas container */}
        <div
          className="shadow-2xl border border-black/[0.08] dark:border-zinc-800 transition-all flex items-center justify-center rounded-md overflow-hidden"
          style={{
            backgroundColor: canvas.backgroundColor,
            maxHeight: zoomLevel === 'fit' ? '85vh' : 'none',
            maxWidth: zoomLevel === 'fit' ? '85vw' : 'none',
            aspectRatio: `${pageDims.width} / ${pageDims.height}`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full block"
          />
        </div>

        {/* Next page button */}
        {pages.length > 1 && (
          <button
            type="button"
            disabled={currentPageIndex === pages.length - 1}
            onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
            className="absolute right-6 z-10 p-3 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-xl backdrop-blur-xs cursor-pointer hover:scale-105 active:scale-95"
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

