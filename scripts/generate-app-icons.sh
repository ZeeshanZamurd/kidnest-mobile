#!/usr/bin/env bash
# Regenerate KidNest app icons from the official source image.
# Usage: ./scripts/generate-app-icons.sh [path-to-source.png]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAND="$ROOT/assets/branding"
SALEH_SRC="$ROOT/../saleh.png"

if [[ -n "${1:-}" ]]; then
  RAW_SOURCE="$1"
elif [[ -f "$SALEH_SRC" ]]; then
  RAW_SOURCE="$SALEH_SRC"
  cp "$SALEH_SRC" "$BRAND/app-icon-raw.png"
else
  RAW_SOURCE="$BRAND/app-icon-raw.png"
fi

if [[ ! -f "$RAW_SOURCE" ]]; then
  echo "Source icon not found: $RAW_SOURCE" >&2
  exit 1
fi

python3 "$ROOT/scripts/prepare-logo-source.py" "$RAW_SOURCE" "$BRAND"

UI="$BRAND/app-icon-ui.png"
LAUNCHER="$BRAND/app-icon-launcher.png"
FOREGROUND="$BRAND/app-icon-foreground.png"
SPLASH_NATIVE="$BRAND/app-icon-splash-native.png"
IOS_ICON_SRC="$BRAND/app-icon-ios.png"
SPLASH_GRADIENT="$BRAND/splash-gradient.png"
SPLASH_GRADIENT_DARK="$BRAND/splash-gradient-dark.png"
SPLASH_BRANDING="$BRAND/splash-branding.png"
SPLASH_SCREEN="$BRAND/splash-screen.png"
SPLASH_SCREEN_DARK="$BRAND/splash-screen-dark.png"

ANDROID_RES="$ROOT/android/app/src/main/res"
IOS_ICON="$ROOT/ios/KidNest/Images.xcassets/AppIcon.appiconset"
IOS_LAUNCH_SPLASH="$ROOT/ios/KidNest/Images.xcassets/LaunchSplash.imageset"
IOS_LAUNCH_BRAND="$ROOT/ios/KidNest/Images.xcassets/LaunchBranding.imageset"
IOS_LAUNCH_BG="$ROOT/ios/KidNest/Images.xcassets/LaunchGradient.imageset"
IOS_LAUNCH_LOGO="$ROOT/ios/KidNest/Images.xcassets/LaunchLogo.imageset"
IOS_BOOT_SPLASH="$ROOT/ios/KidNest/Images.xcassets/KidNestBootSplash.imageset"
IOS_LAUNCH_BUNDLE="$ROOT/ios/KidNest"

mkdir -p "$BRAND" "$IOS_ICON" "$IOS_LAUNCH_SPLASH" "$IOS_LAUNCH_BRAND" "$IOS_LAUNCH_BG" "$IOS_LAUNCH_LOGO" "$IOS_BOOT_SPLASH"

resize() {
  sips -z "$2" "$2" "$1" --out "$3" >/dev/null
}

# In-app (React Native) — same asset that already looks correct
resize "$UI" 1024 "$BRAND/app-icon.png"
resize "$UI" 512 "$BRAND/app-icon-splash.png"
resize "$IOS_ICON_SRC" 1024 "$BRAND/app-icon-store.png"

# Android launcher mipmaps — padded so OS mask does not clip
for spec in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
  dpi="${spec%%:*}"
  px="${spec##*:}"
  dir="$ANDROID_RES/mipmap-$dpi"
  mkdir -p "$dir"
  resize "$LAUNCHER" "$px" "$dir/ic_launcher.png"
  cp "$dir/ic_launcher.png" "$dir/ic_launcher_round.png"
done

mkdir -p "$ANDROID_RES/drawable-nodpi"
# Native splash — full-screen composite (pre-Android 12 window background)
cp "$SPLASH_SCREEN" "$ANDROID_RES/drawable-nodpi/splash_full_screen_img.png"
# Native splash branding — logo + wordmark (Android 12+ animated icon)
cp "$SPLASH_BRANDING" "$ANDROID_RES/drawable-nodpi/splash_branding.png"
# Android 12+ splash center icon — transparent logo only (not the launcher tile)
resize "$SPLASH_NATIVE" 432 "$ANDROID_RES/drawable-nodpi/splash_screen_icon.png"
resize "$FOREGROUND" 432 "$ANDROID_RES/drawable-nodpi/ic_launcher_foreground.png"

# iOS AppIcon — full-bleed squircle (fills icon slot; iOS applies rounded mask)
generate_ios_icon() {
  resize "$IOS_ICON_SRC" "$2" "$IOS_ICON/$1"
}
generate_ios_icon icon-20@2x.png 40
generate_ios_icon icon-20@3x.png 60
generate_ios_icon icon-29@2x.png 58
generate_ios_icon icon-29@3x.png 87
generate_ios_icon icon-40@2x.png 80
generate_ios_icon icon-40@3x.png 120
generate_ios_icon icon-60@2x.png 120
generate_ios_icon icon-60@3x.png 180
generate_ios_icon icon-1024.png 1024

# iOS native launch — full-screen composite in asset catalog + loose bundle (UIImage fallback)
cp "$SPLASH_SCREEN" "$IOS_BOOT_SPLASH/kidnest-boot-splash.png"
cp "$SPLASH_SCREEN" "$IOS_LAUNCH_BUNDLE/kidnest-boot-splash.png"
rm -f "$IOS_LAUNCH_BUNDLE"/launch-splash-icon*.png "$IOS_LAUNCH_BUNDLE"/kidnest-splash-*.png 2>/dev/null || true

