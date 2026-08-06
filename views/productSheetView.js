export function productSheetView(state, technology) {
  const isLed = technology === "LED";
  const theme = isLed ? "led" : "tft";
  const title = `FICHA PRODUCTO ${technology}`;
  return `
    <div class="product-actions">
      <div class="product-zoom-controls" aria-label="Zoom ficha de producto">
        <button type="button" class="row-action-button" data-product-zoom="-0.1">-</button>
        <span id="productZoomValue">100%</span>
        <button type="button" class="row-action-button" data-product-zoom="0.1">+</button>
      </div>
      <button type="button" class="primary-button" id="exportProductPdf">Exportar PDF</button>
    </div>
    <div class="product-sheet-stage">
      <article class="product-sheet product-sheet-${theme}">
        <header class="product-sheet-top">
          <div class="product-brand">
            <img src="brand-assets/swarco-logo-header.png" alt="Swarco" />
          </div>
          <h2>${title}</h2>
          <div class="product-meta">
            ${metaRow("FECHA", shortDate())}
            ${metaRow("Version Herramienta", state.appBuild || "-")}
          </div>
        </header>

        <section class="product-hero">
          <div class="product-image-wrap">
            ${equipmentImage(state)}
          </div>
          <div class="product-calcs">
            ${calcBox("CALCULO MECANICA AUTOMATICO", [
              ["Largo Mecanica (mm.)", productMechanicalWidth(state, isLed)],
              ["Alto Mecanica (mm.)", productMechanicalHeight(state, isLed)],
              ["TOTAL CALCULADO", formatCurrency(productCalculatedCost(state))]
            ])}
            ${calcBox("CALCULO MECANICA MANUAL", [
              ["Largo Mecanica (mm.)", isLed ? state.config.ledManualWidthMm : state.config.tftMechanicalWidthMm],
              ["Alto Mecanica (mm.)", isLed ? state.config.ledManualHeightMm : state.config.tftMechanicalHeightMm],
              ["TOTAL MANUAL", formatCurrency(productManualCost(state))]
            ])}
          </div>
        </section>

        <section class="product-description">
          <div class="product-section-title">Descripción</div>
          <div class="product-description-box">${state.currentModel.longDescription || state.currentModel.description || ""}</div>
        </section>

        <div class="product-sheet-grid">
          <div class="product-column">
            ${sectionTable("Especificaciones", productSpecRows(state))}
            ${sectionTable("Mecánica", productMechanicRows(state, isLed))}
            ${sectionTable("Eléctrico", productElectricalRows(state, isLed))}
            ${sectionTable("CARACTERÍSTICAS AMBIENTALES", productEnvironmentalRows())}
            ${bomPreviewSection(state)}
          </div>
          <div class="product-column">
            ${isLed ? ledTechnologySections(state) : tftTechnologySections(state)}
          </div>
        </div>
      </article>
    </div>
  `;
}

function productSpecRows(state) {
  return [
    ["Familia", state.currentModel.description],
    ["BASTIDOR", selectedDescription(state, "1")],
    ["PUERTA", selectedDescription(state, "2")],
    ["IP", selectedDescription(state, "3")],
    ["Rango Temperatura", selectedDescription(state, "4")],
    ["FA", selectedDescription(state, "5")],
    ["Bandeja Leds", selectedDescription(state, "2L")],
    ["Reloj", selectedDescription(state, "1L") || "-"],
    ["Posición Reloj", state.config.tftClockPosition || "-"]
  ].filter((row) => row[1] !== undefined && row[1] !== "");
}

function productMechanicRows(state, isLed) {
  const dimensions = isLed ? state.ledDimensions : state.tftDimensions;
  return [
    ["Material", isLed ? state.config.ledMaterial : state.config.tftMaterial],
    ["Peso", `${state.mechanics?.mechanicalWeightKg || 0} kg`],
    ["Dimensiones (L x A x F)", `${formatNumber(productMechanicalWidth(state, isLed))} x ${formatNumber(productMechanicalHeight(state, isLed))} mm.`],
    ["Largo visible", isLed ? formatMm(dimensions.widthMm) : formatMm(dimensions.visibleWidthMm)],
    ["Alto visible", isLed ? formatMm(dimensions.heightMm) : formatMm(dimensions.visibleHeightMm)],
    ["Protección", selectedDescription(state, "3")],
    ["Frontal", selectedDescription(state, "2")],
    ["Ventana", selectedGlass(state)]
  ];
}

