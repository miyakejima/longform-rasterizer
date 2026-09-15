'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { renderPageToCanvas } from '../engine/canvasRenderer';
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
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('fit');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setCurrentPageIndex(initialPageIndex);
  }, [initialPageIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentPageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pages.length, onClose]);

  const activePage = pages[currentPageIndex] || pages[0];

  useEffect(() => {
    if (isOpen && canvasRef.current && activePage) {
      renderPageToCanvas(canvasRef.current, {
        page: activePage,
        canvas,
        typography,
        spacing,
        scale: 1,
      });
    }
  }, [isOpen, activePage, canvas, typography, spacing]);

  if (!isOpen || !activePage) return null;

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
    await exportSinglePage(activePage, {
      canvas,
      typography,
      spacing,
      scale: exportScale,
      format: exportFormat,
      projectName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col select-none">
      {/* Top bar */}
      <div className="h-14 px-6 border-b border-zinc-800/80 flex items-center justify-between text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-white">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {canvas.width} × {canvas.height} px
          </span>
          <span className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
            Util: {activePage.utilization}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle */}
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => (prev === 'fit' ? '100%' : 'fit'))}
            className="flex items-center gap-1 text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5 rounded transition-colors text-zinc-300"
          >
            {zoomLevel === 'fit' ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
            <span>{zoomLevel === 'fit' ? 'Fit View' : '100%'}</span>
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1 text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5 rounded transition-colors text-zinc-300"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownloadCurrent}
            className="flex items-center gap-1 text-xs bg-white text-black font-medium hover:bg-zinc-200 px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 ml-2 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-auto">
        {/* Previous page button */}
        {pages.length > 1 && (
          <button
            type="button"
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            className="absolute left-6 z-10 p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-xl"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Canvas container */}
        <div
          className="shadow-2xl border border-zinc-800 bg-black transition-all flex items-center justify-center"
          style={{
            maxHeight: zoomLevel === 'fit' ? '85vh' : 'none',
            maxWidth: zoomLevel === 'fit' ? '85vw' : 'none',
            aspectRatio: `${canvas.width} / ${canvas.height}`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full block"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        {/* Next page button */}
        {pages.length > 1 && (
          <button
            type="button"
            disabled={currentPageIndex === pages.length - 1}
            onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
            className="absolute right-6 z-10 p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-xl"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom thumbnails / pagination dots */}
      {pages.length > 1 && (
        <div className="h-14 border-t border-zinc-800/80 px-4 flex items-center justify-center gap-2">
          {pages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPageIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentPageIndex === idx
                  ? 'w-8 bg-white'
                  : 'w-2 bg-zinc-700 hover:bg-zinc-500'
              }`}
              title={`Jump to Page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
