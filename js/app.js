import { can, isNuesoRole, ROLES } from "./authEngine.js?v=20260806-v4-1-43";
import { loadTableData, readWorkbookFile } from "./importExcel.js?v=20260806-v4-1-43";
import { detectChange } from "./changeDetectionEngine.js?v=20260806-v4-1-43";
import { validateTables } from "./validators.js?v=20260806-v4-1-43";
import { getAllModelRoots, getDefaultConfiguration, getModelTrl, getModels, getOptionsByGroup, selectedRoots } from "./trlEngine.js?v=20260806-v4-1-43";
import { getTftDetails } from "./tftDataEngine.js?v=20260806-v4-1-43";
import { calculateLedPanel } from "./ledCalculationEngine.js?v=20260806-v4-1-43";
import { calculateMechanics } from "./mechanicsEngine.js?v=20260806-v4-1-43";
import { getMechanicalSubassemblies } from "./mechanicalSubassembliesEngine.js?v=20260806-v4-1-43";
import { explodeBom } from "./bomExplosionEngine.js?v=20260806-v4-1-43";
import { consolidateBom } from "./bomConsolidationEngine.js?v=20260806-v4-1-43";
import { calculateCosts } from "./costingEngine.js?v=20260806-v4-1-43";
import { defaultFormulas, formulaContextRows, mergeFormulas } from "./formulaEngine.js?v=20260806-v4-1-43";
import { downloadCsv, downloadJson } from "./exportResults.js?v=20260806-v4-1-43";
import { renderSidebar } from "./appRouter.js?v=20260806-v4-1-43";
import { bindHeader, renderHeader } from "../views/commonHeader.js?v=20260806-v4-1-43";
import { maintenanceView } from "../views/maintenanceView.js?v=20260806-v4-1-43";
import { modelSelectionView } from "../views/modelSelectionView.js?v=20260806-v4-1-43";
import { tftView } from "../views/tftView.js?v=20260806-v4-1-43";
import { ledView } from "../views/ledView.js?v=20260806-v4-1-43";
import { mechanicsView } from "../views/mechanicsView.js?v=20260806-v4-1-43";
import { bomView } from "../views/bomView.js?v=20260806-v4-1-43";
import { costingView } from "../views/costingView.js?v=20260806-v4-1-43";
import { formulasView } from "../views/formulasView.js?v=20260806-v4-1-43";

const app = document.querySelector("#app");
const appVersion = "4.1.43";
const appBuild = "20260806-v4-1-43";

app.innerHTML = `
  <section class="screen">
    <div class="panel">
      <div class="panel-header"><h2>Cargando configurador</h2></div>
      <div class="panel-body grid">
        <div class="notice">Leyendo tablas locales. Puede tardar unos segundos la primera vez.</div>
      </div>
    </div>
  </section>
`;

const state = {
  route: "config",
  role: "consulta",
  nuesoUnlocked: false,
  tables: {},
  versions: {},
  changes: {},
  issues: [],
  models: [],
  selectedModel: "",
  config: {
    options: {},
    tftCode: "",
    ledModuleCode: "",
    widthMm: 1280,
    heightMm: 720,
    consumptionFactor: 1,
    ledColor: "",
    ledCalcMode: "Automático",
    ledManualResolution: "110x41",
    ledPitch: "",
    auxiliaryQuantities: {},
    excAnnulledRefs: [],
    excReplacements: {},
    ledLines: 3,
    ledCharsPerLine: 16,
    ledCharacterFormat: "15x16",
    ledLegibilityDistance: 50,
    ledCharSpacing: 2,
    ledLineSpacing: 10,
    ledMatrices: 2,
    ledMatrixSpacing: 30,
    ledFaAdjustment: 0,
    ledCurrentAdjustmentPercent: 100,
    ledMechanicsMode: "Automático",
    ledManualWidthMm: 1080,
    ledManualHeightMm: 290,
    ledMaterial: "ALU",
    ledQuantity: 30,
    ledPriceMode: "Precio Fijo",
    ledMarginMode: "Sin Margen",
    ledSetup: "SET UP",
    tftSizeMode: "Pulgadas/inches",
    tftAspectRatio: "",
    tftBrightness: "",
    tftResolution: "",
    tftTempRange: "",
    tftManufacturer: "",
    tftMaterial: "GALVA",
    tftQuantity: 30,
    tftPriceMode: "Precio Fijo",
    tftMarginMode: "Sin Margen",
    tftSetup: "SET UP",
    tftSelectionMode: "Seleccionado",
    tftManualPrice: 0,
    tftSelectedPriceSource: "",
    tftSelectedPriceKey: "",
    tftSelectedPrice: 0,
    tftSelectedPriceCode: "",
    tftSelectedPriceLabel: "",
    mechanicalCostMode: "Calculado",
    mechanicalManualCost: 0,
    tftClockPosition: "",
    tftSizeInches: "",
    tftMechanicalWidthMm: 700,
    tftMechanicalHeightMm: 420,
    tftSheetThicknessMm: 2
  },
  bom: {
    status: "BOM_NO_GENERADA",
    version: "",
    generatedAt: "",
    generatedBy: "",
    sourceVersions: {},
    exploded: [],
    consolidated: []
  },
  bomTab: "exploded",
  tftTab: "mecanica",
  ledTab: "mecanica",
  costing: { rows: [], total: 0, missingPrices: 0 },
  formulas: mergeFormulas(),
  formulaEditorMessage: "",
  costApproved: false
};

