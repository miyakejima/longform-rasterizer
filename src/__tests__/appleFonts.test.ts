import { describe, it, expect } from 'vitest';
import { getSupportedFontWeights } from '../engine/fontLoader';

describe('Apple Typography Suite Verification', () => {
  it('verifies SF Pro Display supported weights', () => {
    const weights = getSupportedFontWeights('SF Pro Display');
    expect(weights).toEqual([400, 500, 600, 700]);
  });

  it('verifies SF Pro Text supported weights', () => {
    const weights = getSupportedFontWeights('SF Pro Text');
    expect(weights).toEqual([400, 500, 600, 700]);
  });

  it('verifies SF Pro Rounded supported weights', () => {
    const weights = getSupportedFontWeights('SF Pro Rounded');
    expect(weights).toEqual([400, 700]);
  });

  it('verifies SF Mono supported weights', () => {
    const weights = getSupportedFontWeights('SF Mono');
    expect(weights).toEqual([400, 700]);
  });

  it('verifies New York supported weights', () => {
    const weights = getSupportedFontWeights('New York');
    expect(weights).toEqual([400, 700]);
  });
});
