export function costingView(state) {
  const costing = state.costing;
  return `
    <section class="screen">
      <div class="panel">
        <div class="panel-header">
          <h2>Coste y resumen economico</h2>
          <div class="footer-actions">
            <button class="button" id="exportBomCsv" ${state.bom.consolidated.length ? "" : "disabled"}>Exportar BOM CSV</button>
            <button class="button good" id="approveCost" ${state.canApproveCost ? "" : "disabled"}>Aprobar coste</button>
          </div>
        </div>
        <div class="panel-body grid">
          <div class="status-row">
            <div class="stat"><span>Total estimado</span><strong>${money(costing.total)}</strong></div>
            <div class="stat"><span>Precios faltantes</span><strong>${costing.missingPrices}</strong></div>
            <div class="stat"><span>Estado</span><strong>${state.costApproved ? "Aprobado" : "Pendiente"}</strong></div>
          </div>
          ${costing.rows.length ? table(costing.rows) : `<div class="empty">Genere la BOM para calcular costes consolidados.</div>`}
        </div>
      </div>
    </section>
  `;
}

function table(rows) {
  const columns = ["article", "description", "totalQuantity", "unitCost", "totalCost", "costSource", "missingPrice"];
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((key) => `<th>${key}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${columns.map((key) => `<td>${format(key, row[key])}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function format(key, value) {
  if (["unitCost", "totalCost"].includes(key)) return money(value);
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toFixed(2);
  return value ?? "";
}

function money(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}
