import { describe, it, expect } from 'vitest';
import { autoFitFontSize } from '../engine/autoFit';
import { paginateDocument } from '../engine/pagination';
import {
  DEFAULT_CANVAS,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ADVANCED,
} from '../engine/presetStore';
import { DocumentState } from '../types';

describe('Performance Benchmark: 35k character text', () => {
  // Generate a realistic 35,000 character text with multiple paragraphs
  const sampleParagraph = `In the realm of modern typography and digital editorial design, achieving visual balance is an intricate discipline that requires careful consideration of character geometry, line metrics, and white space distribution. When longform essays are presented across multi-card formats, maintaining paragraph integrity and preventing awkward orphan lines becomes essential for a cohesive reading experience. Readers should never feel disoriented by arbitrary cuts or abrupt column breaks that disrupt the cadence of thought.\n\n`;
  const repeatCount = Math.ceil(35000 / sampleParagraph.length);
  const text35k = sampleParagraph.repeat(repeatCount).slice(0, 35000);

  it('measures execution time for 35k text in paginateDocument', () => {
    const doc: DocumentState = {
      text: text35k,
      projectName: 'test-35k',
      pageCount: 4,
      distributionMode: 'paragraph-preserving',
      manualBreaks: [],
      layoutLocked: false,
    };

    const options = {
      canvas: { ...DEFAULT_CANVAS, width: 1080, height: 1350 },
      typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'Inter', fontSize: 24 },
      spacing: { ...DEFAULT_SPACING, paddingTop: 96, paddingBottom: 96, paddingLeft: 96, paddingRight: 96 },
      advanced: { ...DEFAULT_ADVANCED, autoFit: false },
    };

    const t0 = performance.now();
    const res = paginateDocument(doc, options);
    const duration = performance.now() - t0;
    console.log(`paginateDocument 35k duration: ${duration.toFixed(2)}ms`);
    expect(res.pages.length).toBe(4);
    expect(duration).toBeLessThan(100); // 35k text pagination must complete under 100ms
  });

  it('measures execution time for 35k text in autoFitFontSize', () => {
    const doc: DocumentState = {
      text: text35k,
      projectName: 'test-35k',
      pageCount: 4,
      distributionMode: 'paragraph-preserving',
      manualBreaks: [],
      layoutLocked: false,
    };

    const options = {
      canvas: { ...DEFAULT_CANVAS, width: 1080, height: 1350 },
      typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'Inter', fontSize: 24 },
      spacing: { ...DEFAULT_SPACING, paddingTop: 96, paddingBottom: 96, paddingLeft: 96, paddingRight: 96 },
      advanced: { ...DEFAULT_ADVANCED, autoFit: true, minFontSize: 16, maxFontSize: 48 },
    };

    const t0 = performance.now();
    const res = autoFitFontSize(doc, options);
    const duration = performance.now() - t0;
    console.log(`autoFitFontSize 35k duration: ${duration.toFixed(2)}ms`);
    expect(res.pages.length).toBe(4);
    expect(duration).toBeLessThan(100); // 35k text auto-fit must complete under 100ms
  });

  it('migrates legacy minFontSize: 18 so 40k characters fits without getting stuck at 18', () => {
    const text40k = sampleParagraph.repeat(Math.ceil(40000 / sampleParagraph.length)).slice(0, 40000);
    const doc: DocumentState = {
      text: text40k,
      projectName: 'test-40k',
      pageCount: 4,
      distributionMode: 'paragraph-preserving',
      manualBreaks: [],
      layoutLocked: false,
    };

    // Even if options.advanced has legacy minFontSize: 18, autoFit should NOT get stuck at 18
    const options = {
      canvas: { ...DEFAULT_CANVAS, width: 1080, height: 1920 },
      typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'Inter', fontSize: 24 },
      spacing: { ...DEFAULT_SPACING, preset: 'compact' as const, paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48 },
      advanced: { ...DEFAULT_ADVANCED, autoFit: true, minFontSize: 18 },
    };

    const res = autoFitFontSize(doc, options);
    expect(res.isAutoFitFailed).toBe(false);
    expect(res.effectiveFontSize).toBeLessThan(18);
    expect(res.effectiveFontSize).toBeGreaterThanOrEqual(8);
    expect(res.pages.every((p) => !p.isOverflowing)).toBe(true);
  });
});

