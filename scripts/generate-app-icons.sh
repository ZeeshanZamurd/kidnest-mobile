#!/usr/bin/env bash
# Regenerate KidNest app icons from the official source PNG.
# Usage: ./scripts/generate-app-icons.sh [path-to-source.png]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAND="$ROOT/assets/branding"
SOURCE="${1:-$BRAND/app-icon-source.png}"

if [[ ! -f "$SOURCE" ]]; then
  echo "Source icon not found: $SOURCE" >&2
  echo "Copy the official KidNest icon to assets/branding/app-icon-source.png or pass a path." >&2
  exit 1
fi

ANDROID_RES="$ROOT/android/app/src/main/res"
IOS_ICON="$ROOT/ios/KidNest/Images.xcassets/AppIcon.appiconset"
IOS_LAUNCH="$ROOT/ios/KidNest/Images.xcassets/LaunchLogo.imageset"

mkdir -p "$BRAND" "$IOS_ICON" "$IOS_LAUNCH"

resize() {
  sips -z "$2" "$2" "$1" --out "$3" >/dev/null
}

cp "$SOURCE" "$BRAND/app-icon-source.png"
resize "$SOURCE" 1024 "$BRAND/app-icon.png"
resize "$SOURCE" 512 "$BRAND/app-icon-splash.png"

# Android launcher (legacy + pre-API-26)
for spec in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
  dpi="${spec%%:*}"
  px="${spec##*:}"
  dir="$ANDROID_RES/mipmap-$dpi"
  mkdir -p "$dir"
  resize "$SOURCE" "$px" "$dir/ic_launcher.png"
  cp "$dir/ic_launcher.png" "$dir/ic_launcher_round.png"
done

mkdir -p "$ANDROID_RES/drawable-nodpi"
resize "$SOURCE" 288 "$ANDROID_RES/drawable-nodpi/splash_icon.png"

# iOS AppIcon
declare -A IOS_SIZES=(
  ["icon-20@2x.png"]=40
  ["icon-20@3x.png"]=60
  ["icon-29@2x.png"]=58
  ["icon-29@3x.png"]=87
  ["icon-40@2x.png"]=80
  ["icon-40@3x.png"]=120
  ["icon-60@2x.png"]=120
  ["icon-60@3x.png"]=180
  ["icon-1024.png"]=1024
)
for name in "${!IOS_SIZES[@]}"; do
  resize "$SOURCE" "${IOS_SIZES[$name]}" "$IOS_ICON/$name"
done

# iOS launch logo (centered on native splash)
resize "$SOURCE" 168 "$IOS_LAUNCH/launch-logo.png"
resize "$SOURCE" 336 "$IOS_LAUNCH/launch-logo@2x.png"
resize "$SOURCE" 504 "$IOS_LAUNCH/launch-logo@3x.png"

echo "KidNest icons generated from: $SOURCE"
