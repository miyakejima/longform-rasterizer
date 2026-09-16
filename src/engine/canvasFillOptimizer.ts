// Intelligent Canvas Fill Optimizer Engine
// Automatically maximizes visual utilization towards ~95-99% across all pages,
// removing wasted black space by tuning font size, line height, paragraph spacing, and centering.

import {
  CanvasSettings,
  DocumentState,
  PaginationResult,
  SpacingSettings,
  TypographySettings,
  AdvancedSettings,
} from '../types';
import { paginateDocument, PaginationOptions, computePageAvailableHeight } from './pagination';

export interface OptimizedFillResult {
  typography: TypographySettings;
  spacing: SpacingSettings;
  canvas: CanvasSettings;
  paginationResult: PaginationResult;
  averageUtilization: number;
  minUtilization: number;
}

/**
 * Optimizes typography and spacing settings to eliminate empty black space
 * and maximize page utilization towards ~95-99% without clipping text.
 */
export function optimizeCanvasFill(
  doc: DocumentState,
  canvas: CanvasSettings,
  typography: TypographySettings,
  spacing: SpacingSettings,
  advanced: AdvancedSettings
): OptimizedFillResult {
  const availableWidth = Math.max(100, canvas.width - spacing.paddingLeft - spacing.paddingRight);
  const availableHeight = computePageAvailableHeight(canvas, spacing);
  const canvasScaleMax = Math.max(160, Math.floor(Math.min(availableWidth, availableHeight) / 2));
  const minFont = Math.max(12, advanced.minFontSize || 14);
  const maxFont = advanced.maxFontSize && advanced.maxFontSize !== 64
    ? Math.max(minFont, advanced.maxFontSize)
    : Math.max(minFont, canvasScaleMax);

  // Base configuration: eliminate minimum bottom margin & enable trimLastPageHeight
  const baseCanvas: CanvasSettings = {
    ...canvas,
    trimLastPageHeight: true,
  };

  // Reset any runaway bloat from previous high-res runs or manual slider extremes
  const baseLineHeight = typography.lineHeight > 1.8 ? 1.45 : typography.lineHeight;

  const baseSpacing: SpacingSettings = {
    ...spacing,
    minBottomSpace: 0,
    verticalAlignment: 'center',
  };

  const baseTypography: TypographySettings = {
    ...typography,
    lineHeight: baseLineHeight,
    verticalAlignment: 'center',
  };

  // Phase 1: Binary search to find the maximum font size that fits without overflow
  let low = minFont;
  let high = maxFont;
  let optimalFontSize = minFont;
  let optimalResult: PaginationResult | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testOptions: PaginationOptions = {
      canvas: baseCanvas,
      typography: { ...baseTypography, fontSize: mid },
      spacing: baseSpacing,
      advanced,
    };

    const res = paginateDocument(doc, testOptions);
    const overflows = res.pages.some((p) => p.isOverflowing);

    if (!overflows) {
      optimalFontSize = mid;
      optimalResult = res;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // If even minFont overflows, return current best
  if (!optimalResult) {
    const fallbackOptions: PaginationOptions = {
      canvas,
      typography: { ...baseTypography, fontSize: minFont },
      spacing: baseSpacing,
      advanced,
    };
    const res = paginateDocument(doc, fallbackOptions);
    return {
      typography: { ...baseTypography, fontSize: minFont },
      spacing: baseSpacing,
      canvas,
      paginationResult: res,
      averageUtilization: 0,
      minUtilization: 0,
    };
  }

  // Phase 2: Fine-tune line-height and paragraph spacing to expand utilization towards ~95-99%
  let bestTypography = { ...baseTypography, fontSize: optimalFontSize };
  let bestSpacing = { ...baseSpacing };
  let bestPagination = optimalResult;

  const computeUtilMetrics = (res: PaginationResult) => {
    if (res.pages.length === 0) return { avg: 0, min: 0 };
    const utils = res.pages.map((p) => p.utilization / 100);
    const avg = utils.reduce((a, b) => a + b, 0) / utils.length;
    const min = Math.min(...utils);
    return { avg, min };
  };

  let { avg: bestAvgUtil, min: bestMinUtil } = computeUtilMetrics(bestPagination);

  // If average utilization is below 96%, search over line-height and paragraph-spacing combinations
  if (bestAvgUtil < 0.96) {
    // Clean, typographic line-height candidates (bounded to 1.85 to avoid bloated gaps)
    const baselineLH = Math.min(baseTypography.lineHeight, 1.55);
    const candidateLineHeights = Array.from(
      new Set([
        baselineLH,
        Number((baselineLH + 0.05).toFixed(2)),
        Number((baselineLH + 0.10).toFixed(2)),
        Number((baselineLH + 0.15).toFixed(2)),
        Number((baselineLH + 0.20).toFixed(2)),
      ])
    ).filter((lh) => lh <= 1.85);

    // Scale candidate paragraph spacings proportionally to canvas available height
    // On 1080x1350, baseSpacingPx is ~29px. On 4000x4000, baseSpacingPx is ~95px.
    const baseSpacingPx = Math.max(20, Math.round(availableHeight * 0.025));
    const candidateSpacing = Array.from(
      new Set([
        Math.max(16, Math.round(baseSpacingPx * 0.8)),
        baseSpacingPx,
        Math.round(baseSpacingPx * 1.2),
        Math.round(baseSpacingPx * 1.5),
        Math.round(baseSpacingPx * 1.8),
        Math.round(baseSpacingPx * 2.2),
      ])
    );

    for (const lh of candidateLineHeights) {
      for (const ps of candidateSpacing) {
        const testTypo: TypographySettings = { ...baseTypography, fontSize: optimalFontSize, lineHeight: lh };
        const testSpace: SpacingSettings = { ...baseSpacing, paragraphSpacing: ps };

        const testOptions: PaginationOptions = {
          canvas: baseCanvas,
          typography: testTypo,
          spacing: testSpace,
          advanced,
        };

        const testRes = paginateDocument(doc, testOptions);
        const hasOverflow = testRes.pages.some((p) => p.isOverflowing);

        if (!hasOverflow) {
          const { avg, min } = computeUtilMetrics(testRes);
          // Prefer higher minimum utilization (balances weakest page) and higher average
          const candidateScore = min * 0.65 + avg * 0.35;
          const bestScore = bestMinUtil * 0.65 + bestAvgUtil * 0.35;

          if (candidateScore > bestScore) {
            bestTypography = testTypo;
            bestSpacing = testSpace;
            bestPagination = testRes;
            bestAvgUtil = avg;
            bestMinUtil = min;
          }
        }
      }
    }
  }

  return {
    typography: bestTypography,
    spacing: bestSpacing,
    canvas: baseCanvas,
    paginationResult: bestPagination,
    averageUtilization: bestAvgUtil,
    minUtilization: bestMinUtil,
  };
}
