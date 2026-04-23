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

ensure_next_swc_binding() {
  if [ ! -x "$APP_DIR/node_modules/.bin/next" ]; then
    echo "next binary not found, skip SWC check."
    return 1
  fi

  NEXT_VERSION="$(node -p "require('$APP_DIR/node_modules/next/package.json').version" 2>/dev/null || true)"
  if [ -z "$NEXT_VERSION" ]; then
    echo "Cannot detect Next.js version, skip SWC check."
    return 1
  fi

  if ldd --version 2>&1 | grep -qi musl; then
    SWC_PKG="@next/swc-linux-x64-musl@$NEXT_VERSION"
    SWC_DIR="$APP_DIR/node_modules/@next/swc-linux-x64-musl"
  else
    SWC_PKG="@next/swc-linux-x64-gnu@$NEXT_VERSION"
    SWC_DIR="$APP_DIR/node_modules/@next/swc-linux-x64-gnu"
  fi

  if [ -d "$SWC_DIR" ]; then
    return 0
  fi

  echo "Missing native SWC binding, installing $SWC_PKG ..."
  npm install --no-save --no-audit --no-fund "$SWC_PKG"
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

# 为 Turbopack 显式校验并补装当前平台的 SWC 原生绑定，避免 optional 依赖被静默跳过。
if ! ensure_next_swc_binding; then
  echo "SWC native binding check failed, fallback to webpack mode."
  exec npm run dev -- --webpack
fi

exec npm run dev
