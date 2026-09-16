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
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  scale?: ExportScale;
}

export function renderPageToCanvas(
  targetCanvas: HTMLCanvasElement,
  options: RenderCanvasOptions
): void {
  const { page, canvas, typography, spacing, scale = 1 } = options;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width * scale;
  const height = canvas.height * scale;

  targetCanvas.width = width;
  targetCanvas.height = height;

  // Save context state
  ctx.save();
  ctx.scale(scale, scale);

  // Background
  if (canvas.transparentBackground) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textColor, alignment } =
    typography;
  const { paddingTop, paddingLeft, paddingRight, paragraphSpacing } = spacing;
  const contentWidth = Math.max(10, canvas.width - paddingLeft - paddingRight);
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
  const availableHeight = page.availableHeight ?? (canvas.height - paddingTop - spacing.paddingBottom - (spacing.minBottomSpace || 0));

  // Compute vertical space distribution
  const remainingSpace = Math.max(0, availableHeight - page.renderedHeight);
  const internalParagraphEnds = page.lines.reduce((acc, line, idx) => {
    return idx < page.lines.length - 1 && line.isParagraphEnd ? acc + 1 : acc;
  }, 0);

  let extraParaSpacing = 0;
  let extraLineSpacing = 0;
  let currentY = paddingTop;

  if (verticalAlignment === 'justify' && remainingSpace > 0) {
    if (internalParagraphEnds > 0) {
      extraParaSpacing = remainingSpace / internalParagraphEnds;
    } else if (page.lines.length > 1) {
      const perLine = remainingSpace / (page.lines.length - 1);
      if (perLine <= lineBoxHeight * 0.4) {
        extraLineSpacing = perLine;
      } else {
        currentY = paddingTop + remainingSpace / 2;
      }
    } else {
      currentY = paddingTop + remainingSpace / 2;
    }
  } else if (verticalAlignment === 'center' && remainingSpace > 0) {
    currentY = paddingTop + remainingSpace / 2;
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
