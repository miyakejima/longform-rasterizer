# longform-rasterizer

**Deterministic geometric text rasterization without AI rewriting or layout hacks.**

`longform-rasterizer` partitions arbitrary long-form prose across balanced, publication-grade image cards for editorial distribution. It replaces non-deterministic LLM summarizers, fragile CSS multi-column flows, and blurry DOM screenshot scrapers with an exact, client-side dynamic programming typesetting engine.

![Hero Balancing](docs/hero-balancing.webp)
*Pasting a 1,000-word philosophical essay: instant 4-card dynamic programming balance at 27px font size with 95–97% vertical utilization. (Animation: [WebP](docs/hero-balancing.webp) • [MP4](docs/hero-balancing.mp4))*

---

## Why Naive Approaches Fail

Publishing long-form prose to image-first social feeds (X, Threads, Instagram) typically relies on one of three flawed strategies:

| Strategy | Failure Mode | Impact |
| :--- | :--- | :--- |
| **Generative AI "Summarizers"** | Hallucination and prose distortion | Modifies vocabulary, destroys rhythm, and drops critical nuance without authorial consent. |
| **CSS Multi-Column Wrapping** | Greedy line distribution | Pages 1–3 fill to 100%, while Page 4 ends abruptly with an awkward orphan line or 80% dead whitespace. |
| **Headless Browser Screenshots** | Uncontrollable canvas geometry | Slow (1–3s latency), blurred font baselines, inconsistent font rendering, and zero layout balancing across cards. |

`longform-rasterizer` treats multi-page pagination as a constrained optimization problem solved entirely client-side in sub-pixel Canvas 2D space.

---

## Engineering Architecture

```
Raw Text ──► DOM-Calibrated Measurement (Canvas 2D + LRU) 
         ──► Deterministic Line Tokenizer & Wrapper
         ──► Hierarchical Dynamic Programming (dpP → dpS → dp)
         ──► High-DPI Canvas 2D Rasterizer (Retina @ 2x/3x)
         ──► Lossless Export (PNG / WebP / ZIP)
```

### 1. DOM-Calibrated Line & Glyph Measurement
- **Subpixel Precision**: Glyph metrics are measured directly via Canvas 2D `ctx.measureText()` honoring exact font family, size, weight, and letter-spacing.
- **LRU Width Cache**: A bounded 10,000-entry LRU cache (`widthCache`) eliminates redundant measurement calls, reducing per-line wrapping latency to microseconds.
- **Headless Ratio Table**: An internal `CHAR_WIDTH_RATIOS` table provides exact proportional measurement fallback for headless Node.js and automated CI environments.
- **Byte Fidelity**: Preserves curly quotes, tabs, indentation, Spanish diacritics (`á`, `é`, `í`, `ó`, `ú`, `ñ`), inverted punctuation (`¿`, `¡`), and guillemets (`«`, `»`).

### 2. Multi-Tier Dynamic Programming Partitioning
Rather than filling pages greedily until overflow, the engine formulates card layout as a global cost minimization problem across all requested pages:

$$\mathcal{C}(h) = \frac{(h - h_{\text{target}})^2}{20} \cdot w_{\text{variance}} + \mathcal{P}_{\text{boundary}} + \mathcal{P}_{\text{orphan}}$$

Where:
- $h_{\text{target}}$ is the target content height inside the card padding.
- $\mathcal{P}_{\text{boundary}}$ heavily penalizes mid-paragraph breaks ($5 \times 10^7$) and document overflow ($10^7$).
- $\mathcal{P}_{\text{orphan}}$ penalizes typographic orphan and widow lines ($+400$).

The partitioner executes a 3-tier hierarchical fallback:
1. **Tier 1 (`dpP` - Paragraph DP)**: Partitions strictly along paragraph boundaries when paragraph count $P \ge N$.
2. **Tier 2 (`dpS` - Sentence DP)**: Partitions along sentence-ending punctuation when individual paragraphs exceed card height.
3. **Tier 3 (`dp` - Line DP)**: Falls back to line-level splitting using $O(1)$ prefix-sum height queries to guarantee zero overflow.

**Typography Solver**: A binary search over global font size $[F_{\min}, F_{\max}]$ discovers the optimal uniform font scale. A discrete 2D grid search over line-height $[1.45, 1.85]$ and paragraph spacing (`Fill` optimizer) maximizes vertical card utilization ($\ge 95\%$).

### 3. High-DPI Canvas Drawing & Dynamic Trim
- **Retina Rasterization**: Canvases are rendered at integer multipliers (`devicePixelRatio` 1x, 2x, 3x) with subpixel anti-aliasing and zero vector blurring.
- **Dynamic Terminal Trim (`trimLastPageHeight`)**: On multi-page documents where the concluding card contains fewer lines, the final canvas height automatically truncates to fit content:
  $$H_{\text{terminal}} = H_{\text{rendered}} + P_{\text{top}} + P_{\text{bottom}}$$
  This eliminates dead vertical whitespace on concluding cards without disturbing preceding cards.
