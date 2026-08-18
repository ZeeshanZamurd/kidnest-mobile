/** Premium kids video player design tokens */
export const playerTheme = {
  radius: 0,
  radiusImmersive: 0,
  controlsHideMs: 4500,
  dockHeight: 96,
  shelfHeight: 112,
  miniBarHeight: 4,
  qualityRowHeight: 36,

  progress: {
    trackH: 5,
    trackActiveH: 8,
    hitH: 28,
    thumb: 11,
    thumbActive: 17,
    trackBg: 'rgba(255,255,255,0.28)',
    trackBorder: 'rgba(255,255,255,0.18)',
    bufferBg: 'rgba(255,255,255,0.38)',
    fillGradient: ['#6EA8FF', '#8B5CF6', '#C4A1FF'] as const,
    thumbColor: '#FFFFFF',
    thumbBorder: '#A78BFA',
    glow: 'rgba(167, 139, 250, 0.5)',
  },

  play: {
    dockSize: 44,
    centerSize: 72,
    gradient: ['#7C3AED', '#A78BFA'] as const,
    shadow: '#5B21B6',
  },

  skip: {
    size: 38,
    bg: 'rgba(255,255,255,0.16)',
  },

  fullscreen: {
    size: 38,
    bg: 'rgba(255,255,255,0.16)',
    border: 'rgba(255,255,255,0.22)',
  },

  overlay: {
    gradient: ['transparent', 'rgba(8,5,24,0.72)'] as const,
    gradientLocations: [0, 1] as const,
    fadeHeight: 72,
  },

  miniBar: {
    track: 'rgba(255,255,255,0.2)',
    fill: '#A78BFA',
  },

  buffering: {
    scrim: 'rgba(12, 8, 32, 0.48)',
    ringSize: 96,
    coreSize: 64,
    ringGradient: ['#7B4DFF', '#5B8DEF', '#C084FC', '#7B4DFF'] as const,
    coreGradient: ['#8B5CF6', '#6D28D9'] as const,
    shadow: '#5A36C9',
  },
} as const;
