import { FontWeight } from '../types';
import { clearMeasurementCache } from './textMeasurement';

export const FONT_SUPPORTED_WEIGHTS: Record<string, FontWeight[]> = {
  // Variable / multi-weight Google Fonts
  'Inter': [300, 400, 500, 600, 700],
  'Open Sans': [300, 400, 500, 600, 700],
  'IBM Plex Sans': [300, 400, 500, 600, 700],
  'Roboto': [300, 400, 500, 700],
  'Source Sans 3': [300, 400, 600, 700],
  'Atkinson Hyperlegible Next': [300, 400, 500, 600, 700],
  'Lato': [300, 400, 700],
  'Caveat': [400, 500, 600, 700],
  'Kalam': [300, 400, 700],

  // System & standard web fonts
  'Tw Cen MT Bold': [700],
  'Tw Cen MT': [400, 700],
  'system-ui': [300, 400, 500, 600, 700],
  'Arial': [400, 700],
  'Helvetica': [400, 700],
  'Georgia': [400, 700],
  'Times New Roman': [400, 700],
  'serif': [400, 700],
  'monospace': [400, 700],

  // Single-weight handwriting & diary fonts
  'Dudu Calligraphy': [400],
  'HelvetiHand': [400],
  'Cutewritten': [400],
  'Stay With Me': [400],
  'Internet Friends': [400],
  'Winkle': [400],
  'April': [400],
  'Reading Notes': [400],
  'Classic Milky': [400],
  'i eat crayons': [400],
  'Patrick Hand': [400],
  'Shadows Into Light': [400],
};

export function getSupportedFontWeights(fontFamily: string): FontWeight[] {
  const clean = fontFamily.replace(/['"]/g, '').trim();
  return FONT_SUPPORTED_WEIGHTS[clean] ?? [400];
}


export async function waitForFonts(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      if (document.fonts.load) {
        await Promise.allSettled([
          document.fonts.load('400 24px "Dudu Calligraphy"'),
          document.fonts.load('400 24px "HelvetiHand"'),
          document.fonts.load('400 24px "Cutewritten"'),
          document.fonts.load('400 24px "Stay With Me"'),
          document.fonts.load('400 24px "Internet Friends"'),
          document.fonts.load('400 24px "Winkle"'),
          document.fonts.load('400 24px "April"'),
          document.fonts.load('400 24px "Reading Notes"'),
          document.fonts.load('400 24px "Classic Milky"'),
          document.fonts.load('400 24px "i eat crayons"'),
        ]);
      }
      if (document.fonts.ready) {
        await document.fonts.ready;
      }
      clearMeasurementCache();
    } catch {
      // Ignore
    }
  }
}

export async function ensureFontLoaded(
  fontFamily: string,
  fontSize: number = 24,
  fontWeight: number = 400
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
    try {
      const cleanFont = fontFamily.replace(/"/g, '');
      await document.fonts.load(`${fontWeight} ${fontSize}px "${cleanFont}"`);
      await document.fonts.ready;
      clearMeasurementCache();
    } catch {
      // Ignore
    }
  }
}


export async function loadCustomFont(
  file: File
): Promise<{ fontFamily: string; success: boolean; error?: string }> {
  try {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fontFamily = `Custom_${rawName}_${Date.now()}`;
    const arrayBuffer = await file.arrayBuffer();

    const fontFace = new FontFace(fontFamily, arrayBuffer);
    await fontFace.load();

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.add(fontFace);
      await document.fonts.ready;
    }

    clearMeasurementCache();
    return { fontFamily, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load custom font';
    return { fontFamily: '', success: false, error: message };
  }
}
