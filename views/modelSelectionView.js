export function modelSelectionView(state) {
  const model = state.currentModel;
  return `
    <section class="screen">
      <div class="hero">
        <div>
          <h1>${model?.description || "Configurador tecnico-coste guiado por tablas"}</h1>
          <p>Seleccione un modelo definido por PNxxxy-TRL, configure opciones excluyentes o auxiliares, calcule parametros tecnicos y genere BOM solo bajo demanda autorizada.</p>
        </div>
        <div class="equipment-visual" aria-hidden="true"><div class="gantry"><div class="sign-head"></div></div></div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h2>Seleccion de modelo</h2>
          <span class="badge blue">${model?.technology || "Sin tipo"}</span>
        </div>
        <div class="panel-body grid two">
          <div class="field">
            <label>Modelo</label>
            <select id="modelSelect">
              ${state.models.map((item) => `<option value="${item.model}" ${state.selectedModel === item.model ? "selected" : ""}>${item.model} - ${item.description}</option>`).join("")}
            </select>
          </div>
          <div class="status-row">
            <div class="stat"><span>Estado BOM</span><strong>${state.bom.status}</strong></div>
            <div class="stat"><span>Estado precios</span><strong>${state.costing?.missingPrices ? "Precios faltantes" : "Disponible"}</strong></div>
            <div class="stat"><span>Rol</span><strong>${state.roleLabel}</strong></div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><h2>Versiones activas</h2></div>
        <div class="panel-body">${versions(state)}</div>
      </div>
    </section>
  `;
}

function versions(state) {
  const keys = Object.keys(state.tables);
  return `<div class="status-row">${keys.map((key) => `<div class="stat"><span>${key}</span><strong>${state.versions[key]?.rowCount ?? state.tables[key].length} filas</strong><div class="meta-text">${state.versions[key]?.fileName || "demo"}</div></div>`).join("")}</div>`;
}
