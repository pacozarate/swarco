import { tableDefinitions } from "../js/importExcel.js?v=20260716-v4-1-16";

export function maintenanceView(state) {
  return `
    <section class="screen">
      <div class="panel">
        <div class="panel-header">
          <h2>Mantenimiento de tablas</h2>
          <span class="badge ${state.canUpload ? "ok" : "warn"}">${state.canUpload ? "Carga autorizada" : "Solo consulta"}</span>
        </div>
        <div class="panel-body grid">
          <div class="notice">Cargue Excel o CSV actualizados por tabla. La aplicacion conserva version, huella y recomendacion de accion. La BOM no se recalcula automaticamente.</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Tabla</th><th>Archivo activo</th><th>Filas</th><th>Huella</th><th>Estado</th><th>Accion recomendada</th><th>Carga</th></tr></thead>
              <tbody>
                ${tableDefinitions.map((table) => tableRow(table, state)).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h2>Validacion</h2>
          <button class="button" id="validateTables">Validar tablas</button>
        </div>
        <div class="panel-body">
          ${state.issues.length ? issuesTable(state.issues) : `<div class="empty">Sin incidencias calculadas. Pulse Validar tablas para revisar reglas criticas.</div>`}
        </div>
      </div>
    </section>
  `;
}

function tableRow(table, state) {
  const version = state.versions[table.key];
  const change = state.changes[table.key];
  return `
    <tr>
      <td><strong>${table.label}</strong></td>
      <td>${version?.fileName || "Datos demo"}</td>
      <td>${version?.rowCount ?? (state.tables[table.key]?.length || 0)}</td>
      <td><code>${version?.checksum?.slice(0, 12) || "demo"}</code></td>
      <td>${change?.status || "Version activa"}</td>
      <td>${change?.recommendation || "Sin accion"}</td>
      <td><input type="file" data-upload="${table.key}" accept=".xlsx,.xls,.csv" ${state.canUpload ? "" : "disabled"} /></td>
    </tr>
  `;
}

function issuesTable(issues) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Incidencia</th><th>Articulo</th><th>Detalle</th></tr></thead>
        <tbody>${issues.map((issue) => `<tr><td><span class="badge bad">${issue.code}</span></td><td>${issue.article}</td><td>${issue.message}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}
