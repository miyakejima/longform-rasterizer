# longform-rasterizer

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-63%20passing-brightgreen)](src/__tests__)

**Paste prose. Get publication-grade image cards. No AI, no servers, no blur.**

A client-side typesetting engine that paginates long-form text across balanced, pixel-perfect image cards — entirely in the browser. The layout engine solves card distribution as a constrained optimization problem using hierarchical dynamic programming, maximizing vertical utilization across all pages simultaneously rather than filling them greedily one by one.

![Hero Balancing](docs/hero-balancing.webp)
*A 1,000-word essay pasted into the editor: instant 4-card balance at 27px, 95–97% vertical utilization. ([WebP](docs/hero-balancing.webp) · [MP4](docs/hero-balancing.mp4))*

---

## Features

- **Hierarchical DP layout** — paragraph → sentence → line fallback ensures clean page breaks at every granularity
- **Auto-fit font sizing** — binary search finds the largest font that doesn't overflow, across all pages
- **Fill optimizer** — 2D grid search over line-height × paragraph spacing to maximize utilization to ≥ 95%
- **Text preservation invariant** — every character in equals every character out, enforced mathematically
- **Orphan & widow suppression** — cost penalties prevent single stranded lines at page tops and bottoms
- **Dynamic terminal trim** — final card height shrinks to fit content instead of leaving dead whitespace
- **High-DPI rasterization** — 1×, 2×, 3× Retina rendering with subpixel anti-aliasing
- **Export** — PNG, WebP, JPEG per card or all-in-one ZIP download
- **Canvas presets** — 1080×1350 (4:5 · X/Threads), 1080×1920 (9:16 · Stories), 1080×1080 (1:1), or fully custom
- **Typography controls** — font family, weight, size, letter-spacing, line-height, alignment (L/C/R/justify), vertical alignment
- **Distribution modes** — Balanced, Paragraph-Preserving, Manual (drag breaks)
- **Keyboard shortcuts** — Ctrl+B editor toggle, ←/→ page step, F fullscreen inspect
- **No backend** — measurement, layout, rendering, and export all happen in Canvas 2D on the client

---

## Engine Architecture

`
Raw Text ──► DOM-Calibrated Measurement (Canvas 2D + LRU cache)
         ──► Deterministic Line Tokenizer & Wrapper
         ──► Hierarchical DP Partitioning  (dpP → dpS → dp)
         ──► [Auto-Fit]  Binary search over font size
         ──► [Fill]      Grid search over line-height × paragraph spacing
         ──► High-DPI Canvas 2D Rasterizer (Retina @ 2×/3×)
         ──► Export (PNG / WebP / JPEG / ZIP)
`

### Text Measurement

Glyph metrics are captured via Canvas 2D ctx.measureText() with exact font family, size, weight, and letter-spacing applied — not estimated. A bounded **10,000-entry LRU cache** (widthCache) eliminates redundant measurement calls across re-renders, reducing per-line wrapping to microseconds. A CHAR_WIDTH_RATIOS fallback table ensures identical measurements in headless Node.js and CI environments.

Preserved verbatim: curly quotes, tabs, indentation, Spanish diacritics (á é í ó ú ñ), inverted punctuation (¿ ¡), guillemets (« »).

### DP Partitioning

Rather than filling pages greedily until overflow, the engine frames layout as **global cost minimization** across all pages simultaneously:

\mathcal{C}(h) = \frac{(h - h_{\text{target}})^2}{20} \cdot w_{\text{variance}} + \mathcal{P}_{\text{boundary}} + \mathcal{P}_{\text{orphan}}

| Term | Value | Effect |
| :--- | :--- | :--- |
| $\mathcal{P}_{\text{boundary}}$ (mid-paragraph break) |  \times 10^7$ | Hard-prevents splitting paragraphs across pages |
| $\mathcal{P}_{\text{boundary}}$ (overflow) | ^7$ | Hard-prevents page overflow |
| $\mathcal{P}_{\text{orphan}}$ | $+400$ | Soft-penalizes widow/orphan lines |

**Three-tier fallback** — the engine attempts partition strategies from coarsest to finest:

| Tier | Algorithm | Boundary | Trigger |
| :--- | :--- | :--- | :--- |
| 1 — dpP | Paragraph DP | Paragraph end | ≥ N paragraphs available |
| 2 — dpS | Sentence DP | Sentence end .?! | Any paragraph exceeds page height |
| 3 — dp | Line DP | Any line | Fallback; uses O(1) prefix-sum height queries |

### Auto-Fit & Fill Optimizer

