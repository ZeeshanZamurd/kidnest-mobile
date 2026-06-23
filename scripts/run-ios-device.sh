#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

if [[ -d "$HOME/.rbenv" ]]; then
  export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH"
  eval "$(rbenv init -)" 2>/dev/null || true
fi

echo "==> KidNest iOS device run"
echo ""

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

find_xcode_app() {
  for candidate in \
    "/Applications/Xcode.app" \
    "$HOME/Downloads/Xcode.app" \
    "/Applications/Xcode-beta.app"; do
    if [[ -d "$candidate/Contents/Developer" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  mdfind "kMDItemCFBundleIdentifier == 'com.apple.dt.Xcode'" 2>/dev/null | head -1
}

XCODE_APP="$(find_xcode_app || true)"
XCODE_DEV="${XCODE_APP:+$XCODE_APP/Contents/Developer}"

if ! xcodebuild -version >/dev/null 2>&1; then
  DEV_DIR="$(xcode-select -p 2>/dev/null || true)"
  echo "Xcode is required to build for a physical iPhone."
  echo "Current developer path: ${DEV_DIR:-unknown}"
  echo ""
  if [[ -n "$XCODE_DEV" && -d "$XCODE_DEV" ]]; then
    echo "Found Xcode at: $XCODE_APP"
    echo "Run: sudo xcode-select -s \"$XCODE_DEV\""
  else
    echo "Install Xcode from the App Store."
  fi
  exit 1
fi

echo "Xcode: $(xcodebuild -version | head -1)"

find_pod() {
  if command -v pod >/dev/null 2>&1; then
    command -v pod
    return 0
  fi
  for p in \
    "$HOME/.rbenv/shims/pod" \
    /usr/local/bin/pod \
    "$HOME/.gem/ruby/"*/bin/pod; do
    if [[ -x "$p" ]]; then
      echo "$p"
      return 0
    fi
  done
  if [[ -f "$ROOT/Gemfile" ]] && bundle exec pod --version >/dev/null 2>&1; then
    echo "bundle"
    return 0
  fi
  return 1
}

run_pod() {
  local pod_cmd
  pod_cmd="$(find_pod || true)"
  if [[ "$pod_cmd" == "bundle" ]]; then
    bundle exec pod "$@"
  elif [[ -n "$pod_cmd" ]]; then
    "$pod_cmd" "$@"
  else
    return 1
  fi
}

if [[ ! -d ios/Pods ]]; then
  if ! run_pod --version >/dev/null 2>&1; then
    echo "CocoaPods (pod) is not installed. Run: npm run setup:cocoapods"
    exit 1
  fi
  echo "CocoaPods: $(run_pod --version)"
  echo "==> Installing iOS pods (first time)..."
  (cd ios && run_pod install)
fi

if [[ ! -d ios/KidNest.xcworkspace ]]; then
  fail "KidNest.xcworkspace not found — run: cd ios && pod install"
fi

if ! lsof -i :8088 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "WARNING: Metro is not listening on port 8088."
  echo "Start it in another terminal: npm start"
  echo ""
fi

find_ios_device() {
  python3 - <<'PY'
import json
import subprocess
import sys

try:
    out = subprocess.check_output(
        ["xcrun", "xcdevice", "list"],
        stderr=subprocess.DEVNULL,
        text=True,
    )
    devices = json.loads(out)
except Exception as exc:
    print(f"parse_error:{exc}", file=sys.stderr)
    sys.exit(1)

for device in devices:
    if (
        not device.get("simulator")
        and device.get("available")
        and device.get("platform") == "com.apple.platform.iphoneos"
    ):
        print(device["identifier"])
        print(device["name"])
        sys.exit(0)

sys.exit(2)
PY
}

DEVICE_INFO="$(find_ios_device 2>/dev/null || true)"
if [[ -z "$DEVICE_INFO" ]]; then
  echo "No connected iPhone detected."
  echo ""
  echo "  • Unlock the phone and tap Trust This Computer"
  echo "  • Enable Developer Mode (Settings → Privacy & Security)"
  echo "  • Use a USB cable (Wi‑Fi debugging alone is unreliable)"
  exit 1
fi

DEVICE_UDID="$(echo "$DEVICE_INFO" | sed -n '1p')"
DEVICE_NAME="$(echo "$DEVICE_INFO" | sed -n '2p')"
SCHEME="KidNest"
CONFIG="Debug"
WORKSPACE="ios/KidNest.xcworkspace"
DERIVED="ios/build"
APP_PATH="$DERIVED/Build/Products/${CONFIG}-iphoneos/${SCHEME}.app"
BUNDLE_ID="org.reactjs.native.example.KidNest"

echo "Device: $DEVICE_NAME ($DEVICE_UDID)"

DESTINATIONS="$(xcodebuild -showdestinations -workspace "$WORKSPACE" -scheme "$SCHEME" 2>&1 || true)"
if ! echo "$DESTINATIONS" | grep -q "platform:iOS.*id:$DEVICE_UDID"; then
  if echo "$DESTINATIONS" | grep -q "is not installed"; then
    echo "ERROR: $(echo "$DESTINATIONS" | grep 'is not installed' | head -1)" >&2
    echo "" >&2
    echo "Open Xcode → Settings → Platforms and download the iOS platform." >&2
    echo "If your iPhone runs iOS 18+, you may need Xcode 16 or newer." >&2
    exit 1
  fi
  echo "WARNING: Xcode does not list this device as a build destination yet."
  echo "Open Xcode → Settings → Platforms and install the required iOS platform."
  echo ""
fi

echo "==> Building for device (this can take several minutes)..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -destination "id=$DEVICE_UDID" \
  -derivedDataPath "$DERIVED" \
  build

if [[ ! -d "$APP_PATH" ]]; then
  fail "Build finished but app not found at $APP_PATH"
fi

echo "==> Installing on $DEVICE_NAME..."
xcrun devicectl device install app --device "$DEVICE_UDID" "$APP_PATH"

echo "==> Launching app..."
xcrun devicectl device process launch --device "$DEVICE_UDID" "$BUNDLE_ID"

echo ""
echo "Done. App installed on $DEVICE_NAME. Metro should be on port 8088."
