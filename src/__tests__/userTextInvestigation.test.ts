import { describe, it, expect } from 'vitest';
import { autoFitFontSize } from '../engine/autoFit';
import { optimizeCanvasFill } from '../engine/canvasFillOptimizer';
import {
  DEFAULT_ADVANCED,
  DEFAULT_CANVAS,
  DEFAULT_DOCUMENT,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
} from '../engine/presetStore';

const paragraphText = 'test '.repeat(172).trim();
const userFullText = [
  paragraphText,
  paragraphText,
  paragraphText,
  paragraphText,
  paragraphText,
  paragraphText,
].join('\n\n');

describe('User Text Investigation', () => {
  it('guarantees >= 95% utilization across all 4 pages on user 6-paragraph text without splitting paragraphs', () => {
    const doc = {
      ...DEFAULT_DOCUMENT,
      text: userFullText,
      pageCount: 4,
      distributionMode: 'paragraph-preserving' as const,
    };

    const autoFitRes = autoFitFontSize(doc, {
      canvas: DEFAULT_CANVAS,
      typography: DEFAULT_TYPOGRAPHY,
      spacing: { ...DEFAULT_SPACING, preset: 'compact', paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48, minBottomSpace: 0 },
      advanced: { ...DEFAULT_ADVANCED, autoFit: true },
    });

    expect(autoFitRes.pages.length).toBe(4);
    for (const page of autoFitRes.pages) {
      expect(page.isOverflowing).toBe(false);
      expect(page.utilization).toBeGreaterThanOrEqual(95);
    }

    const fillRes = optimizeCanvasFill(
      doc,
      { ...DEFAULT_CANVAS, trimLastPageHeight: false },
      DEFAULT_TYPOGRAPHY,
      { ...DEFAULT_SPACING, preset: 'compact', paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48, minBottomSpace: 0 },
      DEFAULT_ADVANCED
    );

    expect(fillRes.paginationResult.pages.length).toBe(4);
    for (const page of fillRes.paginationResult.pages) {
      expect(page.isOverflowing).toBe(false);
      expect(page.utilization).toBeGreaterThanOrEqual(95);
    }
  });
});

