import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { showcaseEssay, shortQuote } from './prepare_samples.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'docs');
const rawVideoDir = path.join(docsDir, 'raw_video');

if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
if (!fs.existsSync(rawVideoDir)) fs.mkdirSync(rawVideoDir, { recursive: true });

function resolveFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    const wingetPath =
      'C:\\Users\\yeah\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe';
    if (fs.existsSync(wingetPath)) return wingetPath;
    throw new Error('FFmpeg executable not found in PATH or standard location');
  }
}

const ffmpegExe = resolveFfmpeg();

async function selectPageCount(page, count) {
  const popover = page.locator('div:has-text("Number of Pages")').first();
  const isVisible = await popover.isVisible().catch(() => false);
  if (!isVisible) {
    const pagesButton = page.locator('button[title*="Number of pages"]').first();
    await pagesButton.click();
    await page.waitForTimeout(250);
  }
  const btn = page.locator(`.grid.grid-cols-4 button`).filter({ hasText: new RegExp(`^${count}$`) }).first();
  await btn.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(250);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

async function ensureAutoFit(page, enable = true) {
  const enableBtn = page.locator('button[title*="Enable Auto-fit"]').first();
  const isEnableVisible = await enableBtn.isVisible().catch(() => false);
  if (enable && isEnableVisible) {
    await enableBtn.click();
    await page.waitForTimeout(250);
  } else if (!enable && !isEnableVisible) {
    const disableBtn = page.locator('button[title*="Auto-fit is active"]').first();
    if (await disableBtn.isVisible().catch(() => false)) {
      await disableBtn.click();
      await page.waitForTimeout(250);
    }
  }
}

function getLatestWebm(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) throw new Error(`No webm recordings found in ${dir}`);
  const sorted = files
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);
  return sorted[0].path;
}

function encodeWebp(rawWebm, outWebp, startSec = 0, durationSec = 3.3) {
  console.log(`[FFmpeg] Encoding WebP: ${path.basename(outWebp)} (offset: ${startSec}s, dur: ${durationSec}s)...`);
  // Lanczos scaling to 980w, 15 fps, lossy WebP at q:v 62 (crystal sharp typography, ~2 MB, strictly < 3 MB)
  const cmd = `"${ffmpegExe}" -y -i "${rawWebm}" -ss ${startSec} -t ${durationSec} -vcodec libwebp -filter:v "fps=15,scale=980:-2:flags=lanczos" -lossless 0 -compression_level 6 -q:v 62 -loop 0 "${outWebp}"`;
  execSync(cmd, { stdio: 'inherit' });
}

function encodeMp4(rawWebm, outMp4, startSec = 0, durationSec = 3.3) {
  console.log(`[FFmpeg] Encoding MP4: ${path.basename(outMp4)} (offset: ${startSec}s, dur: ${durationSec}s)...`);
  // H.264 standard faststart MP4 fallback (< 1 MB)
  const cmd = `"${ffmpegExe}" -y -i "${rawWebm}" -ss ${startSec} -t ${durationSec} -c:v libx264 -filter:v "scale=1520:-2" -pix_fmt yuv420p -crf 22 -preset medium -movflags +faststart "${outMp4}"`;
  execSync(cmd, { stdio: 'inherit' });
}

// ---------------------------------------------------------------------------
// 1. HERO BALANCING MICRO-ASSET
// ---------------------------------------------------------------------------
async function generateHeroBalancing(browser) {
  console.log('\n--- Generating Micro-Asset 1: Hero Balancing ---');
  const context = await browser.newContext({
    viewport: { width: 1520, height: 950 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1520, height: 950 },
    },
  });

  const page = await context.newPage();
  const contextStartTime = Date.now();

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  console.log('Configuring baseline state: 4 pages & Auto-fit active...');
  await selectPageCount(page, 4);

  const textarea = page.locator('textarea');
  await textarea.fill('');
  await ensureAutoFit(page, true);
  await page.waitForTimeout(400);

  // Precision action window: exactly ~3.5 seconds
  const actionStartSec = (Date.now() - contextStartTime) / 1000;
  console.log(`Recording paste action starting at ${actionStartSec.toFixed(2)}s...`);

  // Hold initial clean state with Auto-fit active
  await page.waitForTimeout(600);

  // Paste 16-paragraph philosophical critique
  await textarea.fill(showcaseEssay);

  // Wait for 4 canvas elements to render with balanced typography
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 4);

  // Hold balanced 4-card display
  await page.waitForTimeout(2500);

  await context.close();

  const rawWebm = getLatestWebm(rawVideoDir);
  const webpOut = path.join(docsDir, 'hero-balancing.webp');
  const mp4Out = path.join(docsDir, 'hero-balancing.mp4');

  encodeWebp(rawWebm, webpOut, actionStartSec.toFixed(2), 3.3);
  encodeMp4(rawWebm, mp4Out, actionStartSec.toFixed(2), 3.3);
  fs.unlinkSync(rawWebm);
}

