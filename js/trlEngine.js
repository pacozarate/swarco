export function getModels(trlRows) {
  const baseRows = trlRows.filter((row) => String(row.group).toUpperCase() === "0");
  return baseRows.map((row) => ({
    model: row.model || row.code,
    code: row.code,
    description: row.description || row.code,
    technology: String(row.type || "").toUpperCase(),
    image: row.image,
    root: row.root || row.code
  }));
}

export function getModelTrl(trlRows, model) {
  return trlRows.filter((row) => (row.model || row.code) === model);
}

export function getAllModelRoots(trlRows) {
  return trlRows
    .filter((row) => String(row.group).toUpperCase() === "0")
    .map((row) => row.root || row.code || row.model)
    .filter(Boolean);
}

export function getOptionsByGroup(trlRows) {
  return trlRows.reduce((groups, row) => {
    const group = String(row.group || "").toUpperCase();
    if (!groups[group]) groups[group] = [];
    groups[group].push(row);
    return groups;
  }, {});
}

export function getDefaultConfiguration(modelRows) {
  const groups = getOptionsByGroup(modelRows);
  const selected = {};
  Object.entries(groups).forEach(([group, rows]) => {
    if (group === "0") return;
    if (group === "6") {
      selected[group] = rows.filter((row) => truthy(row.default)).map((row) => row.code);
      return;
    }
    const defaultRow = rows.find((row) => truthy(row.default)) || rows[0];
    selected[group] = defaultRow?.code || "";
  });
  return selected;
}

export function selectedRoots(modelRows, configuration) {
  const rootRows = [];
  const base = modelRows.find((row) => String(row.group).toUpperCase() === "0");
  if (base) rootRows.push(base);
  Object.entries(configuration).forEach(([group, value]) => {
    const codes = Array.isArray(value) ? value : [value];
    codes.filter(Boolean).forEach((code) => {
      const row = modelRows.find((option) => String(option.group).toUpperCase() === group && option.code === code);
      if (row) rootRows.push(row);
    });
  });
  return rootRows.map((row) => row.root || row.code).filter(Boolean);
}

function truthy(value) {
  return ["1", "true", "si", "yes", "x"].includes(String(value).trim().toLowerCase());
}
