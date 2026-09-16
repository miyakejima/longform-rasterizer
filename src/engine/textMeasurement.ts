// Text measurement engine supporting both browser Canvas 2D and deterministic headless/test fallback

const widthCache = new Map<string, number>();
const MAX_CACHE_SIZE = 10000;

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = 2048;
    sharedCanvas.height = 2048;
  }
  if (!sharedCtx && sharedCanvas) {
    sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: false });
  }
  return sharedCtx;
}

// Proportional character width ratios relative to fontSize for fallback testing in Node
const CHAR_WIDTH_RATIOS: Record<string, number> = {
  // Common lowercase
  i: 0.26, l: 0.26, j: 0.26, f: 0.32, t: 0.34, r: 0.36,
  s: 0.44, c: 0.45, z: 0.45, v: 0.48, x: 0.48, k: 0.48,
  a: 0.52, e: 0.52, o: 0.52, u: 0.52, n: 0.53, d: 0.54,
  p: 0.54, q: 0.54, b: 0.54, g: 0.54, h: 0.53, y: 0.49,
  w: 0.72, m: 0.82,
  // Common uppercase
  I: 0.30, J: 0.40, L: 0.50, T: 0.55, F: 0.55, E: 0.56,
  P: 0.58, B: 0.60, R: 0.60, S: 0.58, K: 0.60, V: 0.60,
  A: 0.64, C: 0.64, D: 0.66, G: 0.68, H: 0.66, N: 0.66,
  O: 0.68, Q: 0.68, U: 0.66, X: 0.60, Y: 0.60, Z: 0.58,
  M: 0.84, W: 0.88,
  // Spanish & accented characters
  á: 0.52, é: 0.52, í: 0.26, ó: 0.52, ú: 0.52, ñ: 0.53,
  Á: 0.64, É: 0.56, Í: 0.30, Ó: 0.68, Ú: 0.66, Ñ: 0.66,
  ü: 0.52, Ü: 0.66,
  // Punctuation & symbols
  ' ': 0.28, '.': 0.26, ',': 0.26, ';': 0.28, ':': 0.28,
  '!': 0.28, '¡': 0.28, '?': 0.46, '¿': 0.46, '-': 0.35,
  '—': 0.90, '–': 0.55, "'": 0.22, '"': 0.36, '“': 0.38,
  '”': 0.38, '‘': 0.24, '’': 0.24, '(': 0.32, ')': 0.32,
  '[': 0.32, ']': 0.32, '{': 0.35, '}': 0.35, '/': 0.35,
  // Digits
  '0': 0.55, '1': 0.55, '2': 0.55, '3': 0.55, '4': 0.55,
  '5': 0.55, '6': 0.55, '7': 0.55, '8': 0.55, '9': 0.55,
};

function fallbackMeasureText(text: string, fontSize: number, letterSpacing: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const ratio = CHAR_WIDTH_RATIOS[ch] ?? 0.55;
    width += ratio * fontSize;
  }
  if (text.length > 1) {
    width += (text.length - 1) * letterSpacing;
  }
  return width;
}

export function measureTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number = 400,
  letterSpacing: number = 0
): number {
  if (!text) return 0;

  const cacheKey = `${text}|${fontFamily}|${fontSize}|${fontWeight}|${letterSpacing}`;
  const cached = widthCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let width = 0;
  const ctx = getCanvasContext();

  if (ctx) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    let supportsCanvasLetterSpacing = false;
    if ('letterSpacing' in ctx) {
      try {
        (ctx as unknown as { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
        supportsCanvasLetterSpacing = true;
      } catch {
        supportsCanvasLetterSpacing = false;
      }
    }

    width = ctx.measureText(text).width;
    if (!supportsCanvasLetterSpacing && letterSpacing !== 0 && text.length > 1) {
      width += (text.length - 1) * letterSpacing;
    }
  } else {
    width = fallbackMeasureText(text, fontSize, letterSpacing);
  }

  if (widthCache.size > MAX_CACHE_SIZE) {
    widthCache.clear();
  }
  widthCache.set(cacheKey, width);

  return width;
}

export function clearMeasurementCache(): void {
  widthCache.clear();
}
