'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import {
  renderPageToCanvas,
  getPageCanvasDimensions,
  getParagraphBoundsForPage,
} from '../engine/canvasRenderer';
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
  highlightedParagraphIndex?: number | null;
  onParagraphHover?: (info: { pageIndex: number; paragraphIndex: number; startIndex: number; endIndex: number } | null) => void;
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
  highlightedParagraphIndex = null,
  onParagraphHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const paragraphBounds = useMemo(() => {
    return getParagraphBoundsForPage(
      page,
      totalPages,
      canvas,
      spacing,
      effectiveTypo
    );
  }, [page, totalPages, canvas, spacing, effectiveTypo]);

  const currentHoveredParaRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onParagraphHover || paragraphBounds.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.height <= 0) return;

    const relY = (e.clientY - rect.top) / rect.height;
    const canvasY = relY * pageDims.height;

    // Find the paragraph containing canvasY
    let target = paragraphBounds.find((b) => canvasY >= b.topY && canvasY <= b.bottomY);
    if (!target) {
      if (canvasY < paragraphBounds[0].topY) {
        target = paragraphBounds[0];
      } else if (canvasY > paragraphBounds[paragraphBounds.length - 1].bottomY) {
        target = paragraphBounds[paragraphBounds.length - 1];
      } else {
        let closest = paragraphBounds[0];
        let minDist = Infinity;
        for (const b of paragraphBounds) {
          const mid = (b.topY + b.bottomY) / 2;
          const dist = Math.abs(canvasY - mid);
          if (dist < minDist) {
            minDist = dist;
            closest = b;
          }
        }
        target = closest;
      }
    }

    if (target && target.paragraphIndex !== currentHoveredParaRef.current) {
      currentHoveredParaRef.current = target.paragraphIndex;
      onParagraphHover({
        pageIndex: page.pageIndex,
        paragraphIndex: target.paragraphIndex,
        startIndex: target.startIndex,
        endIndex: target.endIndex,
      });
    }
  };

  const handleMouseLeave = () => {
    onHover(false);
    if (currentHoveredParaRef.current !== null) {
      currentHoveredParaRef.current = null;
      onParagraphHover?.(null);
    }
  };

  // Render canvas whenever layout/page changes with rAF throttling for buttery-smooth 60fps updates
  useEffect(() => {
    let animId: number;
    if (canvasRef.current) {
      const c = canvasRef.current;
      animId = requestAnimationFrame(() => {
        renderPageToCanvas(c, {
          page,
          totalPages,
          canvas,
          typography,
          spacing,
          scale: 1, // Preview scale
          highlightedParagraphIndex,
        });
      });
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [page, totalPages, canvas, typography, spacing, highlightedParagraphIndex]);

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
        totalPages,
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
      className={`page-card-frame group relative flex flex-col transition-all cursor-zoom-in select-none rounded-md ${
        hasOverflow
          ? 'border border-red-800 shadow-red-950/20'
          : isHovered
          ? 'border border-black/[0.08] dark:border-white/[0.12]'
          : 'border border-black/[0.04] dark:border-white/[0.05]'
      }`}
      style={{
        aspectRatio: `${pageDims.width} / ${pageDims.height}`,
        backgroundColor: canvas.backgroundColor,
      }}
      onMouseEnter={(e) => {
        onHover(true);
        handleMouseMove(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        onClick();
        onEnlarge();
      }}
    >
      {/* Floating hover micro-actions in top-right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0c0c0e]/90 backdrop-blur-xs p-1 rounded-[6px] border border-[#1b1b22]">
        <button
          type="button"
          onClick={handleCopyText}
          className="p-1 text-zinc-400 hover:text-white hover:bg-[#16161c] rounded-[4px] transition-colors"
          title="Copy text for this page"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="p-1 text-zinc-400 hover:text-white hover:bg-[#16161c] rounded-[4px] transition-colors"
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
          className="p-1 text-zinc-400 hover:text-white hover:bg-[#16161c] rounded-[4px] transition-colors"
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

      {/* Canvas fills the card border 1:1 with exact aspect ratio */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none rounded-md"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};
