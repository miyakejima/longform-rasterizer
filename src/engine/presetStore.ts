// Presets and session storage management

import {
  AdvancedSettings,
  CanvasSettings,
  DocumentState,
  ExportScale,
  SpacingSettings,
  TypographySettings,
  VisualPreset,
  SavedProject,
} from '../types';

export const DEFAULT_CANVAS: CanvasSettings = {
  width: 1080,
  height: 1350,
  preset: 'twitter',
  backgroundColor: '#000000',
  transparentBackground: false,
  trimLastPageHeight: true,
  trimAllPages: true,
};

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'Inter',
  fontSize: 48,
  fontWeight: 400,
  lineHeight: 1.45,
  letterSpacing: 0,
  textColor: '#FFFFFF',
  alignment: 'left',
  verticalAlignment: 'center',
};

export const DEFAULT_SPACING: SpacingSettings = {
  paddingTop: 48,
  paddingRight: 48,
  paddingBottom: 48,
  paddingLeft: 48,
  linked: true,
  preset: 'compact',
  paragraphSpacing: 28,
  minBottomSpace: 0,
  verticalAlignment: 'center',
};

export const DEFAULT_ADVANCED: AdvancedSettings = {
  densityTarget: 'balanced',
  balanceStrength: 'medium',
  preventOrphanLines: true,
  allowClippedExport: false,
  autoFit: true,
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

export const INITIAL_SAMPLE_TEXT = `The Meaning of Enough

In a world that constantly asks for more, there is quiet power in choosing enough. Not as a resignation, but as a deliberate and radical embrace of what is here — a recognition that contentment is not the absence of ambition, but a different measure of success.

Enough is a rhythm. It is the space between striving and resting, where life actually happens. It allows us to see clearly, to appreciate deeply, and to give our full attention to what truly matters.

Perhaps the most meaningful lives are not the fullest, but the most present.`;

export const DEFAULT_DOCUMENT: DocumentState = {
  text: INITIAL_SAMPLE_TEXT,
  projectName: 'The Meaning of Enough',
  pageCount: 4,
  distributionMode: 'paragraph-preserving',
  manualBreaks: [],
  layoutLocked: false,
};

const PRESETS_STORAGE_KEY = 'typography_presets_v1';
const SESSION_STORAGE_KEY = 'typography_last_session_v1';

export function loadStoredPresets(): VisualPreset[] {
  if (typeof localStorage === 'undefined') return [DEFAULT_PRESET];
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
  if (typeof localStorage === 'undefined') return;
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
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: SessionState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore error
  }
}

export function clearStoredSession(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

const PROJECTS_STORAGE_KEY = 'typography_projects_v1';

export function loadStoredProjects(): SavedProject[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore error
  }
  return [];
}

export function saveStoredProjects(projects: SavedProject[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore error
  }
}

export function saveCurrentProject(project: SavedProject): SavedProject[] {
  const existing = loadStoredProjects();
  const index = existing.findIndex((p) => p.id === project.id);
  let updated: SavedProject[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = project;
  } else {
    updated = [project, ...existing];
  }
  saveStoredProjects(updated);
  return updated;
}

export function deleteStoredProject(id: string): SavedProject[] {
  const existing = loadStoredProjects();
  const updated = existing.filter((p) => p.id !== id);
  saveStoredProjects(updated);
  return updated;
}

export function exportProjectAsJson(project: SavedProject): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'project'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importProjectFromJson(file: File): Promise<SavedProject> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.document || !data.canvas || !data.typography || !data.spacing) {
    throw new Error('Invalid project file format');
  }
  return {
    ...data,
    id: data.id || `proj-${Date.now()}`,
    name: data.name || file.name.replace(/\.json$/i, ''),
    updatedAt: Date.now(),
  };
}

