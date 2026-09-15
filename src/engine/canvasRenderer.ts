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

  let currentY = paddingTop;

  for (let i = 0; i < page.lines.length; i++) {
    const line = page.lines[i];
    const lineText = line.text;

    if (lineText.length === 0) {
      currentY += lineBoxHeight;
      if (line.isParagraphEnd) {
        currentY += paragraphSpacing;
      }
      continue;
    }

    const baselineY = currentY + lineBoxHeight / 2;

    if (alignment === 'justify' && !line.isParagraphEnd) {
      // Justified rendering
      const words = lineText.trim().split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        const wordWidths = words.map((w) =>
          measureTextWidth(w, fontFamily, fontSize, fontWeight, letterSpacing)
        );
        const totalWordsWidth = wordWidths.reduce((a, b) => a + b, 0);
        const totalGapSpace = contentWidth - totalWordsWidth;
        const gapSize = Math.max(0, totalGapSpace / (words.length - 1));

        ctx.textAlign = 'left';
        let wordX = paddingLeft;
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

    currentY += lineBoxHeight;
    if (line.isParagraphEnd) {
      currentY += paragraphSpacing;
    }
  }

  ctx.restore();
}
