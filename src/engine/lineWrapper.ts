// Line wrapping engine with exact character slice tracking and boundary detection

import { WrappedLine, TypographySettings } from '../types';
import { ParsedParagraph, parseDocumentParagraphs, isSentenceBoundary } from './documentParser';
import { measureTextWidth } from './textMeasurement';

export interface WrapOptions {
  availableWidth: number;
  typography: TypographySettings;
}

export function wrapParagraph(
  para: ParsedParagraph,
  options: WrapOptions
): WrappedLine[] {
  const { availableWidth, typography } = options;
  const { fontFamily, fontSize, fontWeight, letterSpacing } = typography;

  if (para.content.length === 0) {
    // Empty paragraph (e.g. just newlines)
    return [
      {
        text: '',
        rawText: para.rawText,
        width: 0,
        startIndex: para.startIndex,
        endIndex: para.endIndex,
        isParagraphStart: true,
        isParagraphEnd: true,
        isSentenceEnd: false,
        paragraphIndex: para.index,
        lineInParagraph: 0,
        totalLinesInParagraph: 1,
      },
    ];
  }

  const rawLines: { text: string; rawText: string; width: number; startIndex: number; endIndex: number }[] = [];

  // Split content by explicit single newlines first
  const explicitLinesRegex = /([^\r\n]*)(\r?\n|$)/g;
  let match: RegExpExecArray | null;
  let currentOffset = para.startIndex;

  while ((match = explicitLinesRegex.exec(para.content)) !== null) {
    if (match.index === para.content.length && match[0] === '') {
      break;
    }

    const lineText = match[1];
    const newline = match[2];
    const chunkStart = currentOffset;
    const chunkEnd = chunkStart + match[0].length;
    currentOffset = chunkEnd;

    if (lineText.length === 0) {
      // Empty line within paragraph
      rawLines.push({
        text: '',
        rawText: match[0],
        width: 0,
        startIndex: chunkStart,
        endIndex: chunkEnd,
      });
      if (match.index + match[0].length >= para.content.length) break;
      continue;
    }

    // Tokenize into words and following whitespace
    // Matches non-space characters followed by optional spaces/tabs
    const tokenRegex = /([^\s]+)(\s*)/g;
    let tokenMatch: RegExpExecArray | null;
    const tokens: { word: string; space: string; raw: string; start: number; end: number }[] = [];

    while ((tokenMatch = tokenRegex.exec(lineText)) !== null) {
      tokens.push({
        word: tokenMatch[1],
        space: tokenMatch[2],
        raw: tokenMatch[0],
        start: chunkStart + tokenMatch.index,
        end: chunkStart + tokenMatch.index + tokenMatch[0].length,
      });
    }

    if (tokens.length === 0) {
      rawLines.push({
        text: lineText,
        rawText: match[0],
        width: measureTextWidth(lineText, fontFamily, fontSize, fontWeight, letterSpacing),
        startIndex: chunkStart,
        endIndex: chunkEnd,
      });
      if (match.index + match[0].length >= para.content.length) break;
      continue;
    }

    let lineStartTokenIdx = 0;

    while (lineStartTokenIdx < tokens.length) {
      let lineEndTokenIdx = lineStartTokenIdx;
      let currentLineText = tokens[lineStartTokenIdx].word;
      let currentLineWidth = measureTextWidth(currentLineText, fontFamily, fontSize, fontWeight, letterSpacing);

      // If even a single word exceeds availableWidth, we must break the word across lines
      if (currentLineWidth > availableWidth && lineStartTokenIdx === lineEndTokenIdx) {
        const fullWord = tokens[lineStartTokenIdx].raw;
        let charBreakIdx = 1;
        while (charBreakIdx < fullWord.length) {
          const sub = fullWord.slice(0, charBreakIdx + 1);
          const subW = measureTextWidth(sub, fontFamily, fontSize, fontWeight, letterSpacing);
          if (subW > availableWidth) break;
          charBreakIdx++;
        }
        charBreakIdx = Math.max(1, charBreakIdx);

        const subText = fullWord.slice(0, charBreakIdx);
        const subW = measureTextWidth(subText, fontFamily, fontSize, fontWeight, letterSpacing);
        rawLines.push({
          text: subText,
          rawText: subText,
          width: subW,
          startIndex: tokens[lineStartTokenIdx].start,
          endIndex: tokens[lineStartTokenIdx].start + charBreakIdx,
        });

        // Update token start for remaining part
        tokens[lineStartTokenIdx].raw = fullWord.slice(charBreakIdx);
        tokens[lineStartTokenIdx].word = tokens[lineStartTokenIdx].raw.trimEnd();
        tokens[lineStartTokenIdx].start += charBreakIdx;
        continue;
      }

      // Greedily append words that fit
      while (lineEndTokenIdx + 1 < tokens.length) {
        const nextToken = tokens[lineEndTokenIdx + 1];
        const candidateLineText = currentLineText + tokens[lineEndTokenIdx].space + nextToken.word;
        const candidateWidth = measureTextWidth(candidateLineText, fontFamily, fontSize, fontWeight, letterSpacing);

        if (candidateWidth <= availableWidth) {
          currentLineText = candidateLineText;
          currentLineWidth = candidateWidth;
          lineEndTokenIdx++;
        } else {
          break;
        }
      }

      const isLastChunkOfLine = lineEndTokenIdx === tokens.length - 1;
      const startIdx = tokens[lineStartTokenIdx].start;
      let endIdx = tokens[lineEndTokenIdx].end;

      // If this is the last chunk in this explicit line, append the explicit newline to rawText
      let rawStr = '';
      for (let t = lineStartTokenIdx; t <= lineEndTokenIdx; t++) {
        rawStr += tokens[t].raw;
      }
      if (isLastChunkOfLine && newline.length > 0) {
        rawStr += newline;
        endIdx += newline.length;
      }

      rawLines.push({
        text: currentLineText,
        rawText: rawStr,
        width: currentLineWidth,
        startIndex: startIdx,
        endIndex: endIdx,
      });

      lineStartTokenIdx = lineEndTokenIdx + 1;
    }

    if (match.index + match[0].length >= para.content.length) break;
  }

  // If there are trailing newlines on the paragraph, attach them to the last line rawText & endIndex
  if (rawLines.length > 0 && para.trailingNewlines.length > 0) {
    const lastLine = rawLines[rawLines.length - 1];
    lastLine.rawText += para.trailingNewlines;
    lastLine.endIndex = para.endIndex;
  }

  // Construct final WrappedLine list with paragraph and sentence metadata
  const total = rawLines.length;
  return rawLines.map((line, idx) => {
    const trimmed = line.text.trimEnd();
    const lastChar = trimmed.slice(-1);
    const isPunct = /[.?!…]/.test(lastChar) || 
      (trimmed.length >= 2 && /["'”’]/.test(lastChar) && /[.?!…]/.test(trimmed.slice(-2, -1)));

    return {
      text: line.text,
      rawText: line.rawText,
      width: line.width,
      startIndex: line.startIndex,
      endIndex: line.endIndex,
      isParagraphStart: idx === 0,
      isParagraphEnd: idx === total - 1,
      isSentenceEnd: isPunct || idx === total - 1,
      paragraphIndex: para.index,
      lineInParagraph: idx,
      totalLinesInParagraph: total,
    };
  });
}

export function wrapDocument(
  text: string,
  options: WrapOptions
): WrappedLine[] {
  if (!text) return [];

  const paragraphs = parseDocumentParagraphs(text);
  const allLines: WrappedLine[] = [];

  for (const para of paragraphs) {
    const paraLines = wrapParagraph(para, options);
    allLines.push(...paraLines);
  }

  return allLines;
}
