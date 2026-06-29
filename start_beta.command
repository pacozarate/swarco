#!/bin/sh
cd "$(dirname "$0")" || exit 1
PORT="${1:-4173}"
while lsof -iTCP:"$PORT" -sTCP:LISTEN -n -P >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 4199 ]; then
    echo "No se encontro un puerto libre entre 4173 y 4199."
    exit 1
  fi
done
URL="http://127.0.0.1:$PORT/?fresh=$(date +%s)"
echo "Configurador SWARCO beta"
echo "Servidor local: $URL"
if command -v python3 >/dev/null 2>&1; then
  (sleep 1; open "$URL" >/dev/null 2>&1) &
  python3 scripts/beta_server.py "$PORT"
elif command -v python >/dev/null 2>&1; then
  (sleep 1; open "$URL" >/dev/null 2>&1) &
  python scripts/beta_server.py "$PORT"
else
  echo "No se encontro Python. Instale Python 3 o abra la carpeta con otro servidor web local."
  exit 1
fi
