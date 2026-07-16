from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable

from openpyxl import load_workbook


SOURCE_DIR = Path(
    "/Users/nuesopz/Documents/Descargas ICloud/PR23-0023_NG_LACROIX SERVICIO CALCULADORA COSTES 2023/"
    "03-CALCULO MECANICA/01-CALC_LACROIX/DATOS_A_IMPORTAR"
)
ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    (ROOT / "data/trl").mkdir(parents=True, exist_ok=True)
    alart_rows = import_alart()
    write_json(ROOT / "data/alart.json", alart_rows)
    write_json(ROOT / "data/alartdv.json", import_alartdv())
    write_json(ROOT / "data/cplismat.json", import_cplismat(alart_rows))
    write_json(ROOT / "data/gcesp.json", import_gcesp())
    write_json(ROOT / "data/alhis.json", import_alhis_latest())
    write_json(ROOT / "data/ct_tft.json", import_ct_tft())
    write_json(ROOT / "data/ct_led.json", import_ct_led())
    write_json(ROOT / "data/trl/pn-demo-trl.json", import_trl())


def import_alart() -> list[dict[str, Any]]:
    rows = sheet_dicts(SOURCE_DIR / "Alart.xlsx", "alart")
    return [
        {
            "code": code(row.get("codart")),
            "description": text(row.get("descri1")),
            "pmp": number(row.get("pmedpon")),
            "type": text(row.get("tipart") or row.get("tigte")),
        }
        for row in rows
        if text(row.get("codart"))
    ]


def import_alartdv() -> list[dict[str, Any]]:
    rows = sheet_dicts(SOURCE_DIR / "Alart.xlsx", "dat.alfa.num")
    return [
        {
            "code": code(row.get("codart")),
            "dva17": value(row.get("dva17")),
            "dva18": value(row.get("dva18")),
            "dva19": value(row.get("dva19")),
            "dva20": value(row.get("dva20")),
            "dva37": value(row.get("dva37")),
            "dva38": value(row.get("dva38")),
        }
        for row in rows
        if text(row.get("codart"))
    ]


