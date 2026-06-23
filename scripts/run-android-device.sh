#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> KidNest Android device run"

if ! command -v adb >/dev/null 2>&1; then
  echo "ERROR: adb not found. Install Android SDK platform-tools." >&2
  exit 1
fi

DEVICES="$(adb devices | grep -v '^List' | grep 'device$' | wc -l | tr -d ' ')"
if [[ "$DEVICES" -eq 0 ]]; then
  echo "ERROR: No Android device connected." >&2
  echo "Enable USB debugging and run: adb devices" >&2
  exit 1
fi

adb reverse tcp:8088 tcp:8088 2>/dev/null || true
adb reverse tcp:3010 tcp:3010 2>/dev/null || true

if ! lsof -i :8088 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "WARNING: Start Metro in another terminal: npm start"
fi

exec npx react-native run-android --port 8088 "$@"
