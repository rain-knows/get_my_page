#!/bin/sh
set -eu

APP_DIR="/app"
LOCK_FILE="$APP_DIR/package-lock.json"
PKG_FILE="$APP_DIR/package.json"
HASH_FILE="$APP_DIR/node_modules/.deps.hash"

rewrite_local_proxy() {
  VAR_NAME="$1"
  VALUE="$(printenv "$VAR_NAME" || true)"

  if [ -z "$VALUE" ]; then
    return 0
  fi

  # 容器内的 127.0.0.1/localhost 指向自身，通常无法访问宿主机代理。
  REWRITTEN_VALUE="$(printf '%s' "$VALUE" | sed -e 's#://127\.0\.0\.1#://host.docker.internal#' -e 's#://localhost#://host.docker.internal#')"

  if [ "$REWRITTEN_VALUE" != "$VALUE" ]; then
    echo "Rewrite proxy env $VAR_NAME to $REWRITTEN_VALUE"
    export "$VAR_NAME=$REWRITTEN_VALUE"
  fi
}

install_dependencies() {
  echo "Dependency manifest changed, running npm ci..."
  if npm ci; then
    return 0
  fi

  echo "npm ci failed, fallback to npm install..."
  rm -rf "$APP_DIR/node_modules"
  mkdir -p "$APP_DIR/node_modules"
  npm cache clean --force >/dev/null 2>&1 || true
  npm install --no-audit --no-fund
}

if [ ! -f "$PKG_FILE" ]; then
  echo "package.json not found at $PKG_FILE"
  exit 1
fi

mkdir -p "$APP_DIR/node_modules"

rewrite_local_proxy HTTP_PROXY
rewrite_local_proxy HTTPS_PROXY
rewrite_local_proxy ALL_PROXY

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
  install_dependencies

  if [ ! -x "$APP_DIR/node_modules/.bin/next" ]; then
    echo "next binary missing after install, force reinstall dependencies..."
    rm -rf "$APP_DIR/node_modules"
    mkdir -p "$APP_DIR/node_modules"
    npm install --no-audit --no-fund
  fi

  if [ ! -x "$APP_DIR/node_modules/.bin/next" ]; then
    echo "Dependency install finished but next is still missing."
    rm -f "$HASH_FILE"
    exit 1
  fi

  printf '%s' "$CURRENT_HASH" > "$HASH_FILE"
fi

exec npm run dev
