import { equipmentImages } from "../js/tftMechanicalData.js?v=20260807-v4-1-65";
import { explodeBom } from "../js/bomExplosionEngine.js?v=20260807-v4-1-65";
import { productSheetView } from "./productSheetView.js?v=20260807-v4-1-65";
import { breakdownView } from "./breakdownView.js?v=20260807-v4-1-65";

const ledTabs = [
  { id: "mecanica", label: "Mecánica" },
  { id: "led", label: "LED / Alimentación" },
  { id: "modulos", label: "Módulos" },
  { id: "ficha", label: "Ficha de producto" },
  { id: "desglose", label: "Desglose" }
];

export function ledView(state) {
  const calc = state.ledCalculation;
  const module = state.tables.ct_led.find((row) => row.code === state.config.ledModuleCode) || {};
  const activeTab = ledTabs.some((tab) => tab.id === state.ledTab) ? state.ledTab : "mecanica";
  return `
    <section class="screen">
      <div class="module-header">
        <div class="module-heading">
          <img class="module-logo" src="brand-assets/swarco-logo-header.png" alt="Swarco" />
          <div class="module-title">CALCULO MECANICA. PID Leds</div>
        </div>
        <span class="module-tag">${state.currentModel.description}</span>
      </div>

      ${familySelector(state)}
      ${lotReferenceBar(state)}

      <nav class="config-tabs" role="tablist" aria-label="Configuracion LED">
        ${ledTabs.map((tab) => `
          <button type="button" class="config-tab-button ${activeTab === tab.id ? "active" : ""}" data-led-tab="${tab.id}" role="tab" aria-selected="${activeTab === tab.id}">
            ${tab.label}
          </button>
        `).join("")}
      </nav>

      <div class="tab-content">
        ${activeTab === "mecanica" ? mechanicalTab(state) : ""}
        ${activeTab === "led" ? ledParametersTab(state, module, calc) : ""}
        ${activeTab === "modulos" ? modulesTab(state) : ""}
        ${activeTab === "ficha" ? productSheetView(state, "LED") : ""}
        ${activeTab === "desglose" ? breakdownView(state, "LED") : ""}
      </div>
    </section>
  `;
}

function familySelector(state) {
  return `
    <article class="tech-card config-family-card">
      <header class="tech-card-header orange">Familia / Modelo</header>
      <div class="tech-card-body form-grid">
        <label class="form-label">Familia</label>
        <select class="form-select critical" id="modelSelect">
          ${state.models.map((item) => `
            <option value="${item.model}" ${state.selectedModel === item.model ? "selected" : ""}>${item.model} - ${item.description}</option>
          `).join("")}
        </select>
      </div>
    </article>
  `;
}

function lotReferenceBar(state) {
  return `
    <div class="lot-reference-bar">
      <span>Cantidad | Lote</span>
      <strong>${formatQuantity(state.config.ledQuantity || 0)}</strong>
    </div>
  `;
}

function mechanicalTab(state) {
  const image = resolveEquipmentImage(state);
  return `
    <div class="calc-grid">
      <div class="panel led-mechanical-config-panel">
        <div class="panel-header"><h2>Mecanica - Configuracion</h2></div>
        <div class="panel-body calc-sheet">
          ${readRow("Familia", state.currentModel.description)}
          ${state.optionGroups.filter((group) => group.key !== "6").map((group) => groupSelect(group, state)).join("")}
          ${numberRow("Numero de matrices", "ledMatrices", state.config.ledMatrices, 1, 30)}
          ${numberRow("Distancia entre matrices", "ledMatrixSpacing", state.config.ledMatrixSpacing, 0, 999)}
          ${selectRow("Calculo mecanica", "ledMechanicsMode", state.config.ledMechanicsMode, ["Automático", "Manual"])}
          ${numberRow("Largo mecanica Manual", "ledManualWidthMm", state.config.ledManualWidthMm, 1, 9999)}
          ${numberRow("Alto mecanica Manual", "ledManualHeightMm", state.config.ledManualHeightMm, 1, 9999)}
          ${selectRow("Material", "ledMaterial", state.config.ledMaterial, ["ALU", "GALVA"])}
          ${selectRow("Espesor Chapa", "tftSheetThicknessMm", state.config.tftSheetThicknessMm, sheetThicknessOptions())}
          ${numberRow("Cantidad | Lote", "ledQuantity", state.config.ledQuantity, 1, 9999)}
        </div>
      </div>

      <article class="tech-card image-preview-card">
        <header class="tech-card-header dark">Imagen del equipo</header>
        <div class="tech-card-body">
          <div class="equipment-image-box">
            ${image ? `
              <img class="equipment-image" src="${image.mainImage}" alt="${image.description || "Imagen del equipo seleccionado"}" />
            ` : `
              <div class="image-placeholder">No hay imagen disponible para esta configuracion.</div>
            `}
          </div>
        </div>
      </article>
    </div>

    ${mechanicalSubassembliesCard(state)}
  `;
}

