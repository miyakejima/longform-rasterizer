// Presets and session storage management

import {
  AdvancedSettings,
  CanvasSettings,
  DocumentState,
  ExportScale,
  SpacingSettings,
  TypographySettings,
  VisualPreset,
} from '../types';

export const DEFAULT_CANVAS: CanvasSettings = {
  width: 1080,
  height: 1350,
  preset: 'twitter',
  backgroundColor: '#000000',
  transparentBackground: false,
};

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'Inter',
  fontSize: 36,
  fontWeight: 400,
  lineHeight: 1.45,
  letterSpacing: 0,
  textColor: '#FFFFFF',
  alignment: 'left',
};

export const DEFAULT_SPACING: SpacingSettings = {
  paddingTop: 96,
  paddingRight: 96,
  paddingBottom: 96,
  paddingLeft: 96,
  linked: true,
  preset: 'balanced',
  paragraphSpacing: 28,
  minBottomSpace: 48,
};

export const DEFAULT_ADVANCED: AdvancedSettings = {
  densityTarget: 'balanced',
  balanceStrength: 'medium',
  preventOrphanLines: true,
  allowClippedExport: false,
  autoFit: false,
  minFontSize: 18,
  maxFontSize: 64,
};

export const DEFAULT_PRESET: VisualPreset = {
  id: 'x-essay',
  name: 'X Essay',
  canvas: { ...DEFAULT_CANVAS },
  typography: { ...DEFAULT_TYPOGRAPHY },
  spacing: { ...DEFAULT_SPACING },
  advanced: { ...DEFAULT_ADVANCED },
  exportScale: 2,
};

export const INITIAL_SAMPLE_TEXT = `El silencio de la noche envolvía la ciudad con un manto frío y sereno. A través del cristal empañado, las luces de la avenida titilaban como luciérnagas distantes, reflejando el pulso pausado de las horas tardías.

En este rincón del mundo, cada palabra escrita parece cobrar un peso distinto. No se trata solo de comunicar ideas, sino de cincelar la atención con sobriedad y equilibrio, otorgando al lector un espacio para respirar entre cada línea.

La verdadera belleza tipográfica no radica en el exceso ni en los ornamentos innecesarios, sino en la precisión del blanco y negro: la pureza absoluta de un fondo oscuro donde la luz de los pensamientos emerge con nitidez y fuerza inalterables.`;

export const DEFAULT_DOCUMENT: DocumentState = {
  text: INITIAL_SAMPLE_TEXT,
  projectName: 'mi-ensayo',
  pageCount: 1,
  distributionMode: 'balanced',
  manualBreaks: [],
  layoutLocked: false,
};

const PRESETS_STORAGE_KEY = 'typography_presets_v1';
const SESSION_STORAGE_KEY = 'typography_last_session_v1';

export function loadStoredPresets(): VisualPreset[] {
  if (typeof window === 'undefined') return [DEFAULT_PRESET];
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [DEFAULT_PRESET];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore error
  }
  return [DEFAULT_PRESET];
}

export function saveStoredPresets(presets: VisualPreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Ignore error
  }
}

export interface SessionState {
  document: DocumentState;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  advanced: AdvancedSettings;
  exportScale: ExportScale;
  selectedPresetId: string;
}

export function loadStoredSession(): SessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: SessionState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore error
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}
