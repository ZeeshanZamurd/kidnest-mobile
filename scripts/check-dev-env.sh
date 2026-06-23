#!/usr/bin/env bash
# KidNest — check local dev environment for Android + iOS
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ok() { echo "  OK   $1"; }
warn() { echo "  WARN $1"; }
bad() { echo "  FAIL $1"; }

echo "KidNest dev environment"
echo ""

# Metro
if lsof -i :8088 -sTCP:LISTEN >/dev/null 2>&1; then
  ok "Metro listening on port 8088"
else
  warn "Metro not on 8088 — run: npm start"
fi

# Android
echo ""
echo "Android"
if command -v adb >/dev/null 2>&1; then
  DEVICES="$(adb devices | grep -v '^List' | grep 'device$' | wc -l | tr -d ' ')"
  if [[ "$DEVICES" -gt 0 ]]; then
    ok "$DEVICES device(s) connected"
    adb devices | grep 'device$' || true
  else
    warn "No adb devices — plug in phone & enable USB debugging"
  fi
else
  bad "adb not found — install Android SDK platform-tools"
fi

# iOS
echo ""
echo "iOS"
if xcodebuild -version >/dev/null 2>&1; then
  ok "Xcode: $(xcodebuild -version | head -1)"
else
  bad "Full Xcode not installed (Command Line Tools alone is not enough)"
  echo "       Install Xcode from App Store, then:"
  echo "         sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
fi

if [[ -d ios/KidNest.xcworkspace ]]; then
  ok "KidNest.xcworkspace exists"
elif [[ -d ios/Pods ]]; then
  warn "Pods exist but workspace missing — run: cd ios && pod install"
else
  warn "CocoaPods not installed — after Xcode: cd ios && pod install"
fi

echo ""
echo "Commands:"
echo "  npm start          Metro (8088)"
echo "  npm run android    Install on Android device/emulator"
echo "  npm run ios:device Install on connected iPhone (needs Xcode)"