def import_cplismat(alart_rows: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    rows = sheet_dicts(source_file("dbo_cplismat.xlsx", "DBO_CPLISMAT.xlsx"), "cplismat")
    tipart_by_code = {row["code"]: row.get("type", "") for row in (alart_rows or import_alart())}
    today = date.today()
    output = []
    for row in rows:
        parent = code(row.get("codsup"))
        child = code(row.get("codele"))
        quantity = row.get("cannec")
        valid_to = date_only(row.get("fecfin"))
        if not parent or not child or quantity is None or quantity == "" or valid_to is None or valid_to < today:
            continue
        output.append({
            "codsup": parent,
            "codele": child,
            "cannec": number(quantity),
            "fecfin": valid_to.isoformat(),
            "tipart": tipart_by_code.get(child, ""),
        })
    return output


def source_file(*names: str) -> Path:
    for name in names:
        path = SOURCE_DIR / name
        if path.exists():
            return path
    return SOURCE_DIR / names[0]


def date_only(item: Any) -> date | None:
    if isinstance(item, datetime):
        return item.date()
    if isinstance(item, date):
        return item
    parsed = date_value(item)
    if not parsed:
        return None
    try:
        return date.fromisoformat(parsed[:10])
    except ValueError:
        return None


def import_gcesp() -> list[dict[str, Any]]:
    rows = sheet_dicts(SOURCE_DIR / "dbo_gcesp.xlsx", "gcesp")
    return [
        {
            "code": code(row.get("codart")),
            "description": text(row.get("des")),
            "price": number(row.get("pre")),
            "validFrom": date_value(row.get("fvdesde") or row.get("fecact")),
            "validTo": date_value(row.get("fvhasta")),
            "batch": value(row.get("lote")),
        }
        for row in rows
        if text(row.get("codart"))
    ]


def import_alhis_latest() -> list[dict[str, Any]]:
    latest: dict[str, dict[str, Any]] = {}
    for row in sheet_dicts(SOURCE_DIR / "dbo_alhis.xlsx", "dbo_alhis"):
        article_code = code(row.get("codart"))
        if not article_code:
            continue
        real_cost = number(row.get("premedpon") or row.get("pmedpon") or row.get("prec"))
        if real_cost <= 0:
            continue
        current_date = row.get("fecmov") or row.get("fecintro")
        previous = latest.get(article_code)
        if previous is None or comparable_date(current_date) >= comparable_date(previous.get("_rawDate")):
            latest[article_code] = {
                "code": article_code,
                "realCost": real_cost,
                "date": date_value(current_date),
                "_rawDate": current_date,
            }
    return [{k: v for k, v in row.items() if k != "_rawDate"} for row in latest.values()]


def import_ct_tft() -> list[dict[str, Any]]:
    rows = sheet_dicts(SOURCE_DIR / "Calculation Tool TFTS.xlsx", "CTOOLTFTS", header_row=2)
    return [
        {
            "code": code(row.get("Referencia SWARCO")),
            "description": " ".join(part for part in [text(row.get("Fabricante")), text(row.get("Referencia Fab"))] if part),
            "active": True,
            "manufacturer": text(row.get("Fabricante")),
            "inches": text(row.get("Tamaño")).replace("''", ""),
            "format": text(row.get("Aspect ratio")),
            "brightness": text(row.get("Luminosidad")),
            "resolution": text(row.get("Resolución")),
            "tempRange": text(row.get("Rango Temp.")),
            "visibleArea": text(row.get("Tamaño área activa")),
            "outerSize": text(row.get("Tamaño_1")),
        }
        for row in rows
        if text(row.get("Referencia SWARCO"))
    ]


def import_ct_led() -> list[dict[str, Any]]:
    rows = sheet_dicts(SOURCE_DIR / "Calculation Tool LEDS.xlsx", "CTToolLEDS", header_row=2)
    return [
        {
            "code": code(row.get("Referencia SWARCO")),
            "description": text(row.get("col_3")),
            "color": text(row.get("Color de LED")),
            "moduleColumns": number(row.get("Resolución de módulo en x")),
            "moduleRows": number(row.get("Resolución de módulo en y")),
            "pitchX": number(row.get("Paso en x")),
            "pitchY": number(row.get("Paso en y")),
            "currentModule": number(row.get("A total")),
            "faCode": code(row.get("Cod SWARCO FA")),
            "faVoltage": number(row.get("Vdc (V)")),
            "faCurrent": number(row.get("Adc (A)")),
            "dataCableCode": code(row.get("Cable datos (50mm)")),
            "powerCableCode": code(row.get("Conector alimentación")),
        }
        for row in rows
        if text(row.get("Referencia SWARCO"))
    ]


def import_trl() -> list[dict[str, Any]]:
    source = SOURCE_DIR / "Calculation Tool Model List - TRL.xlsx"
    rows = sheet_dicts(source, "Model List")
    return [
        {
            "model": code(row.get("RAIZ")),
            "group": value(row.get("GRUPO")),
            "groupLabel": text(row.get("GRUPO HERRAMIENT")),
            "type": text(row.get("TIPO")),
            "code": code(row.get("CÓDIGO")),
            "description": text(row.get("DESCRIPCIÓN HERRAMIENTA") or row.get("DESCRIPCIÓN")),
            "longDescription": text(row.get("DESCRIPCIÓN")),
            "material": text(row.get("MATERIAL")),
            "glass": text(row.get("VIDRIO")),
            "widthMm": number(row.get("Largo Total")),
            "heightMm": number(row.get("Alto Total")),
            "depthMm": number(row.get("Fondo Total")),
            "image": text(row.get("IMAGE")),
            "root": code(row.get("CÓDIGO")),
            "default": "1" if text(row.get("GRUPO")) == "0" else "",
        }
        for row in rows
        if text(row.get("RAIZ")) and text(row.get("CÓDIGO"))
    ]


def sheet_dicts(path: Path, sheet_name: str, header_row: int = 1) -> Iterable[dict[str, Any]]:
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet_name]
    header_values = next(ws.iter_rows(min_row=header_row, max_row=header_row, values_only=True))
    headers = unique_headers([text(item) or f"col_{index + 1}" for index, item in enumerate(header_values)])
    for row in ws.iter_rows(min_row=header_row + 1, values_only=True):
      if not any(cell not in (None, "") for cell in row):
          continue
      yield {headers[index]: cell for index, cell in enumerate(row[: len(headers)])}


def unique_headers(headers: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    output = []
    for header in headers:
        count = seen.get(header, 0)
        seen[header] = count + 1
        output.append(f"{header}_{count}" if count else header)
    return output


def write_json(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2, default=serialize), encoding="utf-8")
    print(f"{path.relative_to(ROOT)}: {len(rows)} rows")


def value(item: Any) -> Any:
    if isinstance(item, (datetime, date)):
        return item.isoformat()
    if item is None:
        return ""
    return item


def text(item: Any) -> str:
    if item is None:
        return ""
    if isinstance(item, float) and item.is_integer():
        return str(int(item))
    return str(item).strip()


def code(item: Any) -> str:
    return text(item).upper()


def number(item: Any) -> float:
    if item is None or item == "":
        return 0
    if isinstance(item, (int, float)):
        return item
    try:
        return float(str(item).replace(",", "."))
    except ValueError:
        return 0


def date_value(item: Any) -> str:
    if isinstance(item, (datetime, date)):
        return item.date().isoformat() if isinstance(item, datetime) else item.isoformat()
    return text(item)


def comparable_date(item: Any) -> str:
    return date_value(item) or "0001-01-01"


def serialize(item: Any) -> Any:
    if isinstance(item, (datetime, date)):
        return date_value(item)
    return item


if __name__ == "__main__":
    main()
