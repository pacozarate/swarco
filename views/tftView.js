import { equipmentImages, tftClockPositionOptions, tftTabs } from "../js/tftMechanicalData.js?v=20260806-v4-1-48";
import { explodeBom } from "../js/bomExplosionEngine.js?v=20260806-v4-1-48";
import { productSheetView } from "./productSheetView.js?v=20260806-v4-1-48";

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
        ${activeTab === "ficha" ? productSheetView(state, "TFT") : ""}
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
      <article class="tech-card mechanical-config-card">
        <header class="tech-card-header orange">Mecanica - Configuracion</header>
        <div class="tech-card-body form-grid">
          ${readRow("Familia", state.currentModel.description)}
          ${state.optionGroups.filter((group) => ["1", "2", "3", "4", "5", "1L"].includes(group.key)).map((group) => groupSelect(group, state)).join("")}
          ${clockPositionRow(state)}
        </div>
      </article>

      <article class="tech-card image-preview-card mechanical-image-card">
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

      <article class="tech-card mechanical-material-card">
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

      ${mechanicalCostCard(state)}

      <article class="tech-card dimensions-card mechanical-dimensions-card">
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

      ${mechanicalSubassembliesCard(state)}
    </div>
  `;
}

function mechanicalSubassembliesCard(state) {
  return `
    <article class="tech-card mechanical-subassemblies-card">
      <header class="tech-card-header">
        <span>Subconjuntos mecanicos</span>
        <span>${state.mechanicalSubassemblies.totalWeightKg || 0} kg</span>
      </header>
      <div class="tech-card-body">
        ${mechanicalSubassembliesTable(state.mechanicalSubassemblies.rows, state.tables)}
      </div>
    </article>
  `;
}

function mechanicalCostCard(state) {
  const calculatedCost = mechanicalSubassembliesCostTotal(state.mechanicalSubassemblies.rows, state.tables);
  const manualMode = state.config.mechanicalCostMode === "Manual";
  const visibleCost = manualMode ? Number(state.config.mechanicalManualCost || 0) || 0 : calculatedCost;
  return `
    <article class="tech-card mechanical-cost-card">
      <header class="tech-card-header dark">Coste</header>
      <div class="tech-card-body">
        <div class="form-grid">
          ${selectRow("Modo precio", "mechanicalCostMode", state.config.mechanicalCostMode, ["Manual", "Calculado"], undefined, undefined, "critical")}
          ${manualMode
            ? moneyNumberRow("Coste manual", "mechanicalManualCost", state.config.mechanicalManualCost, 0, 999999.99, 0.01, "critical", "confirmMechanicalManualCost")
            : readRow("Coste calculado", formatCurrency(calculatedCost), "calculated critical")}
          ${readRow("Coste aplicado", formatCurrency(visibleCost), "calculated critical")}
        </div>
      </div>
    </article>
  `;
}

function mechanicalSubassembliesTable(rows = [], tables = {}) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay subconjuntos mecanicos para la configuracion seleccionada.</div>`;
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>Codigo</th><th>Descripcion</th><th>Origen</th><th>Padre</th><th>Cant.</th><th>Peso kg</th><th>Precio unit.</th><th>Precio total</th><th>Dim.</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const price = mechanicalUnitPrice(row.code, tables);
            const totalPrice = price.unitPrice * Number(row.quantity || 0);
            return `
            <tr>
              <td>${row.code}</td>
              <td>${row.description || "-"}</td>
              <td>${row.root || "-"}</td>
              <td>${row.parent || "-"}</td>
              <td class="numeric">${formatQuantity(row.quantity)}</td>
              <td class="numeric">${row.weightKg === "" ? "-" : row.weightKg}</td>
              <td class="numeric">${formatCurrency(price.unitPrice)} <span class="price-source ${price.sourceClass}">${price.sourceLabel}</span></td>
              <td class="numeric">${formatCurrency(totalPrice)}</td>
              <td>${row.dimensionVariable ? "M" : "-"}</td>
            </tr>
          `;
          }).join("")}
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
          ${tftPriceSelectionPanel(state, tftOfferRows, tftHistoryRows)}
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
        ${tftOffersTable(tftOfferRows, state)}
      </div>
    </article>

    <article class="tech-card">
      <header class="tech-card-header dark">Historico de compras - ALHIS</header>
      <div class="tech-card-body">
        ${tftHistoryTable(tftHistoryRows, state)}
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

