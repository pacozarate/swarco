export function downloadJson(name, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(name, rows) {
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(";"), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadXlsx(name, sheets) {
  const xlsx = window.XLSX;
  if (!xlsx) throw new Error("La libreria XLSX no esta cargada.");
  const workbook = xlsx.utils.book_new();
  sheets.forEach((sheet, index) => {
    const rows = sheet.rows?.length ? sheet.rows : [["Sin datos"]];
    const worksheet = xlsx.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = inferColumnWidths(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName(sheet.name || `Hoja ${index + 1}`));
  });
  xlsx.writeFile(workbook, name);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function inferColumnWidths(rows) {
  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = rows.reduce((max, row) => Math.max(max, String(row[columnIndex] ?? "").length), 8);
    return { wch: Math.min(42, Math.max(10, maxLength + 2)) };
  });
}

function sheetName(name) {
  return String(name)
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31)
    .trim() || "Hoja";
}
