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
      // Very heavy penalty to split inside paragraph in preserving mode
      score += isSentenceEnd ? 50_000 : 150_000;
    }
  } else {
    // Balanced mode: prefers paragraph, then sentence, then line
    if (!isParagraphEnd) {
      if (isSentenceEnd) {
        score += 80;
      } else {
        score += 260;
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