**Auto-Fit** runs a binary search over [minFont, maxFont] — O(log F) calls to the full pagination pipeline — to find the largest font size at which no page overflows.

**Fill Optimizer** then runs a 2D grid search over:
- Line-height: [1.45 → 1.85] in 0.05 steps
- Paragraph spacing: continuous range

It selects the combination that maximizes average vertical utilization (target: ≥ 95%) without clipping.

### Text Preservation

Every layout pass enforces:

\bigcup_{p=1}^N \text{page}[p].\text{text} \equiv \text{originalText}

No characters are dropped, reordered, or synthesized.

---

## Performance

Measured on consumer hardware (Apple M-series / Intel Core i7, single-threaded V8):

| Stage | Scale | Time | Complexity |
| :--- | :--- | :--- | :--- |
| Line & glyph measurement | 1,000 words, 16 paragraphs | 2.8 ms | O(W) with LRU |
| Line-break packaging | 1,000 words | 3.4 ms | O(W) greedy |
| DP partitioning | 16 paragraphs → 4 cards | 8.2 ms | O(N·P²) |
| Fill optimization | 16 paragraphs → 4 cards | 31.5 ms | O(log F · DP) |
| Canvas draw @ 2× | 4 cards @ 2160×2700 | 44.0 ms | O(L) |
| **End-to-end** | Paste → balanced canvas | **< 50 ms** | — |

---

## Studio Interface

![Fluid Studio](docs/fluid-studio.webp)
*Collapsing the editor panel to expand the canvas preview to full viewport width. ([WebP](docs/fluid-studio.webp) · [MP4](docs/fluid-studio.mp4))*

| Key | Action |
| :--- | :--- |
| Ctrl + B | Toggle editor panel (expand canvas to full width) |
| ← / → | Step through pages in Single or Carousel view |
| F | Open full-resolution modal for pixel-level inspection |

![Deep Inspection](docs/deep-inspection.webp)
*Stepping through pages in Single View and opening full-resolution inspection with F. ([WebP](docs/deep-inspection.webp) · [MP4](docs/deep-inspection.mp4))*

---

## Output Samples

### Single-Page Aphorism
![Single Page View](docs/showcase-single.png)
*Single View mode with centered vertical justification — no multi-column gutters.*

### 4-Page Balanced Editorial Cards
![4-Page Balanced Output](docs/showcase-balanced.png)
*1,000 words across 4 balanced cards. Pure #000000 / #FFFFFF, 95–97% vertical utilization.*

### Dynamic Terminal Trim
![Dynamic Terminal Trim](docs/showcase-trim.png)
*	rimLastPageHeight crops the final card to fit content exactly — no trailing dead space.*

---

## Canvas Presets

| Preset | Dimensions | Ratio | Platform |
| :--- | :--- | :--- | :--- |
| X Essay (default) | 1080 × 1350 | 4:5 | X (Twitter), Threads |
| Story | 1080 × 1920 | 9:16 | Instagram Stories, TikTok |
| Square | 1080 × 1080 | 1:1 | Instagram Feed |
| Custom | any × any | — | Print, newsletters, arbitrary |

Export scales: **1×** (screen), **2×** (Retina), **3×** (print-ready). Default: 2× (2160×2700 px for the 4:5 preset).

---

## Quickstart

**Prerequisites:** Node.js 18+ and npm 9+

`ash
git clone https://github.com/miyakejima/longform-rasterizer.git
cd longform-rasterizer
npm install
npm run dev
`

Open [http://localhost:3000](http://localhost:3000).

### Quality Gates

`ash
npm run lint                 # ESLint — 0 errors, 0 warnings
npx vitest run               # 63 unit & integration tests
npm run build                # Next.js production build
node scripts/verify_e2e.mjs  # 4-tier release audit
`

### Sample Texts

Pre-calibrated inputs in [docs/samples/](docs/samples/):

| File | Words | Sweet spot |
| :--- | :--- | :--- |
| [ssay-critique-16paras.txt](docs/samples/essay-critique-16paras.txt) | ~1,000 | 4 cards · 27px |
| [medium-craftsmanship-2pages.txt](docs/samples/medium-craftsmanship-2pages.txt) | 365 | 2 cards |
| [short-aphorism-1page.txt](docs/samples/short-aphorism-1page.txt) | 54 | 1 card · Single View |
| [spanish-literary-essay.txt](docs/samples/spanish-literary-essay.txt) | — | Diacritics & inverted punctuation verification |

---

## License

MIT © [miyakejima](https://github.com/miyakejima)
