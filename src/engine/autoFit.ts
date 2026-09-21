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
    const adaptivePages = bestResult.pages.map((p) => {
      if ((p.utilization >= 95 && p.renderedHeight >= availableHeight * 0.90) || !p.text.trim()) {
        return p;
      }

      const singleDoc: DocumentState = {
        ...doc,
        text: p.text,
        pageCount: 1,
      };

      let low = bestFontSize;
      let high = Math.max(bestFontSize, canvasScaleMax);
      let bestPageRes = p;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const testTypo = { ...options.typography, fontSize: mid };
        const testOpt: PaginationOptions = {
          ...options,
          typography: testTypo,
        };
        const singleRes = paginateDocument(singleDoc, testOpt);
        const singlePage = singleRes.pages[0];
        const overflows = singlePage ? singlePage.renderedHeight > availableHeight || singlePage.isOverflowing : true;

        if (!overflows && singlePage) {
          bestPageRes = {
            ...p,
            lines: singlePage.lines.map((l) => ({
              ...l,
              startIndex: l.startIndex + p.startIndex,
              endIndex: l.endIndex + p.startIndex,
            })),
            renderedHeight: singlePage.renderedHeight,
            utilization: singlePage.utilization,
            overflowPx: singlePage.overflowPx,
            isOverflowing: singlePage.isOverflowing,
            typography: testTypo,
          };
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      return bestPageRes;
    });

    return {
      ...bestResult,
      pages: adaptivePages,
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
