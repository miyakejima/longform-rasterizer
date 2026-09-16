// Binary Search Auto-Fit Font Size Engine

import { DocumentState, PaginationResult } from '../types';
import { paginateDocument, PaginationOptions } from './pagination';

export function autoFitFontSize(
  doc: DocumentState,
  options: PaginationOptions
): PaginationResult {
  const minFont = Math.max(8, options.advanced.minFontSize || 16);
  // Calculate dynamic upper bound based on canvas dimensions so high-res canvases (e.g. 4000x4000) or short texts can scale up properly
  const availableWidth = Math.max(100, options.canvas.width - options.spacing.paddingLeft - options.spacing.paddingRight);
  const availableHeight = Math.max(100, options.canvas.height - options.spacing.paddingTop - options.spacing.paddingBottom);
  const canvasScaleMax = Math.max(160, Math.floor(Math.min(availableWidth, availableHeight) / 2));
  const maxFont = options.advanced.maxFontSize && options.advanced.maxFontSize !== 64
    ? Math.max(minFont, options.advanced.maxFontSize)
    : Math.max(minFont, canvasScaleMax);

  let low = minFont;
  let high = maxFont;
  let bestFontSize = minFont;
  let bestResult: PaginationResult | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testOptions: PaginationOptions = {
      ...options,
      typography: {
        ...options.typography,
        fontSize: mid,
      },
    };

    const result = paginateDocument(doc, testOptions);
    const hasOverflow = result.pages.some((p) => p.isOverflowing);

    if (!hasOverflow) {
      bestFontSize = mid;
      bestResult = result;
      // Try a larger font size
      low = mid + 1;
    } else {
      // Too big, shrink font size
      high = mid - 1;
    }
  }

  if (bestResult) {
    return {
      ...bestResult,
      effectiveFontSize: bestFontSize,
      isAutoFitFailed: false,
    };
  }

  // If even at minFont it overflows:
  const fallbackOptions: PaginationOptions = {
    ...options,
    typography: {
      ...options.typography,
      fontSize: minFont,
    },
  };
  const fallbackResult = paginateDocument(doc, fallbackOptions);
  const pageCount = doc.pageCount;

  return {
    ...fallbackResult,
    effectiveFontSize: minFont,
    isAutoFitFailed: true,
    autoFitWarning: `Text does not fit in ${pageCount} image${pageCount > 1 ? 's' : ''} at the minimum font size (${minFont}px). Increase page count, reduce margins, reduce paragraph spacing, or increase canvas size.`,
  };
}