function tftOffersTable(rows, state) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay ofertas GCESP para las referencias TFT visibles.</div>`;
  const showSelection = isSelectedTftPriceMode(state);
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr>${showSelection ? "<th>Seleccion</th>" : ""}<th>Codigo</th><th>Lote</th><th>Precio</th><th>Proveedor</th><th>Fvdesde</th><th>Fvhasta</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const key = tftOfferKey(row);
            const selected = isSelectedTftPrice(state, "GCESP", key);
            return `
            <tr class="${selected ? "selected" : ""}">
              ${showSelection ? `<td>${priceSelectButton("GCESP", key, row.code, row.price, `Oferta ${row.code} lote ${row.batch ?? "-"}` , selected)}</td>` : ""}
              <td>${row.code || "-"}</td>
              <td class="numeric">${row.batch ?? "-"}</td>
              <td class="numeric">${formatPrice(row.price)}</td>
              <td>${row.supplier || "-"}</td>
              <td>${row.validFrom || "-"}</td>
              <td>${row.validTo || "-"}</td>
            </tr>
          `;
          }).join("")}
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

function tftHistoryTable(rows, state) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay movimientos ALHIS para las referencias TFT visibles.</div>`;
  const showSelection = isSelectedTftPriceMode(state);
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr>${showSelection ? "<th>Seleccion</th>" : ""}<th>codigo</th><th>fecha</th><th>cantidad</th><th>precio compra</th><th>proveedor</th><th>fecha caducidad</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const key = tftHistoryKey(row);
            const selected = isSelectedTftPrice(state, "ALHIS", key);
            return `
            <tr class="${selected ? "selected" : ""}">
              ${showSelection ? `<td>${priceSelectButton("ALHIS", key, row.code, row.price, `Compra ${row.code} ${row.date || "-"}` , selected)}</td>` : ""}
              <td>${row.code || "-"}</td>
              <td>${row.date || "-"}</td>
              <td class="numeric">${formatQuantity(row.quantity)}</td>
              <td class="numeric">${formatPrice(row.price)}</td>
              <td>${row.supplier || "-"}</td>
              <td>${row.expiration || "-"}</td>
            </tr>
          `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function tftPriceSelectionPanel(state, offerRows, historyRows) {
  const selected = resolveSelectedTftPrice(state, offerRows, historyRows);
  const manualMode = state.config.tftSelectionMode === "Manual";
  return `
    <div class="price-selection-panel">
      <div class="form-grid detail-readonly-grid">
        ${selectRow("Precio manual/seleccionado", "tftSelectionMode", state.config.tftSelectionMode, ["Seleccionado", "Manual"], undefined, undefined, "critical")}
        ${manualMode ? moneyNumberRow("Importe manual", "tftManualPrice", state.config.tftManualPrice, 0, 999999.99, 0.01, "critical") : readRow("Importe seleccionado", selected.priceLabel, selected.tone)}
        ${readRow("Origen precio", selected.sourceLabel, selected.tone)}
        ${readRow("Referencia precio", selected.referenceLabel, selected.tone)}
      </div>
    </div>
  `;
}

function resolveSelectedTftPrice(state, offerRows, historyRows) {
  if (state.config.tftSelectionMode === "Manual") {
    return {
      priceLabel: formatCurrency(state.config.tftManualPrice),
      sourceLabel: "Manual",
      referenceLabel: state.config.tftCode || "-",
      tone: "calculated critical"
    };
  }
  const source = state.config.tftSelectedPriceSource;
  const key = state.config.tftSelectedPriceKey;
  const rows = source === "GCESP" ? offerRows : historyRows;
  const row = rows.find((item) => (source === "GCESP" ? tftOfferKey(item) : tftHistoryKey(item)) === key);
  if (!row) {
    return {
      priceLabel: "-",
      sourceLabel: "Pendiente de seleccion",
      referenceLabel: "Use un registro de ofertas o historico",
      tone: "locked"
    };
  }
  return {
    priceLabel: formatCurrency(row.price),
    sourceLabel: source === "GCESP" ? "Oferta proveedor" : "Compra historica",
    referenceLabel: source === "GCESP" ? `${row.code} lote ${row.batch ?? "-"}` : `${row.code} ${row.date || "-"}`,
    tone: "calculated critical"
  };
}

