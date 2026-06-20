export const palette = {
  violet600: '#7C3AED',
  violet500: '#8B5CF6',
  violet400: '#A78BFA',
  pink500: '#EC4899',
  pink400: '#F472B6',
  cyan400: '#22D3EE',
  cyan500: '#06B6D4',
  emerald400: '#34D399',
  amber400: '#FBBF24',
  slate950: '#020617',
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export type ThemeColors = {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceGlass: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentSecondary: string;
  success: string;
  warning: string;
  danger: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  tabBar: string;
  tabBarBorder: string;
  overlay: string;
  childPrimary: string;
  childAccent: string;
};

export const LightTheme: ThemeColors = {
  background: palette.slate50,
  backgroundSecondary: palette.white,
  surface: palette.white,
  surfaceGlass: 'rgba(255, 255, 255, 0.72)',
  card: palette.white,
  text: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  border: palette.slate200,
  primary: palette.violet600,
  primaryLight: palette.violet400,
  accent: palette.pink500,
  accentSecondary: palette.cyan500,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  gradientStart: palette.violet600,
  gradientMid: palette.pink500,
  gradientEnd: palette.cyan500,
  tabBar: 'rgba(255, 255, 255, 0.92)',
  tabBarBorder: palette.slate200,
  overlay: 'rgba(15, 23, 42, 0.45)',
  childPrimary: '#FF6B9D',
  childAccent: '#FFD93D',
};

export const DarkTheme: ThemeColors = {
  background: palette.slate950,
  backgroundSecondary: palette.slate900,
  surface: palette.slate800,
  surfaceGlass: 'rgba(30, 41, 59, 0.75)',
  card: palette.slate800,
  text: palette.slate50,
  textSecondary: palette.slate300,
  textMuted: palette.slate500,
  border: palette.slate700,
  primary: palette.violet400,
  primaryLight: palette.violet500,
  accent: palette.pink400,
  accentSecondary: palette.cyan400,
  success: palette.emerald400,
  warning: palette.amber400,
  danger: palette.danger,
  gradientStart: '#5B21B6',
  gradientMid: '#BE185D',
  gradientEnd: '#0891B2',
  tabBar: 'rgba(15, 23, 42, 0.94)',
  tabBarBorder: palette.slate700,
  overlay: 'rgba(0, 0, 0, 0.6)',
  childPrimary: '#FF8FB1',
  childAccent: '#FFE566',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  hero: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const },
};
