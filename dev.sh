#!/usr/bin/env bash
# Sobe o site (Vite) e a API (Express) juntos.
# Uso: ./dev.sh   |   bash dev.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in api site; do
  if [ ! -d "$ROOT_DIR/$dir/node_modules" ]; then
    echo "Instalando dependências de $dir..."
    (cd "$ROOT_DIR/$dir" && npm install)
  fi
done

CLEANED_UP=0
cleanup() {
  [ "$CLEANED_UP" = "1" ] && return
  CLEANED_UP=1
  echo ""
  echo "Encerrando serviços..."
  kill "$API_PID" "$SITE_PID" 2>/dev/null
  wait "$API_PID" "$SITE_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

(cd "$ROOT_DIR/api" && npm run dev) &
API_PID=$!

(cd "$ROOT_DIR/site" && npm run dev) &
SITE_PID=$!

echo "API  → http://localhost:3001 (PID $API_PID)"
echo "Site → http://localhost:5173 (PID $SITE_PID)"
echo "Ctrl+C para encerrar os dois."

wait "$API_PID" "$SITE_PID"
