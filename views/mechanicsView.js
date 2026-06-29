export function mechanicsView(state) {
  const result = state.mechanics;
  return `
    <section class="screen">
      <div class="panel">
        <div class="panel-header">
          <h2>Mecanica</h2>
          <span class="badge">${result.source} ${result.version}</span>
        </div>
        <div class="panel-body grid two">
          <div class="status-row">
            <div class="stat"><span>Coste mecanico</span><strong>${money(result.mechanicalPrice)}</strong></div>
            <div class="stat"><span>Peso mecanica</span><strong>${result.mechanicalWeightKg || 0} kg</strong></div>
            <div class="stat"><span>Modelo</span><strong>${state.currentModel.model}</strong></div>
            <div class="stat"><span>Tecnologia</span><strong>${state.currentModel.technology}</strong></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Concepto</th><th>Importe</th></tr></thead>
              <tbody>${result.breakdown.map((row) => `<tr><td>${row.concept}</td><td>${formatBreakdown(row)}</td></tr>`).join("")}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}

function money(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}

function formatBreakdown(row) {
  return row.concept.toLowerCase().includes("peso") ? `${row.amount} kg` : money(row.amount);
}