const tableKeys = ["alart", "alhis", "gcesp", "alartdv", "cplismat", "ct_tft", "ct_led", "mecanica", "coste_mecanica", "dimensiones_base", "trl"];
const storageKey = "swarco-configurator-state-v7";
const nuesoAccessPassword = "NUESO2026";
const nuesoRoutes = ["maintenance", "model", "mechanics", "formulas", "bom", "costing"];
let focusTftManualPriceAfterRender = false;
const numericConfigLimits = {
  widthMm: { min: 1, max: 10000 },
  heightMm: { min: 1, max: 10000 },
  consumptionFactor: { min: 0, max: 2 },
  ledLines: { min: 1, max: 100 },
  ledCharsPerLine: { min: 1, max: 100 },
  ledLegibilityDistance: { min: 1, max: 1000 },
  ledCharSpacing: { min: 0, max: 100 },
  ledLineSpacing: { min: 0, max: 100 },
  ledMatrices: { min: 1, max: 1000 },
  ledMatrixSpacing: { min: 0, max: 1000 },
  ledFaAdjustment: { min: -100, max: 100 },
  ledCurrentAdjustmentPercent: { min: 1, max: 100 },
  ledManualWidthMm: { min: 1, max: 10000 },
  ledManualHeightMm: { min: 1, max: 10000 },
  ledQuantity: { min: 1, max: 9999 },
  tftQuantity: { min: 1, max: 9999 },
  tftManualPrice: { min: 0, max: 999999.99 },
  mechanicalManualCost: { min: 0, max: 999999.99 },
  auxiliaryQuantity: { min: 1, max: 10 },
  tftMechanicalWidthMm: { min: 1, max: 10000 },
  tftMechanicalHeightMm: { min: 1, max: 10000 },
  tftSheetThicknessMm: { min: 1, max: 5 }
};

init().catch((error) => {
  console.error("No se pudo iniciar el configurador", error);
  renderStartupError(error);
});

async function init() {
  state.tables = await loadTableData(tableKeys);
  restoreLocalState();
  state.models = getModels(state.tables.trl);
  if (!state.models.some((model) => model.model === state.selectedModel)) state.selectedModel = state.models[0]?.model || "";
  if (!state.config.options || !Object.keys(state.config.options).length) resetConfigurationForModel();
  render();
}

function renderStartupError(error) {
  app.innerHTML = `
    <section class="screen">
      <div class="panel">
        <div class="panel-header"><h2>No se pudo cargar el configurador</h2></div>
        <div class="panel-body grid">
          <div class="notice">Revise que ha abierto la aplicacion con start_beta.command y que la carpeta contiene data, js, views, css y vendor.</div>
          <div class="empty"><strong>Detalle:</strong> ${escapeHtml(error?.message || error || "Error desconocido")}</div>
          <div class="actions">
            <button class="button primary" id="clearLocalState">Borrar datos locales y recargar</button>
          </div>
        </div>
      </div>
    </section>
  `;
  document.querySelector("#clearLocalState")?.addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    window.location.reload();
  });
}

function deriveViewState() {
  const currentModel = state.models.find((model) => model.model === state.selectedModel) || state.models[0];
  const modelRows = getModelTrl(state.tables.trl, currentModel?.model);
  const groups = getOptionsByGroup(modelRows);
  const optionGroups = Object.entries(groups)
    .filter(([key]) => key && key !== "0" && (currentModel?.technology === "LED" || key !== "2L"))
    .map(([key, rows]) => ({ key, label: groupLabel(key), rows }));
  const tftDetails = getTftDetails(state.config.tftCode, state.tables);
  const filteredTfts = filterTfts(state.tables.ct_tft, state.config);
  const tftDimensions = getTftDimensions(state.config, tftDetails);
  const ledDimensions = getLedDimensions(state.config, state.tables);
  const ledCalculation = calculateLedPanel({
    moduleCode: state.config.ledModuleCode,
    widthMm: ledDimensions.widthMm,
    heightMm: ledDimensions.heightMm,
    consumptionFactor: Number(state.config.ledCurrentAdjustmentPercent || 100) / 100,
    faAdjustment: Number(state.config.ledFaAdjustment || 0)
  }, state.tables);
  const mechanics = calculateMechanics({
    model: currentModel?.model,
    technology: currentModel?.technology,
    widthMm: currentModel?.technology === "LED"
      ? (state.config.ledMechanicsMode === "Manual" ? Number(state.config.ledManualWidthMm) : Number(state.config.widthMm))
      : tftDimensions.mechanicalWidthMm,
    heightMm: currentModel?.technology === "LED"
      ? (state.config.ledMechanicsMode === "Manual" ? Number(state.config.ledManualHeightMm) : Number(state.config.heightMm))
      : tftDimensions.mechanicalHeightMm,
    sizeInches: tftDetails.inches,
    tftOuterSizeMm: tftDetails.outerSize,
    visibleAreaMm: tftDetails.visibleArea,
    hasClock: Boolean(state.config.options["1L"]),
    protectionType: state.config.options["3"],
    doorType: state.config.options["2"],
    material: currentModel?.technology === "LED" ? state.config.ledMaterial : state.config.tftMaterial,
    sheetThicknessMm: currentModel?.technology === "TFT" ? state.config.tftSheetThicknessMm : undefined,
    selectedMechanicalOptions: [],
    formulas: state.formulas
  }, state.tables);
  const mechanicalSubassemblies = getMechanicalSubassemblies({
    modelRows,
    configuration: state.config.options,
    tables: state.tables,
    dimensions: currentModel?.technology === "LED"
      ? {
          mechanicalWidthMm: state.config.ledMechanicsMode === "Manual" ? Number(state.config.ledManualWidthMm) : Number(state.config.widthMm),
          mechanicalHeightMm: state.config.ledMechanicsMode === "Manual" ? Number(state.config.ledManualHeightMm) : Number(state.config.heightMm),
          sheetThicknessMm: Number(state.config.tftSheetThicknessMm) || 2
        }
      : tftDimensions,
    material: currentModel?.technology === "LED" ? state.config.ledMaterial : state.config.tftMaterial,
    referenceDimensions: getReferenceDimensions(currentModel)
  });
  if (mechanicalSubassemblies.rows.length) {
    mechanics.mechanicalWeightKg = mechanicalSubassemblies.totalWeightKg;
    const weightLine = mechanics.breakdown.find((row) => row.concept === "Peso mecanica calculado");
    if (weightLine) weightLine.amount = mechanicalSubassemblies.totalWeightKg;
  }
  const calculatedFields = buildCalculatedFields({
    mechanics,
    ledCalculation,
    costing: state.costing,
    currentModel,
    formulaContext: mechanics.formulaContext
  });
  const isUnlockedNueso = state.nuesoUnlocked && isNuesoRole(state.role);
  return {
    ...state,
    currentModel,
    appVersion,
    appBuild,
    modelRows,
    optionGroups,
    tftDetails,
    filteredTfts,
    tftDimensions,
    ledDimensions,
    ledCalculation,
    mechanics,
    mechanicalSubassemblies,
    formulas: state.formulas,
    formulaContextRows: formulaContextRows(mechanics.formulaContext || {}),
    calculatedFields,
    tftTab: state.tftTab,
    ledTab: state.ledTab,
    formulaEditorMessage: state.formulaEditorMessage,
    roleLabel: ROLES[state.role]?.label || state.role,
    isNueso: isUnlockedNueso,
    canUpload: isUnlockedNueso && can(state.role, "TABLE_UPLOAD"),
    canUpdateBom: isUnlockedNueso && can(state.role, "BOM_RECALCULATE"),
    canApproveCost: isUnlockedNueso && can(state.role, "COST_APPROVE"),
    canEditFormulas: isUnlockedNueso && can(state.role, "FORMULA_EDIT")
  };
}

