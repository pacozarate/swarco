from __future__ import annotations

import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class BetaHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".html": "text/html",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    os.chdir(root)
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    server = ThreadingHTTPServer(("127.0.0.1", port), BetaHandler)
    print(f"Configurador SWARCO beta")
    print(f"Carpeta: {root}")
    print(f"Servidor local: http://127.0.0.1:{port}/")
    print("Pulse Ctrl+C para cerrar.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor cerrado.")


if __name__ == "__main__":
    main()