function mechanicalSubassembliesCard(state) {
  return `
    <article class="tech-card">
      <header class="tech-card-header">
        <span>Subconjuntos mecanicos</span>
        <span>${state.mechanicalSubassemblies.totalWeightKg || 0} kg</span>
      </header>
      <div class="tech-card-body">
        ${mechanicalSubassembliesTable(state.mechanicalSubassemblies.rows)}
      </div>
    </article>
  `;
}

function mechanicalSubassembliesTable(rows = []) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay subconjuntos mecanicos para la configuracion seleccionada.</div>`;
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>Codigo</th><th>Descripcion</th><th>Origen</th><th>Padre</th><th>Cant.</th><th>Peso kg</th><th>Dim.</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.code}</td>
              <td>${row.description || "-"}</td>
              <td>${row.root || "-"}</td>
              <td>${row.parent || "-"}</td>
              <td class="numeric">${formatQuantity(row.quantity)}</td>
              <td class="numeric">${row.weightKg === "" ? "-" : row.weightKg}</td>
              <td>${row.dimensionVariable ? "M" : "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function ledParametersTab(state, module, calc) {
  return `
    <div class="calc-grid led-grid">
      <div class="panel">
        <div class="panel-header"><h2>Parametros LED</h2></div>
        <div class="panel-body calc-sheet">
          ${selectRow("Color LED", "ledColor", state.config.ledColor || module.color, unique(state.tables.ct_led.map((row) => row.color)))}
          ${selectRow("Calculo de Resolucion", "ledCalcMode", state.config.ledCalcMode, ["Automático", "Manual"])}
          ${textRow("Resolucion Manual Matrices de Leds", "ledManualResolution", state.config.ledManualResolution)}
          ${selectRow("Paso entre LEDs", "ledPitch", state.config.ledPitch || `${module.pitchX}|${module.pitchY}`, unique(state.tables.ct_led.map((row) => `${row.pitchX}|${row.pitchY}`)))}
          ${numberRow("Numero de Lineas", "ledLines", state.config.ledLines, 1, 100)}
          ${numberRow("Numero de Caracteres por Linea", "ledCharsPerLine", state.config.ledCharsPerLine, 1, 100)}
          ${selectRow("Formato de caracteres", "ledCharacterFormat", state.config.ledCharacterFormat, ["5x7", "7x11", "11x16", "15x16"])}
          ${numberRow("Distancia de legibilidad", "ledLegibilityDistance", state.config.ledLegibilityDistance, 1, 100)}
          ${numberRow("Distancia entre caracteres", "ledCharSpacing", state.config.ledCharSpacing, 1, 9)}
          ${numberRow("Distancia entre lineas", "ledLineSpacing", state.config.ledLineSpacing, 1, 20)}
          ${selectRow("Elige Modulo", "ledModuleCode", state.config.ledModuleCode, state.tables.ct_led.map((row) => row.code), "ledSelect")}
          ${numberRow("Ancho panel mm", "widthMm", state.ledDimensions.widthMm, 1, 9999)}
          ${numberRow("Alto panel mm", "heightMm", state.ledDimensions.heightMm, 1, 9999)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Fuente de alimentacion y cableado</h2></div>
        <div class="panel-body calc-sheet">
          ${numberRow("Porcentaje de Ajuste", "ledCurrentAdjustmentPercent", state.config.ledCurrentAdjustmentPercent, 1, 100)}
          ${selectRow("Ajustar fuentes", "ledFaAdjustment", state.config.ledFaAdjustment, ["-3", "-2", "-1", "0", "1", "2", "3"])}
          ${readRow("Codigo FA", module.faCode || "-")}
          ${readRow("Voltaje FA", `${module.faVoltage || "-"} V`)}
          ${readRow("Corriente Maxima FA", `${module.faCurrent || "-"} A`)}
          ${readRow("Cable de datos", module.dataCableCode || "-")}
          ${readRow("Cable de potencia", module.powerCableCode || "-")}
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><h2>Calculo tecnico LED</h2></div>
      <div class="panel-body status-row">
        <div class="stat"><span>Resolucion Real</span><strong>${calc.resolution}</strong></div>
        <div class="stat"><span>Numero de modulos</span><strong>${calc.moduleCount}</strong><div class="meta-text">${calc.moduleColumns} x ${calc.moduleRows}</div></div>
        <div class="stat"><span>Corriente panel ajustada</span><strong>${calc.panelCurrent.toFixed(2)} A</strong></div>
        <div class="stat"><span>Fuentes calculadas</span><strong>${calc.faCount}</strong><div class="meta-text">${module.faCode || "-"} · ${calc.availableCurrent.toFixed(2)} A</div></div>
        <div class="stat"><span>Consumo maximo</span><strong>${calc.watts.toFixed(0)} W</strong></div>
        <div class="stat"><span>Cableado</span><strong>${calc.dataCableCount + calc.powerCableCount}</strong><div class="meta-text">datos + potencia</div></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><h2>Costes y referencias</h2></div>
      <div class="panel-body calc-sheet">
        ${selectRow("Precio Fijo", "ledPriceMode", state.config.ledPriceMode, ["Precio Fijo", "Modificar Precio"])}
        ${selectRow("Modificar Margenes", "ledMarginMode", state.config.ledMarginMode, ["Sin Margen", "Modificar Margenes"])}
        ${selectRow("Sumar SetUp", "ledSetup", state.config.ledSetup, ["SET UP", "NO"])}
        ${auxiliaries(state)}
      </div>
    </div>
  `;
}

function modulesTab(state) {
  const selectedModules = selectedModuleRows(state);
  const moduleSummary = selectedModules
    .filter((row) => String(row.group) !== "6")
    .map((row) => moduleSummaryRow(row, state));
  const auxiliarySummary = auxiliarySummaryRow(state);
  if (auxiliarySummary) moduleSummary.push(auxiliarySummary);
  return `
    <article class="tech-card">
      <header class="tech-card-header">A Modulos seleccionados</header>
      <div class="tech-card-body">
        ${moduleSummaryTable(moduleSummary)}
      </div>
    </article>

    <article class="tech-card">
      <header class="tech-card-header green">B Auxiliares</header>
      <div class="tech-card-body">
        ${auxiliariesTable(state)}
      </div>
    </article>
  `;
}

function selectedModuleRows(state) {
  const rows = [];
  Object.entries(state.config.options || {}).forEach(([group, value]) => {
    const codes = Array.isArray(value) ? value : [value];
    codes.filter(Boolean).forEach((code) => {
      const row = state.modelRows.find((item) => String(item.group).toUpperCase() === String(group).toUpperCase() && item.code === code);
      if (row) rows.push(row);
    });
  });
  return rows;
}

function moduleSummaryRow(moduleRow, state) {
  const rows = explodeModule(moduleRow.root || moduleRow.code, state);
  const summary = rows.reduce((sum, row) => {
    const amount = rowCost(row.article, state.tables) * Number(row.quantity || 0);
    const bucket = costBucket(row.article, state.tables, state);
    sum[bucket] += amount;
    return sum;
  }, emptyModuleCostSummary());
  applyLedCalculatedSupplements(moduleRow, summary, state);
  const total = moduleRowTotal(summary);
  return {
    group: moduleRow.group,
    code: moduleRow.code,
    description: moduleRow.description || moduleRow.longDescription || "",
    quantity: 1,
    noMec: summary.noMec,
    mec: summary.mec,
    fa: summary.fa,
    glassPc: summary.glassPc,
    ledModules: summary.ledModules,
    total
  };
}

function moduleSummaryTable(rows) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay modulos seleccionados.</div>`;
  const totals = rows.reduce((sum, row) => {
    sum.noMec += row.noMec;
    sum.mec += row.mec;
    sum.fa += row.fa;
    sum.glassPc += row.glassPc;
    sum.ledModules += row.ledModules;
    sum.total += row.total;
    return sum;
  }, { noMec: 0, mec: 0, fa: 0, glassPc: 0, ledModules: 0, total: 0 });
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>GRP</th><th>Codigo</th><th>Descripcion</th><th>Cantidad</th><th>noMec</th><th>mec</th><th>FA</th><th>Vidrio | PC</th><th>Modulos LED</th><th>Total</th><th>%</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.group}</td>
              <td>${row.code}</td>
              <td>${row.description || "-"}</td>
              <td class="numeric">${formatQuantity(row.quantity)}</td>
              <td class="numeric">${formatCurrency(row.noMec)}</td>
              <td class="numeric">${row.mec ? formatCurrency(row.mec) : "-"}</td>
              <td class="numeric">${row.fa ? formatCurrency(row.fa) : "-"}</td>
              <td class="numeric">${row.glassPc || String(row.group) === "2" ? formatCurrency(row.glassPc) : "-"}</td>
              <td class="numeric">${row.ledModules ? formatCurrency(row.ledModules) : "-"}</td>
              <td class="numeric">${formatCurrency(row.total)}</td>
              <td class="numeric">${formatPercent(row.total, totals.total)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="4">TOTAL</td><td class="numeric">${formatCurrency(totals.noMec)}</td><td class="numeric">${totals.mec ? formatCurrency(totals.mec) : "-"}</td><td class="numeric">${totals.fa ? formatCurrency(totals.fa) : "-"}</td><td class="numeric">${formatCurrency(totals.glassPc)}</td><td class="numeric">${totals.ledModules ? formatCurrency(totals.ledModules) : "-"}</td><td class="numeric">${formatCurrency(totals.total)}</td><td class="numeric">100%</td></tr>
        </tfoot>
      </table>
    </div>
  `;
}

function auxiliarySummaryRow(state) {
  const group = state.optionGroups.find((item) => item.key === "6");
  if (!group) return null;
  const selectedRows = new Set(Array.isArray(state.config.options["6"]) ? state.config.options["6"] : []);
  const rows = group.rows.map((row) => auxiliaryCostRow(row, state, selectedRows.has(row.code))).filter((row) => row.selected);
  if (!rows.length) return null;
  const totals = rows.reduce((sum, row) => ({
    quantity: sum.quantity + row.quantity,
    noMec: sum.noMec + row.noMec,
    mec: sum.mec + row.mec,
    total: sum.total + row.total
  }), { quantity: 0, noMec: 0, mec: 0, total: 0 });
  return {
    group: 6,
    code: "AUXILIARES",
    description: "Auxiliares seleccionados",
    quantity: totals.quantity,
    noMec: totals.noMec,
    mec: totals.mec,
    fa: 0,
    glassPc: 0,
    ledModules: 0,
    total: totals.total
  };
}

function auxiliariesTable(state) {
  const group = state.optionGroups.find((item) => item.key === "6");
  if (!group) return `<div class="image-placeholder compact">Sin auxiliares disponibles.</div>`;
  const selectedRows = new Set(Array.isArray(state.config.options["6"]) ? state.config.options["6"] : []);
  const rows = group.rows.map((row) => auxiliaryCostRow(row, state, selectedRows.has(row.code)));
  const totals = rows.reduce((sum, row) => ({
    quantity: sum.quantity + (row.selected ? row.quantity : 0),
    noMec: sum.noMec + row.noMec,
    mec: sum.mec + row.mec,
    total: sum.total + row.total
  }), { quantity: 0, noMec: 0, mec: 0, total: 0 });
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>Sel.</th><th>GRP</th><th>Codigo superior</th><th>Descripcion</th><th>Cantidad</th><th>noMec</th><th>mec</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr class="${row.selected ? "selected" : ""}">
              <td><input type="checkbox" data-option-group="6" value="${row.code}" ${row.selected ? "checked" : ""} /></td>
              <td>6</td>
              <td>${row.parentCode}</td>
              <td>${row.description || "-"}</td>
              <td>${row.selected ? auxiliaryQuantitySelect(row.code, row.quantity) : "-"}</td>
              <td class="numeric">${row.selected ? formatCurrency(row.noMec) : "-"}</td>
              <td class="numeric">${row.selected && row.mec ? formatCurrency(row.mec) : "-"}</td>
              <td class="numeric">${row.selected ? formatCurrency(row.total) : "-"}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="4">TOTAL</td><td class="numeric">${formatQuantity(totals.quantity)}</td><td class="numeric">${formatCurrency(totals.noMec)}</td><td class="numeric">${totals.mec ? formatCurrency(totals.mec) : "-"}</td><td class="numeric">${formatCurrency(totals.total)}</td></tr>
        </tfoot>
      </table>
    </div>
  `;
}

