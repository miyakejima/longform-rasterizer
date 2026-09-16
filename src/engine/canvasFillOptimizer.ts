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
import { paginateDocument, PaginationOptions } from './pagination';

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
  const minFont = Math.max(12, advanced.minFontSize || 14);
  const maxFont = Math.max(minFont, 96);

  // Base configuration: eliminate minimum bottom margin & justify vertically for balanced symmetry
  const baseSpacing: SpacingSettings = {
    ...spacing,
    minBottomSpace: 0,
    verticalAlignment: 'justify',
  };

  const baseTypography: TypographySettings = {
    ...typography,
    verticalAlignment: 'justify',
  };

  // Phase 1: Binary search to find the maximum font size that fits without overflow
  let low = minFont;
  let high = maxFont;
  let optimalFontSize = minFont;
  let optimalResult: PaginationResult | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testOptions: PaginationOptions = {
      canvas,
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
    const candidateLineHeights = [
      baseTypography.lineHeight,
      Math.min(2.1, baseTypography.lineHeight + 0.05),
      Math.min(2.1, baseTypography.lineHeight + 0.1),
      Math.min(2.1, baseTypography.lineHeight + 0.15),
      Math.min(2.1, baseTypography.lineHeight + 0.2),
      Math.min(2.1, baseTypography.lineHeight + 0.25),
    ];

    const currentPacing = baseSpacing.paragraphSpacing;
    const candidateSpacing = [
      currentPacing,
      Math.min(64, currentPacing + 6),
      Math.min(64, currentPacing + 12),
      Math.min(64, currentPacing + 18),
      Math.min(64, currentPacing + 24),
      Math.min(64, currentPacing + 32),
    ];

    for (const lh of candidateLineHeights) {
      for (const ps of candidateSpacing) {
        const testTypo: TypographySettings = { ...baseTypography, fontSize: optimalFontSize, lineHeight: lh };
        const testSpace: SpacingSettings = { ...baseSpacing, paragraphSpacing: ps };

        const testOptions: PaginationOptions = {
          canvas,
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
    canvas,
    paginationResult: bestPagination,
    averageUtilization: bestAvgUtil,
    minUtilization: bestMinUtil,
  };
}
