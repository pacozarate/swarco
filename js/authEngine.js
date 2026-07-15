export const ROLES = {
  consulta: {
    label: "Usuario normal",
    permissions: []
  },
  tecnico: {
    label: "Tecnico NUESO",
    permissions: ["TABLE_UPLOAD", "TABLE_VALIDATE", "BOM_RECALCULATE", "PRICE_RECALCULATE", "MECHANICS_RECALCULATE", "FORMULA_EDIT"]
  },
  responsable: {
    label: "Responsable tecnico",
    permissions: ["TABLE_UPLOAD", "TABLE_VALIDATE", "BOM_RECALCULATE", "PRICE_RECALCULATE", "MECHANICS_RECALCULATE", "FORMULA_EDIT", "COST_APPROVE"]
  },
  comercial: {
    label: "Comercial",
    permissions: []
  },
  admin: {
    label: "Administrador",
    permissions: ["TABLE_UPLOAD", "TABLE_VALIDATE", "BOM_RECALCULATE", "PRICE_RECALCULATE", "MECHANICS_RECALCULATE", "FORMULA_EDIT", "COST_APPROVE", "ADMIN"]
  }
};

export function can(roleKey, permission) {
  return ROLES[roleKey]?.permissions.includes(permission) ?? false;
}

export function isNuesoRole(roleKey) {
  return ["tecnico", "responsable", "admin"].includes(roleKey);
}