function isSelectedTftPriceMode(state) {
  return state.config.tftSelectionMode !== "Manual";
}

function isSelectedTftPrice(state, source, key) {
  return state.config.tftSelectedPriceSource === source && state.config.tftSelectedPriceKey === key;
}

function priceSelectButton(source, key, code, price, label, selected) {
  return `
    <button type="button" class="row-action-button ${selected ? "active" : ""}" data-tft-price-select data-source="${source}" data-key="${escapeAttr(key)}" data-code="${escapeAttr(code || "")}" data-price="${Number(price) || 0}" data-label="${escapeAttr(label)}">
      ${selected ? "Elegido" : "Usar"}
    </button>
  `;
}

function tftOfferKey(row) {
  return [row.code, row.batch, row.price, row.supplier, row.validFrom, row.validTo].map((value) => String(value ?? "")).join("|");
}

function tftHistoryKey(row) {
  return [row.code, row.date, row.quantity, row.price, row.supplier, row.expiration].map((value) => String(value ?? "")).join("|");
}

function modulesTab(state) {
  const selectedModules = selectedModuleRows(state);
  const excRows = excReferenceRows(state, selectedModules);
  const excDeductions = excDeductionByGroup(excRows, state);
  const replacementRows = replacementReferenceRows(excRows, state);
  const replacementAdditions = replacementAdditionByGroup(replacementRows);
  const glassRows = glassReferenceRows(state, selectedModules);
  const glassTotals = glassTotalByGroup(glassRows);
  const moduleSummary = selectedModules.filter((row) => String(row.group) !== "6").map((row) => moduleSummaryRow(row, state));
  const auxiliarySummary = auxiliarySummaryRow(state);
  if (auxiliarySummary) moduleSummary.push(auxiliarySummary);
  applyGlassTotals(moduleSummary, glassTotals);
  applyTftPrice(moduleSummary, state);
  applyExcDeductions(moduleSummary, excDeductions);
  applyReplacementAdditions(moduleSummary, replacementAdditions);
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

    <article class="tech-card">
      <header class="tech-card-header orange">C Referencias EXC</header>
      <div class="tech-card-body">
        ${excReferencesTable(excRows, state)}
      </div>
    </article>

    <article class="tech-card">
      <header class="tech-card-header green">D Refs reemplazadas</header>
      <div class="tech-card-body">
        ${replacementReferencesTable(replacementRows, state)}
      </div>
    </article>

    <article class="tech-card">
      <header class="tech-card-header orange">E Vidrios</header>
      <div class="tech-card-body">
        ${glassReferencesTable(glassRows)}
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

function moduleSummaryTable(rows) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay modulos seleccionados.</div>`;
  const totals = rows.reduce((sum, row) => ({
    noMec: sum.noMec + row.noMec,
    mec: sum.mec + row.mec,
    glass: sum.glass + row.glass,
    subtotal: sum.subtotal + row.subtotal,
    tft: sum.tft + row.tft,
    total: sum.total + row.total
  }), { noMec: 0, mec: 0, glass: 0, subtotal: 0, tft: 0, total: 0 });
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>GRP</th><th>Codigo</th><th>Descripcion</th><th>Cantidad</th><th>noMec</th><th>mec</th><th>Vidrio</th><th>Subtotal</th><th>TFT</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.group}</td>
              <td>${row.code}</td>
              <td>${row.description || row.longDescription || "-"}${row.excDeduction ? ` <span class="inline-deduction">EXC -${formatCurrency(row.excDeduction)}</span>` : ""}${row.replacementAddition ? ` <span class="inline-addition">REP +${formatCurrency(row.replacementAddition)}</span>` : ""}</td>
              <td class="numeric">${formatQuantity(row.quantity)}</td>
              <td class="numeric">${formatCurrency(row.noMec)}</td>
              <td class="numeric">${formatCurrency(row.mec)}</td>
              <td class="numeric">${formatCurrency(row.glass)}</td>
              <td class="numeric">${formatCurrency(row.subtotal)}</td>
              <td class="numeric">${row.tft ? formatCurrency(row.tft) : "-"}</td>
              <td class="numeric">${formatCurrency(row.total)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="4">TOTAL</td><td class="numeric">${formatCurrency(totals.noMec)}</td><td class="numeric">${formatCurrency(totals.mec)}</td><td class="numeric">${formatCurrency(totals.glass)}</td><td class="numeric">${formatCurrency(totals.subtotal)}</td><td class="numeric">${totals.tft ? formatCurrency(totals.tft) : "-"}</td><td class="numeric">${formatCurrency(totals.total)}</td></tr>
        </tfoot>
      </table>
    </div>
  `;
}

