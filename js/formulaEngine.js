export const defaultFormulas = {
  mechanicalWeightKg: {
    label: "Peso mecanica calculado",
    unit: "kg",
    category: "Mecanica",
    description: "Peso estimado a partir de superficie, espesor, densidad, refuerzos, reloj y proteccion.",
    expression: "round(((areaMm2 * sheetThicknessMm * densityKgMm3) * reinforcementFactor) + clockWeightKg + protectionWeightKg, 1)"
  },
  mechanicalPrice: {
    label: "Coste mecanico",
    unit: "EUR",
    category: "Mecanica",
    description: "Coste mecanico inicial con base, superficie, reloj, proteccion y setup.",
    expression: "basePrice + (areaMm2 * pricePerMm2) + clockPrice + protectionPrice + setupPrice"
  }
};

export function mergeFormulas(saved = {}) {
  return Object.fromEntries(Object.entries(defaultFormulas).map(([key, formula]) => [
    key,
    { ...formula, ...(saved[key] || {}), expression: saved[key]?.expression || formula.expression }
  ]));
}

export function evaluateFormula(expression, variables, fallback = 0) {
  const allowedNames = {
    ...variables,
    ceil: Math.ceil,
    floor: Math.floor,
    round: roundTo,
    min: Math.min,
    max: Math.max,
    abs: Math.abs
  };
  if (!isSafeExpression(expression, Object.keys(allowedNames))) {
    return { value: fallback, error: "Formula no permitida" };
  }
  try {
    const names = Object.keys(allowedNames);
    const values = Object.values(allowedNames);
    const evaluator = new Function(...names, `"use strict"; return (${expression});`);
    const value = Number(evaluator(...values));
    return Number.isFinite(value)
      ? { value, error: "" }
      : { value: fallback, error: "Resultado no numerico" };
  } catch (error) {
    return { value: fallback, error: error.message };
  }
}

export function buildFormulaContext(input, rule) {
  const material = String(input.material || "").toUpperCase();
  const areaMm2 = (Number(input.widthMm) || 0) * (Number(input.heightMm) || 0);
  const densityKgMm3 = material.includes("ALU") ? 0.0000027 : 0.00000785;
  const sheetThicknessMm = Number(input.sheetThicknessMm) || (material.includes("ALU") ? 3 : 2);
  const reinforcementFactor = input.technology === "LED" ? 1.28 : 1.18;
  const clockWeightKg = input.hasClock ? 1.5 : 0;
  const protectionWeightKg = input.protectionType ? 0.8 : 0;
  const basePrice = Number(rule?.basePrice) || 0;
  const pricePerMm2 = Number(rule?.pricePerMm2) || 0;
  const clockPrice = input.hasClock ? 85 : 0;
  const protectionPrice = input.protectionType ? 45 : 0;
  const setupPrice = Number(rule?.setup) || 0;
  return {
    widthMm: Number(input.widthMm) || 0,
    heightMm: Number(input.heightMm) || 0,
    areaMm2,
    densityKgMm3,
    sheetThicknessMm,
    reinforcementFactor,
    clockWeightKg,
    protectionWeightKg,
    basePrice,
    pricePerMm2,
    clockPrice,
    protectionPrice,
    setupPrice
  };
}

export function formulaContextRows(context) {
  return Object.entries(context).map(([name, value]) => ({ name, value }));
}

function roundTo(value, decimals = 0) {
  const factor = 10 ** Number(decimals || 0);
  return Math.round(Number(value || 0) * factor) / factor;
}

function isSafeExpression(expression, allowedNames) {
  const text = String(expression || "");
  if (!text || text.length > 500) return false;
  if (/[^-+*/%().,\s\w]/.test(text)) return false;
  if (/\b(?:new|this|window|document|globalThis|Function|eval|constructor|prototype|localStorage|fetch|import)\b/.test(text)) return false;
  const identifiers = text.match(/\b[A-Za-z_]\w*\b/g) || [];
  return identifiers.every((identifier) => allowedNames.includes(identifier));
}
