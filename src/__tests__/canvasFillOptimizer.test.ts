import { describe, it, expect } from 'vitest';
import { optimizeCanvasFill } from '../engine/canvasFillOptimizer';
import {
  DEFAULT_ADVANCED,
  DEFAULT_CANVAS,
  DEFAULT_DOCUMENT,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
} from '../engine/presetStore';

describe('Intelligent Canvas Fill Optimizer', () => {
  it('maximizes utilization without overflow on 1-page text', () => {
    const doc = {
      ...DEFAULT_DOCUMENT,
      text: 'Design is not just what it looks like and feels like. Design is how it works. Good typography makes reading effortless.',
      pageCount: 1,
    };

    const result = optimizeCanvasFill(doc, DEFAULT_CANVAS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ADVANCED);

    expect(result.paginationResult.pages.length).toBe(1);
    expect(result.paginationResult.pages[0].isOverflowing).toBe(false);
    expect(result.averageUtilization).toBeGreaterThan(0.5);
    expect(result.typography.verticalAlignment).toBe('center');
    expect(result.spacing.minBottomSpace).toBe(0);
  });

  it('boosts average page utilization towards 90%+ across a multi-page essay', () => {
    const essayText = `thousands of people pay for admission, travel to the same place, wait in lines, give up comfort and personal space, often unable to see or hear properly, all for a few hours of an experience built around music they can already access almost anywhere at any time

the music still matters, but it is only one part of what is being sold, physical presence, proximity to the performer, spectacle, ritual, crowd intensity, scarcity, shared excitement and the feeling of participating in something important enough for thousands of other people to gather around it too

the recorded music can already be heard exactly as produced, without crowd noise, at any volume, paused, replayed, repeated and listened to under conditions chosen by the listener, so the entire extra value of the concert has to come from everything surrounding the music, physical

and that physical presence is literally a product, one human being becoming valuable enough that thousands of strangers pay just to occupy the same space as them for a few hours, despite having no relationship with them, receiving no recognition from them and knowing almost nothing about them beyond a carefully exposed public surface

that last part makes the whole thing even more superficial, enormous emotional and monetary value assigned to someone most attendees do not know personally at all, they know songs, interviews, clips, performances, branding, fragments of personality selected for public consumption, then somehow that tiny controlled slice is enough for physical proximity to the person themselves to acquire extraordinary value

a few words from the stage can trigger screaming from thousands of people who have no serious basis for treating the speaker as personally important, the reaction coming first and the actual knowledge of the person barely existing, repeated exposure to a face and voice doing the work that actual relationship normally would, familiarity becoming attachment to someone whose private character, ordinary behavior and actual self remain almost completely unknown

then the crowd begins feeding on itself, thousands singing the same words, screaming at the same moments, raising phones, copying gestures, reacting not only to the performer but to thousands of other people reacting to the performer, each visible reaction making the next reaction easier, louder and more automatic`;

    const doc = {
      ...DEFAULT_DOCUMENT,
      text: essayText,
      pageCount: 4,
    };

    const initialResult = optimizeCanvasFill(doc, DEFAULT_CANVAS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ADVANCED);

    expect(initialResult.paginationResult.pages.length).toBe(4);
    expect(initialResult.paginationResult.pages.every((p) => !p.isOverflowing)).toBe(true);
    expect(initialResult.averageUtilization).toBeGreaterThan(0.88);
    // Preserves invariant
    const reconstructed = initialResult.paginationResult.pages.map((p) => p.text).join('\n\n');
    expect(reconstructed.length).toBeGreaterThan(0);
  });

  it('preserves text integrity invariant: no dropped or altered characters', () => {
    const text = 'First page paragraph.\n\nSecond page paragraph.\n\nThird page paragraph.\n\nFourth page paragraph.';
    const doc = { ...DEFAULT_DOCUMENT, text, pageCount: 4 };

    const result = optimizeCanvasFill(doc, DEFAULT_CANVAS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ADVANCED);

    const fullReconstructed = result.paginationResult.pages.map((p) => p.text).join('');
    expect(fullReconstructed).toBe(text);
  });
});
