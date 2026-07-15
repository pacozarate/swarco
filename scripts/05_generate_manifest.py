#!/usr/bin/env python3
"""Generate data/manifest.yml from the inspected schema and source file."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
RAW_FILE = ROOT / "data" / "raw" / "dbo_alhis.xlsx"
SCHEMA_FILE = ROOT / "data" / "processed" / "dbo_alhis_schema.json"
OUTPUT_FILE = ROOT / "data" / "manifest.yml"
MAIN_SHEET = "dbo_alhis"


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    if not RAW_FILE.exists():
        raise FileNotFoundError(f"No existe el Excel original: {RAW_FILE}")
    if not SCHEMA_FILE.exists():
        raise FileNotFoundError(f"No existe el schema JSON; ejecute primero scripts/01_inspect_excel.py")

    schema = json.loads(SCHEMA_FILE.read_text(encoding="utf-8"))
    sheets = schema.get("sheets", [])
    main_sheet = next((sheet for sheet in sheets if sheet.get("name") == MAIN_SHEET), {})

    manifest = {
        "archivo_original": RAW_FILE.name,
        "ruta_original": str(RAW_FILE.relative_to(ROOT)),
        "sha256": sha256_file(RAW_FILE),
        "tamano_bytes": RAW_FILE.stat().st_size,
        "descripcion": "Histórico de movimientos de almacén / artículos procedente de ERP",
        "hojas": [
            {
                "nombre": sheet.get("name"),
                **({"observacion": "Revisar si contiene datos útiles"} if sheet.get("name") == "Tipos de Movimiento" else {}),
                **({"filas_aproximadas": sheet.get("max_row"), "columnas": sheet.get("max_column")} if sheet.get("name") == MAIN_SHEET else {}),
            }
            for sheet in sheets
        ],
        "columnas": main_sheet.get("columns", []),
        "tratamiento": [
            "Conservación del Excel original mediante Git LFS",
            "Conversión de la hoja dbo_alhis a Parquet",
            "Generación de muestra CSV para pruebas",
            "Validación técnica de estructura, nulos, fechas y magnitudes económicas",
        ],
        "observaciones": [
            "Las fechas pueden venir en formato serial Excel",
            "feccad puede contener valores convencionales o anómalos",
            "No realizar transformaciones destructivas sin documentación",
        ],
    }

    OUTPUT_FILE.write_text(yaml.safe_dump(manifest, allow_unicode=True, sort_keys=False), encoding="utf-8")
    print(f"Manifest generado: {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
