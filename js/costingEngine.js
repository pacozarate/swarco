export function calculateCosts(consolidatedRows, tables, mechanicsResult) {
  const rows = consolidatedRows.map((row) => {
    const cost = findCost(row.article, tables);
    return {
      ...row,
      unitCost: cost.unitCost,
      totalCost: cost.unitCost * row.totalQuantity,
      costSource: cost.source,
      missingPrice: cost.missingPrice
    };
  });
  rows.push({
    article: "MECANICA_CALCULADA",
    description: "Linea de coste mecanica calculada",
    totalQuantity: 1,
    routesCount: 1,
    type: "CALCULADO",
    unitCost: mechanicsResult.mechanicalPrice,
    totalCost: mechanicsResult.mechanicalPrice,
    costSource: mechanicsResult.source,
    missingPrice: false
  });
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.totalCost, 0),
    missingPrices: rows.filter((row) => row.missingPrice).length
  };
}

function findCost(article, tables) {
  const tariff = latestTariff(article, tables.gcesp);
  if (tariff) return { unitCost: tariff.price, source: "GCESP", missingPrice: false };
  const history = latestHistory(article, tables.alhis);
  if (history) return { unitCost: history.realCost, source: "ALHIS", missingPrice: false };
  const alart = tables.alart.find((row) => row.code === article);
  if (alart && Number(alart.pmp) > 0) return { unitCost: Number(alart.pmp), source: "ALART PMP", missingPrice: false };
  return { unitCost: 0, source: "Sin precio", missingPrice: true };
}

function latestTariff(article, rows) {
  return rows.filter((row) => row.code === article && Number(row.price) > 0).sort((a, b) => String(b.validFrom).localeCompare(String(a.validFrom)))[0];
}

function latestHistory(article, rows) {
  const row = rows
    .filter((item) => item.code === article && historyCost(item) > 0)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  return row ? { ...row, realCost: historyCost(row) } : undefined;
}

function historyCost(row) {
  return Number(row.realCost || row.averageCost || row.price || 0);
}
