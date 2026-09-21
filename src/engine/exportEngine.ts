// Export Engine: Single image download, batch download, and ZIP export

import JSZip from 'jszip';
import {
  CanvasSettings,
  ExportFormat,
  ExportScale,
  PageData,
  SpacingSettings,
  TypographySettings,
} from '../types';
import { renderPageToCanvas } from './canvasRenderer';

export function sanitizeFileName(name: string, defaultName: string = 'text'): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.length > 0 ? cleaned : defaultName;
}

/**
 * Procedurally generates a clean, concise filename slug based on document text.
 * Strips formatting, handles multilingual accents cleanly, extracts leading keywords,
 * and clamps length to prevent OS path issues.
 */
export function generateProceduralTitle(text: string, maxLength: number = 28): string {
  if (!text || typeof text !== 'string') return 'card-deck';

  // Split into lines and find the first non-empty line
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return 'card-deck';

  let candidate = lines[0];

  // Strip Markdown headers (#), bullet points, blockquotes, numbering
  candidate = candidate.replace(/^[#*>\-\d.]+\s*/, '').trim();

  // If the first line was only formatting, look at the second line
  if (!candidate && lines.length > 1) {
    candidate = lines[1].replace(/^[#*>\-\d.]+\s*/, '').trim();
  }

  if (!candidate) return 'card-deck';

  // If line is long, take first sentence or first 4-5 words
  const sentenceMatch = candidate.match(/^[^.!?]+[.!?]/);
  if (sentenceMatch && sentenceMatch[0].length <= 40) {
    candidate = sentenceMatch[0];
  } else {
    candidate = candidate.split(/\s+/).slice(0, 5).join(' ');
  }

  // Normalize diacritics/accents (e.g. "crítico" -> "critico")
  candidate = candidate.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Convert to clean lowercase slug
  let slug = candidate
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) return 'card-deck';

  // Strict length limit without breaking words in the middle
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen >= 8) {
      slug = slug.slice(0, lastHyphen);
    }
    slug = slug.replace(/-+$/, '');
  }

  return slug || 'card-deck';
}

export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'png':
    default:
      return 'image/png';
  }
}

export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'jpeg':
      return 'jpg';
    case 'webp':
      return 'webp';
    case 'png':
    default:
      return 'png';
  }
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat
): Promise<Blob> {
  const mimeType = getMimeType(format);
  const quality = format === 'png' ? undefined : 0.95;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      },
      mimeType,
      quality
    );
  });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportSinglePage(
  page: PageData,
  options: {
    canvas: CanvasSettings;
    totalPages?: number;
    typography: TypographySettings;
    spacing: SpacingSettings;
    scale: ExportScale;
    format: ExportFormat;
    projectName?: string;
  }
): Promise<void> {
  const offscreenCanvas = document.createElement('canvas');
  renderPageToCanvas(offscreenCanvas, {
    page,
    totalPages: options.totalPages ?? (page.pageIndex + 1),
    canvas: options.canvas,
    typography: options.typography,
    spacing: options.spacing,
    scale: options.scale,
  });

  const blob = await canvasToBlob(offscreenCanvas, options.format);
  const rawName = options.projectName && options.projectName.trim()
    ? options.projectName
    : generateProceduralTitle(page.text);
  const baseName = sanitizeFileName(rawName);
  const ext = getFileExtension(options.format);
  const pageNumStr = String(page.pageIndex + 1).padStart(2, '0');
  const filename = `${baseName}-${pageNumStr}.${ext}`;

  triggerDownload(blob, filename);
}

export async function exportAllPagesAsZip(
  pages: PageData[],
  options: {
    canvas: CanvasSettings;
    typography: TypographySettings;
    spacing: SpacingSettings;
    scale: ExportScale;
    format: ExportFormat;
    projectName?: string;
  }
): Promise<void> {
  const zip = new JSZip();
  const rawName = options.projectName && options.projectName.trim()
    ? options.projectName
    : (pages.length > 0 ? generateProceduralTitle(pages[0].text) : 'card-deck');
  const baseName = sanitizeFileName(rawName);
  const ext = getFileExtension(options.format);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const offscreenCanvas = document.createElement('canvas');
    renderPageToCanvas(offscreenCanvas, {
      page,
      totalPages: pages.length,
      canvas: options.canvas,
      typography: options.typography,
      spacing: options.spacing,
      scale: options.scale,
    });

    const blob = await canvasToBlob(offscreenCanvas, options.format);
    const pageNumStr = String(i + 1).padStart(2, '0');
    const filename = `${baseName}-${pageNumStr}.${ext}`;

    const arrayBuffer = await blob.arrayBuffer();
    zip.file(filename, arrayBuffer);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `${baseName}-images.zip`);
}

export async function exportAllPagesSeparately(
  pages: PageData[],
  options: {
    canvas: CanvasSettings;
    typography: TypographySettings;
    spacing: SpacingSettings;
    scale: ExportScale;
    format: ExportFormat;
    projectName?: string;
  }
): Promise<void> {
  const rawName = options.projectName && options.projectName.trim()
    ? options.projectName
    : (pages.length > 0 ? generateProceduralTitle(pages[0].text) : 'card-deck');

  for (let i = 0; i < pages.length; i++) {
    await exportSinglePage(pages[i], {
      ...options,
      projectName: rawName,
      totalPages: pages.length,
    });
    // Stagger downloads slightly to prevent browser throttling
    if (i < pages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
