'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Maximize2,
  AlertTriangle,
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

interface PageCardProps {
  page: PageData;
  totalPages: number;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  exportFormat: ExportFormat;
  exportScale: ExportScale;
  projectName: string;
  isHovered: boolean;
  onHover: (isHovering: boolean) => void;
  onClick: () => void;
  onEnlarge: () => void;
  allowClippedExport?: boolean;
  onBlockedExport?: (msg: string) => void;
}

export const PageCard: React.FC<PageCardProps> = ({
  page,
  totalPages,
  canvas,
  typography,
  spacing,
  exportFormat,
  exportScale,
  projectName,
  isHovered,
  onHover,
  onClick,
  onEnlarge,
  allowClippedExport = false,
  onBlockedExport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Render canvas whenever layout/page changes
  useEffect(() => {
    if (canvasRef.current) {
      renderPageToCanvas(canvasRef.current, {
        page,
        canvas,
        typography,
        spacing,
        scale: 1, // Preview scale
      });
    }
  }, [page, canvas, typography, spacing]);

  const handleCopyText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(page.text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (page.isOverflowing && !allowClippedExport) {
      onBlockedExport?.(`Export blocked: Page ${page.pageIndex + 1} contains clipped text.`);
      return;
    }
    setIsDownloading(true);
    try {
      await exportSinglePage(page, {
        canvas,
        typography,
        spacing,
        scale: exportScale,
        format: exportFormat,
        projectName,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const hasOverflow = page.isOverflowing;

  return (
    <div
      className={`group relative flex flex-col bg-[#000000] border transition-all cursor-zoom-in select-none rounded-md shadow-2xl shadow-black/80 ${
        isHovered
          ? 'border-zinc-400 shadow-zinc-950 ring-1 ring-zinc-500/30'
          : hasOverflow
          ? 'border-red-800 shadow-red-950/20'
          : 'border-[#32323c] hover:border-zinc-400'
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={() => {
        onClick();
        onEnlarge();
      }}
    >
      {/* Floating hover micro-actions in top-right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-xs p-1 rounded-md border border-[#27272a]">
        <button
          type="button"
          onClick={handleCopyText}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
          title="Copy text for this page"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
          title="Download this page image"
        >
          <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce text-zinc-200' : ''}`} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEnlarge();
          }}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
          title="Enlarge preview"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Overflow Warning Badge */}
      {hasOverflow && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] bg-red-950/90 text-red-300 border border-red-800 px-1.5 py-0.5 rounded font-mono">
          <AlertTriangle className="w-3 h-3" />
          <span>Overflow ~{Math.round(page.overflowPx)}px</span>
        </div>
      )}

      {/* Canvas Container */}
      <div
        className="w-full relative overflow-hidden flex items-center justify-center p-2"
        style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain block pointer-events-none"
        />
      </div>

      {/* Discrete Centered Page Number */}
      <div
        className="text-center py-2 text-zinc-400 font-mono text-xs select-none"
        title={`Page ${page.pageIndex + 1} of ${totalPages}`}
      >
        {page.pageIndex + 1}
      </div>
    </div>
  );
};
