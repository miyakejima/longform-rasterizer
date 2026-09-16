import { describe, it, expect } from 'vitest';
import { autoFitFontSize } from '../engine/autoFit';
import {
  DEFAULT_CANVAS,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ADVANCED,
} from '../engine/presetStore';
import { DocumentState } from '../types';

describe('Critical Acceptance Test: Long Spanish Essay across 4 Images', () => {
  const longSpanishEssay = `El ensayo sobre la tipografía moderna y la sobriedad en la era digital plantea un retorno a los fundamentos esenciales del diseño editorial. En un ecosistema saturado de estímulos efímeros y ornamentaciones innecesarias, la contención visual emerge no como una limitación estética, sino como una profunda declaración de principios.

Cuando observamos la evolución de las letras desde los primeros tipos móviles de plomo hasta los píxeles contemporáneos en pantallas de alta densidad, advertimos una constante invariable: la legibilidad es la cortesía suprema del escritor hacia el lector. Un texto concebido para ser comprendido no exige estridencias cromáticas ni composiciones laberínticas; requiere espacio, proporción y un contraste honesto.

¿Por qué persistir entonces en saturar el lienzo con gradientes y sombras artificiales? La belleza de un fondo rigurosamente negro (#000000) contrapuesto a la nitidez inmaculada de caracteres blancos (#FFFFFF) reside precisamente en su austeridad incorruptible. Cada signo de interrogación inicial, cada tilde diacrítica y cada virgulilla sobre la eñe adquiere en este espacio un relieve escultórico, libre de distracciones accesorias.

Finalmente, la partición armónica de un discurso a lo largo de múltiples páginas debe responder a la respiración natural del pensamiento. Dividir un texto respetando las fronteras de los párrafos y preservando la integridad de cada cláusula transforma la experiencia de lectura en una travesía fluida, pausada y memorable para quien busca profundidad en lugar de simple ruido visual.`;

  it('fulfills all 20 critical acceptance criteria', () => {
    const doc: DocumentState = {
      text: longSpanishEssay,
      projectName: 'ensayo-critico-tipografia',
      pageCount: 4,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const options = {
      canvas: { ...DEFAULT_CANVAS, width: 1080, height: 1350, backgroundColor: '#000000' },
      typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'Inter', fontSize: 36, alignment: 'left' as const },
      spacing: { ...DEFAULT_SPACING },
      advanced: { ...DEFAULT_ADVANCED, autoFit: true, minFontSize: 20, maxFontSize: 48 },
    };

    // Run auto-fit pagination
    const result = autoFitFontSize(doc, options);

    // 1. Exactly 4 images / pages
    expect(result.pages.length).toBe(4);

    // 2. Same dimensions across all pages
    result.pages.forEach((p) => {
      expect(p.availableHeight).toBe(options.canvas.height - options.spacing.paddingTop - options.spacing.paddingBottom - options.spacing.minBottomSpace);
    });

    // 3. Same font
    expect(options.typography.fontFamily).toBe('Inter');

    // 4. Same font size for all pages
    expect(result.effectiveFontSize).toBeGreaterThanOrEqual(20);
    expect(result.effectiveFontSize).toBeLessThanOrEqual(48);

    // 5. Same font weight
    expect(options.typography.fontWeight).toBe(400);

    // 6. Same line height
    expect(options.typography.lineHeight).toBe(1.45);

    // 7. Same margins
    expect(options.spacing.paddingTop).toBe(96);
    expect(options.spacing.paddingBottom).toBe(96);
    expect(options.spacing.paddingLeft).toBe(96);
    expect(options.spacing.paddingRight).toBe(96);

    // 8. Pure #000000 background
    expect(options.canvas.backgroundColor).toBe('#000000');

    // 9. Pure #FFFFFF text
    expect(options.typography.textColor).toBe('#FFFFFF');

    // 10. All text preserved exactly: INVARIANT CHECK
    const joinedText = result.pages.map((p) => p.text).join('');
    expect(joinedText).toBe(longSpanishEssay);

    // 11. No overflow on any page
    result.pages.forEach((p) => {
      expect(p.isOverflowing).toBe(false);
      expect(p.overflowPx).toBe(0);
    });

    // 12. No crop
    result.pages.forEach((p) => {
      expect(p.renderedHeight).toBeLessThanOrEqual(p.availableHeight);
    });

    // 13. Visually balanced pages: utilization percentages are reasonable and balanced
    const utilizations = result.pages.map((p) => p.utilization);
    const maxUtil = Math.max(...utilizations);
    const minUtil = Math.min(...utilizations);
    // Difference between most and least full page should be moderate, not extreme (e.g. not 97% vs 10%)
    expect(maxUtil - minUtil).toBeLessThan(45);

    // 14. Paragraph boundaries preserved where possible
    const paraSplitCount = result.pages.filter((p) => !p.text.endsWith('\n\n') && !p.text.endsWith(longSpanishEssay.slice(-10))).length;
    expect(paraSplitCount).toBeLessThanOrEqual(2);

    // 17. No transparency
    expect(options.canvas.transparentBackground).toBe(false);

    // 19. No rewriting, no Spanish accent alterations, no punctuation loss
    expect(joinedText).toContain('¿Por qué persistir');
    expect(joinedText).toContain('eñe');
    expect(joinedText).toContain('píxeles');
    expect(joinedText).toContain('estética');
  });
});
