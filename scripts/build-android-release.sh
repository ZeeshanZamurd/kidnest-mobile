#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE="$ANDROID_DIR/app/kidonest-release.keystore"
PROPS="$ANDROID_DIR/keystore.properties"
OUT_DIR="$ANDROID_DIR/build/release"
AAB_SRC="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

echo "==> KidoNest Android Play Store release (AAB)"
echo "    Package: com.kidonest"
echo ""

if [[ ! -f "$KEYSTORE" ]]; then
  echo "==> Creating release keystore (first time only)..."
  STORE_PASS="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 24)"
  KEY_PASS="$STORE_PASS"
  keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE" \
    -alias kidonest \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=KidoNest, OU=Mobile, O=KidoNest, L=Unknown, ST=Unknown, C=US"

  cat >"$PROPS" <<EOF
storeFile=kidonest-release.keystore
storePassword=$STORE_PASS
keyPassword=$KEY_PASS
keyAlias=kidonest
EOF
  chmod 600 "$PROPS"

  echo ""
  echo "IMPORTANT — save these credentials (required for all future Play Store updates):"
  echo "  Keystore file: $KEYSTORE"
  echo "  Alias:         kidonest"
  echo "  Password:      $STORE_PASS"
  echo "  Properties:    $PROPS"
  echo ""
fi

if [[ ! -f "$PROPS" ]]; then
  echo "Missing $PROPS — copy from keystore.properties.example or delete keystore and re-run."
  exit 1
fi

cd "$ROOT"
mkdir -p "$ANDROID_DIR/app/src/main/assets"
echo "==> Bundling JS for release..."
cd "$ANDROID_DIR"
./gradlew bundleRelease --no-daemon

if [[ ! -f "$AAB_SRC" ]]; then
  echo "Build failed — AAB not found at $AAB_SRC"
  exit 1
fi

mkdir -p "$OUT_DIR"
VERSION_NAME="$(node -p "require('$ROOT/package.json').version")"
OUT_AAB="$OUT_DIR/kidonest-${VERSION_NAME}-release.aab"
cp "$AAB_SRC" "$OUT_AAB"

APK_SRC="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
if [[ -f "$APK_SRC" ]]; then
  OUT_APK="$OUT_DIR/kidonest-${VERSION_NAME}-release.apk"
  cp "$APK_SRC" "$OUT_APK"
fi

echo ""
echo "==> Release build complete"
echo "    Upload to Google Play: $OUT_AAB"
if [[ -f "${OUT_APK:-}" ]]; then
  echo "    Optional APK:          $OUT_APK"
fi
echo ""
echo "Google Play Console → Create app → Production → Create new release → Upload AAB"
