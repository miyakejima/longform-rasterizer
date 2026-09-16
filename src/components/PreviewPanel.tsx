'use client';

import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import {
  CanvasSettings,
  ExportFormat,
  ExportScale,
  PageData,
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
}) => {
  const overflowingPages = pages.filter((p) => p.isOverflowing);
  const hasOverflow = overflowingPages.length > 0;

  // Grid column class matching the reference screenshot with large card display
  const getGridCols = () => {
    if (pages.length === 1) return 'grid-cols-1 max-w-xl';
    return 'grid-cols-1 xl:grid-cols-2 max-w-5xl';
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] overflow-y-auto select-none p-6 md:p-8">
      {/* Overflow Warning Banner (if text doesn't fit) */}
      {hasOverflow && (
        <div className="max-w-4xl mx-auto w-full mb-6 p-3 rounded-lg bg-red-950/40 border border-red-800/80 flex items-center justify-between gap-3 text-xs text-red-200">
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

      {/* 2x2 or Responsive Grid of Page Cards */}
      <div className={`grid ${getGridCols()} gap-5 mx-auto w-full items-start justify-center`}>
        {pages.map((page, idx) => (
          <PageCard
            key={`preview-page-${page.pageIndex}`}
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
        ))}
      </div>
    </div>
  );
};