function auxiliaryCostRow(row, state, selectedRow) {
  const quantity = auxiliaryQuantity(row.code, state);
  const rows = explodeModule(row.root || row.code, state);
  const summary = rows.reduce((sum, bomRow) => {
    const amount = rowCost(bomRow.article, state.tables) * Number(bomRow.quantity || 0);
    const bucket = costBucket(bomRow.article, state.tables, state);
    if (bucket === "mec") sum.mec += amount;
    else sum.noMec += amount;
    return sum;
  }, { noMec: 0, mec: 0 });
  return {
    selected: selectedRow,
    code: row.code,
    parentCode: row.root || row.code,
    description: row.description || row.longDescription || "",
    quantity,
    noMec: selectedRow ? summary.noMec * quantity : 0,
    mec: selectedRow ? summary.mec * quantity : 0,
    total: selectedRow ? (summary.noMec + summary.mec) * quantity : 0
  };
}

function auxiliaryQuantity(code, state) {
  return sanitizeDisplayQuantity(state.config.auxiliaryQuantities?.[code] || 1);
}

function auxiliaryQuantitySelect(code, value) {
  return `
    <select class="form-select compact-select" data-aux-quantity="${code}">
      ${Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => `<option value="${quantity}" ${Number(value) === quantity ? "selected" : ""}>${quantity}</option>`).join("")}
    </select>
  `;
}

