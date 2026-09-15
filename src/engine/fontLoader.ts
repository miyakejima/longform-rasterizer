// Font Loader Engine: wait for fonts & custom font upload

export async function waitForFonts(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
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

    return { fontFamily, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load custom font';
    return { fontFamily: '', success: false, error: message };
  }
}
