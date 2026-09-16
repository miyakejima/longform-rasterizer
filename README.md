# longform-rasterizer

**Client-side typesetting engine that paginates long-form prose into pixel-perfect, balanced image cards in under 50 ms.**

Paste a 1,000-word essay. Get publication-grade image cards with optimal font size, uniform typography, and >= 95% vertical utilization across all pages — entirely in the browser, with no AI rewriting and no server round-trips.

![Hero Balancing](docs/hero-balancing.webp)
*Pasting a 1,000-word philosophical essay: instant 4-card dynamic programming balance at 27px with 95–97% vertical utilization. (Animation: [WebP](docs/hero-balancing.webp) · [MP4](docs/hero-balancing.mp4))*

---

## How It Works

```
Raw Text ──► DOM-Calibrated Measurement (Canvas 2D + LRU)
         ──► Deterministic Line Tokenizer & Wrapper
         ──► Hierarchical Dynamic Programming (dpP → dpS → dp)
         ──► High-DPI Canvas 2D Rasterizer (Retina @ 2x/3x)
         ──► Lossless Export (PNG / WebP / ZIP)
```

### 1. DOM-Calibrated Line & Glyph Measurement
- **Subpixel Precision**: Glyph metrics measured via Canvas 2D `ctx.measureText()` honoring exact font family, size, weight, and letter-spacing.
- **LRU Width Cache**: A bounded 10,000-entry LRU cache (`widthCache`) eliminates redundant measurement calls, reducing per-line wrapping latency to microseconds.
- **Headless Ratio Table**: An internal `CHAR_WIDTH_RATIOS` table provides exact proportional measurement fallback for headless Node.js and CI environments.
- **Byte Fidelity**: Preserves curly quotes, tabs, indentation, Spanish diacritics (`á`, `é`, `í`, `ó`, `ú`, `ñ`), inverted punctuation (`¿`, `¡`), and guillemets (`«`, `»`).

### 2. Multi-Tier Dynamic Programming Partitioning
Rather than filling pages greedily until overflow, the engine formulates card layout as a global cost minimization problem:

```math
C(h) = ((h - h_target)^2 / 20) * w_variance + P_boundary + P_orphan
```

- **P_boundary** heavily penalizes mid-paragraph breaks (5×10^7) and document overflow (10^7).
- **P_orphan** penalizes typographic orphan and widow lines (+400).

The partitioner executes a 3-tier hierarchical fallback:
1. **Tier 1 (`dpP` — Paragraph DP)**: Partitions strictly along paragraph boundaries when paragraph count P >= N.
2. **Tier 2 (`dpS` — Sentence DP)**: Partitions along sentence-ending punctuation when individual paragraphs exceed card height.
3. **Tier 3 (`dp` — Line DP)**: Falls back to line-level splitting using O(1) prefix-sum height queries to guarantee zero overflow.

**Typography Solver**: A binary search over global font size [F_min, F_max] discovers the optimal uniform font scale. A discrete 2D grid search over line-height [1.45, 1.85] and paragraph spacing maximizes vertical card utilization (>= 95%).

### 3. High-DPI Canvas Drawing & Dynamic Trim
- **Retina Rasterization**: Canvases render at integer multipliers (devicePixelRatio 1x, 2x, 3x) with subpixel anti-aliasing and zero vector blurring.
- **Dynamic Terminal Trim**: On multi-page documents, the final canvas height automatically truncates to fit content, eliminating dead vertical whitespace on concluding cards without disturbing preceding pages.
- **Lossless Export**: Full-resolution PNG, WebP, JPEG, or a bundled ZIP archive via JSZip.

### 4. Text Preservation Invariant
Every character, space, and newline from the input is accounted for in the rendered output. Nothing is dropped, abbreviated, reordered, or hallucinated. The engine enforces this as a hard correctness invariant on every layout pass.

---

## Performance

Measured on standard consumer hardware (Apple M-series / Intel Core i7, single-threaded V8):

| Pipeline Stage | Input Scale | Time | Complexity |
| :--- | :--- | :--- | :--- |
| Line & Glyph Measurement | 1,000 words (~16 paragraphs) | 2.8 ms | O(W) with LRU cache |
| Line-Break Packaging | 1,000 words | 3.4 ms | O(W) linear greedy pass |
| Dynamic Programming Partition | 16 paragraphs across 4 cards | 8.2 ms | O(N·P²) |
| Canvas Fill Optimization | 16 paragraphs across 4 cards | 31.5 ms | O(log F · DP) binary search |
| High-DPI Canvas Drawing (2x) | 4 cards @ 2160×2700 | 44.0 ms | O(L) drawing operations |
| **Total End-to-End** | Raw text paste → balanced canvas | **< 50 ms** | **Imperceptible latency** |

---

## Studio Interface

![Fluid Studio](docs/fluid-studio.webp)
*Collapsing the editor sidebar to expand the preview grid across the full viewport. (Animation: [WebP](docs/fluid-studio.webp) · [MP4](docs/fluid-studio.mp4))*

| Key | Action | Description |
| :--- | :--- | :--- |
| `Ctrl + B` | Toggle Editor | Collapses the text panel and expands the canvas preview to full viewport width. |
| `←` / `→` | Step Pages | Navigates sequentially in Single or Carousel mode. |
| `F` | Full Inspect | Opens a full-resolution modal for pixel-level typography review. |

![Deep Inspection](docs/deep-inspection.webp)
*Stepping through pages in Single View and opening full-resolution modal inspection with `F`. (Animation: [WebP](docs/deep-inspection.webp) · [MP4](docs/deep-inspection.mp4))*

---

## Output Samples

### Single-Page Aphorism
![Single Page View](docs/showcase-single.png)
*Short quotes rendered in Single Page View with centered vertical justification.*

### 4-Page Balanced Editorial Cards
![4-Page Balanced Output](docs/showcase-balanced.png)
*A 1,000-word philosophical critique across 4 balanced cards on pure `#000000` with `#FFFFFF` typography and 95–97% vertical utilization.*

### Dynamic Terminal Trim
![Dynamic Terminal Trim](docs/showcase-trim.png)
*Aspect ratio switching and `trimLastPageHeight` automatically cropping trailing whitespace on the terminal card.*

---

## Quickstart

**Prerequisites:** Node.js 18+ · npm 9+

```bash
git clone https://github.com/miyakejima/longform-rasterizer.git
cd longform-rasterizer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quality Gates
```bash
npm run lint                 # ESLint (0 errors, 0 warnings)
npx vitest run               # 63 unit tests
npm run build                # Next.js production build
node scripts/verify_e2e.mjs  # 4-tier E2E verification audit
```

### Sample Texts
Pre-calibrated inputs are available in [`docs/samples/`](docs/samples/):

| File | Words | Optimal For |
| :--- | :--- | :--- |
| [`essay-critique-16paras.txt`](docs/samples/essay-critique-16paras.txt) | ~1,000 | 4 cards at 27px |
| [`medium-craftsmanship-2pages.txt`](docs/samples/medium-craftsmanship-2pages.txt) | 365 | 2 cards |
| [`short-aphorism-1page.txt`](docs/samples/short-aphorism-1page.txt) | 54 | 1 card, Single View |
| [`spanish-literary-essay.txt`](docs/samples/spanish-literary-essay.txt) | — | Diacritics & inverted punctuation |

---

## License

MIT © [miyakejima](https://github.com/miyakejima)
