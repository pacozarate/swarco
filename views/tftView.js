export function tftView(state) {
  const details = state.tftDetails;
  const tftOptions = state.filteredTfts;
  const inchOptions = unique(state.tables.ct_tft.map((row) => row.inches));
  return `
    <section class="screen">
      <div class="calc-title">
        <h2>CALCULO MECANICA. PID TFT</h2>
        <span class="badge blue">${state.currentModel.description}</span>
      </div>
      <div class="calc-grid">
        <div class="panel">
          <div class="panel-header"><h2>Elige parametros del TFT</h2></div>
          <div class="panel-body calc-sheet">
            ${readRow("Familia", state.currentModel.description)}
            ${selectRow("Tamaño", "tftSizeMode", state.config.tftSizeMode, ["Pulgadas/inches", "Largo x Alto"])}
            ${state.config.tftSizeMode === "Pulgadas/inches"
              ? selectRow("Pulgadas disponibles", "tftSizeInches", state.config.tftSizeInches, inchOptions)
              : manualSizeRows(state)}
            ${selectRow("Aspect ratio", "tftAspectRatio", state.config.tftAspectRatio, unique(state.tables.ct_tft.map((row) => row.format)))}
            ${selectRow("Luminosidad", "tftBrightness", state.config.tftBrightness, withAll(unique(state.tables.ct_tft.map((row) => row.brightness))))}
            ${selectRow("Resolucion", "tftResolution", state.config.tftResolution, withAll(unique(state.tables.ct_tft.map((row) => row.resolution))))}
            ${selectRow("Rango Temp.", "tftTempRange", state.config.tftTempRange, withAll(unique(state.tables.ct_tft.map((row) => row.tempRange))))}
            ${selectRow("Fabricante", "tftManufacturer", state.config.tftManufacturer, withAll(unique(state.tables.ct_tft.map((row) => row.manufacturer))))}
            ${selectRow("TFT", "tftCode", state.config.tftCode, tftOptions.map((row) => row.code), "tftSelect")}
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><h2>Grupos de configuracion</h2></div>
          <div class="panel-body calc-sheet">
            ${state.optionGroups.filter((group) => group.key !== "6").map((group) => groupSelect(group, state)).join("")}
            ${selectRow("Material", "tftMaterial", state.config.tftMaterial, ["GALVA", "ALU"])}
            ${numberRow("Cantidad", "tftQuantity", state.config.tftQuantity, 1, 9999)}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>TFTs</h2></div>
        <div class="panel-body">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Codigo</th><th>Ref Fab</th><th>Fabricante</th><th>Tamaño</th><th>Aspect ratio</th><th>Luminosidad</th><th>Resolucion</th><th>Rango Temp.</th></tr></thead>
              <tbody>
                ${tftOptions.length ? tftOptions.map((row) => `
                  <tr class="${row.code === state.config.tftCode ? "selected-row" : ""}">
                    <td>${row.code}</td><td>${row.description}</td><td>${row.manufacturer || "-"}</td><td>${row.inches || "-"}</td><td>${row.format || "-"}</td><td>${row.brightness || "-"}</td><td>${row.resolution || "-"}</td><td>${row.tempRange || "-"}</td>
                  </tr>
                `).join("") : `<tr><td colspan="8">No hay TFTs que cumplan todos los criterios seleccionados.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="calc-grid">
        <div class="panel">
          <div class="panel-header"><h2>Mecanica</h2></div>
          <div class="panel-body calc-sheet">
            ${readRow("Largo Visible", `${state.tftDimensions.visibleWidthMm || "-"} mm`)}
            ${readRow("Alto Visible", `${state.tftDimensions.visibleHeightMm || "-"} mm`)}
            ${readRow("Largo Mecanica", `${state.tftDimensions.mechanicalWidthMm || "-"} mm`)}
            ${readRow("Alto Mecanica", `${state.tftDimensions.mechanicalHeightMm || "-"} mm`)}
            ${readRow("Borde Largo", `${state.tftDimensions.borderWidthMm || "-"} mm`)}
            ${readRow("Borde Alto", `${state.tftDimensions.borderHeightMm || "-"} mm`)}
            ${readRow("Espesor Chapa", `${state.tftDimensions.sheetThicknessMm || "-"} mm`)}
            ${readRow("Peso Mecanica", `${state.mechanics.mechanicalWeightKg || 0} kg`)}
            ${selectRow("Precio Fijo", "tftPriceMode", state.config.tftPriceMode, ["Precio Fijo", "Modificar Precio"])}
            ${selectRow("Sumar SetUp", "tftSetup", state.config.tftSetup, ["SET UP", "NO"])}
            ${selectRow("Margen", "tftMarginMode", state.config.tftMarginMode, ["Sin Margen", "Modificar Margenes"])}
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h2>Precio TFT</h2></div>
          <div class="panel-body calc-sheet">
            ${selectRow("Precio", "tftSelectionMode", state.config.tftSelectionMode, ["Selección", "Manual"])}
            ${numberRow("Coste TFT Manual", "tftManualPrice", state.config.tftManualPrice, 0, 999999)}
            ${auxiliaries(state)}
            <div class="status-row">
              <div class="stat"><span>Pulgadas</span><strong>${details.inches || "-"}</strong></div>
              <div class="stat"><span>Formato</span><strong>${details.format || "-"}</strong></div>
              <div class="stat"><span>NITS</span><strong>${details.brightness || "-"}</strong></div>
              <div class="stat"><span>Resolucion</span><strong>${details.resolution || "-"}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function groupSelect(group, state) {
  return selectRow(`Grupo ${group.key} - ${group.label}`, `group-${group.key}`, state.config.options[group.key], group.rows.map((row) => row.code), undefined, group);
}

function manualSizeRows(state) {
  return `
    ${numberRow("Largo mecanica mm", "tftMechanicalWidthMm", state.config.tftMechanicalWidthMm, 1, 99999999)}
    ${numberRow("Alto mecanica mm", "tftMechanicalHeightMm", state.config.tftMechanicalHeightMm, 1, 99999999)}
    ${numberRow("Espesor de chapa mm", "tftSheetThicknessMm", state.config.tftSheetThicknessMm, 0.1, 99999999, 0.1)}
  `;
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

function numberRow(label, key, value, min, max, step = 1) {
  return `<div class="calc-row"><label>${label}</label><input data-config="${key}" type="number" value="${value ?? ""}" min="${min}" max="${max}" step="${step}" /></div>`;
}

function readRow(label, value) {
  return `<div class="calc-row readonly"><label>${label}</label><strong>${value}</strong></div>`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function withAll(values) {
  return [{ value: "", label: "Todos" }, ...values.map((value) => ({ value, label: value }))];
}

function selected(value, code) {
  return Array.isArray(value) ? value.includes(code) : value === code;
}
