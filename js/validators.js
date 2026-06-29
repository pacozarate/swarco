export function validateTables(tables) {
  const issues = [];
  const articles = new Set(tables.alart.map((row) => row.code));
  const bomParents = new Set(tables.cplismat.map((row) => row.codsup));
  tables.trl.forEach((row) => {
    if (row.code && !articles.has(row.code)) issues.push(issue("ARTICLE_NOT_FOUND_IN_ALART", row.code, "Codigo TRL no existe en ALART"));
  });
  tables.cplismat.forEach((row) => {
    if (!articles.has(row.codsup)) issues.push(issue("ARTICLE_NOT_FOUND_IN_ALART", row.codsup, "Padre CPLISMAT no existe en ALART"));
    if (!articles.has(row.codele)) issues.push(issue("ARTICLE_NOT_FOUND_IN_ALART", row.codele, "Hijo CPLISMAT no existe en ALART"));
    if (!Number.isFinite(Number(row.cannec)) || Number(row.cannec) <= 0) issues.push(issue("INVALID_QUANTITY", row.codele, "Cantidad cannec invalida"));
  });
  tables.alart.forEach((row) => {
    const type = String(row.type).toLowerCase();
    if (type.includes("fabric") && !bomParents.has(row.code)) issues.push(issue("MANUFACTURING_ARTICLE_WITHOUT_BOM", row.code, "Articulo de fabricacion sin BOM"));
    if (type.includes("compra") && bomParents.has(row.code)) issues.push(issue("PURCHASE_ARTICLE_WITH_CHILDREN", row.code, "Articulo de compra con hijos"));
  });
  tables.ct_tft.forEach((row) => {
    if (!tables.alartdv.some((dv) => dv.code === row.code)) issues.push(issue("MISSING_TECHNICAL_DATA", row.code, "TFT sin datos ALARTDV"));
  });
  tables.ct_led.forEach((row) => {
    const dv = tables.alartdv.find((item) => item.code === row.code);
    if (!dv) issues.push(issue("MISSING_TECHNICAL_DATA", row.code, "Modulo LED sin datos ALARTDV"));
    if (dv && !/^\d+(\.\d+)?:\d+(\.\d+)?$/.test(String(dv.dva19))) issues.push(issue("INVALID_FORMAT", row.code, "Paso LED debe tener formato X:Y"));
    if (dv && !/^\d+x\d+$/i.test(String(dv.dva18))) issues.push(issue("INVALID_FORMAT", row.code, "Resolucion modulo debe tener formato 24x32"));
  });
  return issues;
}

function issue(code, article, message) {
  return { code, article, message };
}
