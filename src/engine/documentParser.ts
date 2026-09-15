// Document Parser: preserves text fidelity, breaks into paragraphs and sentences

export interface ParsedParagraph {
  index: number;
  rawText: string;          // Full text slice including trailing newlines
  content: string;          // Text without trailing newlines
  startIndex: number;       // Absolute start index in document
  endIndex: number;         // Absolute end index in document (startIndex + rawText.length)
  trailingNewlines: string; // Trailing newlines
}

export function parseDocumentParagraphs(text: string): ParsedParagraph[] {
  if (text.length === 0) {
    return [];
  }

  const paragraphs: ParsedParagraph[] = [];
  // Split on two or more newlines (with optional whitespace in between)
  const paragraphSplitRegex = /(\r?\n(?:[\t ]*\r?\n)+)/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let paraIdx = 0;

  while ((match = paragraphSplitRegex.exec(text)) !== null) {
    const splitStart = match.index;
    const splitEnd = paragraphSplitRegex.lastIndex;
    const rawParagraph = text.slice(lastIndex, splitEnd);
    const content = text.slice(lastIndex, splitStart);
    const trailingNewlines = text.slice(splitStart, splitEnd);

    paragraphs.push({
      index: paraIdx++,
      rawText: rawParagraph,
      content,
      startIndex: lastIndex,
      endIndex: splitEnd,
      trailingNewlines,
    });

    lastIndex = splitEnd;
  }

  if (lastIndex < text.length) {
    const rawParagraph = text.slice(lastIndex);
    paragraphs.push({
      index: paraIdx++,
      rawText: rawParagraph,
      content: rawParagraph,
      startIndex: lastIndex,
      endIndex: text.length,
      trailingNewlines: '',
    });
  }

  return paragraphs;
}

// Check if a character position inside text is a sentence ending
export function isSentenceBoundary(text: string, pos: number): boolean {
  if (pos <= 0 || pos >= text.length) return false;
  
  const charBefore = text[pos - 1];
  const charAt = text[pos];

  // Needs punctuation right before pos (or before quote + pos)
  const isPunct = /[.?!…]/.test(charBefore) || 
    (pos >= 2 && /["'”’]/.test(charBefore) && /[.?!…]/.test(text[pos - 2]));
  
  if (!isPunct) return false;

  // Next char must be whitespace or end
  return /\s/.test(charAt);
}
