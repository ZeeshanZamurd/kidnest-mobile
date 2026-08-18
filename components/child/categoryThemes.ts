import {
  BRAND_ACCENT,
  BRAND_CHILD_ACCENT,
  BRAND_CYAN,
  BRAND_PRIMARY,
} from '../../constants/branding';
import type { ContentCategory } from '../../types';

export type ChildSectionTheme = {
  id: string;
  labelKey: string;
  emoji: string;
  color: string;
  gradient: [string, string];
  borderColor: string;
};

export const CATEGORY_THEMES: Record<ContentCategory, ChildSectionTheme> = {
  stories: {
    id: 'stories',
    labelKey: 'child_theme_stories',
    emoji: '📚',
    color: BRAND_PRIMARY,
    gradient: ['#9B7BFF', BRAND_PRIMARY],
    borderColor: '#6A3FE8',
  },
  science: {
    id: 'science',
    labelKey: 'child_theme_learning',
    emoji: '🔬',
    color: BRAND_CYAN,
    gradient: ['#8BF0FF', BRAND_CYAN],
    borderColor: '#3DD4EE',
  },
  math: {
    id: 'math',
    labelKey: 'child_theme_learning',
    emoji: '🔢',
    color: BRAND_CYAN,
    gradient: ['#8BF0FF', BRAND_CYAN],
    borderColor: '#3DD4EE',
  },
  nature: {
    id: 'nature',
    labelKey: 'child_theme_learning',
    emoji: '🦁',
    color: BRAND_CYAN,
    gradient: ['#8BF0FF', BRAND_CYAN],
    borderColor: '#3DD4EE',
  },
  coding: {
    id: 'coding',
    labelKey: 'child_theme_learning',
    emoji: '💻',
    color: BRAND_CYAN,
    gradient: ['#8BF0FF', BRAND_CYAN],
    borderColor: '#3DD4EE',
  },
  art: {
    id: 'art',
    labelKey: 'child_theme_creative',
    emoji: '🎨',
    color: BRAND_ACCENT,
    gradient: ['#FF7DC8', BRAND_ACCENT],
    borderColor: '#E63DA0',
  },
  music: {
    id: 'music',
    labelKey: 'child_theme_creative',
    emoji: '🎵',
    color: BRAND_ACCENT,
    gradient: ['#FF7DC8', BRAND_ACCENT],
    borderColor: '#E63DA0',
  },
};

export const FAVORITES_THEME: ChildSectionTheme = {
  id: 'favorites',
  labelKey: 'favorites',
  emoji: '⭐',
  color: BRAND_CHILD_ACCENT,
  gradient: ['#FFE566', BRAND_CHILD_ACCENT],
  borderColor: '#E6C235',
};

export function themeForCategory(category: ContentCategory): ChildSectionTheme {
  return CATEGORY_THEMES[category] ?? CATEGORY_THEMES.stories;
}