function render() {
  if (!isNuesoRole(state.role)) state.nuesoUnlocked = false;
  if (state.config.tftClockPosition === "INTEGRADO") state.config.tftClockPosition = "";
  if ((!state.nuesoUnlocked || !isNuesoRole(state.role)) && nuesoRoutes.includes(state.route)) state.route = "config";
  const viewState = deriveViewState();
  app.innerHTML = `
    ${renderHeader(viewState)}
    <div class="layout">
      ${renderSidebar(state.route, { isNueso: viewState.isNueso, role: state.role })}
      <main class="content">${renderRoute(viewState)}</main>
    </div>
  `;
  bindHeader({
    setRole: (role, control) => {
      if (isNuesoRole(role)) {
        const password = window.prompt("Introduzca clave NUESO para acceder como tecnico o administrador:");
        if (password !== nuesoAccessPassword) {
          window.alert("Clave incorrecta. Se mantiene el acceso de usuario normal.");
          state.role = "consulta";
          state.nuesoUnlocked = false;
          state.route = "config";
          if (control) control.value = state.role;
          persistLocalState();
          render();
          return;
        }
        state.nuesoUnlocked = true;
      } else {
        state.nuesoUnlocked = false;
        if (nuesoRoutes.includes(state.route)) state.route = "config";
      }
      state.role = role;
      persistLocalState();
      render();
    },
    exportTrace: () => downloadJson("trazabilidad-configurador-swarco.json", buildTrace(viewState))
  });
  bindEvents(viewState);
  focusPendingControl();
}

function renderRoute(viewState) {
  if (!viewState.isNueso && nuesoRoutes.includes(state.route)) return viewState.currentModel?.technology === "LED" ? ledView(viewState) : tftView(viewState);
  if (state.route === "maintenance") return maintenanceView(viewState);
  if (state.route === "model") return modelSelectionView(viewState);
  if (state.route === "config") return viewState.currentModel?.technology === "LED" ? ledView(viewState) : tftView(viewState);
  if (state.route === "mechanics") return mechanicsView(viewState);
  if (state.route === "formulas") return viewState.isNueso ? formulasView(viewState) : modelSelectionView(viewState);
  if (state.route === "bom") return bomView(viewState);
  if (state.route === "costing") return costingView(viewState);
  return modelSelectionView(viewState);
}

