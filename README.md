# KidNest

**KidNest** is a premium parent-controlled safe video app for children (React Native CLI, frontend-only).

## Tech Stack

- React Native 0.80.3 (bare CLI — no Expo)
- TypeScript
- React Navigation (stack + animated tabs)
- Zustand (state)
- i18next (English, Spanish, Urdu)
- Reanimated 4 + Gesture Handler
- Mock data in `data/mockData.ts`

## Getting Started

```bash
cd products/kidnest/kidnest-mobile
npm install
cd ios && pod install && cd ..
npm start
npm run ios    # or npm run android
```

## Project Structure

```
components/     # Reusable UI (cards, glass, skeletons)
context/        # Theme provider
data/           # Mock data (single source of truth)
i18n/           # Localization setup
locales/        # en, es, ur translations
navigation/     # Parent & child navigators
screens/        # Feature screens
store/          # Zustand store
theme/          # Colors, typography, spacing
types/          # TypeScript models
```

## Flows

1. **Splash → Onboarding → Auth → Role Selection**
2. **Parent**: Dashboard, Channels, Profiles, Settings (+ stack screens)
3. **Child**: Home, TikTok-style Feed, Favorites

Backend integration points are stubbed — wire APIs later without changing UI structure.
