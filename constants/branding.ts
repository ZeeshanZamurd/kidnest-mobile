/**
 * KidNest official brand system — single source of truth for colors and logo assets.
 * Update here first, then run `npm run icons:generate` after changing the source icon.
 */

/** Primary Purple */
export const BRAND_PRIMARY = '#7B4DFF';
/** Secondary Pink */
export const BRAND_ACCENT = '#FF4DB8';
/** Accent Cyan (highlights) */
export const BRAND_CYAN = '#5FE9FF';
export const BRAND_WHITE = '#FFFFFF';
/** Child accent yellow — matches website "Nest" wordmark */
export const BRAND_CHILD_ACCENT = '#FFD93D';

/** Official brand gradient — purple → pink (horizontal) */
export const BRAND_GRADIENT: [string, string] = [BRAND_PRIMARY, BRAND_ACCENT];

/** Three-stop gradient for backgrounds and hero cards */
export const BRAND_GRADIENT_FULL: [string, string, string] = [
  BRAND_PRIMARY,
  BRAND_ACCENT,
  BRAND_CYAN,
];

/** Consistent in-app logo sizes (dp) */
export const LOGO_SIZES = {
  splash: 168,
  onboarding: 120,
  auth: 96,
  profileSelection: 72,
  header: 44,
  emptyState: 64,
} as const;

/** Native + in-app splash branding copy — matches website wordmark */
export const SPLASH_TITLE_KIDO = 'Kido';
export const SPLASH_TITLE_NEST = 'Nest';
export const SPLASH_TAGLINE = 'Safe Learning & Growth';

/** Splash layout spacing — keep in sync with scripts/prepare-logo-source.py */
export const SPLASH_TYPOGRAPHY = {
  titleSize: 28,
  taglineSize: 14,
  titleTracking: 5,
  logoToTitle: 20,
  titleToTagline: 10,
} as const;

/** Dark-mode splash gradient (matches native splash-gradient-dark.png) */
export const BRAND_GRADIENT_DARK: [string, string] = ['#5532BF', '#D63D98'];

/** Bundled branding assets */
export const BRAND_ASSETS = {
  /** In-app logo — transparent outside icon shape */
  appLogo: require('../assets/branding/app-icon-splash.png'),
} as const;