# iOS launch — single full-screen composite (gradient + logo + KIDNEST + tagline)
cp "$SPLASH_SCREEN" "$IOS_LAUNCH_SPLASH/launch-splash@3x.png"
sips -Z 1864 "$SPLASH_SCREEN" --out "$IOS_LAUNCH_SPLASH/launch-splash@2x.png" >/dev/null
sips -Z 932 "$SPLASH_SCREEN" --out "$IOS_LAUNCH_SPLASH/launch-splash.png" >/dev/null
cp "$SPLASH_SCREEN_DARK" "$IOS_LAUNCH_SPLASH/launch-splash-dark@3x.png"
sips -Z 1864 "$SPLASH_SCREEN_DARK" --out "$IOS_LAUNCH_SPLASH/launch-splash-dark@2x.png" >/dev/null
sips -Z 932 "$SPLASH_SCREEN_DARK" --out "$IOS_LAUNCH_SPLASH/launch-splash-dark.png" >/dev/null

# Legacy imagesets (Android tooling / fallback)
cp "$SPLASH_GRADIENT" "$IOS_LAUNCH_BG/launch-gradient@3x.png"
sips -Z 1864 "$SPLASH_GRADIENT" --out "$IOS_LAUNCH_BG/launch-gradient@2x.png" >/dev/null
sips -Z 932 "$SPLASH_GRADIENT" --out "$IOS_LAUNCH_BG/launch-gradient.png" >/dev/null
cp "$SPLASH_GRADIENT_DARK" "$IOS_LAUNCH_BG/launch-gradient-dark@3x.png"
sips -Z 1864 "$SPLASH_GRADIENT_DARK" --out "$IOS_LAUNCH_BG/launch-gradient-dark@2x.png" >/dev/null
sips -Z 932 "$SPLASH_GRADIENT_DARK" --out "$IOS_LAUNCH_BG/launch-gradient-dark.png" >/dev/null

# iOS launch — centered branding (logo + KIDNEST + tagline)
cp "$SPLASH_BRANDING" "$IOS_LAUNCH_BRAND/launch-branding@3x.png"
sips -Z 720 "$SPLASH_BRANDING" --out "$IOS_LAUNCH_BRAND/launch-branding@2x.png" >/dev/null
sips -Z 360 "$SPLASH_BRANDING" --out "$IOS_LAUNCH_BRAND/launch-branding.png" >/dev/null

# Web admin — favicon, PWA, OG, in-app logo
ADMIN_PUBLIC="$ROOT/../kidnest-admin/public"
ADMIN_ASSETS="$ROOT/../kidnest-admin/src/assets"
if [[ -d "$ADMIN_PUBLIC" ]]; then
  mkdir -p "$ADMIN_PUBLIC" "$ADMIN_ASSETS"
  cp "$BRAND/app-icon-splash.png" "$ADMIN_ASSETS/kidnest-logo.png"
  cp "$BRAND/app-icon-splash.png" "$ADMIN_PUBLIC/kidnest-logo.png"
  resize "$BRAND/app-icon-splash.png" 64 "$ADMIN_PUBLIC/favicon.png"
  resize "$IOS_ICON_SRC" 180 "$ADMIN_PUBLIC/apple-touch-icon.png"
  resize "$LAUNCHER" 192 "$ADMIN_PUBLIC/icon-192.png"
  resize "$LAUNCHER" 512 "$ADMIN_PUBLIC/icon-512.png"
  python3 "$ROOT/scripts/generate-og-image.py" "$LAUNCHER" "$ADMIN_PUBLIC/og-image.png"
  echo "Web admin icons updated in kidnest-admin/public"
fi

# Marketing landing — favicon/PWA from public/saleh.png (website logos; mobile uses its own pipeline)
LANDING_PUBLIC="$ROOT/../kidnest-landing/public"
LANDING_APP="$ROOT/../kidnest-landing/src/app"
LANDING_SALEH="$LANDING_PUBLIC/saleh.png"
SALEH_SRC="$ROOT/../saleh.png"
if [[ -d "$LANDING_PUBLIC" ]]; then
  mkdir -p "$LANDING_PUBLIC" "$LANDING_APP"
  LANDING_LOGO="$LANDING_SALEH"
  if [[ ! -f "$LANDING_LOGO" && -f "$SALEH_SRC" ]]; then
    cp "$SALEH_SRC" "$LANDING_LOGO"
    LANDING_LOGO="$SALEH_SRC"
  fi
  if [[ -f "$LANDING_LOGO" ]]; then
    cp "$LANDING_LOGO" "$LANDING_PUBLIC/brand-icon.png"
    cp "$LANDING_LOGO" "$LANDING_APP/icon.png"
    resize "$LANDING_LOGO" 180 "$LANDING_APP/apple-icon.png"
    resize "$LANDING_LOGO" 64 "$LANDING_PUBLIC/favicon.png"
    resize "$LANDING_LOGO" 180 "$LANDING_PUBLIC/apple-touch-icon.png"
    resize "$LANDING_LOGO" 192 "$LANDING_PUBLIC/icon-192.png"
    resize "$LANDING_LOGO" 512 "$LANDING_PUBLIC/icon-512.png"
    python3 "$ROOT/scripts/generate-og-image.py" "$LANDING_LOGO" "$LANDING_PUBLIC/og-image.png"
  fi
  echo "Landing page icons updated in kidnest-landing/public"
fi

echo "KidNest icons generated from: $RAW_SOURCE"
