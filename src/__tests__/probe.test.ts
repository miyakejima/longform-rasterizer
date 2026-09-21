import { describe, it, expect } from 'vitest';
import { paginateDocument } from '../engine/pagination';
import { autoFitFontSize } from '../engine/autoFit';
import { wrapDocument } from '../engine/lineWrapper';
import {
  DEFAULT_CANVAS,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ADVANCED,
  loadStoredProjects,
  saveStoredProjects,
  deleteStoredProject,
  importProjectFromJson,
} from '../engine/presetStore';
import { DocumentState, SavedProject } from '../types';

describe('Skeptical Adversarial Probes and Boundary Tests', () => {
  const baseOptions = {
    canvas: { ...DEFAULT_CANVAS },
    typography: { ...DEFAULT_TYPOGRAPHY },
    spacing: { ...DEFAULT_SPACING },
    advanced: { ...DEFAULT_ADVANCED },
  };

  it('preserves leading indentation (spaces and tabs) in wrapped line text and pagination', () => {
    const text = '    Indented 4 spaces.\n\tIndented with tab.\n        Indented 8 spaces.\nRegular line.';
    const lines = wrapDocument(text, {
      availableWidth: 800,
      typography: { ...DEFAULT_TYPOGRAPHY, fontSize: 24 },
    });

    expect(lines[0].text.startsWith('    ')).toBe(true);
    expect(lines[1].text.startsWith('\t')).toBe(true);
    expect(lines[2].text.startsWith('        ')).toBe(true);
    expect(lines[0].startIndex).toBe(0);

    const doc: DocumentState = {
      text,
      projectName: 'indent-test',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };
    const result = paginateDocument(doc, baseOptions);
    const joined = result.pages.map((p) => p.text).join('');
    expect(joined).toBe(text);
  });

  it('handles empty text and pure whitespace without crashing or corrupting invariant', () => {
    const emptyDoc: DocumentState = {
      text: '',
      projectName: 'empty',
      pageCount: 3,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };
    const emptyResult = paginateDocument(emptyDoc, baseOptions);
    expect(emptyResult.pages.length).toBe(3);
    expect(emptyResult.pages.map((p) => p.text).join('')).toBe('');

    const whitespaceDoc: DocumentState = {
      text: '   \n\n\t\n   ',
      projectName: 'whitespace',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };
    const wsResult = paginateDocument(whitespaceDoc, baseOptions);
    expect(wsResult.pages.map((p) => p.text).join('')).toBe('   \n\n\t\n   ');
  });

  it('handles massive consecutive newlines without index drift', () => {
    const text = 'Paragraph one.\n\n\n\n\n\n\n\nParagraph two.\n\n\nParagraph three.';
    const doc: DocumentState = {
      text,
      projectName: 'consecutive-newlines',
      pageCount: 3,
      distributionMode: 'paragraph-preserving',
      manualBreaks: [],
      layoutLocked: false,
    };
    const result = paginateDocument(doc, baseOptions);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
  });

  it('handles extremely long unbreakable words without truncation or infinite loops', () => {
    const longWord = 'A'.repeat(300);
    const text = `Before word.\n${longWord}\nAfter word.`;
    const doc: DocumentState = {
      text,
      projectName: 'long-word',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };
    const result = paginateDocument(doc, baseOptions);
    expect(result.pages.map((p) => p.text).join('')).toBe(text);
    expect(result.pages[0].lines.length).toBeGreaterThan(0);
  });

  it('handles manual breaks with invalid boundaries, duplicates, and out-of-bounds indices', () => {
    const text = 'First part of text. Second part of text. Third part of text.';
    const doc: DocumentState = {
      text,
      projectName: 'manual-test',
      pageCount: 3,
      distributionMode: 'manual',
      manualBreaks: [-10, 0, 19, 19, 999], // negative, zero, duplicate, out-of-bounds
      layoutLocked: false,
    };
    const result = paginateDocument(doc, baseOptions);
    expect(result.pages.length).toBe(3);
    const joined = result.pages.map((p) => p.text).join('');
    expect(joined).toBe(text);
  });

  it('clamps Auto-fit within minFontSize and maxFontSize bounds', () => {
    const text = 'Short line of text that easily fits in one page.';
    const doc: DocumentState = {
      text,
      projectName: 'autofit-test',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const options = {
      ...baseOptions,
      advanced: {
        ...baseOptions.advanced,
        autoFit: true,
        minFontSize: 16,
        maxFontSize: 40,
      },
    };

    const result = autoFitFontSize(doc, options);
    expect(result.effectiveFontSize).toBeLessThanOrEqual(40);
    expect(result.effectiveFontSize).toBeGreaterThanOrEqual(16);
  });

  it('flags isAutoFitFailed if content cannot fit even at minFontSize', () => {
    // Generate massive text that cannot fit on 1 page of 1080x1350 at minFontSize
    const massiveText = 'This is a long sentence repeated many times. '.repeat(200);
    const doc: DocumentState = {
      text: massiveText,
      projectName: 'massive-autofit',
      pageCount: 1,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const options = {
      ...baseOptions,
      advanced: {
        ...baseOptions.advanced,
        autoFit: true,
        minFontSize: 30,
        maxFontSize: 60,
      },
    };

    const result = autoFitFontSize(doc, options);
    expect(result.effectiveFontSize).toBe(30);
    expect(result.isAutoFitFailed).toBe(true);
    expect(result.pages[0].isOverflowing).toBe(true);
  });

  it('verifies local project storage and import/export integrity', async () => {
    // Setup mock localStorage in memory
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    const sampleProject: SavedProject = {
      id: 'test-proj-1',
      name: 'Sample Project',
      updatedAt: 1700000000000,
      document: {
        text: 'Hello world',
        projectName: 'Sample Project',
        pageCount: 2,
        distributionMode: 'balanced',
        manualBreaks: [],
        layoutLocked: false,
      },
      canvas: DEFAULT_CANVAS,
      typography: DEFAULT_TYPOGRAPHY,
      spacing: DEFAULT_SPACING,
      advanced: DEFAULT_ADVANCED,
      exportScale: 2,
      exportFormat: 'png',
      selectedPresetId: 'editorial-dark',
    };

    saveStoredProjects([sampleProject]);
    const loaded = loadStoredProjects();
    expect(loaded.length).toBe(1);
    expect(loaded[0].name).toBe('Sample Project');
    expect(loaded[0].document.text).toBe('Hello world');

    const updated = deleteStoredProject('test-proj-1');
    expect(updated.length).toBe(0);
    expect(loadStoredProjects().length).toBe(0);

    // Test import rejection of invalid JSON
    const fakeFile = {
      text: async () => JSON.stringify({ broken: true }),
      name: 'broken.json',
    } as unknown as File;

    await expect(importProjectFromJson(fakeFile)).rejects.toThrow('Invalid project file format');
  });

  it('verifies custom font loader gracefully returns failure for corrupted or unsupported inputs', async () => {
    const { loadCustomFont } = await import('../engine/fontLoader');
    const corruptedFile = {
      name: 'broken.woff2',
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as File;

    const result = await loadCustomFont(corruptedFile);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.fontFamily).toBe('');
  });

  it('guarantees exact text invariant and page integrity with multiple arbitrary manual breaks', () => {
    const text = 'Paragraph 1 content here.\n\nParagraph 2 with different content.\n\nParagraph 3 is final.';
    const break1 = text.indexOf('\n\n') + 2;
    const break2 = text.lastIndexOf('\n\n') + 2;

    const doc: DocumentState = {
      text,
      projectName: 'manual-invariant',
      pageCount: 3,
      distributionMode: 'manual',
      manualBreaks: [break1, break2],
      layoutLocked: false,
    };

    const result = paginateDocument(doc, baseOptions);
    expect(result.pages.length).toBe(3);
    const joined = result.pages.map((p) => p.text).join('');
    expect(joined).toBe(text);
    expect(result.pages[0].text).toBe(text.slice(0, break1));
    expect(result.pages[1].text).toBe(text.slice(break1, break2));
    expect(result.pages[2].text).toBe(text.slice(break2));
  });

  it('never cuts in the middle of a sentence across pages when sentence ends exist', () => {
    const text = 'This is the first sentence about music. This is the second sentence about life. This is the third sentence about joy. This is the best friend.';
    const doc: DocumentState = {
      text,
      projectName: 'sentence-cut-test',
      pageCount: 2,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };
    const result = paginateDocument(doc, baseOptions);
    expect(result.pages.length).toBe(2);
    const page1Trimmed = result.pages[0].text.trimEnd();
    expect(/[.?!…]$/.test(page1Trimmed)).toBe(true);
  });

  it('analyzes pagination and utilization for the concert essay', () => {
    const text = `thousands of people pay for admission, travel to the same place, wait in lines, give up comfort and personal space, often unable to see or hear properly, all for a few hours of an experience built around music they can already access almost anywhere at any time

the music still matters, but it is only one part of what is being sold, physical presence, proximity to the performer, spectacle, ritual, crowd intensity, scarcity, shared excitement and the feeling of participating in something important enough for thousands of other people to gather around it too

the recorded music can already be heard exactly as produced, without crowd noise, at any volume, paused, replayed, repeated and listened to under conditions chosen by the listener, so the entire extra value of the concert has to come from everything surrounding the music, physical presence, proximity, spectacle, ritual, crowd intensity and the status attached to being near the person who made it

and that physical presence is literally a product, one human being becoming valuable enough that thousands of strangers pay just to occupy the same space as them for a few hours, despite having no relationship with them, receiving no recognition from them and knowing almost nothing about them beyond a carefully exposed public surface

that last part makes the whole thing even more superficial, enormous emotional and monetary value assigned to someone most attendees do not know personally at all, they know songs, interviews, clips, performances, branding, fragments of personality selected for public consumption, then somehow that tiny controlled slice is enough for physical proximity to the person themselves to acquire extraordinary value

a few words from the stage can trigger screaming from thousands of people who have no serious basis for treating the speaker as personally important, the reaction coming first and the actual knowledge of the person barely existing, repeated exposure to a face and voice doing the work that actual relationship normally would, familiarity becoming attachment to someone whose private character, ordinary behavior and actual self remain almost completely unknown

then the crowd begins feeding on itself, thousands singing the same words, screaming at the same moments, raising phones, copying gestures, reacting not only to the performer but to thousands of other people reacting to the performer, each visible reaction making the next reaction easier, louder and more automatic

at that point much of the intensity is no longer an individual response to what is happening on stage, it is social contagion, people responding to the fact that everyone around them is responding, excitement becoming evidence for more excitement, volume becoming evidence for importance, scale becoming evidence that the thing deserves the scale, basic heuristics running at maximum, reactions copied before they are examined, people absorbing the crowd's emotion and experiencing part of it as their own

and then this mass reaction gets romanticized as something profound, “humanity,” “soul,” “being alive,” as though thousands of nervous systems synchronizing around noise, repetition, proximity and social cues reveals some deep truth about human existence, when most of what is happening can be explained by mechanisms so primitive they require almost no reflection at all

calling it “soul” does not make it less mechanical, calling it “humanity” does not make it intelligent, putting poetic language over mass emotional contagion only hides how little thought is required for thousands of people to copy one another, amplify one another and then experience the resulting intensity as something spiritually significant

the audience is not merely consuming the spectacle either, it supplies much of the noise, scale, movement, footage, social proof and emotional force that make the event feel enormous, then mistakes the intensity produced by thousands of mutually amplifying reactions for evidence that the performer or moment itself contained that intensity

people help create the emotional force, become overwhelmed by the force they collectively created, then attribute it back to the thing at the center

the hierarchy underneath all of this is embarrassingly simple, one person remains singular while thousands become an anonymous mass, one side pays to get closer, the other is paid because enough people want to get closer, one side becomes less individually relevant as the crowd grows, the person on stage becomes more important precisely because the crowd grew

that is celebrity worship stripped of the flattering language around it, thousands of people giving money, time, attention, comfort and emotional energy to someone they do not know, physically gathering around them, reacting to one another until the reaction itself becomes enormous, then using the size of their own collective reaction as proof that the person at the center deserved that importance in the first place

and that is what all the flattering language is covering up, a pile of assumptions, superficial attachment, borrowed reactions, status worship, emotional contagion and primitive imitation, thousands of people barely knowing the person they are screaming for, taking everyone else’s excitement as evidence of importance, amplifying one another until the reaction becomes enormous, then crediting that self-generated intensity back to the person at the center and calling the whole thing “soul,” “humanity” or “being alive,” as if collective surrender of judgment became profound simply because enough people participated in it at once, and if this is what society keeps presenting as evidence of human depth, then the standard has fallen low enough for mass reflex to pass as meaning and collective stupidity to pass as something special 

wrote this after hearing that a girl died around one of these concerts, after watching an entire culture glorify the same crowding, exhaustion, discomfort and loss of judgment as passion thousands are paying for, waiting, screaming and packing themselves together for proximity to strangers they have elevated far beyond anything they actually know about them a few people on stage filling their pockets and feeding their ego while the crowd supplies the money, worship, noise and importance that keeps the whole machine alive mass naïvety turned into ritual, collective stupidity sold back as something special, then romanticized as “humanity” by the same people participating in it`;

    const doc: DocumentState = {
      text,
      projectName: 'concert',
      pageCount: 4,
      distributionMode: 'balanced',
      manualBreaks: [],
      layoutLocked: false,
    };

    const res = paginateDocument(doc, {
      ...baseOptions,
      typography: { ...DEFAULT_TYPOGRAPHY, fontFamily: 'IBM Plex Sans', fontSize: 27 },
    });

    expect(res.pages.length).toBe(4);
    expect(res.pages.map((p) => p.text).join('')).toBe(text);
  });

});
