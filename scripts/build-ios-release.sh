#!/usr/bin/env bash
# Build a standalone iOS Release .ipa (production API baked in).
# Share with family via TestFlight (recommended) or ad-hoc + Diawi link on WhatsApp.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

SCHEME="KidNest"
WORKSPACE="ios/KidNest.xcworkspace"
ARCHIVE_PATH="ios/build/KidNest.xcarchive"
EXPORT_DIR="ios/build/release"
EXPORT_METHOD="${EXPORT_METHOD:-app-store}"
BUNDLE_ID="com.kidonest"
PROD_API="https://api.kido-nest.fun/api"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

echo "==> KidNest iOS production release"
echo ""

if ! xcodebuild -version >/dev/null 2>&1; then
  fail "Xcode is required. Install from the App Store and run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
fi

echo "Xcode: $(xcodebuild -version | head -1)"

API_IN_CONFIG="$(grep -E "^export const API_URL" config/api.ts | sed "s/.*'\\([^']*\\)'.*/\\1/" || true)"
if [[ "$API_IN_CONFIG" != "$PROD_API" ]]; then
  echo "WARNING: config/api.ts API_URL is '$API_IN_CONFIG' (expected $PROD_API)"
  echo "         Release will use whatever is in config/api.ts."
fi
echo "API: ${API_IN_CONFIG:-$PROD_API}"
echo ""

if [[ ! -d ios/Pods ]]; then
  echo "==> Installing CocoaPods..."
  (cd ios && pod install)
fi

if [[ ! -d "$WORKSPACE" ]]; then
  fail "Missing $WORKSPACE — run: cd ios && pod install"
fi

echo "==> Bundling JavaScript (Release)..."
mkdir -p ios/build
node ./node_modules/react-native/cli.js bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/build/main.jsbundle \
  --assets-dest ios/build

echo "==> Archiving (Release) — this can take 10–20 minutes..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  DEVELOPMENT_TEAM=R46KU6WD7H \
  CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates \
  archive

if [[ "$EXPORT_METHOD" == "adhoc" ]]; then
  PLIST="ios/ExportOptions-adhoc.plist"
  echo "==> Exporting ad-hoc IPA (devices must be registered in Apple Developer)..."
else
  PLIST="ios/ExportOptions.plist"
  echo "==> Exporting App Store IPA (upload to TestFlight)..."
fi

rm -rf "$EXPORT_DIR"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$PLIST" \
  -allowProvisioningUpdates

IPA="$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' | head -1)"
if [[ -z "$IPA" ]]; then
  fail "Export finished but no .ipa found in $EXPORT_DIR"
fi

OUT_IPA="$ROOT/ios/build/KidNest-release.ipa"
cp "$IPA" "$OUT_IPA"

echo ""
echo "=============================================="
echo "  Release build ready"
echo "=============================================="
echo ""
echo "  IPA: $OUT_IPA"
echo "  API: $PROD_API"
echo "  Size: $(du -h "$OUT_IPA" | cut -f1)"
echo ""

if [[ "$EXPORT_METHOD" == "adhoc" ]]; then
  echo "Share on WhatsApp (ad-hoc):"
  echo "  1. Upload $OUT_IPA to https://diawi.com"
  echo "  2. Send the install link to family on WhatsApp"
  echo "  3. Each iPhone must be registered in Apple Developer → Devices"
  echo ""
else
  echo "Share on WhatsApp (TestFlight — recommended):"
  echo "  1. Open Apple Transporter (Mac App Store) or Xcode → Organizer"
  echo "  2. Upload: $OUT_IPA"
  echo "  3. App Store Connect → TestFlight → add external testers"
  echo "  4. Share the TestFlight link on WhatsApp (family installs TestFlight first)"
  echo ""
  echo "  Or upload from terminal (needs app-specific password):"
  echo "    xcrun altool --upload-app -f \"$OUT_IPA\" -t ios -u YOUR_APPLE_ID"
  echo ""
fi
