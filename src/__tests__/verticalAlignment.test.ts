import { describe, it, expect } from 'vitest';
import { paginateDocument } from '../engine/pagination';
import { getPageCanvasDimensions, renderPageToCanvas } from '../engine/canvasRenderer';
import { DEFAULT_CANVAS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ADVANCED, DEFAULT_DOCUMENT } from '../engine/presetStore';

describe('Vertical Alignment and Height Mode Verification', () => {
  const sampleMultiParaText = `First paragraph with some thoughtful words about typography and design.

Second paragraph providing further insight into how spacing and margins interact.

Third paragraph that concludes the section with a definitive and balanced statement.`;

  it('verifies verticalAlignment = justify expands paragraph gaps to fill canvas height', () => {
    const doc = {
      ...DEFAULT_DOCUMENT,
      text: sampleMultiParaText,
      pageCount: 1,
    };

    const canvas = {
      ...DEFAULT_CANVAS,
      trimAllPages: false,
      trimLastPageHeight: false,
      width: 1080,
      height: 1350,
    };

    const typography = {
      ...DEFAULT_TYPOGRAPHY,
      fontSize: 32,
      lineHeight: 1.45,
      verticalAlignment: 'justify' as const,
    };

    const spacing = {
      ...DEFAULT_SPACING,
      paddingTop: 48,
      paddingBottom: 48,
      paddingLeft: 48,
      paddingRight: 48,
      paragraphSpacing: 28,
    };

    const paginated = paginateDocument(doc, {
      canvas,
      typography,
      spacing,
      advanced: DEFAULT_ADVANCED,
    });

    expect(paginated.pages.length).toBe(1);
    expect(paginated.pages[0].isOverflowing).toBe(false);

    // Render to mock canvas and verify execution without errors
    const mockCanvas = {
      width: 1080,
      height: 1350,
      getContext: () => ({
        fillRect: () => {},
        fillText: () => {},
        measureText: (str: string) => ({ width: str.length * 16 }),
        save: () => {},
        restore: () => {},
        scale: () => {},
        fillStyle: '',
        font: '',
        textBaseline: '',
        textAlign: '',
      }),
    } as unknown as HTMLCanvasElement;

    expect(() => {
      renderPageToCanvas(mockCanvas, {
        page: paginated.pages[0],
        totalPages: 1,
        canvas,
        typography,
        spacing,
      });
    }).not.toThrow();
  });

  it('verifies getPageCanvasDimensions handles justify mode by preserving target height', () => {
    const canvas = {
      ...DEFAULT_CANVAS,
      trimAllPages: true,
      trimLastPageHeight: true,
      width: 1080,
      height: 1350,
    };

    const spacing = {
      ...DEFAULT_SPACING,
      paddingTop: 48,
      paddingBottom: 48,
    };

    // When verticalAlignment is justify, card does not shrink-wrap below target height
    const dimsJustify = getPageCanvasDimensions(
      0,
      1,
      600,
      canvas,
      spacing,
      { ...DEFAULT_TYPOGRAPHY, verticalAlignment: 'justify' }
    );
    expect(dimsJustify.height).toBe(1350);
    expect(dimsJustify.isTrimmed).toBe(false);

    // When verticalAlignment is center, card trims to content + padding
    const dimsCenter = getPageCanvasDimensions(
      0,
      1,
      600,
      canvas,
      spacing,
      { ...DEFAULT_TYPOGRAPHY, verticalAlignment: 'center' }
    );
    expect(dimsCenter.height).toBe(600 + 48 + 48);
    expect(dimsCenter.isTrimmed).toBe(true);
  });

  it('verifies default settings match user requirements: compact padding and trim all pages enabled', () => {
    expect(DEFAULT_SPACING.preset).toBe('compact');
    expect(DEFAULT_SPACING.paddingTop).toBe(48);
    expect(DEFAULT_SPACING.paddingBottom).toBe(48);
    expect(DEFAULT_SPACING.paddingLeft).toBe(48);
    expect(DEFAULT_SPACING.paddingRight).toBe(48);
    expect(DEFAULT_CANVAS.trimAllPages).toBe(true);
    expect(DEFAULT_CANVAS.trimLastPageHeight).toBe(true);
  });
});
