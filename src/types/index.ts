export type DistributionMode = 'balanced' | 'paragraph-preserving' | 'manual';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type FontWeight = 300 | 400 | 500 | 600 | 700;
export type TargetDensity = 'airy' | 'balanced' | 'dense';
export type BalanceStrength = 'low' | 'medium' | 'high';
export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportScale = 1 | 2 | 3;
export type PreviewMode = 'grid' | 'single' | 'carousel';
export type MarginPreset = 'compact' | 'balanced' | 'generous' | 'custom';
export type CanvasPreset = 'twitter' | 'square' | 'portrait' | 'story' | 'landscape' | 'custom';

export type VerticalAlignment = 'top' | 'center' | 'justify';

export interface CanvasSettings {
  width: number;
  height: number;
  preset: CanvasPreset;
  backgroundColor: string; // Hex string e.g. '#000000'
  transparentBackground: boolean;
  trimLastPageHeight?: boolean;
  trimAllPages?: boolean;
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number; // in px, e.g. -2 to 5
  textColor: string;     // Hex string e.g. '#FFFFFF'
  alignment: TextAlignment;
  verticalAlignment?: VerticalAlignment;
}

export interface SpacingSettings {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  linked: boolean;
  preset: MarginPreset;
  paragraphSpacing: number; // in px
  minBottomSpace: number;   // in px, e.g. 0, 48, 72, 96
  verticalAlignment?: VerticalAlignment;
}

export interface AdvancedSettings {
  densityTarget: TargetDensity;
  balanceStrength: BalanceStrength;
  preventOrphanLines: boolean;
  allowClippedExport: boolean;
  autoFit: boolean;
  minFontSize: number;
  maxFontSize: number;
}

export interface DocumentState {
  text: string;
  projectName: string;
  pageCount: number;
  distributionMode: DistributionMode;
  manualBreaks: number[]; // Character indices in original text where page breaks are forced
  layoutLocked: boolean;
}

export interface VisualPreset {
  id: string;
  name: string;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  advanced: AdvancedSettings;
  exportScale: ExportScale;
}

export interface WrappedLine {
  text: string;           // The text rendered on this line (trimmed of trailing hard/soft wrap space)
  rawText: string;        // Text slice including any trailing whitespace or newline
  width: number;          // Measured pixel width
  startIndex: number;     // Start index in original document text
  endIndex: number;       // End index in original document text
  isParagraphStart: boolean;
  isParagraphEnd: boolean;
  isSentenceEnd: boolean;
  isHardBreak?: boolean;  // True if line was ended by explicit newline or paragraph break
  paragraphIndex: number;
  lineInParagraph: number;
  totalLinesInParagraph: number;
}

export interface PageData {
  pageIndex: number;
  text: string;           // Exact slice of original text: pages.map(p => p.text).join('') === originalText
  startIndex: number;     // Start index in original text
  endIndex: number;       // End index in original text
  lines: WrappedLine[];
  renderedHeight: number; // Measured height of text block in px
  availableHeight: number;// Canvas height minus padding and minBottomSpace
  utilization: number;    // 0 to 100 percentage
  overflowPx: number;     // 0 if fits, >0 if overflowing
  isOverflowing: boolean;
  typography?: TypographySettings;
}

export interface PaginationResult {
  pages: PageData[];
  totalAvailableHeight: number;
  effectiveFontSize: number;
  isAutoFitFailed: boolean;
  autoFitWarning?: string;
  overallScore: number;
}

export interface SavedProject {
  id: string;
  name: string;
  updatedAt: number;
  document: DocumentState;
  canvas: CanvasSettings;
  typography: TypographySettings;
  spacing: SpacingSettings;
  advanced: AdvancedSettings;
  exportScale: ExportScale;
  exportFormat: ExportFormat;
  selectedPresetId: string;
}

