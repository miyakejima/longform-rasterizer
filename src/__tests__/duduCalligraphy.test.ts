import { describe, it, expect } from 'vitest';
import { measureTextWidth } from '../engine/textMeasurement';
import { renderPageToCanvas } from '../engine/canvasRenderer';
import { DEFAULT_CANVAS, DEFAULT_SPACING, DEFAULT_TYPOGRAPHY } from '../engine/presetStore';
import { PageData } from '../types';

describe('Dudu Calligraphy & Life is Strange Font Engine Integration', () => {
  it('measures text with Dudu Calligraphy without error', () => {
    const text = 'Dear Diary, Life is Strange.';
    const width = measureTextWidth(text, 'Dudu Calligraphy', 27, 400);
    expect(width).toBeGreaterThan(0);
  });

  it('measures text with HelvetiHand without error', () => {
    const text = 'Ready for the mosh pit, shaka brah.';
    const width = measureTextWidth(text, 'HelvetiHand', 27, 400);
    expect(width).toBeGreaterThan(0);
  });

  it('measures text with all new DaFont fonts without error', () => {
    const fonts = [
      'Cutewritten',
      'Stay With Me',
      'Internet Friends',
      'Winkle',
      'April',
      'Reading Notes',
      'Classic Milky',
      'i eat crayons',
    ];
    for (const f of fonts) {
      const w = measureTextWidth('Sample diary handwriting text', f, 27, 400);
      expect(w).toBeGreaterThan(0);
    }
  });


  it('properly quotes multi-word font families in canvas renderer', () => {
    const mockCtx = {
      save: () => {},
      restore: () => {},
      scale: () => {},
      clearRect: () => {},
      fillRect: () => {},
      fillText: () => {},
      measureText: () => ({ width: 100 }),
      set font(val: string) {
        this._font = val;
      },
      get font() {
        return this._font || '';
      },
      _font: '',
      fillStyle: '',
      textBaseline: '',
    };

    const mockCanvas = {
      getContext: () => mockCtx,
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement;

    const page: PageData = {
      pageIndex: 0,
      text: 'This action will have consequences...',
      startIndex: 0,
      endIndex: 37,
      lines: [
        {
          text: 'This action will have consequences...',
          rawText: 'This action will have consequences...',
          width: 300,
          startIndex: 0,
          endIndex: 37,
          isParagraphStart: true,
          isParagraphEnd: true,
          isSentenceEnd: true,
          paragraphIndex: 0,
          lineInParagraph: 0,
          totalLinesInParagraph: 1,
        },
      ],
      renderedHeight: 100,
      availableHeight: 1254,
      utilization: 8,
      overflowPx: 0,
      isOverflowing: false,
    };

    renderPageToCanvas(mockCanvas, {
      page,
      canvas: DEFAULT_CANVAS,
      spacing: DEFAULT_SPACING,
      typography: {
        ...DEFAULT_TYPOGRAPHY,
        fontFamily: 'Dudu Calligraphy',
      },
    });

    const ctx = mockCanvas.getContext('2d') as unknown as { _font: string };
    expect(ctx._font).toContain('"Dudu Calligraphy"');
  });
});