// ---------------------------------------------------------------------------
// 2. FLUID STUDIO MICRO-ASSET
// ---------------------------------------------------------------------------
async function generateFluidStudio(browser) {
  console.log('\n--- Generating Micro-Asset 2: Fluid Studio ---');
  const context = await browser.newContext({
    viewport: { width: 1520, height: 950 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1520, height: 950 },
    },
  });

  const page = await context.newPage();
  const contextStartTime = Date.now();

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  console.log('Setting up 4-page studio baseline...');
  await selectPageCount(page, 4);
  await ensureAutoFit(page, true);
  const textarea = page.locator('textarea');
  await textarea.fill(showcaseEssay);
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 4);
  await page.waitForTimeout(400);

  // Precision action window: exactly ~3.5 seconds
  const actionStartSec = (Date.now() - contextStartTime) / 1000;
  console.log(`Recording studio collapse starting at ${actionStartSec.toFixed(2)}s...`);

  // Hold standard 2-column studio state
  await page.waitForTimeout(700);

  // Click collapse editor button (or Ctrl+B)
  const collapseBtn = page.locator('button[aria-label*="editor panel"]').first();
  await collapseBtn.click();

  // Hold expanded 4-column studio view (xl:grid-cols-4)
  await page.waitForTimeout(2500);

  await context.close();

  const rawWebm = getLatestWebm(rawVideoDir);
  const webpOut = path.join(docsDir, 'fluid-studio.webp');
  const mp4Out = path.join(docsDir, 'fluid-studio.mp4');

  encodeWebp(rawWebm, webpOut, actionStartSec.toFixed(2), 3.3);
  encodeMp4(rawWebm, mp4Out, actionStartSec.toFixed(2), 3.3);
  fs.unlinkSync(rawWebm);
}

// ---------------------------------------------------------------------------
// 3. DEEP INSPECTION MICRO-ASSET
// ---------------------------------------------------------------------------
async function generateDeepInspection(browser) {
  console.log('\n--- Generating Micro-Asset 3: Deep Inspection ---');
  const context = await browser.newContext({
    viewport: { width: 1520, height: 950 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1520, height: 950 },
    },
  });

  const page = await context.newPage();
  const contextStartTime = Date.now();

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  console.log('Loading 4-page essay and switching to Single Page View...');
  await selectPageCount(page, 4);
  await ensureAutoFit(page, true);
  const textarea = page.locator('textarea');
  await textarea.fill(showcaseEssay);
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 4);

  // Switch to Single page view
  const singleBtn = page.locator('button[title="Single page view"]').first();
  await singleBtn.click();
  await page.waitForTimeout(300);

  // Unfocus textarea so keyboard navigation listeners handle Arrow and F keys
  await textarea.blur();
  const previewArea = page.locator('div.flex-1.flex.flex-col.items-center').first();
  await previewArea.click();
  await page.waitForTimeout(300);

  // Precision action window: exactly ~3.5 seconds
  const actionStartSec = (Date.now() - contextStartTime) / 1000;
  console.log(`Recording deep inspection starting at ${actionStartSec.toFixed(2)}s...`);

  // Hold Page 1 in Single view
  await page.waitForTimeout(600);

  // Step to Page 2
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);

  // Step to Page 3
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);

  // Open Fullscreen view with instant key command F
  console.log('Opening Fullscreen view with instant key command F...');
  await page.keyboard.press('f');
  await page.waitForTimeout(1400);

  await context.close();

  const rawWebm = getLatestWebm(rawVideoDir);
  const webpOut = path.join(docsDir, 'deep-inspection.webp');
  const mp4Out = path.join(docsDir, 'deep-inspection.mp4');

  encodeWebp(rawWebm, webpOut, actionStartSec.toFixed(2), 3.3);
  encodeMp4(rawWebm, mp4Out, actionStartSec.toFixed(2), 3.3);
  fs.unlinkSync(rawWebm);
}

