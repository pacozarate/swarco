#!/usr/bin/env python3
"""Validate dbo_alhis.parquet without changing source values."""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq


ROOT = Path(__file__).resolve().parents[1]
PARQUET_FILE = ROOT / "data" / "processed" / "dbo_alhis.parquet"
OUTPUT_FILE = ROOT / "data" / "processed" / "validation_report.json"
REQUIRED_COLUMNS = ["codart", "fecmov", "fecintro", "tipmov", "cant", "prec", "impmov", "almace", "numdoc"]
DATE_COLUMNS = ["fecmov", "fecintro", "feccad"]
NUMERIC_SUM_COLUMNS = ["cant", "impmov"]
NEGATIVE_CHECK_COLUMNS = ["prec", "cant"]
MAX_UNIQUE_VALUES = 500
EXCEL_MAX_SERIAL = 2_958_465


def numeric_series(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def infer_type(series: pd.Series) -> str:
    non_null = series.dropna()
    if non_null.empty:
        return "empty"
    numeric = pd.to_numeric(non_null, errors="coerce")
    numeric_ratio = float(numeric.notna().mean())
    if numeric_ratio == 1:
        integers = (numeric.dropna() % 1 == 0).all()
        return "integer-like" if integers else "numeric"
    if numeric_ratio >= 0.95:
        return "mostly_numeric"
    return "text"


def update_min_max(target: dict, column: str, values: pd.Series) -> None:
    clean = values.dropna()
    if clean.empty:
        return
    current = target.setdefault(column, {"min": None, "max": None})
    min_value = float(clean.min())
    max_value = float(clean.max())
    current["min"] = min_value if current["min"] is None else min(current["min"], min_value)
    current["max"] = max_value if current["max"] is None else max(current["max"], max_value)


def main() -> None:
    if not PARQUET_FILE.exists():
        raise FileNotFoundError(f"No existe el Parquet procesado: {PARQUET_FILE}")

    parquet = pq.ParquetFile(PARQUET_FILE)
    columns = parquet.schema_arrow.names
    row_count = parquet.metadata.num_rows
    null_counts = defaultdict(int)
    unique_values = {"tipmov": set(), "moves": set()}
    date_ranges: dict[str, dict[str, float | None]] = {}
    sums = {column: 0.0 for column in NUMERIC_SUM_COLUMNS}
    negative_counts = {column: 0 for column in NEGATIVE_CHECK_COLUMNS}
    anomalous_dates = {column: {"non_numeric": 0, "outside_excel_serial_range": 0} for column in DATE_COLUMNS}
    sample_values = defaultdict(list)

    for batch in parquet.iter_batches(batch_size=50_000):
        frame = batch.to_pandas()
        null_counts.update(frame.isna().sum().to_dict())

        for column in columns:
            if len(sample_values[column]) < 1000:
                sample_values[column].extend(frame[column].dropna().head(1000 - len(sample_values[column])).tolist())

        for column in unique_values:
            if column in frame.columns and len(unique_values[column]) <= MAX_UNIQUE_VALUES:
                unique_values[column].update(frame[column].dropna().astype(str).unique().tolist())

        for column in DATE_COLUMNS:
            if column not in frame.columns:
                continue
            numeric = numeric_series(frame[column])
            update_min_max(date_ranges, column, numeric)
            present = frame[column].notna()
            anomalous_dates[column]["non_numeric"] += int((present & numeric.isna()).sum())
            anomalous_dates[column]["outside_excel_serial_range"] += int(((numeric < 1) | (numeric > EXCEL_MAX_SERIAL)).sum())

        for column in NUMERIC_SUM_COLUMNS:
            if column in frame.columns:
                sums[column] += float(numeric_series(frame[column]).sum(skipna=True))

        for column in NEGATIVE_CHECK_COLUMNS:
            if column in frame.columns:
                negative_counts[column] += int((numeric_series(frame[column]) < 0).sum())

    inferred_types = {
        column: infer_type(pd.Series(sample_values[column], dtype="object"))
        for column in columns
    }
    null_percentages = {
        column: round((null_counts[column] / row_count) * 100, 4) if row_count else 0
        for column in columns
    }
    missing_required = [column for column in REQUIRED_COLUMNS if column not in columns]

    report = {
        "dataset": str(PARQUET_FILE.relative_to(ROOT)),
        "row_count": row_count,
        "column_count": len(columns),
        "columns": columns,
        "required_columns": REQUIRED_COLUMNS,
        "missing_required_columns": missing_required,
        "null_percentages": null_percentages,
        "inferred_types": inferred_types,
        "unique_tipmov": sorted(unique_values["tipmov"]),
        "unique_moves": sorted(unique_values["moves"]),
        "date_ranges": date_ranges,
        "total_cant": sums["cant"],
        "total_impmov": sums["impmov"],
        "negative_prices": negative_counts["prec"],
        "negative_quantities": negative_counts["cant"],
        "anomalous_dates": anomalous_dates,
    }

    OUTPUT_FILE.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Validación generada: {OUTPUT_FILE.relative_to(ROOT)}")
    print(f"Filas: {row_count}")
    print(f"Columnas: {len(columns)}")
    print(f"Columnas obligatorias faltantes: {missing_required or 'ninguna'}")
    print(f"tipmov únicos: {len(unique_values['tipmov'])}")
    print(f"moves únicos: {len(unique_values['moves'])}")
    print(f"Suma cant: {sums['cant']}")
    print(f"Suma impmov: {sums['impmov']}")
    print(f"Precios negativos: {negative_counts['prec']}")
    print(f"Cantidad negativas: {negative_counts['cant']}")


if __name__ == "__main__":
    main()
