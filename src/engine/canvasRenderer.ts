// Deterministic Canvas Renderer

import {
  CanvasSettings,
  ExportScale,
  PageData,
  SpacingSettings,
  TypographySettings,
} from '../types';
import { measureTextWidth } from './textMeasurement';

export interface RenderCanvasOptions {
  page: PageData;
  totalPages?: number;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  scale?: ExportScale;
}

export function getPageCanvasDimensions(
  pageIndex: number,
  totalPages: number,
  pageRenderedHeight: number,
  canvas: CanvasSettings,
  spacing: SpacingSettings
): { width: number; height: number; isTrimmed: boolean } {
  if (canvas.trimLastPageHeight && totalPages > 1 && pageIndex === totalPages - 1) {
    const naturalHeight = Math.round(pageRenderedHeight + spacing.paddingTop + spacing.paddingBottom);
    if (naturalHeight < canvas.height && naturalHeight > 100) {
      return { width: canvas.width, height: naturalHeight, isTrimmed: true };
    }
  }
  return { width: canvas.width, height: canvas.height, isTrimmed: false };
}

export function renderPageToCanvas(
  targetCanvas: HTMLCanvasElement,
  options: RenderCanvasOptions
): void {
  const { page, totalPages = 1, canvas, typography: baseTypography, spacing, scale = 1 } = options;
  const typography = page.typography ?? baseTypography;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const pageDims = getPageCanvasDimensions(
    page.pageIndex,
    totalPages,
    page.renderedHeight,
    canvas,
    spacing
  );

  const effectiveCanvasWidth = pageDims.width;
  const effectiveCanvasHeight = pageDims.height;

  const width = effectiveCanvasWidth * scale;
  const height = effectiveCanvasHeight * scale;

  targetCanvas.width = width;
  targetCanvas.height = height;

  // Save context state
  ctx.save();
  ctx.scale(scale, scale);

  // Background
  if (canvas.transparentBackground) {
    ctx.clearRect(0, 0, effectiveCanvasWidth, effectiveCanvasHeight);
  } else {
    ctx.fillStyle = canvas.backgroundColor;
    ctx.fillRect(0, 0, effectiveCanvasWidth, effectiveCanvasHeight);
  }

  const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textColor, alignment } =
    typography;
  const { paddingTop, paddingLeft, paddingRight, paragraphSpacing } = spacing;
  const contentWidth = Math.max(10, effectiveCanvasWidth - paddingLeft - paddingRight);
  const lineBoxHeight = fontSize * lineHeight;

  ctx.fillStyle = textColor;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';

  if ('letterSpacing' in ctx) {
    try {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
    } catch {
      // Ignored if unsupported
    }
  }

  const verticalAlignment = typography.verticalAlignment ?? spacing.verticalAlignment ?? 'center';
  const availableHeight = effectiveCanvasHeight - paddingTop - spacing.paddingBottom - (spacing.minBottomSpace || 0);

  // Compute vertical space distribution
  const remainingSpace = Math.max(0, availableHeight - page.renderedHeight);
  let extraParaSpacing = 0;
  let extraLineSpacing = 0;
  let currentY = paddingTop;

  if (pageDims.isTrimmed) {
    // When trimmed, the canvas height matches the text exactly + padding
    currentY = paddingTop;
  } else if (verticalAlignment === 'center' && remainingSpace > 0) {
    // Clean, natural vertical centering as a unified block (normal uniform paragraph spacing!)
    currentY = paddingTop + remainingSpace / 2;
  } else if (verticalAlignment === 'top') {
    currentY = paddingTop;
  } else if (verticalAlignment === 'justify' && remainingSpace > 0) {
    const internalParagraphEnds = page.lines.reduce((acc, line, idx) => {
      return idx < page.lines.length - 1 && line.isParagraphEnd ? acc + 1 : acc;
    }, 0);

    if (internalParagraphEnds > 0) {
      // Multiple paragraphs: expand paragraph gaps tastefully up to a sane limit
      const maxExtraPara = Math.min(36, Math.max(12, Math.round(spacing.paragraphSpacing * 0.8)));
      const neededParaPerGap = remainingSpace / internalParagraphEnds;
      if (neededParaPerGap <= maxExtraPara) {
        extraParaSpacing = neededParaPerGap;
      } else {
        extraParaSpacing = maxExtraPara;
        const remainingAfterParas = remainingSpace - maxExtraPara * internalParagraphEnds;
        currentY = paddingTop + remainingAfterParas / 2;
      }
    } else {
      // Single paragraph on page: NEVER blow apart lines!
      // Keep natural line height and center the paragraph vertically
      currentY = paddingTop + remainingSpace / 2;
    }
  }

  for (let i = 0; i < page.lines.length; i++) {
    const line = page.lines[i];
    const lineText = line.text;

    if (lineText.length === 0) {
      currentY += lineBoxHeight + extraLineSpacing;
      if (line.isParagraphEnd && i < page.lines.length - 1) {
        currentY += paragraphSpacing + extraParaSpacing;
      }
      continue;
    }

    const baselineY = currentY + lineBoxHeight / 2;

    if (alignment === 'justify' && !line.isParagraphEnd && !line.isHardBreak) {
      // Justified rendering (only soft-wrapped lines, preserving indentation)
      const leadingSpaceMatch = lineText.match(/^[\t ]+/);
      const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
      const contentText = lineText.slice(leadingSpace.length);
      const leadingSpaceWidth = leadingSpace.length > 0
        ? measureTextWidth(leadingSpace, fontFamily, fontSize, fontWeight, letterSpacing)
        : 0;

      const words = contentText.trim().split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        const wordWidths = words.map((w) =>
          measureTextWidth(w, fontFamily, fontSize, fontWeight, letterSpacing)
        );
        const totalWordsWidth = wordWidths.reduce((a, b) => a + b, 0);
        const totalGapSpace = (contentWidth - leadingSpaceWidth) - totalWordsWidth;
        const gapSize = Math.max(0, totalGapSpace / (words.length - 1));

        ctx.textAlign = 'left';
        let wordX = paddingLeft + leadingSpaceWidth;
        for (let wIdx = 0; wIdx < words.length; wIdx++) {
          ctx.fillText(words[wIdx], wordX, baselineY);
          wordX += wordWidths[wIdx] + gapSize;
        }
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(lineText, paddingLeft, baselineY);
      }
    } else if (alignment === 'center') {
      ctx.textAlign = 'center';
      const centerX = paddingLeft + contentWidth / 2;
      ctx.fillText(lineText, centerX, baselineY);
    } else if (alignment === 'right') {
      ctx.textAlign = 'right';
      const rightX = canvas.width - paddingRight;
      ctx.fillText(lineText, rightX, baselineY);
    } else {
      // Left alignment (default)
      ctx.textAlign = 'left';
      ctx.fillText(lineText, paddingLeft, baselineY);
    }

    currentY += lineBoxHeight + extraLineSpacing;
    if (line.isParagraphEnd && i < page.lines.length - 1) {
      currentY += paragraphSpacing + extraParaSpacing;
    }
  }

  ctx.restore();
}
