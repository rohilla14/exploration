#!/usr/bin/env bash
#
# share.sh — build + run the production server, then open a public tunnel to it
# with automatic retry if the tunnel drops. Prints the current shareable URL
# clearly every time it changes.
#
# Usage:
#   ./scripts/share.sh                 # cloudflared if available, else localtunnel
#   TUNNEL=localtunnel ./scripts/share.sh
#   TUNNEL=cloudflared ./scripts/share.sh
#   PORT=3001 ./scripts/share.sh
#
# Stop with Ctrl+C — the server and tunnel are both cleaned up automatically.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3001}"
LOG_DIR="$ROOT_DIR/.share-logs"
SERVER_LOG="$LOG_DIR/server.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"
HEALTH_URL="http://localhost:${PORT}/api/health"

SERVER_PID=""
TUNNEL_PID=""
LAST_URL=""

mkdir -p "$LOG_DIR"

# ---------- colors ----------
if [[ -t 1 ]]; then
  BOLD="\033[1m"; GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; CYAN="\033[36m"; RESET="\033[0m"
else
  BOLD=""; GREEN=""; YELLOW=""; RED=""; CYAN=""; RESET=""
fi

info()  { echo -e "${CYAN}[share]${RESET} $1"; }
ok()    { echo -e "${GREEN}[share]${RESET} $1"; }
warn()  { echo -e "${YELLOW}[share]${RESET} $1"; }
err()   { echo -e "${RED}[share]${RESET} $1"; }

cleanup() {
  echo
  info "Shutting down…"
  [[ -n "$TUNNEL_PID" ]] && kill "$TUNNEL_PID" 2>/dev/null
  [[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null
  wait 2>/dev/null
  ok "Stopped. Bye 👋"
  exit 0
}
trap cleanup INT TERM

# ---------- 1. build + start the prod server ----------
info "Building frontend…"
npm run build --silent >> "$LOG_DIR/build.log" 2>&1 || {
  err "Build failed — check $LOG_DIR/build.log"
  exit 1
}
ok "Build complete."

info "Starting server on port $PORT (logs: $SERVER_LOG)…"
: > "$SERVER_LOG"
# The tunnel is a reverse proxy: trust it so rate limits see real client IPs.
TRUST_PROXY="${TRUST_PROXY:-1}" PORT="$PORT" node server/index.js >> "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" > /dev/null 2>&1; then
    ok "Server is healthy (pid $SERVER_PID)."
    break
  fi
  sleep 0.5
done

if ! curl -fsS "$HEALTH_URL" > /dev/null 2>&1; then
  err "Server did not become healthy — check $SERVER_LOG"
  cleanup
fi

# ---------- 2. pick a tunnel backend ----------
TUNNEL_MODE="${TUNNEL:-}"
if [[ -z "$TUNNEL_MODE" ]]; then
  if command -v cloudflared > /dev/null 2>&1; then
    TUNNEL_MODE="cloudflared"
  else
    TUNNEL_MODE="localtunnel"
  fi
fi
info "Using tunnel backend: $TUNNEL_MODE"

start_tunnel() {
  : > "$TUNNEL_LOG"
  if [[ "$TUNNEL_MODE" == "cloudflared" ]]; then
    cloudflared tunnel --url "http://localhost:${PORT}" >> "$TUNNEL_LOG" 2>&1 &
  else
    npx --yes localtunnel --port "$PORT" >> "$TUNNEL_LOG" 2>&1 &
  fi
  TUNNEL_PID=$!
}

extract_url() {
  if [[ "$TUNNEL_MODE" == "cloudflared" ]]; then
    grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -1
  else
    grep -Eo 'https://[a-zA-Z0-9.-]+\.loca\.lt' "$TUNNEL_LOG" | tail -1
  fi
}

print_url() {
  local url="$1"
  echo
  echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${BOLD}${GREEN}  Share this link:${RESET}  ${BOLD}${url}${RESET}"
  echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo
}

info "Starting tunnel (logs: $TUNNEL_LOG)…"
start_tunnel

# ---------- 3. watch loop: reprint URL when it changes, restart tunnel if it dies ----------
while true; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    err "Server process died unexpectedly — check $SERVER_LOG"
    cleanup
  fi

  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    warn "Tunnel dropped — restarting ($TUNNEL_MODE)…"
    LAST_URL=""
    start_tunnel
    sleep 2
  fi

  url="$(extract_url)"
  if [[ -n "$url" && "$url" != "$LAST_URL" ]]; then
    LAST_URL="$url"
    print_url "$LAST_URL"
  fi

  sleep 3
done
