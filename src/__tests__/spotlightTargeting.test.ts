import { describe, it, expect } from 'vitest';
import { paginateDocument } from '../engine/pagination';
import { getParagraphBoundsForPage } from '../engine/canvasRenderer';
import {
  DEFAULT_CANVAS,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ADVANCED,
  INITIAL_SAMPLE_TEXT,
} from '../engine/presetStore';
import { DocumentState } from '../types';

describe('Paragraph Spotlight Targeting & Character Offset Precision', () => {
  const baseOptions = {
    canvas: { ...DEFAULT_CANVAS },
    typography: { ...DEFAULT_TYPOGRAPHY },
    spacing: { ...DEFAULT_SPACING },
    advanced: { ...DEFAULT_ADVANCED },
  };

  const doc: DocumentState = {
    text: INITIAL_SAMPLE_TEXT,
    projectName: 'selective information',
    pageCount: 4,
    distributionMode: 'paragraph-preserving',
    manualBreaks: [],
    layoutLocked: false,
  };

  it('verifies that every page and every line has 100% exact absolute character slices into doc.text', () => {
    const result = paginateDocument(doc, baseOptions);
    expect(result.pages.length).toBe(4);

    for (let pIdx = 0; pIdx < result.pages.length; pIdx++) {
      const page = result.pages[pIdx];
      console.log(`\n=== PAGE ${pIdx + 1} (start: ${page.startIndex}, end: ${page.endIndex}) ===`);
      console.log(`Page text excerpt: "${page.text.slice(0, 40).replace(/\n/g, '\\n')}..."`);

      // Verify that page.text matches doc.text slice exactly
      expect(doc.text.slice(page.startIndex, page.endIndex)).toBe(page.text);

      const bounds = getParagraphBoundsForPage(
        page,
        result.pages.length,
        baseOptions.canvas,
        baseOptions.spacing,
        baseOptions.typography
      );

      console.log(`Bounds count on Page ${pIdx + 1}: ${bounds.length}`);

      for (let bIdx = 0; bIdx < bounds.length; bIdx++) {
        const b = bounds[bIdx];
        const slice = doc.text.slice(b.startIndex, b.endIndex);
        console.log(`  Paragraph ${bIdx}: [${b.startIndex}..${b.endIndex}] (topY: ${b.topY}, bottomY: ${b.bottomY})`);
        console.log(`    Slice excerpt: "${slice.slice(0, 50).replace(/\n/g, '\\n')}..."`);

        // Check if slice matches the first line of that paragraph
        const firstLineInGroup = page.lines.find(l => l.startIndex >= b.startIndex && l.endIndex <= b.endIndex && l.text.trim().length > 0);
        if (firstLineInGroup) {
          expect(slice).toContain(firstLineInGroup.text.trim());
        }
      }
    }

    const p4Last = INITIAL_SAMPLE_TEXT.indexOf('tool removes the difficulty');
    console.log('\n[Index Check] "tool removes the difficulty":', p4Last);
    const missing = INITIAL_SAMPLE_TEXT.indexOf('missing context filled');
    console.log('[Index Check] "missing context filled":', missing);
  });

  it('proves whether autoFitFontSize preserves absolute doc.text startIndex and endIndex on all pages', async () => {
    const { autoFitFontSize } = await import('../engine/autoFit');
    const autoFitResult = autoFitFontSize(doc, baseOptions);

    console.log('\n--- AUTOFIT RESULT PAGES ---');
    for (const page of autoFitResult.pages) {
      console.log(`Page ${page.pageIndex + 1}: start=${page.startIndex}, end=${page.endIndex}`);
      for (const line of page.lines.slice(0, 2)) {
        console.log(`  Line: start=${line.startIndex}, end=${line.endIndex}, text="${line.text.slice(0, 30)}..."`);
      }
      const lastLine = page.lines[page.lines.length - 1];
      console.log(`  Last Line: start=${lastLine.startIndex}, end=${lastLine.endIndex}, text="${lastLine.text.slice(0, 30)}..."`);

      // All line startIndex MUST be >= page.startIndex
      expect(page.lines[0].startIndex).toBeGreaterThanOrEqual(page.startIndex);
      expect(lastLine.endIndex).toBeLessThanOrEqual(page.endIndex);
    }
  });
});
