import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Precision 2x2 grid icon with 1px rounded corners and hairline strokes
 */
export const GridModeIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    className={className}
    aria-hidden="true"
  >
    <rect x="1" y="1" width="5" height="5" rx="1" />
    <rect x="8" y="1" width="5" height="5" rx="1" />
    <rect x="1" y="8" width="5" height="5" rx="1" />
    <rect x="8" y="8" width="5" height="5" rx="1" />
  </svg>
);

/**
 * Minimalist single portrait card silhouette reflecting standard 4:5 editorial posts
 */
export const SingleModeIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    className={className}
    aria-hidden="true"
  >
    <rect x="2.5" y="1" width="9" height="12" rx="1.5" />
  </svg>
);

/**
 * Carousel slide metaphor: hero card flanked by subtle horizontal preview slivers
 */
export const CarouselModeIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    className={className}
    aria-hidden="true"
  >
    <rect x="3.5" y="1.5" width="7" height="11" rx="1" />
    <path d="M0.75 3.5v7" strokeLinecap="round" strokeWidth="1.2" opacity="0.35" />
    <path d="M13.25 3.5v7" strokeLinecap="round" strokeWidth="1.2" opacity="0.35" />
  </svg>
);
