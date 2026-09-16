// Visual balance scoring and penalty functions

import { BalanceStrength, TargetDensity } from '../types';

export interface VisualBalanceOptions {
  availableHeight: number;
  targetHeight: number;
  balanceStrength: BalanceStrength;
  densityTarget: TargetDensity;
  preventOrphanLines: boolean;
  mode: 'balanced' | 'paragraph-preserving';
}

export function computeBalanceScore(
  pageHeight: number,
  options: VisualBalanceOptions,
  isParagraphEnd: boolean,
  isSentenceEnd: boolean,
  isOrphan: boolean,
  isWidow: boolean
): number {
  const { availableHeight, targetHeight, balanceStrength, mode, preventOrphanLines } = options;

  let score = 0;

  // 1. Overflow penalty: immense penalty if content exceeds available height
  if (pageHeight > availableHeight) {
    const overflow = pageHeight - availableHeight;
    return 10_000_000 + overflow * 20_000;
  }

  // 2. Target height variance penalty
  const heightDiff = pageHeight - targetHeight;
  const variance = heightDiff * heightDiff;

  let varianceWeight = 1.0;
  if (balanceStrength === 'low') varianceWeight = 0.35;
  if (balanceStrength === 'high') varianceWeight = 3.2;

  score += (variance / 1000) * varianceWeight;

  // 3. Boundary split penalties
  if (mode === 'paragraph-preserving') {
    if (!isParagraphEnd) {
      // Massive penalty to split inside paragraph in preserving mode
      score += isSentenceEnd ? 500_000 : 50_000_000;
    }
  } else {
    // Balanced mode:
    // Paragraph boundary: 0 penalty
    // Sentence boundary: 300 penalty
    // Incomplete sentence (splitting a sentence across pages): 50,000,000 penalty
    // This strictly prevents cutting sentences in half across pages.
    if (!isParagraphEnd) {
      if (isSentenceEnd) {
        score += 300;
      } else {
        score += 50_000_000;
      }
    }
  }

  // 4. Orphan & widow penalties
  if (preventOrphanLines) {
    if (isOrphan) {
      score += 400;
    }
    if (isWidow) {
      score += 400;
    }
  }

  return score;
}
