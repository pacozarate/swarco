import { explodeBom } from "../js/bomExplosionEngine.js?v=20260807-v4-1-64";

export function breakdownView(state, technology) {
  const data = buildBreakdownData(state, technology);
  const isLed = data.isLed;
  return `
    <div class="breakdown-actions">
      <div class="breakdown-export-controls">
        <label for="breakdownExportFormat">Exportar</label>
        <select id="breakdownExportFormat" class="form-select">
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>
        <button type="button" class="primary-button" id="exportBreakdown">Exportar</button>
      </div>
    </div>
    <article class="breakdown-sheet breakdown-${isLed ? "led" : "tft"}">
      <header class="breakdown-top">
        <img src="brand-assets/swarco-logo-product-gray.png" alt="Swarco" />
        <h2>DESGLOSE ${technology}</h2>
        <div class="breakdown-model">
          <span>FAMILIA</span><strong>${escapeHtml(data.family || "-")}</strong>
          <span>MODELO</span><strong>${escapeHtml(data.model || "-")}</strong>
        </div>
      </header>

      ${mainSummaryTable(data.moduleRows, data.totals, isLed)}

      <div class="breakdown-layout">
        <main class="breakdown-main">
          ${simpleCostTable("EXCLUIDAS", data.excludedRows, ["GRP", "CODIGO", "Descripción", "Cantidad", "PRECIO", "Total"])}
          ${simpleCostTable("INCLUIDOS", data.includedRows, ["GRP", "CODIGO", "Descripción", "Cantidad", "PRECIO", "Total"])}
          ${simpleCostTable("AUXILIARES", data.auxRows, ["GRP", "CODIGO", "Descripción", "Cantidad", "PRECIO", "Total"])}
          ${glassTable(data.glassRows, isLed)}
          ${mechanicalTable(data.mechanicalRows)}
        </main>
        <aside class="breakdown-side">
          ${data.sideCards.map((card) => sideTable(card.title, card.rows)).join("")}
        </aside>
      </div>

      <footer class="breakdown-footer">
        <strong>Coste Total</strong>
        <span>${formatCurrency(data.totalCost)}</span>
      </footer>
    </article>
  `;
}

export function buildBreakdownData(state, technology) {
  const isLed = technology === "LED";
  const selectedModules = selectedModuleRows(state);
  const moduleRows = selectedModules.filter((row) => String(row.group) !== "6").map((row) => moduleSummaryRow(row, state, isLed));
  const auxRows = auxiliaryRows(state);
  const auxSummary = auxiliarySummary(auxRows, isLed);
  if (auxSummary) moduleRows.push(auxSummary);
  const glassRows = glassRowsForState(state, selectedModules, isLed);
  const mechanicalRows = mechanicalRowsForState(state);
  const totals = moduleTotals(moduleRows, isLed);
  const totalCost = totals.total;

  return {
    technology,
    isLed,
    family: state.currentModel?.description || "",
    model: state.selectedModel || "",
    selectedModules,
    moduleRows,
    auxRows,
    glassRows,
    mechanicalRows,
    excludedRows: excludedRows(state),
    includedRows: includedRows(state),
    totals,
    totalCost,
    sideCards: isLed ? ledSideCardData(state, totalCost) : tftSideCardData(state, totalCost)
  };
}

