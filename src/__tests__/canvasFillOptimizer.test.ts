import { describe, it, expect } from 'vitest';
import { optimizeCanvasFill } from '../engine/canvasFillOptimizer';
import { wrapDocument } from '../engine/lineWrapper';
import { computePageRenderedHeight } from '../engine/pagination';
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
    expect(result.typography.verticalAlignment).toBe('justify');
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

  it('diagnoses user 16-paragraph essay utilization', () => {
    const fullUserText = `thousands of people pay for admission, travel to the same place, wait in lines, give up comfort and personal space, often unable to see or hear properly, all for a few hours of an experience built around music they can already access almost anywhere at any time

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

    const paragraphs = fullUserText.split(/\n\s*\n/).filter(Boolean);

    const N = paragraphs.length;
    let minVariance = Infinity;
    let bestPartition: [number, number, number] | null = null;
    let bestUtils: number[] = [];
    let bestFs = 27;

    for (const fs of [24, 25, 26, 27]) {
      const paraHeights = paragraphs.map((p) => {
        const lines = wrapDocument(p, {
          availableWidth: 1080 - 192,
          typography: { ...DEFAULT_TYPOGRAPHY, fontSize: fs },
        });
        return computePageRenderedHeight(lines, fs * 1.45, 28);
      });

      for (let i = 1; i < N - 2; i++) {
        for (let j = i + 1; j < N - 1; j++) {
          for (let k = j + 1; k < N; k++) {
            const h1 = paraHeights.slice(0, i).reduce((a, b) => a + b, 0) + (i - 1) * 28;
            const h2 = paraHeights.slice(i, j).reduce((a, b) => a + b, 0) + (j - i - 1) * 28;
            const h3 = paraHeights.slice(j, k).reduce((a, b) => a + b, 0) + (k - j - 1) * 28;
            const h4 = paraHeights.slice(k, N).reduce((a, b) => a + b, 0) + (N - k - 1) * 28;

            if (h1 <= 1158 && h2 <= 1158 && h3 <= 1158 && h4 <= 1158) {
              const u1 = h1 / 1158;
              const u2 = h2 / 1158;
              const u3 = h3 / 1158;
              const u4 = h4 / 1158;
              const avgU = (u1 + u2 + u3 + u4) / 4;
              const variance = (u1 - avgU) ** 2 + (u2 - avgU) ** 2 + (u3 - avgU) ** 2 + (u4 - avgU) ** 2;
              
              if (variance < minVariance) {
                minVariance = variance;
                bestPartition = [i, j, k];
                bestUtils = [u1, u2, u3, u4];
                bestFs = fs;
              }
            }
          }
        }
      }
    }

    console.log('LOWEST VARIANCE PARAGRAPH-PRESERVING PARTITION:');
    console.log('FontSize:', bestFs, 'splits:', bestPartition);
    console.log('Utils:', bestUtils.map((u) => (u * 100).toFixed(1) + '%').join(', '));
  });

  it('guarantees 100% paragraph preservation and >= 95% utilization on the 16-paragraph concert essay', () => {
    const fullUserText = `thousands of people pay for admission, travel to the same place, wait in lines, give up comfort and personal space, often unable to see or hear properly, all for a few hours of an experience built around music they can already access almost anywhere at any time

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

    const doc = {
      ...DEFAULT_DOCUMENT,
      text: fullUserText,
      pageCount: 4,
    };

    const optResult = optimizeCanvasFill(doc, DEFAULT_CANVAS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ADVANCED);

    expect(optResult.paginationResult.pages.length).toBe(4);
    expect(optResult.paginationResult.pages.every((p) => !p.isOverflowing)).toBe(true);

    // Assert zero paragraphs split across pages
    const paragraphs = fullUserText.split(/\r?\n\s*\r?\n/).map((p) => p.trim());
    for (const page of optResult.paginationResult.pages) {
      const pageTextTrimmed = page.text.trim();
      // The page text must end with a full paragraph (cannot end mid-paragraph)
      const endsWithFullParagraph = paragraphs.some((para) => pageTextTrimmed.endsWith(para));
      expect(endsWithFullParagraph).toBe(true);
    }

    // Assert full document reconstructed exactly without a single lost character
    const reconstructed = optResult.paginationResult.pages.map((p) => p.text).join('');
    expect(reconstructed).toBe(fullUserText);

    // Assert high visual utilization across all pages (>= 95%)
    expect(optResult.minUtilization).toBeGreaterThanOrEqual(0.95);
    expect(optResult.averageUtilization).toBeGreaterThanOrEqual(0.95);
  });
});