function applyExcDeductions(rows, deductions) {
  rows.forEach((row) => {
    const deduction = deductions.get(String(row.group)) || 0;
    if (!deduction) return;
    row.noMec = Math.max(0, row.noMec - deduction);
    row.subtotal = Math.max(0, row.subtotal - deduction);
    row.total = Math.max(0, row.total - deduction);
    row.excDeduction = deduction;
  });
}

function applyReplacementAdditions(rows, additions) {
  rows.forEach((row) => {
    const addition = additions.get(String(row.group)) || 0;
    if (!addition) return;
    row.noMec += addition;
    row.subtotal += addition;
    row.total += addition;
    row.replacementAddition = addition;
  });
}

function applyGlassTotals(rows, totals) {
  rows.forEach((row) => {
    const glassTotal = totals.get(String(row.group));
    if (glassTotal === undefined) return;
    const previousGlass = Number(row.glass || 0);
    row.glass = glassTotal;
    row.subtotal += glassTotal - previousGlass;
    row.total += glassTotal - previousGlass;
  });
}

function applyTftPrice(rows, state) {
  const tftPrice = currentTftPrice(state);
  if (!tftPrice) return;
  const doorRow = rows.find((row) => String(row.group) === "2");
  if (!doorRow) return;
  doorRow.tft = tftPrice;
  doorRow.total += tftPrice;
}

function currentTftPrice(state) {
  if (state.config.tftSelectionMode === "Manual") return Number(state.config.tftManualPrice || 0) || 0;
  return Number(state.config.tftSelectedPrice || 0) || 0;
}

function moduleSummaryRow(moduleRow, state) {
  const rows = explodeModule(moduleRow.root || moduleRow.code, state);
  const summary = rows.reduce((sum, row) => {
    const cost = rowCost(row.article, state.tables) * Number(row.quantity || 0);
    const bucket = costBucket(row.article, state.tables);
    sum[bucket] += cost;
    return sum;
  }, { noMec: 0, mec: 0, glass: 0 });
  const subtotal = summary.noMec + summary.mec + summary.glass;
  return {
    group: moduleRow.group,
    code: moduleRow.code,
    description: moduleRow.description,
    quantity: 1,
    noMec: summary.noMec,
    mec: summary.mec,
    glass: summary.glass,
    subtotal,
    tft: 0,
    total: subtotal
  };
}

function auxiliarySummaryRow(state) {
  const group = state.optionGroups.find((item) => item.key === "6");
  if (!group) return null;
  const selected = new Set(Array.isArray(state.config.options["6"]) ? state.config.options["6"] : []);
  const rows = group.rows.map((row) => auxiliaryCostRow(row, state, selected.has(row.code))).filter((row) => row.selected);
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
    glass: 0,
    subtotal: totals.total,
    tft: 0,
    total: totals.total
  };
}

function excReferenceRows(state, selectedModules) {
  const rows = selectedModules.flatMap((moduleRow) => explodeModule(moduleRow.root || moduleRow.code, state)
    .filter((row) => isExcReference(row.article, state.tables))
    .map((row) => {
      const unitCost = rowCost(row.article, state.tables);
      const bucket = costBucket(row.article, state.tables);
      return {
        group: moduleRow.group,
        code: row.article,
        description: articleDescription(row.article, state.tables),
        quantity: Number(row.quantity || 0),
        unitCost,
        noMecUnit: bucket === "mec" ? 0 : unitCost,
        mecUnit: bucket === "mec" ? unitCost : 0,
        total: unitCost * Number(row.quantity || 0)
      };
    }));
  return consolidateExcRows(rows);
}

