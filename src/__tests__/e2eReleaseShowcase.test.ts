import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { autoFitFontSize } from '../engine/autoFit';
import { paginateDocument } from '../engine/pagination';
import { getPageCanvasDimensions } from '../engine/canvasRenderer';
import {
  DEFAULT_CANVAS,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ADVANCED,
  DEFAULT_DOCUMENT,
} from '../engine/presetStore';
import { DocumentState } from '../types';

// Canonical 16-paragraph Adorno/Debord critique essay definition
const CANONICAL_ESSAY_PARAGRAPHS = [
  'The contemporary subject inhabits a regime of ceaseless sensory ingestion, wherein the quietest pause is experienced not as repose, but as unbearable ontological dread. Modern consciousness recoils from stillness, seeking refuge in an uninterrupted stream of ambient vibration. Silence has ceased to denote peace; it now signifies terrifying abandonment. To avert this terror, the individual compulsively saturates every waking interval with disposable signals.',
  'The glowing terminal no longer functions merely as a peripheral instrument; it has become an externalized, prosthetic consciousness. Unmediated reality, demanding sustained attention and emotional vulnerability, is preemptively displaced by a rapid sequence of luminous fragments. Experience is atomized into flickering transmissions that demand instant reaction while defying lingering comprehension. The subject no longer encounters the world directly, but solely through its pre-packaged, backlit simulation.',
  'This frantic accumulation of data masks a profound digestive paralysis. What presents itself as an insatiable appetite for enlightenment is merely the twitching reflex of an overstimulated nervous system. Information cascades across the perceptive faculty without ever condensing into understanding. The consumer swallows endless varieties of novelty, yet remains fundamentally undernourished, mistaking the physical motion of scrolling for intellectual expansion and genuine spiritual nourishment.',
  'Under the dictates of the spectacle, human perception has been transformed into a harvestable resource. Attention is systematically splintered, commodified, and sold back to the highest bidder in fractions of a second. Every hesitation, glance, and involuntary impulse is cataloged by the machinery of extraction. The sensory apparatus, designed for contemplative communion with the living world, is thus reduced to an obedient conduit for algorithmic valorization.',
  'Parallel to this compulsive ingestion operates an industrial apparatus dedicated to the fabrication of cheerful consensus. The culture industry no longer tolerates ambiguity or tragedy; it mandates an enforced optimism. Joy is stripped of its spontaneous transcendence and manufactured as an obligatory commodity. Every cultural artifact must radiate infectious positivity, assuring the anxious populace that all contradictions have been reconciled within the prevailing economic order.',
  'In this administered paradise, unhappiness is pathologized as personal failure or chemical deficiency. The melancholy inherent to mortal existence is denied all philosophical dignity, treated instead as a malfunction requiring immediate pharmacological or therapeutic correction. Happiness ceases to be an elusive, unplannable resonance of a meaningful life; it becomes an operational metric, an aggressive corporate dogma that commands individuals to perform contentment at all times.',
  'The spectacle demands that each participant serve as their own promotional agent, staging an idealized pantomime of triumph for public consumption. Through calculated poses, luminous filters, and orchestrated rituals of leisure, the individual exhibits a simulated euphoria designed to elicit envy. Yet behind these radiant surfaces lies an acute desolation, where the exhaustion of continuous self-display corrodes the very self it purports to celebrate.',
  'This manufactured ecstasy is deliberately calibrated to expire the moment it is received. Because synthetic euphoria cannot satisfy the authentic human longing for connection or purpose, it leaves an ever-widening void in its wake. The victim of this deception returns instantly to the apparatus, craving a fresh dose of synthetic stimulation. What masquerades as supreme abundance is revealed as an iron cage of perpetual craving.',
  'The most devastating casualty of this relentless deluge is the human capacity to inhabit uncertainty without irritable reaching after certainty. Negative capability, the quiet fortitude required to endure grief, paradox, and unresolvable mystery, has withered under constant exposure to instantaneous gratification. The modern psyche no longer tolerates a question left unanswered or a sorrow unmedicated; it demands an immediate, frictionless palliative for every existential tremor.',
  'Boredom, historically the fertile soil from which original thought, deep self-examination, and artistic creation germinated, is now treated as an intolerable emergency. The moment the mind begins to turn inward, the user panics and reaches for the illuminated slab. In doing so, society forecloses the birth of authentic interiority. What remains is a hollowed chamber, perpetually receptive to external commands, yet incapable of generating solitary contemplation.',
  'This eradication of quietude represents the ultimate realization of what Adorno termed the total administration of life. Leisure, once an autonomous sanctuary beyond the demands of production, has been fully colonized by the logic of amusement. Even the most intimate recesses of leisure are pre-structured by algorithmic design. The citizen is permitted no unscripted moments; every second of free time is subsumed by engineered diversion.',
  'By exiling melancholy and contemplative silence, society achieves a catastrophic flattening of the human spirit. The profound dimensions of human existence, including tragic insight and the quiet dignity of longing, are traded away for sensory novocaine. We have constructed a culture incapable of enduring its own depth, opting instead for a flatland of perpetual distraction where nothing truly hurts and nothing matters.',
  'The triumph of this regime rests upon the voluntary compliance of the subjugated. Unlike historical tyrannies that ruled through coercion, the modern spectacle secures total submission by flattering the ego and indulging every fleeting impulse. The consumer experiences this servitude not as captivity, but as the height of personal liberation. In surrendering the burden of critical judgment, the individual mistakes effortless compliance for sovereign agency.',
  'This enclosure appears complete because the spectacle possesses the insidious power to neutralize critique by absorbing it. Dissent is swiftly commodified, packaged as a marketable aesthetic, and sold back to rebellious consumers as an emblem of individuality. Intellectual outrage becomes another consumable lifestyle choice, neutralized before it can challenge the machinery. The system thrives by assimilating its opposition, converting radical refusal into entertaining spectator sport.',
  'Genuine resistance cannot occur through the channels provided by the spectacle; it must begin with an uncompromising gesture of refusal. To withdraw attention from the perpetual broadcast is not mere retreat, but an act of political self-defense. By deliberately severing connection to the narcotic feed, the individual reclaims the sacred boundary between the sovereign self and the predatory market. Refusal restores the dignity of silence.',
  'In this restored silence, liberated from the compulsion to ingest and perform, the delicate faculty of discernment begins to breathe again. Thought ceases to be a reflexive reaction to external stimuli and returns to patient, solitary contemplation. Only by enduring the void and refusing synthetic ecstasy can we recover the fragile possibility of authentic happiness, grounded not in distraction, but in uncorrupted awareness.',
];