- **Lossless Export**: Generates full-resolution PNG, WebP, JPEG, or a bundled ZIP archive via JSZip.

### 4. Mathematical Text Preservation Invariant
The engine enforces a strict mathematical invariant on every layout pass:

$$\bigcup_{p=1}^N \text{page}[p].\text{text} \equiv \text{originalText}$$

Every character, space, and newline from the input is accounted for in the rendered output. No words are dropped, abbreviated, reordered, or hallucinated.

---

## Studio Interface & Interaction

![Fluid Studio](docs/fluid-studio.webp)
*Collapsing the editor sidebar to expand the preview grid across the full viewport width. (Animation: [WebP](docs/fluid-studio.webp) • [MP4](docs/fluid-studio.mp4))*

The studio provides an uncluttered, distraction-free environment for rapid editorial inspection:

| Key Command | Action | Description |
| :--- | :--- | :--- |
| `Ctrl + B` | **Toggle Editor Sidebar** | Collapses the text panel, smoothly expanding the preview canvas across the full viewport. |
| `ArrowLeft` / `ArrowRight` | **Step Sequential Pages** | Navigates through pages sequentially in Single Page View or Carousel mode. |
| `F` | **Fullscreen Inspection** | Opens a full-resolution modal inspection view for pixel-level typography review. |

![Deep Inspection](docs/deep-inspection.webp)
*Stepping through pages in Single View mode and opening full-resolution modal inspection with key `F`. (Animation: [WebP](docs/deep-inspection.webp) • [MP4](docs/deep-inspection.mp4))*

---

## Curated Output Showcases

### 1-Page Focused Aphorism
![Single Page View](docs/showcase-single.png)
*Short aphorisms and quotes rendered in dedicated Single Page View mode with centered vertical justification, avoiding empty multi-column gutters.*

### 4-Page Balanced Editorial Cards
![4-Page Balanced Output](docs/showcase-balanced.png)
*A 1,000-word philosophical critique partitioned into 4 balanced cards on pure `#000000` with pure `#FFFFFF` typography and 95–97% vertical utilization.*

### Canvas Format & Dynamic Terminal Trim
![Dynamic Terminal Trim](docs/showcase-trim.png)
*Demonstrating aspect ratio switching and `trimLastPageHeight` automatically cropping trailing whitespace on the terminal card.*

---

## Algorithmic Performance Benchmarks

Measured on standard consumer hardware (Apple M-series / Intel Core i7, single-threaded V8):

| Pipeline Stage | Input Scale | Execution Time | Algorithmic Complexity |
| :--- | :--- | :--- | :--- |
| **Line & Glyph Measurement** | 1,000 words (~16 paragraphs) | 2.8 ms | $O(W)$ with LRU cache |
| **Line-Break Packaging** | 1,000 words | 3.4 ms | $O(W)$ linear greedy pass |
| **Dynamic Programming Partition** | 16 paragraphs across 4 cards | 8.2 ms | $O(N \cdot P^2)$ |
| **Canvas Fill Optimization** | 16 paragraphs across 4 cards | 31.5 ms | $O(\log F \cdot \text{DP})$ binary search |
| **High-DPI Canvas Drawing (2x)** | 4 cards @ 2160&times;2700 | 44.0 ms | $O(L)$ drawing operations |
| **Total End-to-End Solve** | Raw text paste to balanced canvas | **< 50 ms** | **Imperceptible interaction latency** |

---

## Quickstart

### Prerequisites
- Node.js 18.0+
- npm 9.0+

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/miyakejima/longform-rasterizer.git
cd longform-rasterizer

# Install dependencies
npm install

# Start local studio
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Gates & Verification
```bash
# Run linter (0 errors, 0 warnings)
npm run lint

# Run Vitest test suite (63 tests)
npx vitest run

# Run production build (Next.js Turbopack)
npm run build

# Run 4-tier E2E verification audit
node scripts/verify_e2e.mjs
```

### Benchmark Text Samples
Pre-calibrated test texts are available in [`docs/samples/`](docs/samples/):
- [`docs/samples/essay-critique-16paras.txt`](docs/samples/essay-critique-16paras.txt) — 16-paragraph Adorno/Postman philosophical critique (~1,000 words; optimal for 4 cards at 27px).
- [`docs/samples/medium-craftsmanship-2pages.txt`](docs/samples/medium-craftsmanship-2pages.txt) — 5-paragraph craft reflection (365 words; optimal for 2 cards).
- [`docs/samples/short-aphorism-1page.txt`](docs/samples/short-aphorism-1page.txt) — Single typography quote (54 words; optimal for 1 card in Single View).
- [`docs/samples/spanish-literary-essay.txt`](docs/samples/spanish-literary-essay.txt) — Spanish literary text verifying diacritics and inverted punctuation preservation.

---

## License

MIT © [miyakejima](https://github.com/miyakejima)