function excReferencesTable(rows, state) {
  if (!rows.length) return `<div class="image-placeholder compact">NO</div>`;
  const annulled = new Set(state.config.excAnnulledRefs || []);
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>GRP</th><th>Codigo</th><th>Descripcion</th><th>Cantidad</th><th>noMec</th><th>mec</th><th>Total</th><th>Anular</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const key = excReferenceKey(row);
            const selected = annulled.has(key);
            const strikeClass = selected ? "strike-value" : "";
            return `
            <tr class="${selected ? "selected" : ""}">
              <td>${row.group}</td>
              <td>${row.code}</td>
              <td>${row.description || "-"}</td>
              <td class="numeric ${strikeClass}">${formatQuantity(row.quantity)}</td>
              <td class="numeric ${strikeClass}">${row.noMecUnit ? formatCurrency(row.noMecUnit) : "-"}</td>
              <td class="numeric ${strikeClass}">${row.mecUnit ? formatCurrency(row.mecUnit) : "-"}</td>
              <td class="numeric ${strikeClass}">${formatCurrency(row.total)}</td>
              <td class="annul-cell"><input type="checkbox" data-exc-annul value="${escapeAttr(key)}" ${selected ? "checked" : ""} /></td>
            </tr>
          `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function excReferenceKey(row) {
  return [row.group, row.code, row.unitCost].map((value) => String(value ?? "")).join("|");
}

function excDeductionByGroup(rows, state) {
  const annulled = new Set(state.config.excAnnulledRefs || []);
  const deductions = new Map();
  rows.forEach((row) => {
    if (!annulled.has(excReferenceKey(row))) return;
    const group = String(row.group);
    deductions.set(group, (deductions.get(group) || 0) + Number(row.total || 0));
  });
  return deductions;
}

function replacementReferenceRows(excRows, state) {
  const annulled = new Set(state.config.excAnnulledRefs || []);
  return excRows
    .filter((row) => annulled.has(excReferenceKey(row)))
    .map((row) => {
      const key = excReferenceKey(row);
      const replacement = state.config.excReplacements?.[key] || {};
      const quantity = sanitizeDisplayQuantity(replacement.quantity || row.quantity || 1);
      const price = Number(replacement.price || 0);
      return {
        key,
        group: row.group,
        excCode: row.code,
        excDescription: row.description,
        enabled: Boolean(replacement.enabled),
        code: replacement.code || "",
        description: replacement.description || "",
        quantity,
        price,
        total: replacement.enabled ? quantity * price : 0
      };
    });
}

function replacementAdditionByGroup(rows) {
  const additions = new Map();
  rows.forEach((row) => {
    if (!row.enabled) return;
    const group = String(row.group);
    additions.set(group, (additions.get(group) || 0) + Number(row.total || 0));
  });
  return additions;
}

function replacementReferencesTable(rows) {
  if (!rows.length) return `<div class="image-placeholder compact">No hay referencias EXC anuladas.</div>`;
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>Reemplazar</th><th>GRP</th><th>Cod EXC</th><th>Codigo nuevo</th><th>Descripcion</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr class="${row.enabled ? "selected" : ""}">
              <td class="annul-cell"><input type="checkbox" data-exc-replace-enable value="${escapeAttr(row.key)}" ${row.enabled ? "checked" : ""} /></td>
              <td>${row.group}</td>
              <td>${row.excCode}</td>
              <td>${replacementInput(row, "code", row.code, "Codigo", "text")}</td>
              <td>${replacementInput(row, "description", row.description, "Descripcion", "text")}</td>
              <td>${replacementQuantitySelect(row)}</td>
              <td>${replacementInput(row, "price", row.price || "", "Precio", "number")}</td>
              <td class="numeric">${row.enabled ? formatCurrency(row.total) : "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function replacementInput(row, field, value, label, type) {
  return `<input class="table-input" data-exc-replace-control data-exc-replace-key="${escapeAttr(row.key)}" data-exc-replace-field="${field}" type="${type}" value="${escapeAttr(value)}" placeholder="${label}" ${row.enabled ? "" : "disabled"} />`;
}

function replacementQuantitySelect(row) {
  return `
    <select class="form-select compact-select" data-exc-replace-control data-exc-replace-key="${escapeAttr(row.key)}" data-exc-replace-field="quantity" ${row.enabled ? "" : "disabled"}>
      ${Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => `<option value="${quantity}" ${Number(row.quantity) === quantity ? "selected" : ""}>${quantity}</option>`).join("")}
    </select>
  `;
}

function glassReferenceRows(state, selectedModules) {
  const visibleAreaM2 = areaM2(state.tftDimensions?.visibleWidthMm, state.tftDimensions?.visibleHeightMm);
  const doorModules = selectedModules.filter((moduleRow) => String(moduleRow.group) === "2");
  const rows = doorModules.flatMap((moduleRow) => explodeModule(moduleRow.root || moduleRow.code, state)
    .filter((row) => isGlassReference(row.article, state.tables))
    .map((row) => {
      const unitPrice = alartLastPurchaseCost(row.article, state.tables);
      const referenceAreaM2 = glassReferenceAreaM2(row.article, state.tables);
      const priceM2 = referenceAreaM2 > 0 ? unitPrice / referenceAreaM2 : 0;
      return {
        group: moduleRow.group,
        code: row.article,
        description: articleDescription(row.article, state.tables),
        unitPrice,
        priceM2,
        visibleAreaM2,
        total: priceM2 * visibleAreaM2
      };
    }));
  return consolidateGlassRows(rows);
}

function glassReferencesTable(rows) {
  if (!rows.length) return `<div class="image-placeholder compact">NO</div>`;
  const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  return `
    <div class="data-table-wrapper">
      <table class="data-table compact">
        <thead>
          <tr><th>GRP</th><th>Codigo</th><th>Descripcion</th><th>Precio unitario</th><th>€/m2</th><th>Area visible</th><th>Total vidrio</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.group}</td>
              <td>${row.code}</td>
              <td>${row.description || "-"}</td>
              <td class="numeric">${formatCurrency(row.unitPrice)}</td>
              <td class="numeric">${formatCurrency(row.priceM2)}</td>
              <td class="numeric">${formatSquareMeters(row.visibleAreaM2)}</td>
              <td class="numeric">${formatCurrency(row.total)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="6">TOTAL</td><td class="numeric">${formatCurrency(total)}</td></tr>
        </tfoot>
      </table>
    </div>
  `;
}

function auxiliariesTable(state) {
  const group = state.optionGroups.find((item) => item.key === "6");
  if (!group) return `<div class="image-placeholder compact">Sin auxiliares disponibles.</div>`;
  const selected = new Set(Array.isArray(state.config.options["6"]) ? state.config.options["6"] : []);
  const rows = group.rows.map((row) => auxiliaryCostRow(row, state, selected.has(row.code)));
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

function auxiliaryCostRow(row, state, selected) {
  const quantity = auxiliaryQuantity(row.code, state);
  const rows = explodeModule(row.root || row.code, state);
  const summary = rows.reduce((sum, bomRow) => {
    const unitCost = alartLastPurchaseCost(bomRow.article, state.tables);
    const amount = unitCost * Number(bomRow.quantity || 0);
    const bucket = costBucket(bomRow.article, state.tables);
    if (bucket === "mec") sum.mec += amount;
    else sum.noMec += amount;
    return sum;
  }, { noMec: 0, mec: 0 });
  return {
    selected,
    code: row.code,
    parentCode: row.root || row.code,
    description: row.description || row.longDescription || "",
    quantity,
    noMec: selected ? summary.noMec * quantity : 0,
    mec: selected ? summary.mec * quantity : 0,
    total: selected ? (summary.noMec + summary.mec) * quantity : 0
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

function sanitizeDisplayQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(10, Math.max(1, Math.round(number)));
}

function explodeModule(root, state) {
  if (!root) return [];
  return explodeBom({ roots: [root], cplismatRows: state.tables.cplismat || [], maxLevel: 6 });
}

function consolidateExcRows(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = `${row.group}|${row.code}|${row.unitCost}`;
    const current = grouped.get(key) || { ...row, quantity: 0, total: 0 };
    current.quantity += row.quantity;
    current.total += row.total;
    grouped.set(key, current);
  });
  return [...grouped.values()].sort((a, b) => naturalCompare(a.group, b.group) || naturalCompare(a.code, b.code));
}

function consolidateGlassRows(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = `${row.group}|${row.code}`;
    if (!grouped.has(key)) grouped.set(key, { ...row });
  });
  return [...grouped.values()].sort((a, b) => naturalCompare(a.group, b.group) || naturalCompare(a.code, b.code));
}

