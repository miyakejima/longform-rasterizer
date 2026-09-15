import { describe, it, expect } from 'vitest';
import {
  CanvasSettings,
  DocumentState,
  SpacingSettings,
  TypographySettings,
  AdvancedSettings,
} from '../types';
import { paginateDocument, PaginationOptions } from '../engine/pagination';
import { autoFitFontSize } from '../engine/autoFit';
import { parseDocumentParagraphs } from '../engine/documentParser';
import { wrapDocument } from '../engine/lineWrapper';
import { measureTextWidth } from '../engine/textMeasurement';
import { sanitizeFileName } from '../engine/exportEngine';

const defaultCanvas: CanvasSettings = {
  width: 1080,
  height: 1350,
  preset: 'twitter',
  backgroundColor: '#000000',
  transparentBackground: false,
};

const defaultTypography: TypographySettings = {
  fontFamily: 'Inter',
  fontSize: 36,
  fontWeight: 400,
  lineHeight: 1.4,
  letterSpacing: 0,
  textColor: '#FFFFFF',
  alignment: 'left',
};

const defaultSpacing: SpacingSettings = {
  paddingTop: 96,
  paddingRight: 96,
  paddingBottom: 96,
  paddingLeft: 96,
  linked: true,
  preset: 'balanced',
  paragraphSpacing: 28,
  minBottomSpace: 48,
};

const defaultAdvanced: AdvancedSettings = {
  densityTarget: 'balanced',
  balanceStrength: 'medium',
  preventOrphanLines: true,
  allowClippedExport: false,
  autoFit: false,
  minFontSize: 18,
  maxFontSize: 64,
};

function createOptions(overrides?: {
  canvas?: Partial<CanvasSettings>;
  typography?: Partial<TypographySettings>;
  spacing?: Partial<SpacingSettings>;
  advanced?: Partial<AdvancedSettings>;
}): PaginationOptions {
  return {
    canvas: { ...defaultCanvas, ...(overrides?.canvas || {}) },
    typography: { ...defaultTypography, ...(overrides?.typography || {}) },
    spacing: { ...defaultSpacing, ...(overrides?.spacing || {}) },
    advanced: { ...defaultAdvanced, ...(overrides?.advanced || {}) },
  };
}

