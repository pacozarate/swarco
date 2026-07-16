import { buildFormulaContext, evaluateFormula, mergeFormulas } from "./formulaEngine.js?v=20260716-v4-1-30";

export function calculateMechanics(input, tables) {
  const rule = tables.mecanica.find((row) => row.model === input.model && String(row.technology).toUpperCase() === input.technology)
    || tables.mecanica.find((row) => String(row.technology).toUpperCase() === input.technology);
  const area = (Number(input.widthMm) || 0) * (Number(input.heightMm) || 0);
  const material = String(input.material || "").toUpperCase();
  const formulas = mergeFormulas(input.formulas);
  const context = buildFormulaContext(input, rule);
  const fallbackWeight = ((context.areaMm2 * context.sheetThicknessMm * context.densityKgMm3) * context.reinforcementFactor) + context.clockWeightKg + context.protectionWeightKg;
  const weightResult = evaluateFormula(formulas.mechanicalWeightKg.expression, context, fallbackWeight);
  const mechanicalWeightKg = roundWeight(weightResult.value);
  const base = context.basePrice;
  const variable = context.areaMm2 * context.pricePerMm2;
  const clock = context.clockPrice;
  const protection = context.protectionPrice;
  const fallbackPrice = base + variable + clock + protection + context.setupPrice;
  const priceResult = evaluateFormula(formulas.mechanicalPrice.expression, context, fallbackPrice);
  const mechanicalPrice = priceResult.value;
  return {
    mechanicalPrice,
    mechanicalWeightKg,
    material: material || "N/D",
    formulaContext: context,
    formulaResults: {
      mechanicalWeightKg: { expression: formulas.mechanicalWeightKg.expression, error: weightResult.error },
      mechanicalPrice: { expression: formulas.mechanicalPrice.expression, error: priceResult.error }
    },
    source: rule ? "mecanica" : "estimacion sin tabla",
    version: rule?.version || "demo",
    breakdown: [
      { concept: "Base mecanica", amount: base },
      { concept: "Superficie", amount: variable },
      { concept: "Peso mecanica calculado", amount: mechanicalWeightKg },
      { concept: "Reloj", amount: clock },
      { concept: "Proteccion", amount: protection }
    ],
    warnings: rule ? [] : ["No hay regla de mecanica especifica para el modelo"]
  };
}

function roundWeight(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}