function mainSummaryTable(rows, totals, isLed) {
  const headers = isLed
    ? ["GRP", "CODIGO", "Descripción", "Cantidad", "noMec", "mec", "FA", "Vidrio | PC", "Modulos LED", "TOTAL", "%"]
    : ["GRP", "CODIGO", "Descripción", "Cantidad", "noMec", "mec", "Vidrio | PC", "subtotal", "TFT", "TOTAL", "%"];
  return `
    <section class="breakdown-block">
      <table class="breakdown-table breakdown-summary-table">
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => {
            const percent = totals.total > 0 ? `${Math.round((row.total / totals.total) * 100)}%` : "0%";
            return isLed ? `
              <tr>
                <td>${cell(row.group)}</td><td>${cell(row.code)}</td><td>${cell(row.description)}</td><td>${formatQuantity(row.quantity)}</td>
                <td>${formatCurrency(row.noMec)}</td><td>${formatCurrency(row.mec)}</td><td>${formatCurrency(row.fa)}</td>
                <td>${formatCurrency(row.glassPc)}</td><td>${formatCurrency(row.ledModules)}</td><td>${formatCurrency(row.total)}</td><td>${percent}</td>
              </tr>
            ` : `
              <tr>
                <td>${cell(row.group)}</td><td>${cell(row.code)}</td><td>${cell(row.description)}</td><td>${formatQuantity(row.quantity)}</td>
                <td>${formatCurrency(row.noMec)}</td><td>${formatCurrency(row.mec)}</td><td>${formatCurrency(row.glassPc)}</td>
                <td>${formatCurrency(row.subtotal)}</td><td>${formatCurrency(row.tft)}</td><td>${formatCurrency(row.total)}</td><td>${percent}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
        <tfoot>
          ${isLed ? `
            <tr><td colspan="4">TOTAL</td><td>${formatCurrency(totals.noMec)}</td><td>${formatCurrency(totals.mec)}</td><td>${formatCurrency(totals.fa)}</td><td>${formatCurrency(totals.glassPc)}</td><td>${formatCurrency(totals.ledModules)}</td><td>${formatCurrency(totals.total)}</td><td>100%</td></tr>
          ` : `
            <tr><td colspan="4">TOTAL</td><td>${formatCurrency(totals.noMec)}</td><td>${formatCurrency(totals.mec)}</td><td>${formatCurrency(totals.glassPc)}</td><td>${formatCurrency(totals.subtotal)}</td><td>${formatCurrency(totals.tft)}</td><td>${formatCurrency(totals.total)}</td><td>100%</td></tr>
          `}
        </tfoot>
      </table>
    </section>
  `;
}

function selectedModuleRows(state) {
  const rows = [];
  Object.entries(state.config.options || {}).forEach(([group, value]) => {
    const codes = Array.isArray(value) ? value : [value];
    codes.filter(Boolean).forEach((code) => {
      const row = (state.modelRows || []).find((item) => same(item.group, group) && item.code === code);
      if (row) rows.push(row);
    });
  });
  return rows;
}

function moduleSummaryRow(moduleRow, state, isLed) {
  const summary = explodeModule(moduleRow.root || moduleRow.code, state).reduce((sum, row) => {
    const amount = rowCost(row.article, state.tables) * Number(row.quantity || 0);
    const bucket = costBucket(row.article, state.tables, state, isLed);
    sum[bucket] += amount;
    return sum;
  }, emptySummary());
  if (isLed && String(moduleRow.group).toUpperCase() === "2L") applyLedSupplements(summary, state);
  const tft = !isLed && String(moduleRow.group) === "2" ? currentTftPrice(state) : 0;
  const subtotal = summary.noMec + summary.mec + summary.glassPc;
  return {
    group: moduleRow.group,
    code: moduleRow.code,
    description: moduleRow.description || moduleRow.longDescription || "",
    quantity: Number(moduleRow.quantity || 1),
    ...summary,
    subtotal,
    tft,
    total: subtotal + summary.fa + summary.ledModules + tft
  };
}

function emptySummary() {
  return { noMec: 0, mec: 0, fa: 0, glassPc: 0, ledModules: 0 };
}

function moduleTotals(rows, isLed) {
  return rows.reduce((sum, row) => {
    sum.noMec += row.noMec || 0;
    sum.mec += row.mec || 0;
    sum.fa += row.fa || 0;
    sum.glassPc += row.glassPc || 0;
    sum.ledModules += row.ledModules || 0;
    sum.subtotal += row.subtotal || 0;
    sum.tft += row.tft || 0;
    sum.total += row.total || 0;
    return sum;
  }, { noMec: 0, mec: 0, fa: 0, glassPc: 0, ledModules: 0, subtotal: 0, tft: 0, total: 0, isLed });
}

function auxiliaryRows(state) {
  const group = (state.optionGroups || []).find((item) => item.key === "6");
  if (!group) return [];
  const selected = new Set(Array.isArray(state.config.options?.["6"]) ? state.config.options["6"] : []);
  return group.rows
    .filter((row) => selected.has(row.code))
    .map((row) => {
      const quantity = Number(state.config.auxiliaryQuantities?.[row.code] || 1);
      const unit = explodeModule(row.root || row.code, state).reduce((sum, bomRow) => sum + rowCost(bomRow.article, state.tables) * Number(bomRow.quantity || 0), 0);
      return {
        group: "AUX",
        code: row.code,
        description: row.description || row.longDescription || "",
        quantity,
        unitPrice: unit,
        total: unit * quantity
      };
    });
}

function auxiliarySummary(rows, isLed) {
  if (!rows.length) return null;
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return {
    group: 6,
    code: "AUXILIARES",
    description: "Auxiliares seleccionados",
    quantity: rows.reduce((sum, row) => sum + row.quantity, 0),
    noMec: total,
    mec: 0,
    fa: 0,
    glassPc: 0,
    ledModules: 0,
    subtotal: total,
    tft: 0,
    total,
    isLed
  };
}

function excludedRows(state) {
  const selected = new Set(state.config.excAnnulledRefs || []);
  if (!selected.size) return [];
  return [...selected].map((key) => {
    const [, code] = String(key).split("|");
    return { group: "EXC", code, description: articleDescription(code, state.tables), quantity: 1, unitPrice: rowCost(code, state.tables), total: rowCost(code, state.tables) };
  });
}

function includedRows(state) {
  return Object.values(state.config.excReplacements || {})
    .filter((row) => row.enabled)
    .map((row) => {
      const quantity = Number(row.quantity || 1);
      const price = Number(row.price || 0);
      return { group: "INCL", code: row.code || "-", description: row.description || "-", quantity, unitPrice: price, total: quantity * price };
    });
}

function glassRowsForState(state, selectedModules, isLed) {
  const visibleArea = isLed
    ? areaM2(state.ledDimensions?.widthMm, state.ledDimensions?.heightMm)
    : areaM2(state.tftDimensions?.visibleWidthMm, state.tftDimensions?.visibleHeightMm);
  return selectedModules.flatMap((moduleRow) => explodeModule(moduleRow.root || moduleRow.code, state)
    .filter((row) => costBucket(row.article, state.tables, state, isLed) === "glassPc")
    .map((row) => {
      const unitPrice = rowCost(row.article, state.tables);
      return {
        group: moduleRow.group,
        code: row.article,
        description: articleDescription(row.article, state.tables),
        quantity: Number(row.quantity || 1),
        visibleArea,
        priceM2: visibleArea > 0 ? unitPrice / visibleArea : unitPrice,
        unitPrice,
        total: unitPrice * Number(row.quantity || 1)
      };
    }));
}

function mechanicalRowsForState(state) {
  return (state.mechanicalSubassemblies?.rows || []).map((row) => {
    const price = mechanicalUnitPrice(row.code, state.tables);
    const quantity = Number(row.quantity || 0);
    return {
      group: row.parent || row.origin || "-",
      code: row.code,
      description: row.description,
      quantity,
      material: state.currentModel?.technology === "LED" ? state.config.ledMaterial : state.config.tftMaterial,
      weight: Number(row.weightKg || 0),
      unitPrice: price.unitPrice,
      total: price.unitPrice * quantity
    };
  });
}

function simpleCostTable(title, rows, headers) {
  const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  return `
    <section class="breakdown-block">
      <h3>${escapeHtml(title)}</h3>
      <table class="breakdown-table">
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.length ? rows.map((row) => `
            <tr><td>${cell(row.group)}</td><td>${cell(row.code)}</td><td>${cell(row.description)}</td><td>${formatQuantity(row.quantity)}</td><td>${formatCurrency(row.unitPrice)}</td><td>${formatCurrency(row.total)}</td></tr>
          `).join("") : `<tr><td colspan="${headers.length}">NO</td></tr>`}
        </tbody>
        <tfoot><tr><td colspan="${headers.length - 1}">TOTAL</td><td>${formatCurrency(total)}</td></tr></tfoot>
      </table>
    </section>
  `;
}

function glassTable(rows, isLed) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return `
    <section class="breakdown-block">
      <h3>${isLed ? "VIDRIO / PC" : "GLASS"}</h3>
      <table class="breakdown-table">
        <thead><tr><th>GRP</th><th>CODIGO</th><th>Descripción</th><th>Cantidad</th><th>Area Visible (m2)</th><th>€/m2</th><th>Total</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((row) => `
            <tr><td>${cell(row.group)}</td><td>${cell(row.code)}</td><td>${cell(row.description)}</td><td>${formatQuantity(row.quantity)}</td><td>${formatNumber(row.visibleArea)}</td><td>${formatCurrency(row.priceM2)}</td><td>${formatCurrency(row.total)}</td></tr>
          `).join("") : `<tr><td colspan="7">NO</td></tr>`}
        </tbody>
        <tfoot><tr><td colspan="6">TOTAL</td><td>${formatCurrency(total)}</td></tr></tfoot>
      </table>
    </section>
  `;
}

function mechanicalTable(rows) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return `
    <section class="breakdown-block">
      <h3>MECANICA</h3>
      <table class="breakdown-table">
        <thead><tr><th>GRP</th><th>CODIGO</th><th>Descripción</th><th>Cantidad</th><th>Material</th><th>Peso</th><th>Coste Est.</th><th>Total</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((row) => `
            <tr><td>${cell(row.group)}</td><td>${cell(row.code)}</td><td>${cell(row.description)}</td><td>${formatQuantity(row.quantity)}</td><td>${cell(row.material)}</td><td>${formatNumber(row.weight)}</td><td>${formatCurrency(row.unitPrice)}</td><td>${formatCurrency(row.total)}</td></tr>
          `).join("") : `<tr><td colspan="8">NO</td></tr>`}
        </tbody>
        <tfoot><tr><td colspan="7">TOTAL</td><td>${formatCurrency(total)}</td></tr></tfoot>
      </table>
    </section>
  `;
}

function ledSideCardData(state, totalCost) {
  const module = (state.tables.ct_led || []).find((row) => row.code === state.config.ledModuleCode) || {};
  return [
    { title: "LEDS", rows: [
      ["Color LED", state.config.ledColor || module.color || "-"],
      ["Paso entre LEDs", `${module.pitchX || "-"} x ${module.pitchY || "-"} mm`],
      ["Resolucion", state.ledCalculation?.resolution || "-"],
      ["Nº modulos", state.ledCalculation?.moduleCount || 0],
      ["Nº fuentes", state.ledCalculation?.faCount || 0]
    ] },
    { title: "MODULOS", rows: [
      ["Matriz", state.config.ledModuleCode || "-"],
      ["FA", module.faCode || "-"],
      ["Area visible", `${formatNumber(state.ledDimensions?.widthMm)} x ${formatNumber(state.ledDimensions?.heightMm)} mm`]
    ] },
    { title: "CALCULO MECANICA", rows: [
      ["Largo Mecanica", `${state.config.ledMechanicsMode === "Manual" ? state.config.ledManualWidthMm : state.ledDimensions?.widthMm || "-"} mm`],
      ["Alto Mecanica", `${state.config.ledMechanicsMode === "Manual" ? state.config.ledManualHeightMm : state.ledDimensions?.heightMm || "-"} mm`],
      ["Peso Mecanica", `${state.mechanics?.mechanicalWeightKg || 0} kg`],
      ["Coste Total", formatCurrency(totalCost)]
    ] }
  ];
}

function tftSideCardData(state, totalCost) {
  return [
    { title: "CALCULO TFT", rows: [
      ["Tamaño en Pulgadas", state.tftDetails?.inches || state.config.tftSizeInches || "-"],
      ["Aspect ratio", state.tftDetails?.format || state.config.tftAspectRatio || "-"],
      ["Luminosidad", state.tftDetails?.brightness || "-"],
      ["Resolucion", state.tftDetails?.resolution || "-"],
      ["Precio final", formatCurrency(currentTftPrice(state))]
    ] },
    { title: "MEC. CALCULO AUTOMATICO", rows: [
      ["Largo Visible", `${state.tftDimensions?.visibleWidthMm || "-"} mm`],
      ["Alto Visible", `${state.tftDimensions?.visibleHeightMm || "-"} mm`],
      ["Largo Mecanica", `${state.tftDimensions?.mechanicalWidthMm || "-"} mm`],
      ["Alto Mecanica", `${state.tftDimensions?.mechanicalHeightMm || "-"} mm`]
    ] },
    { title: "RESUMEN COSTE", rows: [
      ["Material", state.config.tftMaterial || "-"],
      ["Peso Mecanica", `${state.mechanics?.mechanicalWeightKg || 0} kg`],
      ["Coste Total", formatCurrency(totalCost)]
    ] }
  ];
}

function sideTable(title, rows) {
  return `
    <section class="breakdown-side-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="breakdown-side-grid">
        ${rows.map(([label, value]) => `
          <div class="breakdown-side-row">
            <div class="breakdown-side-label">${cell(label)}</div>
            <div class="breakdown-side-value">${cell(value)}</div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function explodeModule(root, state) {
  if (!root) return [];
  return explodeBom({ roots: [root], cplismatRows: state.tables.cplismat || [], maxLevel: 6 });
}

function applyLedSupplements(summary, state) {
  const module = (state.tables.ct_led || []).find((row) => row.code === state.config.ledModuleCode) || {};
  summary.ledModules += rowCost(state.config.ledModuleCode, state.tables) * Number(state.ledCalculation?.moduleCount || 0);
  summary.fa += rowCost(module.faCode, state.tables) * Number(state.ledCalculation?.faCount || 0);
}

function costBucket(code, tables, state, isLed) {
  const upper = String(code || "").toUpperCase();
  const dv = (tables.alartdv || []).find((row) => row.code === code) || {};
  const description = String(articleDescription(code, tables)).toUpperCase();
  const module = (state.tables?.ct_led || []).find((row) => row.code === state.config?.ledModuleCode) || {};
  if (isLed && upper === String(state.config?.ledModuleCode || "").toUpperCase()) return "ledModules";
  if (isLed && upper === String(module.faCode || "").toUpperCase()) return "fa";
  if (String(dv.dva17 || "").trim().toUpperCase() === "GLASS" || upper.includes("AV") || description.includes("VIDRIO") || description.includes("POLICARBONATO")) return "glassPc";
  if (String(dv.dva19 || dv.dva17 || "").trim().toUpperCase() === "M" || /AM\d+/.test(upper)) return "mec";
  return "noMec";
}

function rowCost(code, tables) {
  if (!code) return 0;
  const alart = (tables.alart || []).find((row) => row.code === code);
  if (Number(alart?.pultcomp || 0) > 0) return Number(alart.pultcomp);
  const offer = (tables.gcesp || []).filter((row) => row.code === code && Number(row.price) > 0).sort((a, b) => compareDateDesc(a.validFrom, b.validFrom))[0];
  if (offer) return Number(offer.price || 0);
  const history = (tables.alhis || []).filter((row) => row.code === code && Number(row.price || row.realCost || row.averageCost || 0) > 0).sort((a, b) => compareDateDesc(a.date, b.date))[0];
  return Number(history?.price || history?.realCost || history?.averageCost || alart?.pmp || 0) || 0;
}

function mechanicalUnitPrice(code, tables) {
  const historical = (tables.alart || []).find((row) => row.code === code);
  if (Number(historical?.pultcomp || 0) > 0) return { unitPrice: Number(historical.pultcomp) };
  const estimated = (tables.coste_mecanica || []).find((row) => row.code === code);
  return { unitPrice: Number(estimated?.commercialCost || estimated?.pureMechanicalCost || 0) || 0 };
}

function currentTftPrice(state) {
  if (state.config.tftSelectionMode === "Manual") return Number(state.config.tftManualPrice || 0) || 0;
  return Number(state.config.tftSelectedPrice || 0) || 0;
}

function articleDescription(code, tables) {
  return (tables.alart || []).find((row) => row.code === code)?.description
    || (tables.gcesp || []).find((row) => row.code === code)?.description
    || code
    || "";
}

function areaM2(widthMm, heightMm) {
  const width = Number(widthMm) || 0;
  const height = Number(heightMm) || 0;
  return width > 0 && height > 0 ? (width / 1000) * (height / 1000) : 0;
}

function compareDateDesc(a, b) {
  return String(b || "").localeCompare(String(a || ""));
}

function same(a, b) {
  return String(a).toUpperCase() === String(b).toUpperCase();
}

function cell(value) {
  return escapeHtml(value ?? "-");
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

function formatQuantity(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 }).format(number) : "-";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
