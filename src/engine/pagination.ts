import {
  CanvasSettings,
  DocumentState,
  PageData,
  PaginationResult,
  SpacingSettings,
  TypographySettings,
  AdvancedSettings,
  WrappedLine,
} from '../types';
import { wrapDocument } from './lineWrapper';
import { computeBalanceScore, VisualBalanceOptions } from './visualBalance';
import { parseDocumentSentences, parseDocumentParagraphs } from './documentParser';

export interface PaginationOptions {
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  advanced: AdvancedSettings;
}

export function computePageAvailableHeight(canvas: CanvasSettings, spacing: SpacingSettings): number {
  return Math.max(100, canvas.height - spacing.paddingTop - spacing.paddingBottom - spacing.minBottomSpace);
}

/**
 * Calculates whether rendered content genuinely overflows the physical card boundary.
 * Allows graceful, aesthetic encroachment into generous padding before flagging clipping.
 */
export function computePageOverflow(
  renderedH: number,
  availableHeight: number,
  canvas: CanvasSettings,
  spacing: SpacingSettings
): { overflowPx: number; isOverflowing: boolean } {
  if (renderedH <= availableHeight) {
    return { overflowPx: 0, isOverflowing: false };
  }

  // Graceful buffer into bottom margin before physical canvas edge
  const safeEdgeBuffer = Math.min(24, Math.max(12, spacing.paddingBottom * 0.35));
  const maxSafeRenderedHeight = canvas.height - spacing.paddingTop - safeEdgeBuffer;

  if (renderedH <= maxSafeRenderedHeight) {
    return { overflowPx: 0, isOverflowing: false };
  }

  const overflow = Math.round(renderedH - maxSafeRenderedHeight);
  return { overflowPx: overflow, isOverflowing: overflow > 0 };
}

export function computePageRenderedHeight(
  lines: WrappedLine[],
  lineHeightPx: number,
  paragraphSpacing: number
): number {
  if (lines.length === 0) return 0;
  let height = lines.length * lineHeightPx;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].isParagraphEnd) {
      height += paragraphSpacing;
    }
  }
  return height;
}

