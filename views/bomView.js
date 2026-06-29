export function bomView(state) {
  return `
    <section class="screen">
      <div class="panel">
        <div class="panel-header">
          <div><h2>BOM</h2><div class="meta-text">Estado: ${state.bom.status} · Version: ${state.bom.version || "-"}</div></div>
          <button class="button primary" id="updateBom" ${state.canUpdateBom ? "" : "disabled"}>Actualizar BOM</button>
        </div>
        <div class="panel-body grid">
          ${state.canUpdateBom ? "" : `<div class="notice">El rol actual no tiene permiso BOM_RECALCULATE. La explosion solo se ejecuta por usuario autorizado.</div>`}
          <div class="tabs">
            <button class="tab ${state.bomTab === "exploded" ? "active" : ""}" data-bom-tab="exploded">Explosionada</button>
            <button class="tab ${state.bomTab === "consolidated" ? "active" : ""}" data-bom-tab="consolidated">Consolidada</button>
          </div>
          ${state.bomTab === "exploded" ? exploded(state) : consolidated(state)}
        </div>
      </div>
    </section>
  `;
}

function exploded(state) {
  if (!state.bom.exploded.length) return `<div class="empty">No hay BOM generada. Pulse Actualizar BOM con un rol autorizado.</div>`;
  return table(state.bom.exploded, ["root", "p1", "p2", "p3", "p4", "p5", "p6", "article", "parent", "quantity", "level", "routeId", "warning"]);
}

function consolidated(state) {
  if (!state.bom.consolidated.length) return `<div class="empty">No hay BOM consolidada.</div>`;
  return table(state.bom.consolidated, ["article", "description", "totalQuantity", "unitCost", "totalCost", "costSource", "routesCount", "missingPrice"]);
}

function table(rows, columns) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((key) => `<th>${key}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${columns.map((key) => `<td>${format(row[key])}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function format(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toFixed(2);
  return value ?? "";
}
