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
    typography: TypographySettings;
    spacing: SpacingSettings;
    scale: ExportScale;
    format: ExportFormat;
    projectName: string;
  }
): Promise<void> {
  const offscreenCanvas = document.createElement('canvas');
  renderPageToCanvas(offscreenCanvas, {
    page,
    canvas: options.canvas,
    typography: options.typography,
    spacing: options.spacing,
    scale: options.scale,
  });

  const blob = await canvasToBlob(offscreenCanvas, options.format);
  const baseName = sanitizeFileName(options.projectName);
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
    projectName: string;
  }
): Promise<void> {
  const zip = new JSZip();
  const baseName = sanitizeFileName(options.projectName);
  const ext = getFileExtension(options.format);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const offscreenCanvas = document.createElement('canvas');
    renderPageToCanvas(offscreenCanvas, {
      page,
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
    projectName: string;
  }
): Promise<void> {
  for (let i = 0; i < pages.length; i++) {
    await exportSinglePage(pages[i], options);
    // Stagger downloads slightly to prevent browser throttling
    if (i < pages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