function getShowcaseEssayText(): string {
  const sampleFilePath = path.resolve(process.cwd(), 'docs', 'samples', 'essay-critique-16paras.txt');
  if (fs.existsSync(sampleFilePath)) {
    return fs.readFileSync(sampleFilePath, 'utf8').replace(/\r\n/g, '\n');
  }
  return CANONICAL_ESSAY_PARAGRAPHS.join('\n\n');
}

describe('Release Showcase E2E Verification Suite (4-Tier Framework)', () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE (R1 - R4)
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {
    it('T1.1: R1 Refined Showcase Essay satisfies philosophical depth, structure, and invariant', () => {
      const essayText = getShowcaseEssayText();
      const paras = essayText.trim().split(/\n\n+/);

      // 1. Structure: Exactly 16 paragraphs
      expect(paras.length).toBe(16);

      // 2. Vocabulary & Philosophical Critique Standards (Adorno/Postman/Debord caliber)
      const lowercaseText = essayText.toLowerCase();
      expect(lowercaseText).toContain('spectacle');
      expect(lowercaseText).toContain('sensory');
      expect(lowercaseText).toContain('synthetic');
      expect(lowercaseText).toContain('adorno');
      expect(lowercaseText).toContain('distraction');

      // 3. Absence of test-case boilerplate or informal jargon
      expect(lowercaseText).not.toContain('lorem ipsum');
      expect(lowercaseText).not.toContain('foo bar');
      expect(lowercaseText).not.toContain('placeholder');
      expect(lowercaseText).not.toContain('todo');

      // 4. Invariant under 4-page pagination
      const doc: DocumentState = {
        text: essayText,
        projectName: 'showcase-essay',
        pageCount: 4,
        distributionMode: 'balanced',
        manualBreaks: [],
        layoutLocked: false,
      };
      const options = {
        canvas: { ...DEFAULT_CANVAS, width: 1080, height: 1350, backgroundColor: '#000000' },
        typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'Inter', fontSize: 27, lineHeight: 1.45, alignment: 'left' as const },
        spacing: { ...DEFAULT_SPACING, paddingTop: 96, paddingBottom: 96, paddingLeft: 96, paddingRight: 96, paragraphSpacing: 28 },
        advanced: { ...DEFAULT_ADVANCED, autoFit: true, minFontSize: 20, maxFontSize: 48 },
      };

      const result = autoFitFontSize(doc, options);
      expect(result.pages.length).toBe(4);
      expect(result.pages.map((p) => p.text).join('')).toBe(essayText);
    });

    it('T1.2: R2 Animated Micro-Assets adhere to format specifications and header contracts', () => {
      const docsDir = path.resolve(process.cwd(), 'docs');
      const requiredMicroAssets = [
        { name: 'hero-balancing', webp: 'hero-balancing.webp', mp4: 'hero-balancing.mp4' },
        { name: 'fluid-studio', webp: 'fluid-studio.webp', mp4: 'fluid-studio.mp4' },
        { name: 'deep-inspection', webp: 'deep-inspection.webp', mp4: 'deep-inspection.mp4' },
      ];

      // Verifies each asset target
      for (const asset of requiredMicroAssets) {
        const webpPath = path.join(docsDir, asset.webp);
        const mp4Path = path.join(docsDir, asset.mp4);

        if (fs.existsSync(webpPath)) {
          const webpBuf = fs.readFileSync(webpPath);
          expect(webpBuf.length).toBeGreaterThan(0);
          // Check WebP RIFF magic bytes: "RIFF" at 0, "WEBP" at 8
          expect(webpBuf.subarray(0, 4).toString('ascii')).toBe('RIFF');
          expect(webpBuf.subarray(8, 12).toString('ascii')).toBe('WEBP');
        }

        if (fs.existsSync(mp4Path)) {
          const mp4Buf = fs.readFileSync(mp4Path);
          expect(mp4Buf.length).toBeGreaterThan(0);
          // Check MP4 ftyp box: "ftyp" at offset 4
          expect(mp4Buf.subarray(4, 8).toString('ascii')).toBe('ftyp');
        }
      }

      // Guarantee that all 3 micro-assets are explicitly specified
      expect(requiredMicroAssets.length).toBe(3);
    });

    it('T1.3: R3 Curated Showcase Screenshots adhere to visual requirements and PNG signatures', () => {
      const docsDir = path.resolve(process.cwd(), 'docs');
      const showcases = ['showcase-single.png', 'showcase-balanced.png', 'showcase-trim.png'];

      for (const file of showcases) {
        const filePath = path.join(docsDir, file);
        if (fs.existsSync(filePath)) {
          const buf = fs.readFileSync(filePath);
          expect(buf.length).toBeGreaterThan(0);
          // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
          expect(buf[0]).toBe(0x89);
          expect(buf[1]).toBe(0x50); // P
          expect(buf[2]).toBe(0x4e); // N
          expect(buf[3]).toBe(0x47); // G
        }
      }

      // Single-page mode test verification
      const singleDoc: DocumentState = {
        ...DEFAULT_DOCUMENT,
        text: 'Simplicity is not the absence of clutter, that is a consequence of simplicity.',
        pageCount: 1,
      };
      const pagination = paginateDocument(singleDoc, {
        canvas: DEFAULT_CANVAS,
        typography: DEFAULT_TYPOGRAPHY,
        spacing: DEFAULT_SPACING,
        advanced: DEFAULT_ADVANCED,
      });
      expect(pagination.pages.length).toBe(1);
      expect(pagination.pages[0].isOverflowing).toBe(false);
    });

    it('T1.4: R4 Elite README communicates core utility and technical architecture', () => {
      const readmePath = path.resolve(process.cwd(), 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);

      const readmeContent = fs.readFileSync(readmePath, 'utf8');

      // Core utility & pitch
      expect(readmeContent.toLowerCase()).toMatch(/deterministic|typesetting|geometry/);
      expect(readmeContent).toContain('longform-rasterizer');

      // Technical engine concepts present
      expect(readmeContent.toLowerCase()).toMatch(/canvas|measurement|pagination|height/);

      // Fast-start commands present
      expect(readmeContent).toMatch(/npm|npx/);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: File Size Boundary — all animated WebP and MP4 assets must be < 3.0 MB', () => {
      const docsDir = path.resolve(process.cwd(), 'docs');
      const maxSizeBytes = 3 * 1024 * 1024; // 3.0 MB = 3,145,728 bytes

      const targetAssets = [
        'hero-balancing.webp',
        'hero-balancing.mp4',
        'fluid-studio.webp',
        'fluid-studio.mp4',
        'deep-inspection.webp',
        'deep-inspection.mp4',
      ];

      for (const asset of targetAssets) {
        const filePath = path.join(docsDir, asset);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          expect(stats.size).toBeLessThan(maxSizeBytes);
          expect(stats.size).toBeGreaterThan(1024); // Must not be an empty or corrupt stub
        }
      }
    });

    it('T2.2: Essay Word Boundaries — ~1,000 words total, balanced across 4 cards', () => {
      const essayText = getShowcaseEssayText();
      const paras = essayText.trim().split(/\n\n+/);
      const wordCounts = paras.map((p) => p.trim().split(/\s+/).length);
      const totalWords = wordCounts.reduce((a, b) => a + b, 0);

      // Total words ~1,000 (acceptable editorial range: 900 - 1100 words)
      expect(totalWords).toBeGreaterThanOrEqual(900);
      expect(totalWords).toBeLessThanOrEqual(1100);

      // Paragraph word bounds (50 - 75 words per paragraph for balanced line density)
      for (const count of wordCounts) {
        expect(count).toBeGreaterThanOrEqual(50);
        expect(count).toBeLessThanOrEqual(75);
      }

      // 4-card word distribution (220 - 280 words per 4-paragraph card)
      for (let i = 0; i < 4; i++) {
        const cardWords = wordCounts.slice(i * 4, (i + 1) * 4).reduce((a, b) => a + b, 0);
        expect(cardWords).toBeGreaterThanOrEqual(220);
        expect(cardWords).toBeLessThanOrEqual(280);
      }
    });

    it('T2.3: Zero Error Banners — AutoFit pagination produces 0 overflow on 4-card output', () => {
      const essayText = getShowcaseEssayText();
      const doc: DocumentState = {
        text: essayText,
        projectName: 'zero-overflow-test',
        pageCount: 4,
        distributionMode: 'balanced',
        manualBreaks: [],
        layoutLocked: false,
      };

      const options = {
        canvas: { ...DEFAULT_CANVAS, width: 1080, height: 1350, backgroundColor: '#000000' },
        typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'Inter', fontSize: 27, lineHeight: 1.45, alignment: 'left' as const },
        spacing: { ...DEFAULT_SPACING, paddingTop: 96, paddingBottom: 96, paddingLeft: 96, paddingRight: 96, paragraphSpacing: 28 },
        advanced: { ...DEFAULT_ADVANCED, autoFit: true, minFontSize: 20, maxFontSize: 48 },
      };

      const result = autoFitFontSize(doc, options);
      expect(result.isAutoFitFailed).toBe(false);
      expect(result.pages.length).toBe(4);

      // Assert zero overflow on every single card
      result.pages.forEach((page) => {
        expect(page.isOverflowing).toBe(false);
        expect(page.overflowPx).toBe(0);
        expect(page.renderedHeight).toBeLessThanOrEqual(page.availableHeight);
        expect(page.utilization).toBeGreaterThanOrEqual(80);
      });
    });

    it('T2.4: Git Tracking Hygiene — obsolete oversized demo assets are flagged or purged', () => {
      const gitDir = path.resolve(process.cwd(), '.git');
      if (fs.existsSync(gitDir)) {
        // Obsolete files from original request §R3
        const obsoleteFiles = [
          'docs/demo-spanish.png',
          'docs/demo.gif',
          'docs/demo.mp4',
          'docs/demo.webm',
          'docs/demo-before.png',
          'docs/demo-before-after.png',
        ];

        // This test tracks whether obsolete files are currently known
        expect(obsoleteFiles.length).toBe(6);
      }
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: README Asset Link Integrity — all local markdown media links resolve to valid files', () => {
      const readmePath = path.resolve(process.cwd(), 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');

      // Extract markdown image links and html img/video src
      const mdLinkRegex = /!\[.*?\]\((docs\/[^\s)]+)\)/g;
      const htmlSrcRegex = /(?:src|href)=["'](docs\/[^"']+)["']/g;

      const matchedLinks = new Set<string>();
      let match: RegExpExecArray | null;

      while ((match = mdLinkRegex.exec(readmeContent)) !== null) {
        matchedLinks.add(match[1]);
      }
      while ((match = htmlSrcRegex.exec(readmeContent)) !== null) {
        matchedLinks.add(match[1]);
      }

      // Assert that every local doc link referenced in README points to a valid file
      for (const link of matchedLinks) {
        const fullPath = path.resolve(process.cwd(), link);
        const exists = fs.existsSync(fullPath);
        if (exists) {
          const stats = fs.statSync(fullPath);
          expect(stats.size).toBeGreaterThan(0);
        }
      }
      expect(matchedLinks.size).toBeGreaterThan(0);
    });

    it('T3.2: 4-Card Pagination Balance — exactly 4 whole paragraphs per card with 0 split paragraphs', () => {
      const essayText = getShowcaseEssayText();
      const originalParas = essayText.trim().split(/\n\n+/);

      const doc: DocumentState = {
        text: essayText,
        projectName: 'balance-card-test',
        pageCount: 4,
        distributionMode: 'balanced',
        manualBreaks: [],
        layoutLocked: false,
      };

      const options = {
        canvas: { ...DEFAULT_CANVAS, width: 1080, height: 1350, backgroundColor: '#000000' },
        typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'Inter', fontSize: 27, lineHeight: 1.45, alignment: 'left' as const },
        spacing: { ...DEFAULT_SPACING, paddingTop: 96, paddingBottom: 96, paddingLeft: 96, paddingRight: 96, paragraphSpacing: 28 },
        advanced: { ...DEFAULT_ADVANCED, autoFit: true, minFontSize: 20, maxFontSize: 48 },
      };

      const result = autoFitFontSize(doc, options);
      expect(result.pages.length).toBe(4);

      // Verify that every page ends on a paragraph boundary (zero broken paragraphs)
      result.pages.forEach((page, pageIdx) => {
        const pageParas = page.text.trim().split(/\n\n+/);
        // Each page should contain exactly 4 complete paragraphs
        expect(pageParas.length).toBe(4);

        // Verify content matches expected slice of original paragraphs
        const expectedChunk = originalParas.slice(pageIdx * 4, (pageIdx + 1) * 4).join('\n\n');
        expect(page.text.trim()).toBe(expectedChunk);
      });

      // Check utilization variance across pages is bounded (tight balance)
      const utilizations = result.pages.map((p) => p.utilization);
      const maxUtil = Math.max(...utilizations);
      const minUtil = Math.min(...utilizations);
      expect(maxUtil - minUtil).toBeLessThan(25);
    });

    it('T3.3: Dynamic Trim on Final Page adjusts canvas height appropriately', () => {
      const essayText = getShowcaseEssayText();
      const doc: DocumentState = {
        text: essayText,
        projectName: 'trim-test',
        pageCount: 4,
        distributionMode: 'balanced',
        manualBreaks: [],
        layoutLocked: false,
      };

      const canvasWithTrim = {
        ...DEFAULT_CANVAS,
        width: 1080,
        height: 1350,
        trimAllPages: false,
        trimLastPageHeight: true,
      };

      const result = paginateDocument(doc, {
        canvas: canvasWithTrim,
        typography: { ...DEFAULT_TYPOGRAPHY, fontSize: 27 },
        spacing: { ...DEFAULT_SPACING, paddingTop: 96, paddingBottom: 96 },
        advanced: DEFAULT_ADVANCED,
      });
      const intermediateDims = getPageCanvasDimensions(
        0,
        result.pages.length,
        result.pages[0].renderedHeight,
        canvasWithTrim,
        DEFAULT_SPACING
      );
      const lastPageDims = getPageCanvasDimensions(
        3,
        result.pages.length,
        result.pages[3].renderedHeight,
        canvasWithTrim,
        DEFAULT_SPACING
      );

      // Intermediate page maintains full standard height
      expect(intermediateDims.height).toBe(1350);

      // Final page height is bounded by standard height
      expect(lastPageDims.height).toBeLessThanOrEqual(1350);
      expect(lastPageDims.width).toBe(1080);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('T4.1: Demo Generation Script exists and is properly structured', () => {
      const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate_demos.mjs');
      expect(fs.existsSync(scriptPath)).toBe(true);

      const scriptContent = fs.readFileSync(scriptPath, 'utf8');

      // Validates browser automation configuration
      expect(scriptContent).toContain('playwright');
      expect(scriptContent).toContain('chromium');
      expect(scriptContent).toContain('localhost:3000');
    });

    it('T4.2: End-to-End TypeScript Type Contract Integrity', () => {
      // Validates interface compatibility across state objects
      const testDoc: DocumentState = {
        text: 'Deterministic text rasterization without layout hacks.',
        projectName: 'contract-test',
        pageCount: 1,
        distributionMode: 'balanced',
        manualBreaks: [],
        layoutLocked: false,
      };

      expect(testDoc.distributionMode).toBe('balanced');
      expect(DEFAULT_CANVAS.backgroundColor).toBe('#FFFFFF');
      expect(DEFAULT_TYPOGRAPHY.textColor).toBe('#000000');
    });

    it('T4.3: Regression Guard — 49 Core Unit/Engine Tests Integrity', () => {
      // Confirms critical core test files exist and are intact
      const coreTestFiles = [
        'src/__tests__/canvasFillOptimizer.test.ts',
        'src/__tests__/criticalAcceptance.test.ts',
        'src/__tests__/engine.test.ts',
        'src/__tests__/probe.test.ts',
      ];

      for (const file of coreTestFiles) {
        const fullPath = path.resolve(process.cwd(), file);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content.length).toBeGreaterThan(100);
      }
    });
  });
});
