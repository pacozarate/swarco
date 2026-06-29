const bomTables = new Set(["trl", "cplismat", "ct_led", "ct_tft", "alartdv"]);
const priceTables = new Set(["gcesp", "alhis", "alart"]);

export function detectChange(tableName, previousVersion, nextVersion) {
  if (!previousVersion) {
    return { status: "Carga inicial", recommendation: "Validar tablas" };
  }
  if (previousVersion.checksum === nextVersion.checksum) {
    return { status: "Sin cambios criticos", recommendation: "Sin accion" };
  }
  if (bomTables.has(tableName)) {
    return { status: "Cambios estructurales o tecnicos", recommendation: "Actualizar BOM recomendado" };
  }
  if (priceTables.has(tableName)) {
    return { status: "Cambios de precio", recommendation: "Actualizar precios recomendado" };
  }
  if (tableName === "mecanica") {
    return { status: "Cambios de mecanica", recommendation: "Actualizar coste de mecanica recomendado" };
  }
  return { status: "Cambios detectados", recommendation: "Revisar" };
}