function bindEvents(viewState) {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextRoute = button.dataset.route;
      if ((!state.nuesoUnlocked || !isNuesoRole(state.role)) && nuesoRoutes.includes(nextRoute)) {
        state.route = "config";
        render();
        return;
      }
      state.route = nextRoute;
      render();
    });
  });
  document.querySelectorAll("[data-config-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tftTab = button.dataset.configTab || "mecanica";
      persistLocalState();
      render();
    });
  });
  document.querySelectorAll("[data-led-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ledTab = button.dataset.ledTab || "mecanica";
      persistLocalState();
      render();
    });
  });
  document.querySelector("#exportProductPdf")?.addEventListener("click", () => {
    exportProductSheetPdf();
  });
  document.querySelectorAll("[data-product-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      const stage = document.querySelector(".product-sheet-stage");
      if (!stage) return;
      const current = Number(stage.dataset.zoom || 1);
      const next = Math.min(1.4, Math.max(0.6, current + Number(button.dataset.productZoom || 0)));
      stage.dataset.zoom = String(next);
      stage.style.setProperty("--product-zoom", String(next));
      const label = document.querySelector("#productZoomValue");
      if (label) label.textContent = `${Math.round(next * 100)}%`;
    });
  });
  document.querySelector("#resetFormulas")?.addEventListener("click", () => {
    state.formulas = mergeFormulas(defaultFormulas);
    state.formulaEditorMessage = "Formulas restauradas";
    persistLocalState();
    render();
  });
  document.querySelector("#saveFormulas")?.addEventListener("click", () => {
    document.querySelectorAll("[data-formula-key]").forEach((textarea) => {
      const key = textarea.dataset.formulaKey;
      state.formulas[key] = { ...state.formulas[key], expression: textarea.value.trim() };
    });
    state.formulaEditorMessage = "Formulas aplicadas";
    markBomPending();
    persistLocalState();
    render();
  });
  document.querySelector("#modelSelect")?.addEventListener("change", (event) => {
    state.selectedModel = event.target.value;
    state.tftTab = "mecanica";
    state.ledTab = "mecanica";
    resetConfigurationForModel();
    markBomPending();
    persistLocalState();
    render();
  });
  document.querySelector("#validateTables")?.addEventListener("click", () => {
    state.issues = validateTables(state.tables);
    render();
  });
  document.querySelectorAll("[data-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const key = input.dataset.upload;
      const previous = state.versions[key];
      const imported = await readWorkbookFile(file, key, ROLES[state.role]?.label || state.role);
      state.tables[key] = imported.rows;
      state.versions[key] = imported.version;
      state.changes[key] = detectChange(key, previous, imported.version);
      if (state.changes[key].recommendation.includes("BOM")) markBomPending();
      state.models = getModels(state.tables.trl);
      if (!state.models.some((model) => model.model === state.selectedModel)) {
        state.selectedModel = state.models[0]?.model || "";
        resetConfigurationForModel();
      }
      persistLocalState();
      render();
    });
  });
  document.querySelector("#tftSelect")?.addEventListener("change", (event) => {
    state.config.tftCode = event.target.value;
    clearTftSelectedPrice();
    markBomPending();
    persistLocalState();
    render();
  });
  document.querySelector("#ledSelect")?.addEventListener("change", (event) => {
    state.config.ledModuleCode = event.target.value;
    markBomPending();
    persistLocalState();
    render();
  });
  document.querySelectorAll("[data-config]").forEach((control) => {
    control.addEventListener("input", handleConfigChange);
    control.addEventListener("change", handleConfigChange);
  });
  document.querySelectorAll("[data-tft-price-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const price = sanitizeNumericConfigValue("tftManualPrice", button.dataset.price);
      const label = button.dataset.label || "";
      if (!window.confirm(`Usar este precio TFT (${formatCurrency(price)}) de ${label}?`)) return;
      state.config.tftSelectionMode = "Seleccionado";
      state.config.tftSelectedPriceSource = button.dataset.source || "";
      state.config.tftSelectedPriceKey = button.dataset.key || "";
      state.config.tftSelectedPrice = price;
      state.config.tftSelectedPriceCode = button.dataset.code || "";
      state.config.tftSelectedPriceLabel = label;
      markBomPending();
      persistLocalState();
      render();
    });
  });
  document.querySelector("#confirmTftManualPrice")?.addEventListener("click", () => {
    const input = document.querySelector('[data-config="tftManualPrice"]');
    const price = sanitizeNumericConfigValue("tftManualPrice", input?.value ?? state.config.tftManualPrice);
    if (!window.confirm(`Usar este precio TFT manual (${formatCurrency(price)})?`)) return;
    state.config.tftSelectionMode = "Manual";
    state.config.tftManualPrice = price;
    clearTftSelectedPrice();
    markBomPending();
    persistLocalState();
    render();
  });
  document.querySelector("#confirmMechanicalManualCost")?.addEventListener("click", () => {
    const input = document.querySelector('[data-config="mechanicalManualCost"]');
    const price = sanitizeNumericConfigValue("mechanicalManualCost", input?.value ?? state.config.mechanicalManualCost);
    if (!window.confirm(`Usar este coste mecanico manual (${formatCurrency(price)})?`)) return;
    state.config.mechanicalCostMode = "Manual";
    state.config.mechanicalManualCost = price;
    markBomPending();
    persistLocalState();
    render();
  });
  document.querySelectorAll("[data-option-group]").forEach((input) => {
    input.addEventListener("change", () => {
      const group = input.dataset.optionGroup;
      if (input.type === "checkbox") {
        const current = new Set(state.config.options[group] || []);
        input.checked ? current.add(input.value) : current.delete(input.value);
        state.config.options[group] = [...current];
      } else {
        state.config.options[group] = input.value;
      }
      markBomPending();
      persistLocalState();
      render();
    });
  });
  document.querySelectorAll("[data-aux-quantity]").forEach((select) => {
    select.addEventListener("change", () => {
      const code = select.dataset.auxQuantity;
      state.config.auxiliaryQuantities = {
        ...(state.config.auxiliaryQuantities || {}),
        [code]: sanitizeNumericConfigValue("auxiliaryQuantity", select.value)
      };
      markBomPending();
      persistLocalState();
      render();
    });
  });
  document.querySelectorAll("[data-exc-annul]").forEach((input) => {
    input.addEventListener("change", () => {
      const current = new Set(state.config.excAnnulledRefs || []);
      input.checked ? current.add(input.value) : current.delete(input.value);
      state.config.excAnnulledRefs = [...current];
      markBomPending();
      persistLocalState();
      render();
    });
  });
  document.querySelectorAll("[data-exc-replace-enable]").forEach((input) => {
    input.addEventListener("change", () => {
      updateExcReplacement(input.value, "enabled", input.checked);
      render();
    });
  });
  document.querySelectorAll("[data-exc-replace-control]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.excReplaceKey;
      const field = input.dataset.excReplaceField;
      const value = field === "quantity" || field === "price" ? sanitizeNumericConfigValue(field === "quantity" ? "auxiliaryQuantity" : "tftManualPrice", input.value) : input.value;
      updateExcReplacement(key, field, value);
      if (field === "code") {
        hydrateExcReplacementFromAlart(key, input.value);
        persistLocalState();
      }
      render();
    });
  });
  document.querySelector("#updateBom")?.addEventListener("click", () => updateBom(viewState));
  document.querySelectorAll("[data-bom-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bomTab = button.dataset.bomTab;
      render();
    });
  });
  document.querySelector("#exportBomCsv")?.addEventListener("click", () => downloadCsv("bom-consolidada-swarco.csv", state.costing.rows));
  document.querySelector("#approveCost")?.addEventListener("click", () => {
    state.costApproved = true;
    persistLocalState();
    render();
  });
}

