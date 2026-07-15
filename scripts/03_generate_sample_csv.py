#!/usr/bin/env python3
"""Generate a lightweight CSV sample from dbo_alhis.parquet."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq


ROOT = Path(__file__).resolve().parents[1]
PARQUET_FILE = ROOT / "data" / "processed" / "dbo_alhis.parquet"
OUTPUT_FILE = ROOT / "data" / "processed" / "dbo_alhis_sample.csv"
MAX_ROWS = 10_000


def main() -> None:
    if not PARQUET_FILE.exists():
        raise FileNotFoundError(f"No existe el Parquet procesado: {PARQUET_FILE}")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    parquet = pq.ParquetFile(PARQUET_FILE)
    frames = []
    rows_read = 0
    for batch in parquet.iter_batches(batch_size=min(MAX_ROWS, 10_000)):
        frame = batch.to_pandas()
        frames.append(frame)
        rows_read += len(frame)
        if rows_read >= MAX_ROWS:
            break
    sample = pd.concat(frames, ignore_index=True).head(MAX_ROWS) if frames else pd.DataFrame()
    sample.to_csv(OUTPUT_FILE, sep=";", encoding="utf-8", index=False)

    print(f"Muestra CSV generada: {OUTPUT_FILE.relative_to(ROOT)}")
    print(f"Filas: {len(sample)}")
    print(f"Columnas: {len(sample.columns)}")


if __name__ == "__main__":
    main()