function productElectricalRows(state, isLed) {
  const module = selectedLedModule(state);
  return [
    ["Alimentación", "100 - 240 VAC"],
    ["Consumo energético", isLed ? `${Math.round(state.ledCalculation?.watts || 0)} W` : "Máximo 202 W"],
    ["Protección contra rayos", "Incluida"]
  ].concat(isLed ? [["Fuente", module.faCode || "-"]] : []);
}

function productEnvironmentalRows() {
  return [
    ["Temp. funcionamiento", "-20 ºC / +60 ºC"],
    ["Temp. almacenamiento", "-20 ºC / +60 ºC"],
    ["Humedad", "entre 10% y 80%"]
  ];
}

function tftTechnologySections(state) {
  const details = state.tftDetails || {};
  return `
    ${sectionTable("TFT", [
      ["PULGADAS", details.inches || state.config.tftSizeInches || "-"],
      ["ÁREA VISIBLE", details.visibleArea || "-"],
      ["RATIO", details.format || state.config.tftAspectRatio || "-"],
      ["LUMINOSIDAD", details.brightness || "-"],
      ["RESOLUCIÓN", details.resolution || "-"]
    ])}
    ${infoBlock("Capacidad Informativa", [
      "4 líneas de 40 caracteres de 40 mm de altura y 24 mm de ancho, con más de 4 mm entre caracteres.",
      "Detección de impactos y vibraciones.",
      "Detección de puertas abiertas.",
      "Temperatura interna y alarma en caso de niveles demasiado altos.",
      "Estado del sistema de refrigeración.",
      "Fallo de la pantalla.",
      "Fallo de alimentación."
    ])}
    ${sectionTable("Procesador y Comunicaciones", [
      ["Procesador", "Quad Core 1,5 Ghz"],
      ["Memoria", "RAM 4GB"],
      ["Almacenamiento", "256 GB SSD"],
      ["Comunicaciones", "1x Ethernet 10M/100M/1G bps"]
    ])}
  `;
}

function ledTechnologySections(state) {
  const module = selectedLedModule(state);
  const calc = state.ledCalculation || {};
  return `
    ${sectionTable("LEDS", [
      ["Color LED", state.config.ledColor || module.color || "-"],
      ["Luminosidad", "4 kd/m2 tipic"],
      ["Número de Leds", calc.resolution || "-"],
      ["Formato de Caracteres", state.config.ledCharacterFormat || "-"],
      ["Distancia de legibilidad", state.config.ledLegibilityDistance ? `${state.config.ledLegibilityDistance} m` : "-"],
      ["Paso Real LEDs", `${module.pitchX || "-"} x ${module.pitchY || "-"} mm.`],
      ["Resolución Real", calc.resolution || "-"],
      ["Tamaño Área Visible", `${formatMm(state.ledDimensions?.widthMm)} x ${formatMm(state.ledDimensions?.heightMm)}`],
      ["Número de Matrices", calc.moduleCount || "-"]
    ])}
    ${infoBlock("Capacidad de Información", [
      "3 líneas de 40 caracteres de 40 mm de altura y 24 mm de ancho, con más de 4 mm entre caracteres.",
      "4 líneas de 40 caracteres de 40 mm de altura y 24 mm de ancho, con más de 4 mm entre caracteres.",
      "Pantalla dedicada al número de andén."
    ])}
    ${sectionTable("Vida útil LED", [["", "100.000 horas"]])}
    ${sectionTable("Procesador y Comunicaciones", [
      ["Procesador", "Quad Core 1,5 Ghz"],
      ["Memoria", "RAM 4GB"],
      ["Almacenamiento", "256 GB SSD"],
      ["Comunicaciones", "1x Ethernet 10M/100M/1G bps"]
    ])}
  `;
}