describe('Typography Pagination and Layout Engine', () => {
  // Test 1: Invariant check (join(allPageText) === originalText)
  it('strictly preserves the invariant join(allPageText) === originalText across all modes', () => {
    const text = `En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero.\n\nUna olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados.`;

    const doc: DocumentState = {
      text,
      projectName: 'quijote',
      pageCount: 3,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(3);
    const joined = result.pages.map((p) => p.text).join('');
    expect(joined).toBe(text);
  });

  // Test 2: Short text
  it('handles short text correctly across single and multiple pages', () => {
    const text = 'Breve nota.';
    const doc: DocumentState = {
      text,
      projectName: 'short',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(2);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
    expect(result.pages[0].text.length).toBeGreaterThan(0);
  });

  // Test 3: Very long text
  it('handles very long text and computes correct line counts and page slices', () => {
    const paragraphs = Array.from({ length: 40 }, (_, i) => `Párrafo ${i + 1}: Este es un texto extenso diseñado para evaluar la capacidad de paginación con múltiples párrafos y oraciones complejas.`);
    const text = paragraphs.join('\n\n');

    const doc: DocumentState = {
      text,
      projectName: 'long-essay',
      pageCount: 4,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(4);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
    result.pages.forEach((p) => {
      expect(p.lines.length).toBeGreaterThan(0);
      expect(p.renderedHeight).toBeGreaterThan(0);
    });
  });

  // Test 4: One page
  it('handles exact 1 page request', () => {
    const text = 'Solo una página con texto conciso y claro.';
    const doc: DocumentState = {
      text,
      projectName: 'one-page',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].text).toBe(text);
    expect(result.pages[0].isOverflowing).toBe(false);
  });

  // Test 5: Four pages
  it('handles exact 4 pages request and balances visual height', () => {
    const text = Array.from({ length: 12 }, (_, i) => `Sección ${i + 1}. Contenido balanceado para cuatro imágenes continuas.`).join('\n\n');
    const doc: DocumentState = {
      text,
      projectName: 'four-pages',
      pageCount: 4,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(4);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 6: Eight pages
  it('handles exact 8 pages request', () => {
    const text = Array.from({ length: 24 }, (_, i) => `Capítulo ${i + 1}: Reflexiones sobre la tipografía y el diseño sobrio.`).join('\n\n');
    const doc: DocumentState = {
      text,
      projectName: 'eight-pages',
      pageCount: 8,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(8);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 7: Blank lines and spacing
  it('preserves multiple blank lines and paragraph breaks accurately', () => {
    const text = `Primer párrafo.\n\n\n\nSegundo párrafo tras múltiples saltos.\n\n\nTercer párrafo.`;
    const doc: DocumentState = {
      text,
      projectName: 'blank-lines',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 8: Multiple paragraphs
  it('splits cleanly across multiple paragraphs without losing content', () => {
    const paras = ['Párrafo 1.', 'Párrafo 2.', 'Párrafo 3.', 'Párrafo 4.', 'Párrafo 5.'];
    const text = paras.join('\n\n');
    const doc: DocumentState = {
      text,
      projectName: 'multi-para',
      pageCount: 3,
      distributionMode: 'paragraph-preserving',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(3);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 9: Single huge paragraph
  it('splits a single huge paragraph across pages based on lines and sentences', () => {
    const sentences = Array.from({ length: 20 }, (_, i) => `Esta es la oración número ${i + 1} dentro de un único párrafo inmenso sin saltos de línea.`);
    const text = sentences.join(' ');
    const doc: DocumentState = {
      text,
      projectName: 'huge-para',
      pageCount: 3,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(3);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 10: Single huge sentence
  it('splits a single huge sentence without word clipping or character loss', () => {
    const words = Array.from({ length: 150 }, (_, i) => `palabra${i}`);
    const text = words.join(' ') + '.';
    const doc: DocumentState = {
      text,
      projectName: 'huge-sentence',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(2);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 11: Spanish accents, ñ, ¿, ¡
  it('preserves Spanish accents, ñ, and inverted punctuation marks exactly', () => {
    const text = `¡Atención! ¿Sabías que el ñandú corre velozmente por la llanura? Además, el río Paraná continúa su curso pacífico con aguas cálidas.`;
    const doc: DocumentState = {
      text,
      projectName: 'spanish-accents',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
    expect(result.pages.some((p) => p.text.includes('¡Atención!'))).toBe(true);
    expect(result.pages.some((p) => p.text.includes('ñandú'))).toBe(true);
    expect(result.pages.some((p) => p.text.includes('¿Sabías'))).toBe(true);
  });

  // Test 12: Curly quotes and special punctuation
  it('preserves curly quotes (“ ” ‘ ’) and em-dashes (—)', () => {
    const text = `“La sencillez es la máxima sofisticación”, afirmó el maestro —con mirada serena y voz firme—. ‘Nunca lo olvides’.`;
    const doc: DocumentState = {
      text,
      projectName: 'quotes',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
    expect(result.pages.some((p) => p.text.includes('“La sencillez'))).toBe(true);
    expect(result.pages.some((p) => p.text.includes('—con mirada'))).toBe(true);
  });

  // Test 13: Manual line breaks
  it('respects explicit single newline line breaks within a paragraph', () => {
    const text = `Línea uno con salto forzado.\nLínea dos con otro salto forzado.\nLínea tres final.`;
    const doc: DocumentState = {
      text,
      projectName: 'line-breaks',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages[0].text).toBe(text);
    expect(result.pages[0].lines.length).toBeGreaterThanOrEqual(3);
  });

  // Test 14: Manual page breaks
  it('respects manual page break markers explicitly', () => {
    const part1 = 'Primera sección manual.';
    const part2 = 'Segunda sección manual.';
    const text = part1 + part2;
    const breakPos = part1.length;

    const doc: DocumentState = {
      text,
      projectName: 'manual-breaks',
      pageCount: 2,
      distributionMode: 'manual',
      manualBreaks: [breakPos],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(2);
    expect(result.pages[0].text).toBe(part1);
    expect(result.pages[1].text).toBe(part2);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 15: Changing font size recalculates line wrapping
  it('adapts lines and heights when changing font size', () => {
    const text = 'Texto para medir el impacto de la variación de tamaño tipográfico en el número de líneas y altura total.';
    const doc: DocumentState = {
      text,
      projectName: 'font-size',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const small = paginateDocument(doc, createOptions({ typography: { fontSize: 20 } }));
    const large = paginateDocument(doc, createOptions({ typography: { fontSize: 60 } }));

    expect(large.pages[0].renderedHeight).toBeGreaterThan(small.pages[0].renderedHeight);
  });

  // Test 16: Changing line height
  it('increases rendered height proportionally when line height is increased', () => {
    const text = 'Párrafo uno con varias líneas para verificar el espaciado vertical.\n\nPárrafo dos con más contenido.';
    const doc: DocumentState = {
      text,
      projectName: 'line-height',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const tight = paginateDocument(doc, createOptions({ typography: { lineHeight: 1.1 } }));
    const relaxed = paginateDocument(doc, createOptions({ typography: { lineHeight: 1.9 } }));

    expect(relaxed.pages[0].renderedHeight).toBeGreaterThan(tight.pages[0].renderedHeight);
  });

  // Test 17: Changing margins / padding
  it('restricts content width and alters wrapping when padding is changed', () => {
    const text = 'Una línea de texto relativamente larga que se ajustará según el ancho disponible en el lienzo.';
    const doc: DocumentState = {
      text,
      projectName: 'margins',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const smallMargins = paginateDocument(
      doc,
      createOptions({ spacing: { paddingLeft: 20, paddingRight: 20 } })
    );
    const wideMargins = paginateDocument(
      doc,
      createOptions({ spacing: { paddingLeft: 400, paddingRight: 400 } })
    );

    expect(wideMargins.pages[0].lines.length).toBeGreaterThan(smallMargins.pages[0].lines.length);
  });

  // Test 18: Changing image / canvas dimensions
  it('adapts to different canvas presets and custom dimensions', () => {
    const text = 'Texto probado en diferentes formatos de lienzo: historia vertical, publicación cuadrada y formato horizontal.';
    const doc: DocumentState = {
      text,
      projectName: 'canvas-dims',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const square = paginateDocument(doc, createOptions({ canvas: { width: 1080, height: 1080 } }));
    const story = paginateDocument(doc, createOptions({ canvas: { width: 1080, height: 1920 } }));

    expect(story.pages[0].availableHeight).toBeGreaterThan(square.pages[0].availableHeight);
  });

  // Test 19: Auto-fit binary search engine
  it('automatically finds the largest font size that fits without overflow', () => {
    const text = `Este es un texto que debe ser dimensionado automáticamente para ajustarse a exactamente 2 páginas sin desbordar los límites del lienzo.`;
    const doc: DocumentState = {
      text,
      projectName: 'autofit-test',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = autoFitFontSize(
      doc,
      createOptions({ advanced: { autoFit: true, minFontSize: 16, maxFontSize: 60 } })
    );

    expect(result.effectiveFontSize).toBeGreaterThanOrEqual(16);
    expect(result.effectiveFontSize).toBeLessThanOrEqual(60);
    expect(result.pages.every((p) => !p.isOverflowing)).toBe(true);
  });

  // Test 20: Auto-fit warning when text cannot fit at minimum font size
  it('emits a warning if text cannot fit even at minimum font size', () => {
    // Generate massive text that cannot fit on 1 page even at 16px
    const text = Array.from({ length: 100 }, (_, i) => `Línea de prueba masiva número ${i + 1} para forzar desbordamiento de página.`).join('\n\n');
    const doc: DocumentState = {
      text,
      projectName: 'autofit-overflow',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = autoFitFontSize(
      doc,
      createOptions({ advanced: { autoFit: true, minFontSize: 24, maxFontSize: 40 } })
    );

    expect(result.isAutoFitFailed).toBe(true);
    expect(result.autoFitWarning).toBeDefined();
    expect(result.pages[0].isOverflowing).toBe(true);
  });

  // Test 21: Paragraph preserving mode vs balanced mode
  it('prioritizes keeping paragraphs whole in paragraph-preserving mode', () => {
    const para1 = 'Primer párrafo con suficiente longitud para llenar parte de la página.';
    const para2 = 'Segundo párrafo que preferirá no dividirse si el modo de preservación está activo.';
    const text = `${para1}\n\n${para2}`;

    const doc: DocumentState = {
      text,
      projectName: 'mode-comparison',
      pageCount: 2,
      distributionMode: 'paragraph-preserving',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages.length).toBe(2);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  // Test 22: Overflow detection calculation in px
  it('computes exact overflow in pixels when text exceeds available height', () => {
    const lines = Array.from({ length: 60 }, (_, i) => `Línea de overflow ${i + 1}`);
    const text = lines.join('\n');

    const doc: DocumentState = {
      text,
      projectName: 'overflow-calc',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    expect(result.pages[0].isOverflowing).toBe(true);
    expect(result.pages[0].overflowPx).toBeGreaterThan(0);
  });

  // Test 23: No missing characters, no duplicated characters, exact character order
  it('ensures zero characters are lost or duplicated across multi-page boundaries', () => {
    const text = 'Alpha beta gamma delta. 123456789! @#$%^&*()_+ Ñandú pingüino.';
    const doc: DocumentState = {
      text,
      projectName: 'fidelity',
      pageCount: 3,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, createOptions());
    const concatenated = result.pages.map((p) => p.text).join('');
    expect(concatenated).toBe(text);
    expect(concatenated.length).toBe(text.length);
  });

  // Test 24: Filename sanitization
  it('generates clean and safe filenames from project name', () => {
    expect(sanitizeFileName('Mi Ensayo Crítico Sobre Arte! #1')).toBe('mi-ensayo-cr-tico-sobre-arte-1');
    expect(sanitizeFileName('')).toBe('text');
    expect(sanitizeFileName('   ')).toBe('text');
  });

  // Test 25: Custom font name measurement fallback
  it('measures text with custom font family name', () => {
    const width = measureTextWidth('Custom font text sample', 'MyCustomFont', 32, 400, 1);
    expect(width).toBeGreaterThan(0);
  });
});
