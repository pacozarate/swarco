export function ledView(state) {
  const calc = state.ledCalculation;
  const module = state.tables.ct_led.find((row) => row.code === state.config.ledModuleCode) || {};
  return `
    <section class="screen">
      <div class="calc-title">
        <h2>CALCULO MECANICA. PID Leds</h2>
        <span class="badge blue">${state.currentModel.description}</span>
      </div>
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
          <div class="panel-header"><h2>Configuracion del equipo</h2></div>
          <div class="panel-body calc-sheet">
            ${state.optionGroups.filter((group) => group.key !== "6").map((group) => groupSelect(group, state)).join("")}
            ${numberRow("Numero de matrices", "ledMatrices", state.config.ledMatrices, 1, 30)}
            ${numberRow("Distancia entre matrices", "ledMatrixSpacing", state.config.ledMatrixSpacing, 0, 999)}
            ${selectRow("Calculo mecanica", "ledMechanicsMode", state.config.ledMechanicsMode, ["Automático", "Manual"])}
            ${numberRow("Largo mecanica Manual", "ledManualWidthMm", state.config.ledManualWidthMm, 1, 9999)}
            ${numberRow("Alto mecanica Manual", "ledManualHeightMm", state.config.ledManualHeightMm, 1, 9999)}
            ${selectRow("Material", "ledMaterial", state.config.ledMaterial, ["ALU", "GALVA"])}
            ${numberRow("Cantidad", "ledQuantity", state.config.ledQuantity, 1, 9999)}
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

      <div class="calc-grid">
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
        <div class="panel">
          <div class="panel-header"><h2>Costes y referencias</h2></div>
          <div class="panel-body calc-sheet">
            ${selectRow("Precio Fijo", "ledPriceMode", state.config.ledPriceMode, ["Precio Fijo", "Modificar Precio"])}
            ${selectRow("Modificar Margenes", "ledMarginMode", state.config.ledMarginMode, ["Sin Margen", "Modificar Margenes"])}
            ${selectRow("Sumar SetUp", "ledSetup", state.config.ledSetup, ["SET UP", "NO"])}
            ${auxiliaries(state)}
          </div>
        </div>
      </div>
    </section>
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

function selected(value, code) {
  return Array.isArray(value) ? value.includes(code) : value === code;
}