function exportProductSheetPdf() {
  const sheet = document.querySelector(".product-sheet");
  if (!sheet) return;
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    window.print();
    return;
  }
  const title = `${state.selectedModel || "SWARCO"} - ficha producto`;
  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <link rel="stylesheet" href="css/styles.css?v=${appBuild}" />
        <style>
          body { margin: 0; background: #fff; }
          .product-sheet-stage { overflow: visible; zoom: 1; padding: 0; }
          .product-sheet { width: 194mm; max-width: 194mm; min-height: 281mm; max-height: 281mm; margin: 0; padding: 4mm; box-shadow: none; border: 0; font-size: 7.2px; overflow: hidden; }
          .product-sheet-top { grid-template-columns: 32mm 1fr 55mm; gap: 4mm; }
          .product-brand img { max-width: 28mm; }
          .product-sheet h2 { font-size: 10px; margin-top: 2mm; }
          .product-meta-row { grid-template-columns: 24mm 1fr; min-height: 5mm; }
          .product-meta-row span, .product-meta-row strong, .product-calc-box th, .product-calc-box td, .product-table th, .product-table td { padding: 1.1mm 1.5mm; }
          .product-hero { grid-template-columns: 62mm 1fr; gap: 5mm; margin-top: 2mm; }
          .product-image-wrap { min-height: 34mm; }
          .product-image-wrap img { max-height: 34mm; }
          .product-calcs { gap: 2mm; }
          .product-calc-title, .product-section-title { min-height: 4mm; padding: 1mm 1.5mm; }
          .product-description { margin-top: 2mm; }
          .product-description-box { min-height: 11mm; padding: 1.5mm; border-width: 0.4mm; }
          .product-sheet-grid { grid-template-columns: 1fr 1fr; gap: 5mm; margin-top: 3mm; }
          .product-column { gap: 2mm; }
          .product-info-list { min-height: 24mm; padding: 1.5mm; line-height: 1.25; }
          .product-info-list p { margin-bottom: 1.8mm; }
          .product-actions, .topbar, .sidebar, .module-header, .config-tabs { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
        </style>
      </head>
      <body>
        ${sheet.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.focus();
    printWindow.print();
  }, { once: true });
}

function resetConfigurationForModel() {
  const currentModel = state.models.find((model) => model.model === state.selectedModel) || state.models[0];
  const modelRows = getModelTrl(state.tables.trl, currentModel?.model);
  state.config.options = getDefaultConfiguration(modelRows);
  state.tftTab = "mecanica";
  state.ledTab = "mecanica";
  state.config.ledModuleCode = state.tables.ct_led[0]?.code || "";
  state.config.widthMm = currentModel?.technology === "LED" ? 1280 : 700;
  state.config.heightMm = currentModel?.technology === "LED" ? 720 : 420;
  state.config.consumptionFactor = 1;
  const baseDimensions = getBaseDimensions(currentModel?.model);
  const firstTft = state.tables.ct_tft[0] || {};
  const modelTft = state.tables.ct_tft.find((row) => String(row.inches) === String(baseDimensions?.inches)) || firstTft;
  state.config.tftCode = modelTft.code || "";
  state.config.tftSizeInches = modelTft.inches || "";
  state.config.tftAspectRatio = modelTft.format || "";
  state.config.tftBrightness = "";
  state.config.tftResolution = "";
  state.config.tftTempRange = "";
  state.config.tftManufacturer = "";
  state.config.auxiliaryQuantities = {};
  state.config.excAnnulledRefs = [];
  state.config.excReplacements = {};
  clearTftSelectedPrice();
  if (currentModel?.technology === "TFT" && baseDimensions) {
    state.config.tftMechanicalWidthMm = baseDimensions.totalWidthMm;
    state.config.tftMechanicalHeightMm = baseDimensions.totalHeightMm;
    state.config.tftSheetThicknessMm = state.config.tftSheetThicknessMm || 2;
  }
  const firstLed = state.tables.ct_led[0] || {};
  state.config.ledColor = firstLed.color || "";
  state.config.ledPitch = firstLed.pitchX && firstLed.pitchY ? `${firstLed.pitchX}|${firstLed.pitchY}` : "";
}

function handleConfigChange(event) {
  const key = event.currentTarget.dataset.config;
  if (!key) return;
  if (key === "tftManualPrice" || key === "mechanicalManualCost") {
    const value = normalizeManualPriceInput(event.currentTarget.value);
    event.currentTarget.value = value;
    state.config[key] = value;
    return;
  }
  const value = key in numericConfigLimits ? sanitizeNumericConfigValue(key, event.currentTarget.value) : event.currentTarget.value;
  state.config[key] = key === "tftSelectionMode" && value === "Selección" ? "Seleccionado" : value;
  if (key === "tftSelectionMode") {
    clearTftPriceChoice();
    if (state.config[key] === "Manual") focusTftManualPriceAfterRender = true;
  }
  if (tftFilterConfigKeys.has(key)) {
    syncTftSelection();
    clearTftSelectedPrice();
  }
  if (key.startsWith("tft") || key.startsWith("led") || ["widthMm", "heightMm"].includes(key)) markBomPending();
  persistLocalState();
  render();
}

const tftFilterConfigKeys = new Set([
  "tftCode",
  "tftSizeMode",
  "tftSizeInches",
  "tftAspectRatio",
  "tftBrightness",
  "tftResolution",
  "tftTempRange",
  "tftManufacturer"
]);

function clearTftSelectedPrice() {
  state.config.tftSelectedPriceSource = "";
  state.config.tftSelectedPriceKey = "";
  state.config.tftSelectedPrice = 0;
  state.config.tftSelectedPriceCode = "";
  state.config.tftSelectedPriceLabel = "";
}

function clearTftPriceChoice() {
  state.config.tftManualPrice = 0;
  clearTftSelectedPrice();
}

function updateExcReplacement(key, field, value) {
  state.config.excReplacements = {
    ...(state.config.excReplacements || {}),
    [key]: {
      ...(state.config.excReplacements?.[key] || {}),
      [field]: value
    }
  };
  markBomPending();
  persistLocalState();
}

