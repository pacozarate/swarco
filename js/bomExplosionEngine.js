export function explodeBom({ roots, cplismatRows, maxLevel = 6 }) {
  const childrenByParent = cplismatRows.reduce((map, row) => {
    if (!map.has(row.codsup)) map.set(row.codsup, []);
    map.get(row.codsup).push(row);
    return map;
  }, new Map());
  const rows = [];
  let routeCounter = 0;

  roots.forEach((root) => {
    walk({
      root,
      parent: root,
      accumulated: 1,
      level: 0,
      path: [root],
      routeBase: `${root}-${++routeCounter}`
    });
  });

  function walk(context) {
    const children = childrenByParent.get(context.parent) || [];
    children.forEach((child, index) => {
      const quantity = context.accumulated * Number(child.cannec || 0);
      const path = [...context.path, child.codele];
      const warning = [];
      if (context.path.includes(child.codele)) warning.push("CYCLE_DETECTED");
      if (context.level + 1 >= maxLevel && (childrenByParent.get(child.codele) || []).length) warning.push("MAX_LEVEL_REACHED");
      rows.push(makeRow({
        root: context.root,
        parent: context.parent,
        article: child.codele,
        quantity,
        level: context.level + 1,
        path,
        routeId: `${context.routeBase}.${index + 1}`,
        warning: warning.join(", ")
      }));
      if (!warning.includes("CYCLE_DETECTED") && context.level + 1 < maxLevel) {
        walk({
          root: context.root,
          parent: child.codele,
          accumulated: quantity,
          level: context.level + 1,
          path,
          routeBase: `${context.routeBase}.${index + 1}`
        });
      }
    });
  }

  return rows;
}

function makeRow({ root, parent, article, quantity, level, path, routeId, warning }) {
  const row = { root, parent, article, quantity, level, routeId, warning };
  for (let index = 1; index <= 6; index += 1) {
    row[`p${index}`] = path[index] || "";
  }
  return row;
}
