import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { concertEssay, spanishEssay, mediumArticle, shortQuote } from './prepare_samples.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'docs');
const rawVideoDir = path.join(docsDir, 'raw_video');

if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
if (!fs.existsSync(rawVideoDir)) fs.mkdirSync(rawVideoDir, { recursive: true });

async function selectPageCount(page, count) {
  const popover = page.locator('div:has-text("Number of Pages")').first();
  const isVisible = await popover.isVisible().catch(() => false);
  if (!isVisible) {
    const pagesButton = page.locator('button[title*="Number of pages"]').first();
    await pagesButton.click();
    await page.waitForTimeout(300);
  }
  const btn = page.locator(`.grid.grid-cols-4 button`).filter({ hasText: new RegExp(`^${count}$`) }).first();
  await btn.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
}


async function run() {
  console.log('Launching browser (Edge channel)...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1520, height: 950 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1520, height: 950 },
    },
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const textarea = page.locator('textarea');
  const fillButton = page.locator('button:has-text("Fill")').first();

  // -------------------------------------------------------------
  // 1. CAPTURE BEFORE STATE: RAW PASTED ESSAY
  // -------------------------------------------------------------
  console.log('Inserting 16-paragraph concert essay...');
  await textarea.fill(concertEssay);
  await page.waitForTimeout(500);

  // Set 4 pages
  console.log('Selecting 4 pages...');
  await selectPageCount(page, 4);

  // Take screenshot: demo-before-after.png
  console.log('Capturing docs/demo-before.png ...');
  await page.screenshot({ path: path.join(docsDir, 'demo-before.png') });

  // -------------------------------------------------------------
  // 2. RUN FILL OPTIMIZER & CAPTURE MAIN 4-PAGE OUTPUT
  // -------------------------------------------------------------
  console.log('Optimizing with Fill...');
  await fillButton.click();
  await page.waitForTimeout(1500);

  // Capture Main Studio interface (demo-main.png)
  console.log('Capturing docs/demo-main.png ...');
  await page.screenshot({ path: path.join(docsDir, 'demo-main.png') });

  // Capture Preview Panel focus (demo-four-pages.png)
  console.log('Capturing docs/demo-four-pages.png ...');
  const previewPanel = page.locator('div.grid').filter({ has: page.locator('canvas') }).first();
  if (await previewPanel.count() > 0) {
    await previewPanel.screenshot({ path: path.join(docsDir, 'demo-four-pages.png') });
  }

  // -------------------------------------------------------------
  // 3. CAPTURE CANVAS FORMAT & SETTINGS POPOVER
  // -------------------------------------------------------------
  console.log('Opening Canvas Format popover...');
  const formatButton = page.locator('button[title*="Change canvas aspect ratio"]').first();
  await formatButton.click();
  await page.waitForTimeout(400);
  console.log('Capturing docs/demo-settings.png ...');
  await page.screenshot({ path: path.join(docsDir, 'demo-settings.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // -------------------------------------------------------------
  // 4. CAPTURE SINGLE PAGE VIEW
  // -------------------------------------------------------------
  console.log('Switching to Single View...');
  const singleViewBtn = page.locator('button[title="Single page view"]');
  await singleViewBtn.click();
  await page.waitForTimeout(600);
  console.log('Capturing docs/demo-single-focus.png ...');
  await page.screenshot({ path: path.join(docsDir, 'demo-single-focus.png') });

  // Switch back to Grid View
  const gridViewBtn = page.locator('button[title="Grid view"]');
  await gridViewBtn.click();
  await page.waitForTimeout(400);

  // -------------------------------------------------------------
  // 5. CAPTURE MANUAL PAGE BREAK MODE
  // -------------------------------------------------------------
  console.log('Capturing docs/demo-manual-breaks.png ...');
  const pagesButton = page.locator('button[title*="Number of pages"]').first();
  await pagesButton.click();
  await page.waitForTimeout(300);
  const manualBtn = page.locator('button:has-text("Manual")').first();
  await manualBtn.click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(docsDir, 'demo-manual-breaks.png') });

  // Switch back to Balanced mode
  await pagesButton.click();
  await page.waitForTimeout(300);
  const balancedBtn = page.locator('button:has-text("Balanced")').first();
  await balancedBtn.click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // -------------------------------------------------------------
  // 6. CAPTURE 1-PAGE DEMO
  // -------------------------------------------------------------
  console.log('Capturing docs/demo-1-page.png (short aphorism)...');
  await textarea.fill(shortQuote);
  await selectPageCount(page, 1);
  await fillButton.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(docsDir, 'demo-1-page.png') });

  // -------------------------------------------------------------
  // 7. CAPTURE 2-PAGE DEMO
  // -------------------------------------------------------------
  console.log('Capturing docs/demo-2-pages.png (craftsmanship essay)...');
  await textarea.fill(mediumArticle);
  await selectPageCount(page, 2);
  await fillButton.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(docsDir, 'demo-2-pages.png') });

  // -------------------------------------------------------------
  // 8. CAPTURE SPANISH EDITORIAL DEMO (Rich Accents & Punctuation)
  // -------------------------------------------------------------
  console.log('Capturing docs/demo-spanish.png (Spanish literary essay)...');
  await textarea.fill(spanishEssay);
  await selectPageCount(page, 2);
  await fillButton.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(docsDir, 'demo-spanish.png') });

  // -------------------------------------------------------------
  // 9. CAPTURE CUSTOM TYPOGRAPHY (Georgia Serif)
  // -------------------------------------------------------------
  console.log('Capturing docs/demo-typography.png (Georgia serif configuration)...');
  const typoButton = page.locator('button[title*="Choose typography font"]').first();
  if (await typoButton.count() > 0) {
    await typoButton.click();
    await page.waitForTimeout(400);
    const georgiaBtn = page.locator('button:has-text("Georgia")').first();
    if (await georgiaBtn.isVisible()) {
      await georgiaBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(docsDir, 'demo-typography.png') });
    // Switch back to Inter
    await typoButton.click();
    await page.waitForTimeout(400);
    const interBtn = page.locator('button:has-text("Inter")').first();
    if (await interBtn.isVisible()) {
      await interBtn.click();
      await page.waitForTimeout(400);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // -------------------------------------------------------------
  // 10. RESTORE 4-PAGE CONCERT ESSAY & DEMONSTRATE EXPORT MENU
  // -------------------------------------------------------------
  console.log('Restoring 4-page concert essay for final video action...');
  await textarea.fill(concertEssay);
  await selectPageCount(page, 4);
  await fillButton.click();
  await page.waitForTimeout(1200);

  const exportBtn = page.locator('button:has-text("Export")').first();
  await exportBtn.click();
  await page.waitForTimeout(800);
  await exportBtn.click();
  await page.waitForTimeout(600);

  console.log('Closing browser context to finalize video...');
  await context.close();
  await browser.close();

  // -------------------------------------------------------------
  // 11. BUILD COMPOSITE BEFORE/AFTER GRAPHIC
  // -------------------------------------------------------------
  console.log('Generating composite before/after graphic...');
  const compBrowser = await chromium.launch({ channel: 'msedge', headless: true });
  const compPage = await compBrowser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });

  const beforeImgData = fs.readFileSync(path.join(docsDir, 'demo-before.png')).toString('base64');
  const fourPagesImgData = fs.readFileSync(path.join(docsDir, 'demo-four-pages.png')).toString('base64');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background-color: #0c0c0e;
          color: #f4f4f6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 900px;
          padding: 40px;
        }
        .header { text-align: center; margin-bottom: 28px; }
        .title { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; color: #ffffff; }
        .subtitle { font-size: 14px; color: #8e8e99; margin-top: 6px; }
        .container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          width: 100%;
          max-width: 1520px;
        }
        .card {
          flex: 1;
          background: #121216;
          border: 1px solid #22222a;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
        }
        .card-header {
          padding: 12px 18px;
          background: #17171d;
          border-bottom: 1px solid #22222a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #a1a1aa;
        }
        .card-badge {
          font-size: 11px;
          font-family: ui-monospace, monospace;
          color: #71717a;
          background: #0c0c0e;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #27272a;
        }
        .card-img-wrap {
          height: 620px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: #08080a;
        }
        .card-img-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 6px;
        }
        .arrow {
          font-size: 32px;
          color: #71717a;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .arrow-badge {
          font-size: 11px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a1a1aa;
          background: #16161c;
          border: 1px solid #2a2a34;
          padding: 4px 10px;
          border-radius: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Automatic Balanced Typographic Pagination</div>
        <div class="subtitle">Arbitrary unformatted text transformed deterministically into publication-grade image cards</div>
      </div>
      <div class="container">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Before: Raw Long-form Text</span>
            <span class="card-badge">16 Paragraphs &bull; 1,006 words</span>
          </div>
          <div class="card-img-wrap">
            <img src="data:image/png;base64,${beforeImgData}" />
          </div>
        </div>
        <div class="arrow">
          <span>&rarr;</span>
          <span class="arrow-badge">Auto-fit &amp; Fill</span>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">After: 4 Balanced Image Cards</span>
            <span class="card-badge">95-100% Fill &bull; 1080&times;1350</span>
          </div>
          <div class="card-img-wrap">
            <img src="data:image/png;base64,${fourPagesImgData}" />
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await compPage.setContent(html);
  await compPage.waitForTimeout(500);
  console.log('Capturing docs/demo-before-after.png ...');
  await compPage.screenshot({ path: path.join(docsDir, 'demo-before-after.png') });
  await compBrowser.close();

  // -------------------------------------------------------------
  // 12. CONVERT VIDEO TO MP4 & CRISP GIF
  // -------------------------------------------------------------
  const videoFiles = fs.readdirSync(rawVideoDir).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    const sorted = videoFiles.map((f) => ({
      name: f,
      time: fs.statSync(path.join(rawVideoDir, f)).mtimeMs,
    })).sort((a, b) => b.time - a.time);

    const rawVideoPath = path.join(rawVideoDir, sorted[0].name);
    const mp4Path = path.join(docsDir, 'demo.mp4');
    const webmPath = path.join(docsDir, 'demo.webm');
    const gifPath = path.join(docsDir, 'demo.gif');
    console.log(`Processing video recording from ${rawVideoPath}...`);

    const ffmpegExe = 'C:\\Users\\yeah\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe';

    try {
      fs.copyFileSync(rawVideoPath, webmPath);
      console.log('Saved docs/demo.webm');

      // Convert to high-quality MP4 (H.264)
      execSync(`"${ffmpegExe}" -y -i "${rawVideoPath}" -c:v libx264 -pix_fmt yuv420p -crf 20 -preset fast "${mp4Path}"`, { stdio: 'inherit' });
      console.log('Generated docs/demo.mp4');

      // Convert first 12 seconds to high-palette crisp GIF
      execSync(`"${ffmpegExe}" -y -ss 0 -t 12 -i "${rawVideoPath}" -vf "fps=14,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "${gifPath}"`, { stdio: 'inherit' });
      console.log('Generated docs/demo.gif');
    } catch (err) {
      console.error('Error during ffmpeg conversion:', err);
    }
  }

  console.log('All demo assets generated successfully!');
}


run().catch((err) => {
  console.error('Failed to generate demos:', err);
  process.exit(1);
});