function hydrateExcReplacementFromAlart(key, codeValue) {
  const code = String(codeValue || "").trim();
  if (!code) return;
  const article = (state.tables.alart || []).find((row) => row.code === code);
  if (!article) return;
  const current = state.config.excReplacements?.[key] || {};
  state.config.excReplacements[key] = {
    ...current,
    description: article.description || current.description || "",
    price: Number(article.pultcomp || 0) || current.price || 0
  };
}

function normalizeManualPriceInput(value) {
  const normalized = String(value || "")
    .replace(/[^\d,.]/g, "")
    .replace(".", ",");
  const [integerPart = "", decimalPart = ""] = normalized.split(",");
  const integerDigits = integerPart.replace(/\D/g, "").slice(0, 6);
  const decimalDigits = decimalPart.replace(/\D/g, "").slice(0, 2);
  const hasDecimal = normalized.includes(",");
  const nextValue = `${integerDigits || "0"}${hasDecimal ? `,${decimalDigits}` : ""}`;
  return sanitizeNumericConfigValue("tftManualPrice", nextValue) > 999999.99 ? "999999,99" : nextValue;
}

function focusPendingControl() {
  if (!focusTftManualPriceAfterRender) return;
  focusTftManualPriceAfterRender = false;
  window.requestAnimationFrame(() => {
    const input = document.querySelector('[data-config="tftManualPrice"]');
    if (!input) return;
    input.focus();
    input.setSelectionRange?.(0, 0);
  });
}

function syncTftSelection() {
  if (state.config.tftSizeMode === "Pulgadas/inches" && !state.config.tftSizeInches) {
    state.config.tftSizeInches = [...new Set(state.tables.ct_tft.map((row) => row.inches).filter(Boolean).map(String))][0] || "";
  }
  syncTftAspectRatioForInches();
  syncTftSecondaryFilters();
  const options = filterTfts(state.tables.ct_tft, state.config);
  if (!options.some((row) => row.code === state.config.tftCode)) {
    state.config.tftCode = options[0]?.code || "";
  }
}

function syncTftAspectRatioForInches() {
  if (state.config.tftSizeMode !== "Pulgadas/inches" || !state.config.tftSizeInches) return;
  const inchRows = state.tables.ct_tft.filter((row) => sameTftInches(row.inches, state.config.tftSizeInches));
  if (!inchRows.length) return;
  if (!inchRows.some((row) => row.format === state.config.tftAspectRatio)) {
    state.config.tftAspectRatio = inchRows[0].format || "";
  }
}

function syncTftSecondaryFilters() {
  if (filterTfts(state.tables.ct_tft, state.config).length) return;
  ["tftBrightness", "tftResolution", "tftTempRange", "tftManufacturer"].forEach((key) => {
    state.config[key] = "";
  });
}

