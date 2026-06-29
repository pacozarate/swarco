export function calculateLedPanel({ moduleCode, widthMm, heightMm, consumptionFactor, faAdjustment = 0 }, tables) {
  const module = tables.ct_led.find((row) => row.code === moduleCode);
  const dv = tables.alartdv.find((row) => row.code === moduleCode) || {};
  const moduleResolution = parsePair(dv.dva18, "x", { x: module?.moduleColumns, y: module?.moduleRows });
  const pitch = parsePair(dv.dva19, ":", { x: module?.pitchX, y: module?.pitchY });
  const currentModule = Number(dv.dva20) || Number(module?.currentModule) || 0;
  const colsPanel = pitch.x ? Math.ceil(widthMm / pitch.x) : 0;
  const rowsPanel = pitch.y ? Math.ceil(heightMm / pitch.y) : 0;
  const moduleColumns = moduleResolution.x ? Math.ceil(colsPanel / moduleResolution.x) : 0;
  const moduleRows = moduleResolution.y ? Math.ceil(rowsPanel / moduleResolution.y) : 0;
  const moduleCount = moduleColumns * moduleRows;
  const panelCurrent = currentModule * moduleCount * consumptionFactor;
  const faCurrent = Number(module?.faCurrent) || 0;
  const faCount = faCurrent ? Math.max(0, Math.ceil(panelCurrent / faCurrent) + Number(faAdjustment || 0)) : 0;
  const availableCurrent = faCount * faCurrent;
  const voltage = Number(module?.faVoltage) || 5;
  const watts = panelCurrent * voltage / 0.9;

  return {
    module,
    technical: {
      color: dv.dva17 || module?.color || "",
      moduleResolution: dv.dva18 || `${moduleResolution.x}x${moduleResolution.y}`,
      pitch: dv.dva19 || `${pitch.x}:${pitch.y}`,
      currentModule
    },
    resolution: `${colsPanel}x${rowsPanel}`,
    moduleColumns,
    moduleRows,
    moduleCount,
    panelCurrent,
    faCount,
    availableCurrent,
    watts,
    dataCableCount: moduleCount,
    powerCableCount: moduleCount,
    warnings: module ? [] : ["Modulo LED no encontrado en ct_LED"]
  };
}

function parsePair(value, separator, fallback = {}) {
  const [x, y] = String(value || "").split(separator).map((item) => Number(item.replace(",", ".")));
  return {
    x: Number.isFinite(x) ? x : Number(fallback.x) || 0,
    y: Number.isFinite(y) ? y : Number(fallback.y) || 0
  };
}