function glassTotalByGroup(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    const group = String(row.group);
    totals.set(group, (totals.get(group) || 0) + Number(row.total || 0));
  });
  return totals;
}

function isExcReference(code, tables) {
  const upperCode = String(code || "").toUpperCase();
  const article = articleDv(code, tables);
  return String(article?.dva17 || "").trim().toUpperCase() === "EXC" && !upperCode.includes("AV");
}

function isGlassReference(code, tables) {
  const upperCode = String(code || "").toUpperCase();
  const article = articleDv(code, tables);
  return upperCode.includes("AV")
    && String(article?.dva17 || "").trim().toUpperCase() === "GLASS"
    && costBucket(code, tables) === "glass";
}

function glassReferenceAreaM2(code, tables) {
  const dimensions = parseSizePair(articleDv(code, tables)?.dva18);
  return areaM2(dimensions.width, dimensions.height);
}

function parseSizePair(value) {
  const text = String(value || "").trim().toLowerCase().replace(",", ".");
  const match = text.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
  if (!match) return { width: 0, height: 0 };
  return {
    width: Number(match[1]) || 0,
    height: Number(match[2]) || 0
  };
}

function areaM2(widthMm, heightMm) {
  const width = Number(widthMm) || 0;
  const height = Number(heightMm) || 0;
  return width > 0 && height > 0 ? (width / 1000) * (height / 1000) : 0;
}

