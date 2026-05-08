#!/usr/bin/env bash
# Fix xcode-select to point at /Applications/Xcode.app instead of CommandLineTools.
# Bypasses zsh / Chinese-IME whitespace corruption by reading the path from this script
# (no user-typed whitespace or `--switch=` parsing required).
#
# Usage: sudo bash scripts/fix-xcode-select.sh

set -euo pipefail

DEV_DIR="/Applications/Xcode.app/Contents/Developer"

if [[ ! -d "$DEV_DIR" ]]; then
  echo "ERROR: $DEV_DIR not found. Make sure Xcode.app is installed in /Applications." >&2
  exit 1
fi

CURRENT="$(/usr/bin/xcode-select -p 2>/dev/null || true)"
echo "current xcode-select path: $CURRENT"

if [[ "$CURRENT" == "$DEV_DIR" ]]; then
  echo "already pointing at Xcode.app — nothing to do."
  exit 0
fi

echo "switching to: $DEV_DIR"
/usr/bin/xcode-select -s "$DEV_DIR"
echo "verify:"
/usr/bin/xcode-select -p
echo "xcodebuild version:"
/usr/bin/xcodebuild -version || true