export function paginateDocument(
  doc: DocumentState,
  options: PaginationOptions
): PaginationResult {
  const { canvas, typography, spacing, advanced } = options;
  const originalText = doc.text;
  const pageCount = Math.max(1, Math.floor(doc.pageCount));

  const availableWidth = Math.max(100, canvas.width - spacing.paddingLeft - spacing.paddingRight);
  const availableHeight = computePageAvailableHeight(canvas, spacing);
  const lineHeightPx = typography.fontSize * typography.lineHeight;
  const isVerticalJustify = typography.verticalAlignment === 'justify' || spacing.verticalAlignment === 'justify';

  // Wrap all text into lines
  const allLines = wrapDocument(originalText, {
    availableWidth,
    typography,
  });

  const M = allLines.length;

  // Handle empty document
  if (M === 0 || originalText.length === 0) {
    const pages: PageData[] = [];
    for (let p = 0; p < pageCount; p++) {
      pages.push({
        pageIndex: p,
        text: '',
        startIndex: 0,
        endIndex: 0,
        lines: [],
        renderedHeight: 0,
        availableHeight,
        utilization: 0,
        overflowPx: 0,
        isOverflowing: false,
      });
    }
    return {
      pages,
      totalAvailableHeight: availableHeight * pageCount,
      effectiveFontSize: typography.fontSize,
      isAutoFitFailed: false,
      overallScore: 0,
    };
  }

  // Handle Manual Mode
  if (doc.distributionMode === 'manual' && doc.manualBreaks && doc.manualBreaks.length > 0) {
    const sortedBreaks = [...doc.manualBreaks]
      .filter((b) => b > 0 && b < originalText.length)
      .sort((a, b) => a - b);

    // Break lines according to character boundaries
    const breakIndices = [0, ...sortedBreaks, originalText.length];
    const pages: PageData[] = [];

    for (let i = 0; i < breakIndices.length - 1; i++) {
      const bStart = breakIndices[i];
      const bEnd = breakIndices[i + 1];
      const pageSlice = originalText.slice(bStart, bEnd);
      const pageLines = wrapDocument(pageSlice, { availableWidth, typography }).map((l) => ({
        ...l,
        startIndex: l.startIndex + bStart,
        endIndex: l.endIndex + bStart,
      }));

      const renderedH = computePageRenderedHeight(pageLines, lineHeightPx, spacing.paragraphSpacing);
      const { overflowPx, isOverflowing } = computePageOverflow(renderedH, availableHeight, canvas, spacing);
      const isTrimmedPage = Boolean(
        (canvas.trimAllPages || (canvas.trimLastPageHeight && pageCount > 1 && i === pageCount - 1)) &&
        renderedH < availableHeight
      );
      const isFull = (isVerticalJustify || isTrimmedPage || renderedH >= availableHeight) && !isOverflowing;
      pages.push({
        pageIndex: i,
        text: pageSlice,
        startIndex: bStart,
        endIndex: bEnd,
        lines: pageLines,
        renderedHeight: renderedH,
        availableHeight,
        utilization: isFull
          ? 100
          : Math.min(100, Math.round((renderedH / availableHeight) * 100)),
        overflowPx,
        isOverflowing,
      });
    }

    // Pad or slice to match pageCount if requested
    while (pages.length < pageCount) {
      const last = pages[pages.length - 1];
      pages.push({
        pageIndex: pages.length,
        text: '',
        startIndex: last.endIndex,
        endIndex: last.endIndex,
        lines: [],
        renderedHeight: 0,
        availableHeight,
        utilization: 0,
        overflowPx: 0,
        isOverflowing: false,
      });
    }

    if (pages.length > 0) {
      const last = pages[pages.length - 1];
      if (last.endIndex < originalText.length) {
        last.endIndex = originalText.length;
        last.text = originalText.slice(last.startIndex, originalText.length);
      }
    }

    return {
      pages,
      totalAvailableHeight: availableHeight * pages.length,
      effectiveFontSize: typography.fontSize,
      isAutoFitFailed: false,
      overallScore: 0,
    };
  }

  // If pageCount === 1, all lines go to single page
  if (pageCount === 1) {
    const renderedH = computePageRenderedHeight(allLines, lineHeightPx, spacing.paragraphSpacing);
    const { overflowPx, isOverflowing } = computePageOverflow(renderedH, availableHeight, canvas, spacing);
    const isFull = renderedH >= availableHeight && !isOverflowing;
    return {
      pages: [
        {
          pageIndex: 0,
          text: originalText,
          startIndex: 0,
          endIndex: originalText.length,
          lines: allLines,
          renderedHeight: renderedH,
          availableHeight,
          utilization: isFull ? 100 : Math.min(100, Math.round((renderedH / availableHeight) * 100)),
          overflowPx,
          isOverflowing,
        },
      ],
      totalAvailableHeight: availableHeight,
      effectiveFontSize: typography.fontSize,
      isAutoFitFailed: false,
      overallScore: 0,
    };
  }

  // If fewer lines than page count, assign 1 line per page until empty
  if (M < pageCount) {
    const pages: PageData[] = [];
    let currentIdx = 0;
    for (let p = 0; p < pageCount; p++) {
      if (p < M) {
        const line = allLines[p];
        const pageText = originalText.slice(currentIdx, line.endIndex);
        const renderedH = computePageRenderedHeight([line], lineHeightPx, spacing.paragraphSpacing);
        pages.push({
          pageIndex: p,
          text: pageText,
          startIndex: currentIdx,
          endIndex: line.endIndex,
          lines: [line],
          renderedHeight: renderedH,
          availableHeight,
          utilization: Math.min(100, Math.round((renderedH / availableHeight) * 100)),
          overflowPx: 0,
          isOverflowing: false,
        });
        currentIdx = line.endIndex;
      } else {
        pages.push({
          pageIndex: p,
          text: '',
          startIndex: currentIdx,
          endIndex: currentIdx,
          lines: [],
          renderedHeight: 0,
          availableHeight,
          utilization: 0,
          overflowPx: 0,
          isOverflowing: false,
        });
      }
    }

    if (pages.length > 0) {
      const last = pages[pages.length - 1];
      if (last.endIndex < originalText.length) {
        last.endIndex = originalText.length;
        last.text = originalText.slice(last.startIndex, originalText.length);
      }
    }
    return {
      pages,
      totalAvailableHeight: availableHeight * pageCount,
      effectiveFontSize: typography.fontSize,
      isAutoFitFailed: false,
      overallScore: 0,
    };
  }

  // BALANCED & PARAGRAPH-PRESERVING: Dynamic Programming
  const totalDocHeight = computePageRenderedHeight(allLines, lineHeightPx, spacing.paragraphSpacing);

  const avgHeight = totalDocHeight / pageCount;
  let targetHeight = avgHeight;
  if (avgHeight < availableHeight) {
    if (advanced.densityTarget === 'airy') {
      targetHeight = Math.min(avgHeight, availableHeight * 0.72);
    } else if (advanced.densityTarget === 'dense') {
      targetHeight = Math.max(avgHeight, Math.min(availableHeight * 0.95, totalDocHeight));
    } else {
      targetHeight = avgHeight;
    }
  }

  const safeEdgeBuffer = Math.min(24, Math.max(12, spacing.paddingBottom * 0.35));
  const maxSafeHeight = canvas.height - spacing.paddingTop - safeEdgeBuffer;

  const balanceOpts: VisualBalanceOptions = {
    availableHeight,
    maxSafeHeight,
    targetHeight,
    balanceStrength: advanced.balanceStrength,
    densityTarget: advanced.densityTarget,
    preventOrphanLines: advanced.preventOrphanLines,
    mode: doc.distributionMode === 'paragraph-preserving' ? 'paragraph-preserving' : 'balanced',
  };

  // 1. PARAGRAPH-LEVEL PARTITIONING:
  // Whenever there are at least as many paragraphs as requested pages,
  // evaluate whole-paragraph partitions first. This strictly prevents splitting paragraphs across pages!
  const parsedParagraphs = parseDocumentParagraphs(originalText);
  if (parsedParagraphs.length >= pageCount) {
    const P = parsedParagraphs.length;
    const dpP: number[][] = Array.from({ length: pageCount + 1 }, () => new Array(P + 1).fill(Infinity));
    const parentP: number[][] = Array.from({ length: pageCount + 1 }, () => new Array(P + 1).fill(0));
    dpP[0][0] = 0;

    const paraSpanCache = new Map<number, { height: number; lines: WrappedLine[] }>();
    function getParaSpan(k: number, j: number) {
      const key = k * 10000 + j;
      const cached = paraSpanCache.get(key);
      if (cached !== undefined) return cached;
      const startChar = parsedParagraphs[k].startIndex;
      const endChar = parsedParagraphs[j - 1].endIndex;
      const spanText = originalText.slice(startChar, endChar);
      const spanLines = wrapDocument(spanText, { availableWidth, typography });
      const h = computePageRenderedHeight(spanLines, lineHeightPx, spacing.paragraphSpacing);
      const data = { height: h, lines: spanLines };
      paraSpanCache.set(key, data);
      return data;
    }

    for (let p = 1; p <= pageCount; p++) {
      for (let j = p; j <= P; j++) {
        const minK = p - 1;
        const maxK = j - 1;

        for (let k = minK; k <= maxK; k++) {
          if (dpP[p - 1][k] === Infinity) continue;
          const spanData = getParaSpan(k, j);
          // Entire paragraphs: isParagraphEnd is true, isSentenceEnd is true
          const cost = computeBalanceScore(spanData.height, balanceOpts, true, true, false, false);
          const total = dpP[p - 1][k] + cost;
          if (total < dpP[p][j]) {
            dpP[p][j] = total;
            parentP[p][j] = k;
          }
        }
      }
    }

    // If valid whole-paragraph partition exists without individual page overflow:
    if (dpP[pageCount][P] < 10_000_000) {
      const splitParas: number[] = new Array(pageCount + 1);
      splitParas[pageCount] = P;
      let curr = P;
      for (let p = pageCount; p >= 1; p--) {
        curr = parentP[p][curr];
        splitParas[p - 1] = curr;
      }

      if (splitParas[0] === 0 && splitParas[pageCount] === P) {
        const pages: PageData[] = [];
        let prevEnd = 0;
        for (let p = 0; p < pageCount; p++) {
          const startP = splitParas[p];
          const endP = splitParas[p + 1];
          const startChar = prevEnd;
          const endChar = endP === P ? originalText.length : parsedParagraphs[endP - 1].endIndex;
          const pageText = originalText.slice(startChar, endChar);
          prevEnd = endChar;

          const spanData = getParaSpan(startP, endP);
          const pageLines = spanData.lines.map((l) => ({
            ...l,
            startIndex: l.startIndex + startChar,
            endIndex: l.endIndex + startChar,
          }));
          const renderedH = spanData.height;
          const { overflowPx, isOverflowing } = computePageOverflow(renderedH, availableHeight, canvas, spacing);
          const isTrimmedPage = Boolean(
            (canvas.trimAllPages || (canvas.trimLastPageHeight && pageCount > 1 && p === pageCount - 1)) &&
            renderedH < availableHeight
          );
          const isFull = (isTrimmedPage || renderedH >= availableHeight) && !isOverflowing;
          const util = isFull
            ? 100
            : Math.min(100, Math.round((renderedH / availableHeight) * 100));

          pages.push({
            pageIndex: p,
            text: pageText,
            startIndex: startChar,
            endIndex: endChar,
            lines: pageLines,
            renderedHeight: renderedH,
            availableHeight,
            utilization: util,
            overflowPx,
            isOverflowing,
          });
        }

        if (pages.length > 0) {
          const lastPage = pages[pages.length - 1];
          if (lastPage.endIndex < originalText.length) {
            lastPage.endIndex = originalText.length;
            lastPage.text = originalText.slice(lastPage.startIndex, originalText.length);
          }
        }

        return {
          pages,
          totalAvailableHeight: availableHeight * pageCount,
          effectiveFontSize: typography.fontSize,
          isAutoFitFailed: false,
          overallScore: dpP[pageCount][P],
        };
      }
    }
  }

  // 2. SENTENCE-LEVEL PARTITIONING:
  // Fallback when fewer paragraphs than pages or when an individual paragraph overflows page bounds
  const sentenceChunks = parseDocumentSentences(originalText);
  if (sentenceChunks.length >= pageCount) {
    const S = sentenceChunks.length;
    const dpS: number[][] = Array.from({ length: pageCount + 1 }, () => new Array(S + 1).fill(Infinity));
    const parentS: number[][] = Array.from({ length: pageCount + 1 }, () => new Array(S + 1).fill(0));
    dpS[0][0] = 0;

    const chunkSpanCache = new Map<number, number>();
    function getChunkSpanHeight(k: number, j: number): number {
      const key = k * 10000 + j;
      const cached = chunkSpanCache.get(key);
      if (cached !== undefined) return cached;
      const startChar = sentenceChunks[k].startIndex;
      const endChar = sentenceChunks[j - 1].endIndex;
      const spanText = originalText.slice(startChar, endChar);
      const spanLines = wrapDocument(spanText, { availableWidth, typography });
      const h = computePageRenderedHeight(spanLines, lineHeightPx, spacing.paragraphSpacing);
      chunkSpanCache.set(key, h);
      return h;
    }

    for (let p = 1; p <= pageCount; p++) {
      for (let j = p; j <= S; j++) {
        const lastChunk = sentenceChunks[j - 1];
        const isParaEnd = lastChunk.isParagraphEnd;
        const minK = p - 1;
        const maxK = j - 1;

        for (let k = minK; k <= maxK; k++) {
          if (dpS[p - 1][k] === Infinity) continue;
          const spanH = getChunkSpanHeight(k, j);
          const cost = computeBalanceScore(spanH, balanceOpts, isParaEnd, true, false, false);
          const total = dpS[p - 1][k] + cost;
          if (total < dpS[p][j]) {
            dpS[p][j] = total;
            parentS[p][j] = k;
          }
        }
      }
    }

    if (dpS[pageCount][S] < 50_000_000) {
      const splitChunks: number[] = new Array(pageCount + 1);
      splitChunks[pageCount] = S;
      let curr = S;
      for (let p = pageCount; p >= 1; p--) {
        curr = parentS[p][curr];
        splitChunks[p - 1] = curr;
      }

      if (splitChunks[0] === 0 && splitChunks[pageCount] === S) {
        const pages: PageData[] = [];
        let prevEnd = 0;
        for (let p = 0; p < pageCount; p++) {
          const endC = splitChunks[p + 1];
          const startChar = prevEnd;
          const endChar = endC === S ? originalText.length : sentenceChunks[endC - 1].endIndex;
          const pageText = originalText.slice(startChar, endChar);
          prevEnd = endChar;

          const pageLines = wrapDocument(pageText, { availableWidth, typography }).map((l) => ({
            ...l,
            startIndex: l.startIndex + startChar,
            endIndex: l.endIndex + startChar,
          }));
          const renderedH = computePageRenderedHeight(pageLines, lineHeightPx, spacing.paragraphSpacing);
          const { overflowPx, isOverflowing } = computePageOverflow(renderedH, availableHeight, canvas, spacing);
          const isTrimmedPage = Boolean(
            (canvas.trimAllPages || (canvas.trimLastPageHeight && pageCount > 1 && p === pageCount - 1)) &&
            renderedH < availableHeight
          );
          const isFull = (isTrimmedPage || renderedH >= availableHeight) && !isOverflowing;
          const util = isFull
            ? 100
            : Math.min(100, Math.round((renderedH / availableHeight) * 100));

          pages.push({
            pageIndex: p,
            text: pageText,
            startIndex: startChar,
            endIndex: endChar,
            lines: pageLines,
            renderedHeight: renderedH,
            availableHeight,
            utilization: util,
            overflowPx,
            isOverflowing,
          });
        }

        if (pages.length > 0) {
          const lastPage = pages[pages.length - 1];
          if (lastPage.endIndex < originalText.length) {
            lastPage.endIndex = originalText.length;
            lastPage.text = originalText.slice(lastPage.startIndex, originalText.length);
          }
        }

        return {
          pages,
          totalAvailableHeight: availableHeight * pageCount,
          effectiveFontSize: typography.fontSize,
          isAutoFitFailed: false,
          overallScore: dpS[pageCount][S],
        };
      }
    }
  }

  // Precompute heights for lines i..j-1
  // To keep memory small, compute on the fly or with prefix sums
  const prefixLineHeights = new Float64Array(M + 1);
  const prefixParaEnds = new Int32Array(M + 1);
  for (let i = 0; i < M; i++) {
    prefixLineHeights[i + 1] = prefixLineHeights[i] + lineHeightPx;
    prefixParaEnds[i + 1] = prefixParaEnds[i] + (allLines[i].isParagraphEnd ? 1 : 0);
  }

  function getSpanHeight(i: number, j: number): number {
    if (j <= i) return 0;
    const baseH = prefixLineHeights[j] - prefixLineHeights[i];
    // paragraph ends strictly between i and j-2 (not including the last line j-1)
    const paraEnds = Math.max(0, prefixParaEnds[j - 1] - prefixParaEnds[i]);
    return baseH + paraEnds * spacing.paragraphSpacing;
  }

  // DP table: dp[p][j] = min cost to partition first j lines into p pages
  // parent[p][j] = optimal previous line index k
  const dp: number[][] = Array.from({ length: pageCount + 1 }, () => new Array(M + 1).fill(Infinity));
  const parent: number[][] = Array.from({ length: pageCount + 1 }, () => new Array(M + 1).fill(0));

  dp[0][0] = 0;

  for (let p = 1; p <= pageCount; p++) {
    for (let j = p; j <= M; j++) {
      // Line j-1 metadata
      const lastLine = allLines[j - 1];
      const isParaEnd = lastLine.isParagraphEnd;
      const isSentenceEnd = lastLine.isSentenceEnd;
      // An orphan at the bottom of the page occurs if the page ends on line 0 of a multi-line paragraph
      const isOrphan = lastLine.lineInParagraph === 0 && lastLine.totalLinesInParagraph > 1;

      // Search previous boundary k
      const minK = p - 1;
      const maxK = j - 1;

      for (let k = minK; k <= maxK; k++) {
        if (dp[p - 1][k] === Infinity) continue;

        // A widow at the top of page p occurs if page p starts on the lonely last line of a multi-line paragraph
        const firstLine = allLines[k];
        const isWidow = firstLine.lineInParagraph === firstLine.totalLinesInParagraph - 1 && firstLine.totalLinesInParagraph > 1;

        const spanH = getSpanHeight(k, j);
        const cost = computeBalanceScore(spanH, balanceOpts, isParaEnd, isSentenceEnd, isOrphan, isWidow);
        const total = dp[p - 1][k] + cost;

        if (total < dp[p][j]) {
          dp[p][j] = total;
          parent[p][j] = k;
        }
      }
    }
  }

  // Backtrack to find partition line indices
  const splitPoints: number[] = new Array(pageCount + 1);
  splitPoints[pageCount] = M;
  let curr = M;
  for (let p = pageCount; p >= 1; p--) {
    curr = parent[p][curr];
    splitPoints[p - 1] = curr;
  }

  // If DP failed to find a valid non-infinite path (e.g. extreme constraints), fall back to even line distribution
  if (splitPoints[0] !== 0 || splitPoints[pageCount] !== M) {
    for (let p = 0; p <= pageCount; p++) {
      splitPoints[p] = Math.round((p * M) / pageCount);
    }
  }

  const pages: PageData[] = [];
  let prevEndIndex = 0;

  for (let p = 0; p < pageCount; p++) {
    const startLineIdx = splitPoints[p];
    const endLineIdx = splitPoints[p + 1];
    const pageLines = allLines.slice(startLineIdx, endLineIdx);

    const startChar = prevEndIndex;
    const endChar = pageLines.length > 0 ? pageLines[pageLines.length - 1].endIndex : startChar;
    const pageText = originalText.slice(startChar, endChar);
    prevEndIndex = endChar;

    const renderedH = getSpanHeight(startLineIdx, endLineIdx);
    const { overflowPx, isOverflowing } = computePageOverflow(renderedH, availableHeight, canvas, spacing);
    const isTrimmedPage = Boolean(
      (canvas.trimAllPages || (canvas.trimLastPageHeight && pageCount > 1 && p === pageCount - 1)) &&
      renderedH < availableHeight
    );
    const isFull = (isTrimmedPage || renderedH >= availableHeight) && !isOverflowing;

    pages.push({
      pageIndex: p,
      text: pageText,
      startIndex: startChar,
      endIndex: endChar,
      lines: pageLines,
      renderedHeight: renderedH,
      availableHeight,
      utilization: isFull
        ? 100
        : Math.min(100, Math.round((renderedH / availableHeight) * 100)),
      overflowPx,
      isOverflowing,
    });
  }

  // Ensure last page reaches the end of originalText
  if (pages.length > 0) {
    const lastPage = pages[pages.length - 1];
    if (lastPage.endIndex < originalText.length) {
      lastPage.endIndex = originalText.length;
      lastPage.text = originalText.slice(lastPage.startIndex, originalText.length);
    }
  }

  return {
    pages,
    totalAvailableHeight: availableHeight * pageCount,
    effectiveFontSize: typography.fontSize,
    isAutoFitFailed: false,
    overallScore: dp[pageCount][M],
  };
}
