# longform-rasterizer

Deterministic long-form text rasterizer that converts essays, threads, and articles into clean, high-readability multi-page typographic images.

Built with Next.js, React, TypeScript, and HTML5 Canvas.

## Features

- **Exact Text Fidelity**: Preserves punctuation, unicode, paragraph breaks, and formatting without AI rewriting or truncation.
- **Deterministic Multi-Page Pagination**: Intelligent sentence- and paragraph-aware line wrapping and height balancing across 1 to 8 pages.
- **Dynamic Auto-Fit**: Binary-search typography scaling to fit arbitrary text cleanly into target page counts.
- **Obsidian Dark Aesthetic**: Minimalist, distraction-free editorial interface with zero clutter.
- **High-Resolution Export**: 1x, 2x, and 3x retina exports for PNG, JPEG, and WebP, plus batch ZIP download.
- **Client-Side Only**: 100% private, browser-based rendering with custom font upload support.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev`: Start local development server
- `npm run build`: Build production bundle
- `npm start`: Serve production build
- `npm test`: Run Vitest test suite
- `npm run lint`: Run ESLint checks

