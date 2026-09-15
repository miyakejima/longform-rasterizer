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
      className={`flex flex-col transition-all group ${
        isHovered ? 'ring-2 ring-zinc-500 rounded-sm' : ''
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      {/* Outside Header */}
      <div className="flex items-center justify-between py-1.5 px-0.5 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">
            Page {page.pageIndex + 1}{' '}
            <span className="text-zinc-500 font-normal">/ {totalPages}</span>
          </span>

          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              hasOverflow
                ? 'bg-red-950/80 text-red-300 border border-red-800'
                : 'bg-zinc-850 text-zinc-400 border border-zinc-750'
            }`}
            title={`Utilization: ${page.utilization}%`}
          >
            {page.utilization}% full
          </span>

          {hasOverflow && (
            <span
              className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950/90 border border-red-800 px-1.5 py-0.5 rounded font-mono"
              title={`Overflows by ~${Math.round(page.overflowPx)}px`}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>+{Math.round(page.overflowPx)}px</span>
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopyText}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Copy page text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Download this page image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEnlarge();
            }}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Click to enlarge"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div
        className={`relative rounded overflow-hidden shadow-xl border bg-black transition-all ${
          hasOverflow
            ? 'border-red-600/80 ring-1 ring-red-600/50'
            : 'border-zinc-800 hover:border-zinc-700'
        }`}
        style={{
          aspectRatio: `${canvas.width} / ${canvas.height}`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ imageRendering: 'crisp-edges' }}
        />

        {/* Overflow banner overlay at bottom of canvas if overflowing */}
        {hasOverflow && (
          <div className="absolute bottom-0 inset-x-0 bg-red-950/90 backdrop-blur-xs border-t border-red-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-red-200">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              Page overflows by ~{Math.round(page.overflowPx)}px
            </span>
            <span className="text-[10px] text-red-300 underline cursor-pointer">
              Enable Auto-fit or add page
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