function updateBom(viewState) {
  const modelRoots = getAllModelRoots(state.tables.trl);
  const roots = modelRoots.length ? modelRoots : selectedRoots(viewState.modelRows, state.config.options);
  const exploded = explodeBom({ roots: [...new Set(roots)], cplismatRows: state.tables.cplismat, maxLevel: 6 });
  const consolidated = consolidateBom(exploded, state.tables);
  const costing = calculateCosts(consolidated, state.tables, viewState.mechanics);
  state.bom = {
    status: exploded.some((row) => row.warning) ? "BOM_CON_ERRORES" : "BOM_ACTUALIZADA",
    version: `BOM-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    generatedAt: new Date().toISOString(),
    generatedBy: ROLES[state.role]?.label || state.role,
    sourceVersions: Object.fromEntries(Object.entries(state.versions).map(([key, version]) => [key, version?.checksum || "demo"])),
    exploded,
    consolidated: costing.rows
  };
  state.costing = costing;
  state.bomTab = "consolidated";
  persistLocalState();
  render();
}

function markBomPending() {
  if (state.bom.status === "BOM_ACTUALIZADA") state.bom.status = "BOM_PENDIENTE_ACTUALIZACION";
  state.costApproved = false;
}

function buildTrace(viewState) {
  return {
    generatedAt: new Date().toISOString(),
    appVersion,
    appBuild,
    role: viewState.roleLabel,
    model: viewState.currentModel,
    configuration: state.config,
    tableVersions: state.versions,
    formulas: state.formulas,
    bom: state.bom,
    costing: state.costing
  };
}

function persistLocalState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      role: state.role,
      appVersion,
      appBuild,
      versions: state.versions,
      changes: state.changes,
      selectedModel: state.selectedModel,
      tftTab: state.tftTab,
      ledTab: state.ledTab,
      config: state.config,
      formulas: state.formulas,
      bom: {
        status: state.bom.status,
        version: state.bom.version,
        generatedAt: state.bom.generatedAt,
        generatedBy: state.bom.generatedBy,
        sourceVersions: state.bom.sourceVersions
      },
      costApproved: state.costApproved
    }));
  } catch (error) {
    console.warn("No se pudo guardar el estado local ligero", error);
  }
}

function restoreLocalState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    const savedRole = saved.role || state.role;
    state.role = isNuesoRole(savedRole) ? "consulta" : savedRole;
    state.nuesoUnlocked = false;
    state.versions = saved.versions || {};
    state.changes = saved.changes || {};
    state.selectedModel = saved.selectedModel || "";
    state.tftTab = ["mecanica", "tfts", "modulos", "ficha"].includes(saved.tftTab) ? saved.tftTab : "mecanica";
    state.ledTab = ["mecanica", "led", "modulos", "ficha"].includes(saved.ledTab) ? saved.ledTab : "mecanica";
    const defaultConfig = { ...state.config };
    state.config = { ...state.config, ...(saved.config || {}) };
    if (state.config.tftSelectionMode === "Selección") state.config.tftSelectionMode = "Seleccionado";
    sanitizeConfig(defaultConfig);
    state.formulas = mergeFormulas(saved.formulas || {});
    state.bom = { ...state.bom, ...(saved.bom || {}), exploded: [], consolidated: [] };
    state.costApproved = Boolean(saved.costApproved);
  } catch (error) {
    console.warn("No se pudo restaurar el estado local", error);
  }
}

function sanitizeConfig(defaultConfig = {}) {
  Object.keys(numericConfigLimits).forEach((key) => {
    if (key in state.config) state.config[key] = sanitizeNumericConfigValue(key, state.config[key], defaultConfig[key]);
  });
}

function sanitizeNumericConfigValue(key, value, fallback) {
  const number = Number(String(value).replace(",", "."));
  if (!Number.isFinite(number)) return fallback ?? state.config?.[key] ?? 0;
  const limits = numericConfigLimits[key];
  if (!limits) return number;
  if (number < limits.min || number > limits.max) return fallback ?? Math.min(limits.max, Math.max(limits.min, number));
  return number;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function buildCalculatedFields({ mechanics, ledCalculation, costing, currentModel }) {
  const rows = [
    {
      key: "mechanicalWeightKg",
      label: "Peso mecanica calculado",
      category: "Mecanica",
      value: `${mechanics.mechanicalWeightKg || 0} kg`,
      formula: mechanics.formulaResults?.mechanicalWeightKg?.expression || state.formulas.mechanicalWeightKg.expression,
      error: mechanics.formulaResults?.mechanicalWeightKg?.error || "",
      editable: true
    },
    {
      key: "mechanicalPrice",
      label: "Coste mecanico",
      category: "Mecanica",
      value: money(mechanics.mechanicalPrice),
      formula: mechanics.formulaResults?.mechanicalPrice?.expression || state.formulas.mechanicalPrice.expression,
      error: mechanics.formulaResults?.mechanicalPrice?.error || "",
      editable: true
    }
  ];
  if (currentModel?.technology === "LED") {
    rows.push(
      { key: "ledResolution", label: "Resolucion Real", category: "LED", value: ledCalculation.resolution, formula: "dimensiones_panel / paso_modulo", editable: false },
      { key: "ledModuleCount", label: "Total numero de modulos", category: "LED", value: ledCalculation.moduleCount, formula: "ceil(columnas_panel / columnas_modulo) * ceil(filas_panel / filas_modulo)", editable: false },
      { key: "ledPanelCurrent", label: "Corriente panel ajustada", category: "LED", value: `${ledCalculation.panelCurrent.toFixed(2)} A`, formula: "corriente_modulo * numero_modulos * factor_consumo", editable: false },
      { key: "ledFaCount", label: "Numero de fuentes", category: "LED", value: ledCalculation.faCount, formula: "ceil(corriente_panel / corriente_maxima_fa) + ajuste_fuentes", editable: false },
      { key: "ledWatts", label: "Consumo maximo panel", category: "LED", value: `${ledCalculation.watts.toFixed(0)} W`, formula: "corriente_panel * voltaje_fa / 0.9", editable: false }
    );
  }
  rows.push({ key: "costTotal", label: "Coste total", category: "Coste", value: money(costing.total), formula: "SUM(BOM consolidada + mecanica)", editable: false });
  return rows;
}

function money(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function groupLabel(key) {
  return {
    "1": "bastidor",
    "1L": "reloj",
    "2": "puerta",
    "2L": "bandeja LEDs",
    "3": "IP",
    "4": "RANGO",
    "5": "FA",
    "6": "auxiliares"
  }[key] || "opciones";
}

function parseSize(value, aspectRatio = "") {
  const [width, height] = String(value || "").split("x").map(Number);
  return normalizeTftSize({
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0
  }, aspectRatio);
}

function normalizeTftSize(size, aspectRatio = "") {
  const width = Number(size.width) || 0;
  const height = Number(size.height) || 0;
  const ratio = parseAspectRatio(aspectRatio);
  if (!width || !height || !ratio) return { width, height };
  const measuredRatio = width / height;
  if (measuredRatio > ratio * 2.5) return { width: roundToOne(height * ratio), height };
  if (measuredRatio < ratio / 2.5) return { width, height: roundToOne(width / ratio) };
  return { width, height };
}

function parseAspectRatio(value) {
  const [left, right] = String(value || "").replace(",", ".").split(":").map(Number);
  if (!Number.isFinite(left) || !Number.isFinite(right) || !right) return 0;
  return left / right;
}

function getBaseDimensions(model) {
  return state.tables.dimensiones_base?.find((row) => row.model === model);
}

function getTftDimensions(config, details) {
  const base = getBaseDimensions(state.selectedModel) || {};
  const borderWidthMm = Number(base.borderWidthMm) || 0;
  const borderHeightMm = Number(base.borderHeightMm) || 0;
  const visibleFromMechanical = (mechanical, border) => Math.max(0, roundToOne((Number(mechanical) || 0) - (border * 2)));
  const mechanicalFromVisible = (visible, border) => roundToOne((Number(visible) || 0) + (border * 2));
  const clockExtensionMm = getClockExtensionMm(config.options?.["1L"]);
  const clockPosition = String(config.tftClockPosition || "").toUpperCase();
  const addClockToWidth = clockPosition === "LATERAL" ? clockExtensionMm : 0;
  const addClockToHeight = clockPosition === "SUPERIOR" ? clockExtensionMm : 0;
  if (config.tftSizeMode === "Largo x Alto") {
    const baseWidth = Number(config.tftMechanicalWidthMm ?? config.tftCustomWidthMm) || 0;
    const baseHeight = Number(config.tftMechanicalHeightMm ?? config.tftCustomHeightMm) || 0;
    return {
      visibleWidthMm: visibleFromMechanical(baseWidth, borderWidthMm),
      visibleHeightMm: visibleFromMechanical(baseHeight, borderHeightMm),
      mechanicalWidthMm: roundToOne(baseWidth + addClockToWidth),
      mechanicalHeightMm: roundToOne(baseHeight + addClockToHeight),
      weightMechanicalWidthMm: roundToOne(baseWidth + addClockToWidth),
      weightMechanicalHeightMm: roundToOne(baseHeight + addClockToHeight),
      clockHoleDiameterMm: clockExtensionMm || 0,
      borderWidthMm,
      borderHeightMm,
      sheetThicknessMm: Number(config.tftSheetThicknessMm) || 0
    };
  }
  const visible = parseSize(details.visibleArea, config.tftAspectRatio);
  const fallbackOuter = parseSize(details.outerSize, config.tftAspectRatio);
  const usesBasePlanDimensions = hasCompleteBasePlanDimensions(base) && sameNumericValue(details.inches, base.inches) && sameTextValue(config.tftAspectRatio, base.aspectRatio);
  const visibleWidthMm = usesBasePlanDimensions ? Number(base.visibleWidthMm) : (visible.width || Number(base.visibleWidthMm) || fallbackOuter.width);
  const visibleHeightMm = usesBasePlanDimensions ? Number(base.visibleHeightMm) : (visible.height || Number(base.visibleHeightMm) || fallbackOuter.height);
  const baseMechanicalWidthMm = usesBasePlanDimensions
    ? Number(base.totalWidthMm)
    : (borderWidthMm ? mechanicalFromVisible(visibleWidthMm, borderWidthMm) : (fallbackOuter.width || Number(base.totalWidthMm) || visibleWidthMm));
  const baseMechanicalHeightMm = usesBasePlanDimensions
    ? Number(base.totalHeightMm)
    : (borderHeightMm ? mechanicalFromVisible(visibleHeightMm, borderHeightMm) : (fallbackOuter.height || Number(base.totalHeightMm) || visibleHeightMm));
  return {
    visibleWidthMm,
    visibleHeightMm,
    mechanicalWidthMm: roundToOne(baseMechanicalWidthMm + addClockToWidth),
    mechanicalHeightMm: roundToOne(baseMechanicalHeightMm + addClockToHeight),
    weightMechanicalWidthMm: roundToOne(baseMechanicalWidthMm + addClockToWidth),
    weightMechanicalHeightMm: roundToOne(baseMechanicalHeightMm + addClockToHeight),
    clockHoleDiameterMm: clockExtensionMm || 0,
    borderWidthMm,
    borderHeightMm,
    sheetThicknessMm: Number(config.tftSheetThicknessMm) || 0
  };
}

function getClockExtensionMm(clockCode) {
  if (!clockCode) return 0;
  const dv = state.tables.alartdv?.find((row) => row.code === clockCode) || {};
  const article = state.tables.alart?.find((row) => row.code === clockCode) || {};
  const gcesp = state.tables.gcesp?.find((row) => row.code === clockCode) || {};
  return parseFirstNumber(dv.dva17) || parseFirstNumber(article.description) || parseFirstNumber(gcesp.description) || 0;
}

function sameNumericValue(left, right) {
  const leftNumber = Number(String(left || "").replace(",", "."));
  const rightNumber = Number(String(right || "").replace(",", "."));
  return Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && Math.abs(leftNumber - rightNumber) < 0.01;
}

function hasCompleteBasePlanDimensions(base = {}) {
  return ["visibleWidthMm", "visibleHeightMm", "totalWidthMm", "totalHeightMm", "inches", "aspectRatio"]
    .every((field) => String(base[field] ?? "").trim() !== "");
}

function sameTextValue(left, right) {
  return String(left || "").trim().toUpperCase() === String(right || "").trim().toUpperCase();
}

function parseFirstNumber(value) {
  const match = String(value || "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getReferenceDimensions(currentModel) {
  const base = getBaseDimensions(currentModel?.model) || {};
  return {
    mechanicalWidthMm: Number(base.totalWidthMm) || 0,
    mechanicalHeightMm: Number(base.totalHeightMm) || 0,
    visibleWidthMm: Number(base.visibleWidthMm) || 0,
    visibleHeightMm: Number(base.visibleHeightMm) || 0,
    sheetThicknessMm: 2,
    material: base.material || (currentModel?.technology === "LED" ? "ALU" : "GALVA")
  };
}

function roundToOne(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function getLedDimensions(config, tables) {
  const module = tables.ct_led.find((row) => row.code === config.ledModuleCode);
  const pitchX = Number(module?.pitchX) || Number(String(config.ledPitch).split("|")[0]?.replace(",", ".")) || 1;
  const pitchY = Number(module?.pitchY) || Number(String(config.ledPitch).split("|")[1]?.replace(",", ".")) || 1;
  if (config.ledCalcMode === "Manual") {
    const resolution = parseResolution(config.ledManualResolution);
    return {
      widthMm: Math.max(1, Math.round(resolution.x * pitchX)),
      heightMm: Math.max(1, Math.round(resolution.y * pitchY))
    };
  }
  return { widthMm: Number(config.widthMm) || 1, heightMm: Number(config.heightMm) || 1 };
}

function parseResolution(value) {
  const [x, y] = String(value || "").toLowerCase().split("x").map(Number);
  return { x: Number.isFinite(x) ? x : 1, y: Number.isFinite(y) ? y : 1 };
}

function filterTfts(rows, config) {
  if (config.tftSizeMode === "Pulgadas/inches" && !config.tftSizeInches) return [];
  if (!config.tftAspectRatio) return [];
  const matches = rows.filter((row) => {
    return (config.tftSizeMode !== "Pulgadas/inches" || !config.tftSizeInches || sameTftInches(row.inches, config.tftSizeInches))
      && row.format === config.tftAspectRatio
      && (!config.tftBrightness || row.brightness === config.tftBrightness)
      && (!config.tftResolution || row.resolution === config.tftResolution)
      && (!config.tftTempRange || row.tempRange === config.tftTempRange)
      && (!config.tftManufacturer || row.manufacturer === config.tftManufacturer);
  });
  return matches;
}

function sameTftInches(left, right) {
  return normalizeTftInches(left) === normalizeTftInches(right);
}

function normalizeTftInches(value) {
  return String(value ?? "").trim().replace(",", ".");
}
