import { normalizeRows } from "./normalizers.js?v=20260716-v4-1-14";
import { makeVersion } from "./versioningEngine.js?v=20260716-v4-1-14";

export const tableDefinitions = [
  { key: "alart", label: "ALART" },
  { key: "alhis", label: "ALHIS" },
  { key: "gcesp", label: "GCESP" },
  { key: "alartdv", label: "ALARTDV" },
  { key: "cplismat", label: "CPLISMAT" },
  { key: "ct_tft", label: "ct_TFT" },
  { key: "ct_led", label: "ct_LED" },
  { key: "mecanica", label: "mecanica" },
  { key: "dimensiones_base", label: "DimensionesBase" },
  { key: "trl", label: "PNxxxy-TRL" }
];

export async function readWorkbookFile(file, tableKey, uploadedBy) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const rows = workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    return sheetToRows(sheet);
  });
  const normalized = normalizeRows(tableKey === "trl" ? "trl" : tableKey, rows);
  return {
    rows: normalized,
    version: await makeVersion(tableKey, file.name, normalized, uploadedBy)
  };
}

export async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

function sheetToRows(sheet) {
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerIndex = findHeaderIndex(matrix);
  if (headerIndex < 0) return [];
  const headers = uniqueHeaders(matrix[headerIndex].map((value, index) => String(value || `col_${index + 1}`).trim()));
  return matrix.slice(headerIndex + 1)
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function uniqueHeaders(headers) {
  const seen = new Map();
  return headers.map((header) => {
    const count = seen.get(header) || 0;
    seen.set(header, count + 1);
    return count ? `${header}_${count}` : header;
  });
}

function findHeaderIndex(matrix) {
  const candidates = [
    "codart", "codigo", "código", "referencia swarco", "raiz", "codsup", "codele", "cod swarco fa"
  ];
  let best = { index: -1, score: 0 };
  matrix.slice(0, 20).forEach((row, index) => {
    const normalized = row.map((value) => String(value || "").trim().toLowerCase());
    const score = candidates.filter((candidate) => normalized.includes(candidate)).length
      + normalized.filter((value) => value !== "").length / 100;
    if (score > best.score) best = { index, score };
  });
  return best.score >= 1 ? best.index : -1;
}
