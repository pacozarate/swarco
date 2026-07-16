import { equipmentImages } from "../js/tftMechanicalData.js?v=20260716-v4-1-25";

const ledTabs = [
  { id: "mecanica", label: "Mecánica" },
  { id: "led", label: "LED / Alimentación" }
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

function mechanicalTab(state) {
  const image = resolveEquipmentImage(state);
  return `
    <div class="calc-grid">
      <div class="panel">
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
          ${numberRow("Cantidad", "ledQuantity", state.config.ledQuantity, 1, 9999)}
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

function groupSelect(group, state) {
  return selectRow(`Grupo ${group.key} - ${group.label}`, `group-${group.key}`, state.config.options[group.key], group.rows.map((row) => row.code), undefined, group);
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
  return `
    <div class="calc-row">
      <label>${label}</label>
      <select ${elementId ? `id="${elementId}"` : ""} ${attr}>
        ${options.filter(Boolean).map((option) => `<option value="${option}" ${String(value) === String(option) ? "selected" : ""}>${option}</option>`).join("")}
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
