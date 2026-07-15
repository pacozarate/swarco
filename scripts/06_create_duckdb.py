#!/usr/bin/env python3
"""Create an optional DuckDB database from dbo_alhis.parquet."""

from __future__ import annotations

from pathlib import Path

import duckdb


ROOT = Path(__file__).resolve().parents[1]
PARQUET_FILE = ROOT / "data" / "processed" / "dbo_alhis.parquet"
DUCKDB_FILE = ROOT / "data" / "processed" / "dbo_alhis.duckdb"


def main() -> None:
    if not PARQUET_FILE.exists():
        raise FileNotFoundError(f"No existe el Parquet procesado: {PARQUET_FILE}")

    if DUCKDB_FILE.exists():
        DUCKDB_FILE.unlink()

    connection = duckdb.connect(str(DUCKDB_FILE))
    try:
        connection.execute(
            """
            CREATE TABLE dbo_alhis AS
            SELECT * FROM read_parquet(?)
            """,
            [str(PARQUET_FILE)],
        )
        rows = connection.execute("SELECT COUNT(*) FROM dbo_alhis").fetchone()[0]
        print(f"DuckDB generado: {DUCKDB_FILE.relative_to(ROOT)}")
        print(f"Filas cargadas en dbo_alhis: {rows}")
        print("Consulta ejemplo 1:")
        print(connection.execute(
            """
            SELECT codart, SUM(CAST(cant AS DOUBLE)) AS cantidad_total
            FROM dbo_alhis
            GROUP BY codart
            ORDER BY cantidad_total DESC
            LIMIT 20
            """
        ).fetchdf())
    finally:
        connection.close()


if __name__ == "__main__":
    main()