function costBucket(code, tables) {
  const upperCode = String(code || "").toUpperCase();
  const dv = articleDv(code, tables);
  if (upperCode.includes("AV") && String(dv?.dva17 || "").trim().toUpperCase() === "GLASS") return "glass";
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

function mechanicalUnitPrice(code, tables) {
  const historical = alartLastPurchaseCost(code, tables);
  if (historical > 0) {
    return {
      unitPrice: historical,
      sourceLabel: "Hist.",
      sourceClass: "historical"
    };
  }
  const estimated = (tables.coste_mecanica || []).find((row) => row.code === code);
  return {
    unitPrice: Number(estimated?.commercialCost || estimated?.pureMechanicalCost || 0) || 0,
    sourceLabel: estimated ? "Estim." : "Sin precio",
    sourceClass: estimated ? "estimated" : "missing"
  };
}

function mechanicalSubassembliesCostTotal(rows = [], tables = {}) {
  return rows.reduce((total, row) => {
    const price = mechanicalUnitPrice(row.code, tables);
    return total + price.unitPrice * Number(row.quantity || 0);
  }, 0);
}

function articleDescription(code, tables) {
  return (tables.alart || []).find((row) => row.code === code)?.description
    || (tables.gcesp || []).find((row) => row.code === code)?.description
    || "";
}

function articleDv(code, tables) {
  return (tables.alartdv || []).find((row) => row.code === code) || {};
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
    ? [{ value: "", label: "Sin reloj" }, ...group.rows.map(groupOption)]
    : group.rows.map(groupOption);
  return selectRow(label, `group-${group.key}`, state.config.options[group.key], options, undefined, group);
}

function groupOption(row) {
  return {
    value: row.code,
    label: row.description || row.longDescription || row.code
  };
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

function moneyNumberRow(label, key, value, min, max, step = 0.01, tone = "", confirmId = "confirmTftManualPrice") {
  return `
      <label class="form-label">${label}</label>
      <div class="money-input-wrap">
        <input class="form-control ${tone}" data-config="${key}" type="text" inputmode="decimal" value="${value ?? ""}" data-min="${min}" data-max="${max}" data-step="${step}" />
        <span class="money-input-symbol">€</span>
        <button type="button" class="row-action-button money-confirm-button" id="${confirmId}">Confirmar</button>
      </div>
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

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

function formatSquareMeters(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(number)} m2`;
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
