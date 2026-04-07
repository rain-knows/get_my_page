#!/bin/sh
set -eu

APP_DIR="/app"
LOCK_FILE="$APP_DIR/package-lock.json"
PKG_FILE="$APP_DIR/package.json"
HASH_FILE="$APP_DIR/node_modules/.deps.hash"

if [ ! -f "$PKG_FILE" ]; then
  echo "package.json not found at $PKG_FILE"
  exit 1
fi

mkdir -p "$APP_DIR/node_modules"

# 用 package.json + lockfile 的组合哈希判断依赖是否变化。
if [ -f "$LOCK_FILE" ]; then
  CURRENT_HASH="$(cat "$PKG_FILE" "$LOCK_FILE" | sha256sum | awk '{print $1}')"
else
  CURRENT_HASH="$(cat "$PKG_FILE" | sha256sum | awk '{print $1}')"
fi

SAVED_HASH=""
if [ -f "$HASH_FILE" ]; then
  SAVED_HASH="$(cat "$HASH_FILE")"
fi

if [ "$CURRENT_HASH" != "$SAVED_HASH" ] || [ ! -d "$APP_DIR/node_modules/.bin" ]; then
  echo "Dependency manifest changed, running npm ci..."
  npm ci
  printf '%s' "$CURRENT_HASH" > "$HASH_FILE"
fi

exec npm run dev
