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
  backgroundColor: '#FFFFFF',
  transparentBackground: false,
  trimLastPageHeight: true,
  trimAllPages: true,
};

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'Inter',
  fontSize: 27,
  fontWeight: 400,
  lineHeight: 1.45,
  letterSpacing: 0,
  textColor: '#000000',
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
  paragraphSpacing: 38,
  minBottomSpace: 0,
  verticalAlignment: 'center',
};

export const DEFAULT_ADVANCED: AdvancedSettings = {
  densityTarget: 'balanced',
  balanceStrength: 'medium',
  preventOrphanLines: true,
  allowClippedExport: false,
  autoFit: true,
  minFontSize: 8,
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

export const INITIAL_SAMPLE_TEXT = `selective information mistaken for representative evidence, what reaches attention already filtered by what was unusual, emotionally strong or worth mentioning
ordinary context disappearing because nothing happened there, while failures, conflicts and exceptions travel much farther than uneventful normality
no dishonesty required, sincere reporting still capable of producing a badly distorted sample because selection happens before reception

repetition making it worse, the same type of selected event arriving again and again until quantity starts looking like representativeness
large amounts of evidence accumulating through a narrow channel while the underlying sample remains narrow
volume increasing without any equivalent increase in access to the reality supposedly being understood

later information interpreted through whatever model the earlier sample already produced, ambiguity increasingly converted into confirmation
missing context filled by existing assumptions, ordinary counterexamples carrying less force than the events memorable enough to be reported
corrections arriving weaker than accusations, later context struggling against conclusions formed when uncertainty was still enormous

support, loyalty and agreement making the distortion easier to preserve, questioning missing information easily interpreted as taking the wrong side
certainty socially easier than investigation, validation feeling supportive while uncertainty feels cold or disloyal
confidence therefore rewarded before the information available could reasonably justify it

judgment gradually becoming detached from the quality of access that produced it, conclusions expanding from events into motives, character and future behavior
the less direct access available, the more interpretation required, yet interpretation itself often disappearing from awareness once repeated enough
assumption eventually experienced as observation, selected evidence experienced as reality

information volume mistaken for information quality, repeated selection mistaken for representativeness, familiarity mistaken for understanding
a large archive of filtered evidence still remaining filtered evidence regardless of how convincing its accumulation feels
confidence growing much faster than actual knowledge

effort mistaken for value, suffering mistaken for proof
someone putting a lot of time into something feeling more deserving than someone reaching the same result with a fraction of the effort
someone struggling for weeks to understand something being treated as more deserving than someone who understood it quickly

understandable considering effort is easy to see while competence often isn't
visible struggle becoming convenient evidence that something was earned
gets worse once the effort has already been spent, years of unnecessary difficulty becoming something people need to justify

easier methods appearing and getting dismissed as lazy, fake or illegitimate
old difficulty gaining value partly because accepting the easier method also means accepting how much time never needed to be lost

a lot of anti-ai criticism reduces less manual work to less understanding
code getting large, not remembering where something is, or not personally writing every part used as evidence
that the person no longer knows what they built

meanwhile the same tool can locate anything, explain what it does, trace how it's used, map the entire system
show where something is referenced and give an extremely detailed breakdown of how everything connects
if you don't know what a part does you can ask, if you don't know where something is you can ask

if the entire codebase feels unclear you can ask for its structure, relationships, dependencies and flow and keep narrowing into whatever needs inspection
none of that guarantees understanding, blindly accepting the answer obviously doesn't either

actual understanding shows up in whether the person can question what was produced, check whether an explanation makes sense
follow the relationships, modify the system and debug it when something breaks
manually finding every file, remembering every location or personally producing every line was never the knowledge itself

same output reached with less manual work then gets treated as less legitimate
even without any demonstrated loss in quality or understanding, removed work becoming evidence that something important must also have been removed
simply because that work used to be where competence was visibly demonstrated

tool removes the difficulty and suddenly the removed difficulty gets defended as part of what made the person competent
the skill being defended keeps becoming whatever difficulty disappeared`;

export const DEFAULT_DOCUMENT: DocumentState = {
  text: INITIAL_SAMPLE_TEXT,
  projectName: 'selective information',
  pageCount: 4,
  distributionMode: 'paragraph-preserving',
  manualBreaks: [],
  layoutLocked: false,
};

const PRESETS_STORAGE_KEY = 'typography_presets_v2';
const SESSION_STORAGE_KEY = 'typography_last_session_v2';

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

