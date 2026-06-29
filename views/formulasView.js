export function formulasView(state) {
  return `
    <section class="screen">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Editor de formulas</h2>
            <div class="meta-text">Acceso NUESO · Rol actual: ${state.roleLabel}</div>
          </div>
          <div class="footer-actions">
            <button class="button ghost" id="resetFormulas">Restaurar</button>
            <button class="button primary" id="saveFormulas">Aplicar formulas</button>
          </div>
        </div>
        <div class="panel-body grid">
          ${state.formulaEditorMessage ? `<div class="notice">${state.formulaEditorMessage}</div>` : ""}
          <div class="status-row">
            <div class="stat"><span>Campos calculados</span><strong>${state.calculatedFields.length}</strong></div>
            <div class="stat"><span>Editables ahora</span><strong>${state.calculatedFields.filter((field) => field.editable).length}</strong></div>
            <div class="stat"><span>Modelo activo</span><strong>${state.currentModel.model}</strong></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Formulas editables</h2></div>
        <div class="panel-body formula-list">
          ${state.calculatedFields.filter((field) => field.editable).map((field) => formulaEditor(field, state)).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Todos los campos calculados</h2></div>
        <div class="panel-body">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Categoria</th><th>Campo</th><th>Valor actual</th><th>Formula / regla</th><th>Estado</th></tr></thead>
              <tbody>
                ${state.calculatedFields.map((field) => `
                  <tr>
                    <td>${field.category}</td>
                    <td>${field.label}</td>
                    <td>${field.value}</td>
                    <td><code>${field.formula}</code></td>
                    <td>${field.error ? `<span class="badge bad">${field.error}</span>` : field.editable ? `<span class="badge ok">Editable</span>` : `<span class="badge">Solo lectura</span>`}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Variables disponibles</h2></div>
        <div class="panel-body">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Variable</th><th>Valor actual</th></tr></thead>
              <tbody>${state.formulaContextRows.map((row) => `<tr><td><code>${row.name}</code></td><td>${formatValue(row.value)}</td></tr>`).join("")}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}

function formulaEditor(field, state) {
  const formula = state.formulas[field.key];
  return `
    <div class="formula-card">
      <div>
        <h3>${field.label}</h3>
        <p>${formula?.description || ""}</p>
      </div>
      <div class="formula-meta">
        <span class="badge blue">${formula?.category || field.category}</span>
        <span class="badge">${formula?.unit || ""}</span>
        ${field.error ? `<span class="badge bad">${field.error}</span>` : `<span class="badge ok">OK</span>`}
      </div>
      <textarea data-formula-key="${field.key}" spellcheck="false">${formula?.expression || field.formula}</textarea>
      <div class="meta-text">Valor actual: <strong>${field.value}</strong></div>
    </div>
  `;
}

function formatValue(value) {
  return typeof value === "number" ? Number(value.toFixed(6)).toString() : value;
}
