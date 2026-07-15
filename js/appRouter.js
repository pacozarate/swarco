export const routes = [
  { key: "maintenance", label: "Tablas", icon: "DB" },
  { key: "model", label: "Modelo", icon: "MD" },
  { key: "config", label: "Configurador", icon: "CF" },
  { key: "mechanics", label: "Mecanica", icon: "ME" },
  { key: "formulas", label: "Formulas", icon: "FX", nuesoOnly: true },
  { key: "bom", label: "BOM", icon: "BM" },
  { key: "costing", label: "Coste", icon: "€" }
];

export function renderSidebar(activeRoute, context = {}) {
  const privilegedRoles = ["tecnico", "responsable", "admin"];
  const canSeeTechnicalRoutes = context.isNueso === true && privilegedRoles.includes(context.role);
  const visibleRoutes = canSeeTechnicalRoutes
    ? routes
    : routes.filter((route) => route.key === "config");
  return `
    <aside class="sidebar">
      ${visibleRoutes.map((route) => `<button class="nav-button ${activeRoute === route.key ? "active" : ""}" data-route="${route.key}"><span class="nav-icon">${route.icon}</span><span>${route.label}</span></button>`).join("")}
    </aside>
  `;
}
