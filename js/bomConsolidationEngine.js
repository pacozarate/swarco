export function consolidateBom(explodedRows, tables) {
  const byArticle = new Map();
  explodedRows.forEach((row) => {
    const current = byArticle.get(row.article) || {
      article: row.article,
      totalQuantity: 0,
      routesCount: 0,
      routeIds: new Set()
    };
    current.totalQuantity += Number(row.quantity) || 0;
    current.routesCount += 1;
    current.routeIds.add(row.routeId);
    byArticle.set(row.article, current);
  });
  return [...byArticle.values()].map((row) => {
    const article = tables.alart.find((item) => item.code === row.article);
    return {
      article: row.article,
      description: article?.description || "",
      totalQuantity: row.totalQuantity,
      routesCount: row.routeIds.size,
      type: article?.type || "",
      unitCost: 0,
      totalCost: 0,
      costSource: "",
      missingPrice: false
    };
  });
}
