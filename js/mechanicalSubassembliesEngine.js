import { explodeBom } from "./bomExplosionEngine.js?v=20260716-v4-1-31";

const materialDensities = {
  GALVA: 7850,
  ALU: 2700,
  INOX: 8000
};

const defaultReferenceThicknessMm = 2;

export function getMechanicalSubassemblies({ modelRows, configuration, tables, dimensions = {}, material = "GALVA", referenceDimensions = {} }) {
  const roots = selectedConfigurationRoots(modelRows, configuration);
  const selectedRootSet = new Set(roots);
  const cplismatRows = uniqueBomRows(tables.cplismat || []);
  const articleData = new Map((tables.alartdv || []).map((row) => [row.code, row]));
  const descriptions = buildDescriptionMap(tables);
  const exploded = explodeBom({ roots, cplismatRows, maxLevel: 6 });
  const mechanicalRows = exploded.filter((row) => {
    const article = articleData.get(row.article);
    return !belongsToNestedSelectedRoot(row, selectedRootSet) && isMetalMechanical(row.article, article);
  });
  const rows = consolidateMechanicalRows(mechanicalRows, articleData, descriptions, {
    dimensions,
    material,
    referenceDimensions
  });
  return {
    rows,
    totalWeightKg: roundWeight(rows.reduce((total, row) => total + (Number(row.weightKg) || 0) * Number(row.quantity || 0), 0))
  };
}

function selectedConfigurationRoots(modelRows, configuration) {
  const roots = [];
  Object.entries(configuration || {}).forEach(([group, value]) => {
    const codes = Array.isArray(value) ? value : [value];
    codes.filter(Boolean).forEach((code) => {
      const row = modelRows.find((option) => String(option.group).toUpperCase() === String(group).toUpperCase() && option.code === code);
      if (row?.root || row?.code) roots.push(row.root || row.code);
    });
  });
  return [...new Set(roots)];
}

function uniqueBomRows(rows) {
  return [...new Map(rows.map((row) => [`${row.codsup}|${row.codele}|${row.cannec}`, row])).values()];
}

function buildDescriptionMap(tables) {
  const descriptions = new Map();
  [...(tables.alart || []), ...(tables.gcesp || [])].forEach((row) => {
    if (row.code && row.description) descriptions.set(row.code, row.description);
  });
  return descriptions;
}

function belongsToNestedSelectedRoot(row, selectedRootSet) {
  for (let index = 1; index <= 5; index += 1) {
    const pathCode = row[`p${index}`];
    if (pathCode && pathCode !== row.root && pathCode !== row.article && selectedRootSet.has(pathCode)) return true;
  }
  return false;
}

function isMetalMechanical(code, row) {
  const upperCode = String(code || "").toUpperCase();
  const isMetalCode = /AM\d+/.test(upperCode);
  const isMechanicalFamily = String(row?.dva17 || "").trim().toUpperCase() === "MEC";
  const hasWeight = parseDecimal(row?.dva18) !== "";
  return isMetalCode && isMechanicalFamily && hasWeight;
}

function consolidateMechanicalRows(rows, articleData, descriptions, calculationContext) {
  const grouped = new Map();
  rows.forEach((row) => {
    const article = articleData.get(row.article);
    const baseWeightKg = parseDecimal(article?.dva18);
    const dimensionVariable = String(article?.dva19 || "").trim().toUpperCase() === "M";
    const weightKg = dimensionVariable
      ? recalculateVariableWeight(baseWeightKg, calculationContext)
      : baseWeightKg;
    const key = `${row.root}|${row.parent}|${row.article}`;
    const current = grouped.get(key) || {
      root: row.root,
      parent: row.parent,
      code: row.article,
      quantity: 0,
      description: descriptions.get(row.article) || "",
      family: article?.dva17 || "",
      baseWeightKg,
      weightKg,
      dimensionVariable,
      routeIds: []
    };
    current.quantity += Number(row.quantity || 0);
    current.routeIds.push(row.routeId);
    grouped.set(key, current);
  });
  return [...grouped.values()].sort((a, b) => naturalCompare(a.root, b.root) || naturalCompare(a.code, b.code));
}

function parseDecimal(value) {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : "";
}

function recalculateVariableWeight(baseWeightKg, { dimensions = {}, material = "GALVA", referenceDimensions = {} }) {
  if (baseWeightKg === "") return "";
  const currentArea = sheetArea(dimensions);
  const referenceArea = sheetArea(referenceDimensions) || currentArea;
  const areaFactor = referenceArea ? currentArea / referenceArea : 1;
  const currentThickness = Number(dimensions.sheetThicknessMm) || defaultReferenceThicknessMm;
  const referenceThickness = Number(referenceDimensions.sheetThicknessMm) || defaultReferenceThicknessMm;
  const thicknessFactor = referenceThickness ? currentThickness / referenceThickness : 1;
  const densityFactor = materialDensity(material) / materialDensity(referenceDimensions.material || "GALVA");
  return roundToTwo(baseWeightKg * areaFactor * thicknessFactor * densityFactor);
}

function sheetArea(dimensions = {}) {
  const outerArea = area(
    dimensions.weightMechanicalWidthMm || dimensions.mechanicalWidthMm,
    dimensions.weightMechanicalHeightMm || dimensions.mechanicalHeightMm
  );
  const visibleArea = area(dimensions.visibleWidthMm, dimensions.visibleHeightMm);
  const clockHoleArea = circleArea(dimensions.clockHoleDiameterMm);
  const netArea = outerArea - visibleArea - clockHoleArea;
  return netArea > 0 ? netArea : outerArea;
}

function area(width, height) {
  return (Number(width) || 0) * (Number(height) || 0);
}

function circleArea(diameter) {
  const radius = (Number(diameter) || 0) / 2;
  return radius > 0 ? Math.PI * radius * radius : 0;
}

function materialDensity(material) {
  return materialDensities[String(material || "").toUpperCase()] || materialDensities.GALVA;
}

function naturalCompare(left, right) {
  return String(left || "").localeCompare(String(right || ""), "es", { numeric: true, sensitivity: "base" });
}

function roundWeight(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function roundToTwo(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
