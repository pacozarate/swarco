import { ROLES } from "../js/authEngine.js?v=20260716-v4-1-34";

export function renderHeader(state, actions) {
  return `
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark">S</div>
        <div class="brand-copy">
          <strong>Configurador SWARCO</strong>
          <span>NUESO TECH / NUESO GROUP · v${state.appVersion || "-"}</span>
        </div>
      </div>
      <div class="top-actions">
        <label class="field" style="min-width:220px">
          <span class="meta-text">Modo de acceso</span>
          <select id="roleSelect">
            ${Object.entries(ROLES).map(([key, role]) => `<option value="${key}" ${state.role === key ? "selected" : ""}>${role.label}</option>`).join("")}
          </select>
        </label>
        <button class="button ghost" id="exportTrace">Exportar trazabilidad</button>
      </div>
    </header>
  `;
}

export function bindHeader(actions) {
  document.querySelector("#roleSelect")?.addEventListener("change", (event) => actions.setRole(event.target.value, event.target));
  document.querySelector("#exportTrace")?.addEventListener("click", actions.exportTrace);
}