function groupSelect(group, state) {
  return selectRow(`Grupo ${group.key} - ${group.label}`, `group-${group.key}`, state.config.options[group.key], group.rows.map(groupOption), undefined, group);
}

function groupOption(row) {
  return {
    value: row.code,
    label: row.description || row.longDescription || row.code
  };
}

function auxiliaries(state) {
  const group = state.optionGroups.find((item) => item.key === "6");
  if (!group) return readRow("Auxiliares", "Sin auxiliares disponibles");
  return `
    <div class="calc-row tall">
      <label>Auxiliares</label>
      <div class="calc-value option-list compact">
        ${group.rows.map((row) => `
          <label class="checkline">
            <input type="checkbox" data-option-group="6" value="${row.code}" ${selected(state.config.options["6"], row.code) ? "checked" : ""} />
            <span>${row.description || row.code}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function resolveEquipmentImage(state) {
  return equipmentImages[state.selectedModel] || null;
}

function selectRow(label, key, value, options, id, group) {
  const attr = group ? `data-option-group="${group.key}"` : `data-config="${key}"`;
  const elementId = id || "";
  const normalizedOptions = options.filter((option) => option !== undefined && option !== null).map((option) => {
    if (typeof option === "object") return option;
    return { value: option, label: option };
  });
  return `
    <div class="calc-row">
      <label>${label}</label>
      <select ${elementId ? `id="${elementId}"` : ""} ${attr}>
        ${normalizedOptions.map((option) => `<option value="${option.value}" ${String(value) === String(option.value) ? "selected" : ""}>${option.label}</option>`).join("")}
      </select>
    </div>
  `;
}

function textRow(label, key, value) {
  return `<div class="calc-row"><label>${label}</label><input data-config="${key}" type="text" value="${value || ""}" /></div>`;
}

function numberRow(label, key, value, min, max) {
  return `<div class="calc-row"><label>${label}</label><input id="${key}" data-config="${key}" type="number" value="${value ?? ""}" min="${min}" max="${max}" /></div>`;
}

function readRow(label, value) {
  return `<div class="calc-row readonly"><label>${label}</label><strong>${value}</strong></div>`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function sheetThicknessOptions() {
  return [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
}

function formatQuantity(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function selected(value, code) {
  return Array.isArray(value) ? value.includes(code) : value === code;
}

function sanitizeDisplayQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(10, Math.max(1, Math.round(number)));
}

function explodeModule(root, state) {
  if (!root) return [];
  return explodeBom({ roots: [root], cplismatRows: state.tables.cplismat || [], maxLevel: 6 });
}

function emptyModuleCostSummary() {
  return { noMec: 0, mec: 0, fa: 0, glassPc: 0, ledModules: 0 };
}

function moduleRowTotal(summary) {
  return summary.noMec + summary.mec + summary.fa + summary.glassPc + summary.ledModules;
}

function applyLedCalculatedSupplements(moduleRow, summary, state) {
  if (String(moduleRow.group).toUpperCase() !== "2L") return;
  const selectedLedModule = state.tables.ct_led.find((row) => row.code === state.config.ledModuleCode) || {};
  const moduleCount = Number(state.ledCalculation?.moduleCount || 0);
  const faCount = Number(state.ledCalculation?.faCount || 0);
  summary.ledModules += rowCost(state.config.ledModuleCode, state.tables) * moduleCount;
  summary.fa += rowCost(selectedLedModule.faCode, state.tables) * faCount;
}

function costBucket(code, tables, state = {}) {
  const upperCode = String(code || "").toUpperCase();
  const dv = articleDv(code, tables);
  const description = String((tables.alart || []).find((row) => row.code === code)?.description || "").toUpperCase();
  const selectedLedModule = (state.tables?.ct_led || []).find((row) => row.code === state.config?.ledModuleCode) || {};
  if (upperCode === String(state.config?.ledModuleCode || "").toUpperCase() || description.includes("MATRIZ LED") || description.includes("MODULO MATRIZ LED")) return "ledModules";
  if (upperCode === String(selectedLedModule.faCode || "").toUpperCase() || description.includes("FUENTE")) return "fa";
  if (String(dv?.dva17 || "").trim().toUpperCase() === "GLASS" || upperCode.includes("AV") || description.includes("VIDRIO") || description.includes("POLICARBONATO")) return "glassPc";
  if (String(dv?.dva17 || "").trim().toUpperCase() === "MEC" || /AM\d+/.test(upperCode)) return "mec";
  return "noMec";
}

function rowCost(code, tables) {
  const lastPurchase = alartLastPurchaseCost(code, tables);
  if (lastPurchase > 0) return lastPurchase;
  const tariff = (tables.gcesp || [])
    .filter((row) => row.code === code && Number(row.price) > 0)
    .sort((a, b) => compareDateDesc(a.validFrom, b.validFrom))[0];
  if (tariff) return Number(tariff.price) || 0;
  const history = (tables.alhis || [])
    .filter((row) => row.code === code && Number(row.quantity || 0) > 0 && Number(row.price || row.realCost || row.averageCost || 0) > 0)
    .sort((a, b) => compareDateDesc(a.date, b.date))[0];
  if (history) return Number(history.realCost || history.averageCost || history.price || 0) || 0;
  return Number((tables.alart || []).find((row) => row.code === code)?.pmp || 0) || 0;
}

function alartLastPurchaseCost(code, tables) {
  const article = (tables.alart || []).find((row) => row.code === code);
  return Number(article?.pultcomp || 0) || 0;
}

function articleDv(code, tables) {
  return (tables.alartdv || []).find((row) => row.code === code) || {};
}

function compareDateDesc(a, b) {
  return new Date(b || 0).getTime() - new Date(a || 0).getTime();
}

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

function formatPercent(value, total) {
  const totalNumber = Number(total);
  if (!totalNumber) return "-";
  return `${Math.round((Number(value || 0) / totalNumber) * 100)}%`;
}
