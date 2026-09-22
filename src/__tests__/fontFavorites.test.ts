import { describe, it, expect, beforeEach } from 'vitest';
import { getSupportedFontWeights } from '../engine/fontLoader';
import {
  loadStoredFavoriteFonts,
  saveStoredFavoriteFonts,
  FAVORITE_FONTS_STORAGE_KEY,
} from '../engine/presetStore';

describe('Font Installation & Favorites Management', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('supports the requested typography fonts with correct font weights', () => {
    // 1. Tw Cen MT Bold
    const twCenBoldWeights = getSupportedFontWeights('Tw Cen MT Bold');
    expect(twCenBoldWeights).toContain(700);

    // 2. Source Sans 3
    const sourceSansWeights = getSupportedFontWeights('Source Sans 3');
    expect(sourceSansWeights).toContain(300);
    expect(sourceSansWeights).toContain(400);
    expect(sourceSansWeights).toContain(600);
    expect(sourceSansWeights).toContain(700);

    // 3. Atkinson Hyperlegible Next
    const atkinsonWeights = getSupportedFontWeights('Atkinson Hyperlegible Next');
    expect(atkinsonWeights).toContain(300);
    expect(atkinsonWeights).toContain(400);
    expect(atkinsonWeights).toContain(500);
    expect(atkinsonWeights).toContain(600);
    expect(atkinsonWeights).toContain(700);

    // 4. Lato
    const latoWeights = getSupportedFontWeights('Lato');
    expect(latoWeights).toContain(300);
    expect(latoWeights).toContain(400);
    expect(latoWeights).toContain(700);
  });

  it('loads and saves favorite fonts from localStorage correctly', () => {
    expect(loadStoredFavoriteFonts()).toEqual([]);

    const testFavorites = ['Atkinson Hyperlegible Next', 'Tw Cen MT Bold'];
    saveStoredFavoriteFonts(testFavorites);

    expect(loadStoredFavoriteFonts()).toEqual(testFavorites);
    expect(JSON.parse(store[FAVORITE_FONTS_STORAGE_KEY])).toEqual(testFavorites);
  });

  it('sorts favorite fonts first in the font list', () => {
    const fonts = [
      'Inter',
      'Tw Cen MT Bold',
      'Source Sans 3',
      'Atkinson Hyperlegible Next',
      'Lato',
      'Roboto',
    ];

    const favorites = ['Lato', 'Atkinson Hyperlegible Next'];

    const sorted = [...fonts].sort((a, b) => {
      const aFav = favorites.includes(a);
      const bFav = favorites.includes(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });

    // The favorites should be at the beginning of the list
    expect(sorted.slice(0, 2)).toEqual(['Atkinson Hyperlegible Next', 'Lato']);
    expect(sorted).toContain('Inter');
    expect(sorted).toContain('Tw Cen MT Bold');
    expect(sorted).toContain('Source Sans 3');
    expect(sorted).toContain('Roboto');
  });
});