function bomPreviewSection(state) {
  const rows = selectedOptionRows(state).concat(auxiliaryRows(state));
  return `
    <section class="product-section">
      <div class="product-section-title green">E&A</div>
      <table class="product-table product-bom">
        <thead><tr><th>DESCRIPCION</th><th>CODIGO</th><th>Qty</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${row.description || "-"}</td><td>${row.code || "-"}</td><td>${row.quantity || 1}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function selectedOptionRows(state) {
  return Object.entries(state.config.options || {}).flatMap(([group, value]) => {
    if (group === "0" || group === "6") return [];
    const codes = Array.isArray(value) ? value : [value];
    return codes.filter(Boolean).map((code) => {
      const row = findModelRow(state, group, code);
      return { code, description: row?.description || row?.longDescription || code, quantity: 1 };
    });
  });
}

function auxiliaryRows(state) {
  const codes = Array.isArray(state.config.options?.["6"]) ? state.config.options["6"] : [];
  return codes.map((code) => {
    const row = findModelRow(state, "6", code);
    return {
      code,
      description: row?.description || row?.longDescription || code,
      quantity: state.config.auxiliaryQuantities?.[code] || 1
    };
  });
}

function sectionTable(title, rows) {
  return `
    <section class="product-section">
      <div class="product-section-title">${title}</div>
      <table class="product-table">
        <tbody>
          ${rows.map(([label, value]) => `<tr><th>${label}</th><td>${value || "-"}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function infoBlock(title, lines) {
  return `
    <section class="product-section">
      <div class="product-section-title">${title}</div>
      <div class="product-info-list">
        ${lines.map((line) => `<p>${line}</p>`).join("")}
      </div>
    </section>
  `;
}

function calcBox(title, rows) {
  return `
    <div class="product-calc-box">
      <div class="product-calc-title">${title}</div>
      <table>${rows.map(([label, value]) => `<tr><th>${label}</th><td>${value || "-"}</td></tr>`).join("")}</table>
    </div>
  `;
}

function metaRow(label, value) {
  return `<div class="product-meta-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function equipmentImage(state) {
  const model = state.currentModel?.model || state.selectedModel;
  const src = `equipment-images/${model}.PNG`;
  return `<img src="${src}" alt="${state.currentModel?.description || model}" />`;
}

function selectedDescription(state, group) {
  const code = state.config.options?.[group];
  if (Array.isArray(code)) return code.map((item) => findModelRow(state, group, item)?.description || item).join(", ");
  const row = findModelRow(state, group, code);
  return row?.description || row?.longDescription || code || "";
}

function selectedGlass(state) {
  const row = findModelRow(state, "2", state.config.options?.["2"]);
  return row?.glass || "-";
}

function findModelRow(state, group, code) {
  return (state.modelRows || []).find((row) => String(row.group).toUpperCase() === String(group).toUpperCase() && row.code === code);
}

function selectedLedModule(state) {
  return (state.tables.ct_led || []).find((row) => row.code === state.config.ledModuleCode) || {};
}

function productMechanicalWidth(state, isLed) {
  if (isLed) return state.config.ledMechanicsMode === "Manual" ? state.config.ledManualWidthMm : state.ledDimensions?.widthMm;
  return state.tftDimensions?.mechanicalWidthMm;
}

function productMechanicalHeight(state, isLed) {
  if (isLed) return state.config.ledMechanicsMode === "Manual" ? state.config.ledManualHeightMm : state.ledDimensions?.heightMm;
  return state.tftDimensions?.mechanicalHeightMm;
}

function productCalculatedCost(state) {
  return Number(state.mechanics?.mechanicalPrice || 0) || 0;
}

function productManualCost(state) {
  return Number(state.config.mechanicalManualCost || 0) || 0;
}

function shortDate() {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "numeric", year: "2-digit" }).format(new Date());
}

function formatMm(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `${number} mm` : "-";
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : "-";
}

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}
