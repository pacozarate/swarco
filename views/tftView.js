import { equipmentImages, tftClockPositionOptions, tftTabs } from "../js/tftMechanicalData.js?v=20260716-v4-1-19";

export function tftView(state) {
  const activeTab = tftTabs.some((tab) => tab.id === state.tftTab) ? state.tftTab : "mecanica";
  return `
    <section class="screen">
      <div class="module-header">
        <div class="module-heading">
          <img class="module-logo" src="brand-assets/swarco-logo-header.png" alt="Swarco" />
          <div class="module-title">CALCULO MECANICA. PID TFT</div>
        </div>
        <span class="module-tag">${state.currentModel.description}</span>
      </div>

      ${familySelector(state)}

      <nav class="config-tabs" role="tablist" aria-label="Configuracion TFT">
        ${tftTabs.map((tab) => `
          <button type="button" class="config-tab-button ${activeTab === tab.id ? "active" : ""}" data-config-tab="${tab.id}" role="tab" aria-selected="${activeTab === tab.id}">
            ${tab.label}
          </button>
        `).join("")}
      </nav>

      <div class="tab-content">
        ${activeTab === "mecanica" ? mechanicalTab(state) : ""}
        ${activeTab === "tfts" ? tftsTab(state) : ""}
        ${activeTab === "modulos" ? modulesTab(state) : ""}
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
    <div class="mechanical-tab-grid">
      <div class="mechanical-left-stack">
        <article class="tech-card">
          <header class="tech-card-header orange">Mecanica - Configuracion</header>
          <div class="tech-card-body form-grid">
          ${readRow("Familia", state.currentModel.description)}
          ${state.optionGroups.filter((group) => ["1", "2", "3", "4", "5", "1L"].includes(group.key)).map((group) => groupSelect(group, state)).join("")}
          ${clockPositionRow(state)}
          </div>
        </article>

        <article class="tech-card dimensions-card">
          <header class="tech-card-header">Dimensiones TFT / Mecanica</header>
          <div class="tech-card-body form-grid">
            ${selectRow("AspectRatio", "tftAspectRatio", state.config.tftAspectRatio, unique(state.tables.ct_tft.map((row) => row.format)), undefined, undefined, "critical")}
            ${selectRow("Tamaño", "tftSizeMode", state.config.tftSizeMode, ["Pulgadas/inches", "Largo x Alto"])}
            ${state.config.tftSizeMode === "Pulgadas/inches"
              ? selectRow("Pulgadas/Inches", "tftSizeInches", state.config.tftSizeInches, unique(state.tables.ct_tft.map((row) => row.inches)), undefined, undefined, "critical")
              : manualSizeRows(state)}
            ${selectRow("Espesor Chapa", "tftSheetThicknessMm", state.config.tftSheetThicknessMm, sheetThicknessOptions(), undefined, undefined, "critical")}
            ${readRow("Largo Visible", `${state.tftDimensions.visibleWidthMm || "-"} mm`, "calculated")}
            ${readRow("Alto Visible", `${state.tftDimensions.visibleHeightMm || "-"} mm`, "calculated")}
            ${readRow("Largo Mecanica", `${state.tftDimensions.mechanicalWidthMm || "-"} mm`, "calculated")}
            ${readRow("Alto Mecanica", `${state.tftDimensions.mechanicalHeightMm || "-"} mm`, "calculated")}
            ${readRow("Borde Largo", `${state.tftDimensions.borderWidthMm || "-"} mm`, "locked")}
            ${readRow("Borde Alto", `${state.tftDimensions.borderHeightMm || "-"} mm`, "locked")}
          </div>
        </article>
      </div>

      <div class="mechanical-right-stack">
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

        <article class="tech-card">
          <header class="tech-card-header green">Material / Peso / Cantidad</header>
          <div class="tech-card-body">
            <div class="form-grid">
              ${selectRow("Material", "tftMaterial", state.config.tftMaterial, ["GALVA", "ALU", "INOX"])}
              ${readRow("Peso Mecanica", `${state.mechanics.mechanicalWeightKg || 0} kg`, "calculated critical")}
              ${numberRow("Cantidad", "tftQuantity", state.config.tftQuantity, 1, 9999, 1, "critical")}
            </div>
            <div class="material-summary-grid">
              <div class="kpi-box">
                <div class="kpi-label">Peso mecanica</div>
                <div class="kpi-value">${state.mechanics.mechanicalWeightKg || 0} kg</div>
              </div>
              <div class="kpi-box">
                <div class="kpi-label">Cantidad</div>
                <div class="kpi-value warning">${state.config.tftQuantity || 0}</div>
              </div>
            </div>
          </div>
        </article>

        ${mechanicalSubassembliesCard(state)}
      </div>
    </div>
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

function tftsTab(state) {
  const details = state.tftDetails;
  const tftOptions = state.filteredTfts;
  const tftOfferRows = tftOffers(state, tftOptions);
  const tftHistoryRows = tftHistory(state, tftOptions);
  const dimensions = state.tftDimensions || {};
  return `
    <div class="technical-grid">
      <article class="tech-card">
        <header class="tech-card-header orange">Filtros TFT</header>
        <div class="tech-card-body form-grid">
          ${selectRow("Aspect ratio", "tftAspectRatio", state.config.tftAspectRatio, unique(state.tables.ct_tft.map((row) => row.format)), undefined, undefined, "critical")}
          ${selectRow("Pulgadas disponibles", "tftSizeInches", state.config.tftSizeInches, unique(state.tables.ct_tft.map((row) => row.inches)), undefined, undefined, "critical")}
          ${selectRow("Luminosidad", "tftBrightness", state.config.tftBrightness, withAll(unique(state.tables.ct_tft.map((row) => row.brightness))))}
          ${selectRow("Resolucion", "tftResolution", state.config.tftResolution, withAll(unique(state.tables.ct_tft.map((row) => row.resolution))))}
          ${selectRow("Rango Temp.", "tftTempRange", state.config.tftTempRange, withAll(unique(state.tables.ct_tft.map((row) => row.tempRange))))}
          ${selectRow("Fabricante", "tftManufacturer", state.config.tftManufacturer, withAll(unique(state.tables.ct_tft.map((row) => row.manufacturer))))}
          ${selectRow("TFT", "tftCode", state.config.tftCode, tftOptions.map((row) => row.code), "tftSelect", undefined, "critical")}
        </div>
      </article>

      <article class="tech-card">
        <header class="tech-card-header green">Detalle TFT seleccionado</header>
        <div class="tech-card-body">
          <div class="material-summary-grid">
            <div class="kpi-box"><div class="kpi-label">Pulgadas</div><div class="kpi-value">${details.inches || "-"}</div></div>
            <div class="kpi-box"><div class="kpi-label">Formato</div><div class="kpi-value">${details.format || "-"}</div></div>
            <div class="kpi-box"><div class="kpi-label">NITS</div><div class="kpi-value warning">${details.brightness || "-"}</div></div>
            <div class="kpi-box"><div class="kpi-label">Resolucion</div><div class="kpi-value">${details.resolution || "-"}</div></div>
          </div>
          <div class="form-grid detail-readonly-grid">
            ${readRow("Largo visible", formatMm(dimensions.visibleWidthMm), "calculated")}
            ${readRow("Alto visible", formatMm(dimensions.visibleHeightMm), "calculated")}
            ${readRow("Largo mecanica", formatMm(dimensions.mechanicalWidthMm), "calculated")}
            ${readRow("Alto mecanica", formatMm(dimensions.mechanicalHeightMm), "calculated")}
            ${readRow("Borde largo", formatMm(dimensions.borderWidthMm), "locked")}
            ${readRow("Borde alto", formatMm(dimensions.borderHeightMm), "locked")}
            ${readRow("Reloj", clockSummary(state), "calculated")}
            ${readRow("Posicion reloj", clockPositionSummary(state), "locked")}
          </div>
        </div>
      </article>
    </div>

    <article class="tech-card">
      <header class="tech-card-header">TFTs</header>
      <div class="tech-card-body">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>Codigo</th><th>Ref Fab</th><th>Fabricante</th><th>Tamaño</th><th>Aspect ratio</th><th>Luminosidad</th><th>Resolucion</th><th>Rango Temp.</th></tr></thead>
            <tbody>
              ${tftOptions.length ? tftOptions.map((row) => `
                <tr class="${row.code === state.config.tftCode ? "selected" : ""}">
                  <td>${row.code}</td><td>${row.description}</td><td>${row.manufacturer || "-"}</td><td class="numeric">${row.inches || "-"}</td><td>${row.format || "-"}</td><td>${row.brightness || "-"}</td><td>${row.resolution || "-"}</td><td>${row.tempRange || "-"}</td>
                </tr>
              `).join("") : `<tr><td colspan="8">No hay TFTs que cumplan todos los criterios seleccionados.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </article>

    <article class="tech-card">
      <header class="tech-card-header green">Ofertas TFT - GCESP</header>
      <div class="tech-card-body">
        ${tftOffersTable(tftOfferRows)}
      </div>
    </article>

    <article class="tech-card">
      <header class="tech-card-header dark">Historico de compras - ALHIS</header>
      <div class="tech-card-body">
        ${tftHistoryTable(tftHistoryRows)}
      </div>
    </article>
  `;
}

function tftOffers(state, tftOptions) {
  const visibleCodes = new Set(tftOptions.map((row) => row.code).filter(Boolean));
  return (state.tables.gcesp || [])
    .filter((row) => visibleCodes.has(row.code))
    .sort((a, b) => naturalCompare(a.code, b.code) || compareDateDesc(a.validFrom, b.validFrom) || Number(a.batch || 0) - Number(b.batch || 0));
}

function tftOffersTable(rows) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay ofertas GCESP para las referencias TFT visibles.</div>`;
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>Codigo</th><th>Lote</th><th>Precio</th><th>Proveedor</th><th>Fvdesde</th><th>Fvhasta</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.code || "-"}</td>
              <td class="numeric">${row.batch ?? "-"}</td>
              <td class="numeric">${formatPrice(row.price)}</td>
              <td>${row.supplier || "-"}</td>
              <td>${row.validFrom || "-"}</td>
              <td>${row.validTo || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function tftHistory(state, tftOptions) {
  const visibleCodes = new Set(tftOptions.map((row) => row.code).filter(Boolean));
  return (state.tables.alhis || [])
    .filter((row) => visibleCodes.has(row.code) && Number(row.quantity || 0) > 0 && Number(row.price || 0) > 0 && hasPurchaseSupplier(row))
    .sort((a, b) => compareDateDesc(a.date, b.date) || naturalCompare(a.code, b.code));
}

function hasPurchaseSupplier(row) {
  const supplier = row.supplier;
  if (supplier === null || supplier === undefined) return false;
  const normalized = String(supplier).trim();
  return normalized !== "" && normalized !== "-" && Number(normalized) !== 0;
}

function tftHistoryTable(rows) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay movimientos ALHIS para las referencias TFT visibles.</div>`;
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>codigo</th><th>fecha</th><th>cantidad</th><th>precio compra</th><th>proveedor</th><th>fecha caducidad</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.code || "-"}</td>
              <td>${row.date || "-"}</td>
              <td class="numeric">${formatQuantity(row.quantity)}</td>
              <td class="numeric">${formatPrice(row.price)}</td>
              <td>${row.supplier || "-"}</td>
              <td>${row.expiration || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function modulesTab(state) {
  return `
    <div class="technical-grid">
      <article class="tech-card">
        <header class="tech-card-header green">Modulos y auxiliares</header>
        <div class="tech-card-body form-grid">
          ${auxiliaries(state)}
        </div>
      </article>
      <article class="tech-card">
        <header class="tech-card-header dark">Precio TFT</header>
        <div class="tech-card-body form-grid">
          ${selectRow("Precio", "tftSelectionMode", state.config.tftSelectionMode, ["Selección", "Manual"])}
          ${numberRow("Coste TFT Manual", "tftManualPrice", state.config.tftManualPrice, 0, 999999, 1, "critical")}
          ${selectRow("Precio Fijo", "tftPriceMode", state.config.tftPriceMode, ["Precio Fijo", "Modificar Precio"])}
          ${selectRow("Sumar SetUp", "tftSetup", state.config.tftSetup, ["SET UP", "NO"])}
          ${selectRow("Margen", "tftMarginMode", state.config.tftMarginMode, ["Sin Margen", "Modificar Margenes"])}
        </div>
      </article>
    </div>
  `;
}

function groupSelect(group, state) {
  const label = {
    "1": "Grupo 1 - Bastidor",
    "2": "Grupo 2 - Puerta",
    "3": "Grupo 3 - IP",
    "4": "Grupo 4 - Rango temperatura",
    "5": "Grupo 5 - Fuente alimentacion",
    "1L": "Grupo 1L - Reloj"
  }[group.key] || `Grupo ${group.key} - ${group.label}`;
  const options = group.key === "1L"
    ? [{ value: "", label: "Sin reloj" }, ...group.rows.map((row) => ({ value: row.code, label: row.code }))]
    : group.rows.map((row) => row.code);
  return selectRow(label, `group-${group.key}`, state.config.options[group.key], options, undefined, group);
}

function clockPositionRow(state) {
  const clockOption = state.config.options["1L"];
  if (!shouldShowClockPosition(clockOption)) return "";
  return selectRow("Grupo 1LA - Posicion del reloj", "tftClockPosition", state.config.tftClockPosition, tftClockPositionOptions);
}

function shouldShowClockPosition(clockOption) {
  return Boolean(clockOption && clockOption !== "Sin reloj");
}

function clockSummary(state) {
  const clockCode = state.config.options["1L"];
  if (!shouldShowClockPosition(clockCode)) return "Sin reloj";
  return clockCode;
}

function clockPositionSummary(state) {
  if (!shouldShowClockPosition(state.config.options["1L"])) return "-";
  const option = tftClockPositionOptions.find((item) => item.value === state.config.tftClockPosition);
  return option?.label || "-";
}

function manualSizeRows(state) {
  return `
    ${numberRow("Largo mecanica mm", "tftMechanicalWidthMm", state.config.tftMechanicalWidthMm, 1, 10000, 1, "critical")}
    ${numberRow("Alto mecanica mm", "tftMechanicalHeightMm", state.config.tftMechanicalHeightMm, 1, 10000, 1, "critical")}
  `;
}

function sheetThicknessOptions() {
  return [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
}

function auxiliaries(state) {
  const group = state.optionGroups.find((item) => item.key === "6");
  if (!group) return readRow("Auxiliares", "Sin auxiliares disponibles");
  return `
      <label class="form-label">Auxiliares</label>
      <div class="option-list compact">
        ${group.rows.map((row) => `
          <label class="checkline">
            <input type="checkbox" data-option-group="6" value="${row.code}" ${selected(state.config.options["6"], row.code) ? "checked" : ""} />
            <span>${row.description || row.code}</span>
          </label>
        `).join("")}
      </div>
  `;
}

function resolveEquipmentImage(state) {
  const configurationCode = [
    state.selectedModel,
    state.config.tftCode,
    state.config.options["1"],
    state.config.options["2"],
    state.config.options["3"]
  ].filter(Boolean).join("_");
  const familyCode = state.selectedModel;
  const bastidorCode = state.config.options["1"];
  const tftCode = state.config.tftCode;
  if (equipmentImages[configurationCode]) return equipmentImages[configurationCode];
  if (equipmentImages[familyCode]) return equipmentImages[familyCode];
  if (equipmentImages[bastidorCode]) return equipmentImages[bastidorCode];
  if (equipmentImages[tftCode]) return equipmentImages[tftCode];
  return null;
}

function selectRow(label, key, value, options, id, group, tone = "") {
  const attr = group ? `data-option-group="${group.key}"` : `data-config="${key}"`;
  const elementId = id || "";
  const normalizedOptions = options.filter((option) => option !== undefined && option !== null).map((option) => {
    if (typeof option === "object") return option;
    return { value: option, label: option };
  });
  return `
      <label class="form-label">${label}</label>
      <select class="form-select ${tone}" ${elementId ? `id="${elementId}"` : ""} ${attr}>
        ${normalizedOptions.map((option) => `<option value="${option.value}" ${String(value) === String(option.value) ? "selected" : ""}>${option.label}</option>`).join("")}
      </select>
  `;
}

function numberRow(label, key, value, min, max, step = 1, tone = "") {
  return `
      <label class="form-label">${label}</label>
      <input class="form-control ${tone}" data-config="${key}" type="number" value="${value ?? ""}" min="${min}" max="${max}" step="${step}" />
  `;
}

function readRow(label, value, tone = "") {
  return `
      <label class="form-label">${label}</label>
      <div class="form-control ${tone}">${value}</div>
  `;
}

function formatMm(value) {
  if (value === undefined || value === null || value === "") return "-";
  const number = Number(value);
  return Number.isFinite(number) ? `${number} mm` : "-";
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function withAll(values) {
  return [{ value: "", label: "Todos" }, ...values.map((value) => ({ value, label: value }))];
}

function formatQuantity(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(number);
}

function compareDateDesc(left, right) {
  return dateSortValue(right) - dateSortValue(left);
}

function dateSortValue(value) {
  if (!value) return 0;
  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  const esMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (esMatch) {
    const year = Number(esMatch[3]) < 100 ? 2000 + Number(esMatch[3]) : Number(esMatch[3]);
    return Date.UTC(year, Number(esMatch[2]) - 1, Number(esMatch[1]));
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function naturalCompare(left, right) {
  return String(left || "").localeCompare(String(right || ""), "es", { numeric: true, sensitivity: "base" });
}

function selected(value, code) {
  return Array.isArray(value) ? value.includes(code) : value === code;
}