// ---------------------------------------------------------------------------
// 4. STATIC SHOWCASE SCREENSHOTS
// ---------------------------------------------------------------------------
async function captureShowcaseSingle(browser) {
  console.log('\n--- Capturing Static Showcase 1: Single Page View ---');
  const context = await browser.newContext({
    viewport: { width: 1520, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  await selectPageCount(page, 1);
  await ensureAutoFit(page, true);
  const textarea = page.locator('textarea');
  await textarea.fill(shortQuote);

  const singleBtn = page.locator('button[title="Single page view"]').first();
  await singleBtn.click();
  await page.waitForTimeout(600);

  const outPath = path.join(docsDir, 'showcase-single.png');
  await page.screenshot({ path: outPath });
  console.log(`Saved ${outPath}`);
  await context.close();
}

async function captureShowcaseBalanced(browser) {
  console.log('\n--- Capturing Static Showcase 2: 4-Page Balanced Cards ---');
  const context = await browser.newContext({
    viewport: { width: 1520, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  await selectPageCount(page, 4);
  await ensureAutoFit(page, true);
  const textarea = page.locator('textarea');
  await textarea.fill(showcaseEssay);
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 4);

  // Collapse editor to let 4 cards breathe in expansive studio layout
  const collapseBtn = page.locator('button[aria-label*="editor panel"]').first();
  await collapseBtn.click();
  await page.waitForTimeout(800);

  const outPath = path.join(docsDir, 'showcase-balanced.png');
  await page.screenshot({ path: outPath });
  console.log(`Saved ${outPath}`);
  await context.close();
}

async function captureShowcaseTrim(browser) {
  console.log('\n--- Capturing Static Showcase 3: Canvas Format & Dynamic Trim ---');
  const context = await browser.newContext({
    viewport: { width: 1520, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  await selectPageCount(page, 4);
  await ensureAutoFit(page, true);

  // Use 13 paragraphs so page 4 has a short paragraph, making dynamic trim striking
  const paras = showcaseEssay.trim().split(/\n\n+/);
  const partialText = paras.slice(0, 13).join('\n\n');
  const textarea = page.locator('textarea');
  await textarea.fill(partialText);
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 4);
  await page.waitForTimeout(400);

  // Open Canvas Format popover
  const formatButton = page.locator('button[title*="Change canvas aspect ratio"]').first();
  await formatButton.click();
  await page.waitForTimeout(300);

  // Toggle "Trim last page height" ON if not active
  const trimRow = page.locator('div:has-text("Trim last page height")').filter({ has: page.locator('button') }).last();
  const trimToggle = trimRow.locator('button').first();
  await trimToggle.click();
  await page.waitForTimeout(500);

  const outPath = path.join(docsDir, 'showcase-trim.png');
  await page.screenshot({ path: outPath });
  console.log(`Saved ${outPath}`);
  await context.close();
}

// ---------------------------------------------------------------------------
// 5. ASSET VALIDATION GATE
// ---------------------------------------------------------------------------
function validateAssets() {
  console.log('\n================================================================');
  console.log('  Automated Release Asset Validation Gate');
  console.log('================================================================');

  const maxSizeBytes = 3_000_000; // 3.0 MB limit strictly enforced

  const microAssets = [
    'hero-balancing.webp',
    'hero-balancing.mp4',
    'fluid-studio.webp',
    'fluid-studio.mp4',
    'deep-inspection.webp',
    'deep-inspection.mp4',
  ];

  const screenshots = [
    'showcase-single.png',
    'showcase-balanced.png',
    'showcase-trim.png',
  ];

  let errors = 0;

  console.log('\n--- Animated Micro-Assets (Limit: < 3,000,000 bytes) ---');
  for (const file of microAssets) {
    const filePath = path.join(docsDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] Missing micro-asset: ${file}`);
      errors++;
      continue;
    }
    const size = fs.statSync(filePath).size;
    const mb = (size / (1024 * 1024)).toFixed(2);
    if (size >= maxSizeBytes) {
      console.error(`[FAIL] ${file}: ${size} bytes (${mb} MB) EXCEEDS 3 MB limit!`);
      errors++;
    } else {
      console.log(`[PASS] ${file.padEnd(24)}: ${size.toString().padStart(8)} bytes (${mb} MB)`);
    }
  }

  console.log('\n--- Curated Showcase Screenshots (Valid PNG > 1 KB) ---');
  for (const file of screenshots) {
    const filePath = path.join(docsDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] Missing showcase image: ${file}`);
      errors++;
      continue;
    }
    const size = fs.statSync(filePath).size;
    const kb = (size / 1024).toFixed(1);
    if (size < 1000) {
      console.error(`[FAIL] ${file}: ${size} bytes — file appears corrupt or stubbed!`);
      errors++;
    } else {
      console.log(`[PASS] ${file.padEnd(24)}: ${size.toString().padStart(8)} bytes (${kb} KB)`);
    }
  }

  if (errors > 0) {
    throw new Error(`Asset validation failed with ${errors} error(s)!`);
  }
  console.log('\n>>> All generated assets PASSED size and integrity checks cleanly! <<<\n');
}

// ---------------------------------------------------------------------------
// MAIN EXECUTION
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting longform-rasterizer demo & showcase generation...');
  console.log(`FFmpeg path: ${ffmpegExe}`);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  try {
    // 1. Generate 3 Animated Micro-Assets
    await generateHeroBalancing(browser);
    await generateFluidStudio(browser);
    await generateDeepInspection(browser);

    // 2. Generate 3 Curated Showcase Screenshots
    await captureShowcaseSingle(browser);
    await captureShowcaseBalanced(browser);
    await captureShowcaseTrim(browser);

    // 3. Automated Validation Gate
    validateAssets();
  } finally {
    await browser.close();
    // Clean up temporary raw_video directory if empty
    if (fs.existsSync(rawVideoDir)) {
      const remaining = fs.readdirSync(rawVideoDir);
      if (remaining.length === 0) {
        fs.rmdirSync(rawVideoDir);
      }
    }
  }

  console.log('Demo automation completed successfully with exit code 0.');
}

main().catch((err) => {
  console.error('Fatal error during demo generation:', err);
  process.exit(1);
});
