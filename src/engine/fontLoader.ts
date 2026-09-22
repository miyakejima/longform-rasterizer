// Font Loader Engine: wait for fonts & custom font upload

import { clearMeasurementCache } from './textMeasurement';

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
