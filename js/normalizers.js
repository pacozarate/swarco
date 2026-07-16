const aliases = {
  alart: {
    code: ["code", "codigo", "articulo", "codart", "cod"],
    description: ["description", "descripcion", "descrip", "nombre", "descri1", "des"],
    pmp: ["pmp", "precio", "precio_medio", "precio medio ponderado", "pmedpon", "pultcomp", "pcoste", "coste"],
    pultcomp: ["pultcomp", "precio_ultima_compra", "precio ultima compra"],
    type: ["type", "tipo", "tipo_articulo", "clase", "tipart", "tigte"]
  },
  alartdv: {
    code: ["code", "codigo", "articulo", "codart"],
    dva17: ["dva17"],
    dva18: ["dva18"],
    dva19: ["dva19"],
    dva20: ["dva20"],
    dva37: ["dva37"],
    dva38: ["dva38"],
    dva39: ["dva39"],
    dva40: ["dva40"]
  },
  cplismat: {
    codsup: ["codsup", "padre", "parent"],
    codele: ["codele", "hijo", "componente", "child"],
    cannec: ["cannec", "cantidad", "qty", "quantity"],
    fecfin: ["fecfin", "validto", "valid_to", "fecha_fin"],
    tipart: ["tipart", "tipo", "type"]
  },
  gcesp: {
    code: ["code", "codigo", "articulo", "codart"],
    price: ["price", "precio", "tarifa", "pre"],
    supplier: ["supplier", "proveedor", "codpro"],
    validFrom: ["validfrom", "fecha", "fecha_tarifa", "valid_from", "fvdesde", "fecact"],
    validTo: ["validto", "valid_to", "fvhasta"],
    batch: ["batch", "lote", "lotecom"],
    description: ["description", "descripcion", "des"]
  },
  alhis: {
    code: ["code", "codigo", "articulo", "codart"],
    realCost: ["realcost", "coste_real", "coste", "precio", "prec", "pmedpon", "premedpon"],
    date: ["date", "fecha", "fecmov", "fecintro"],
    quantity: ["quantity", "cantidad", "cant"],
    price: ["price", "precio", "prec"],
    movement: ["movement", "moves"],
    supplier: ["supplier", "proveedor", "clprfab"],
    expiration: ["expiration", "feccad"],
    averageCost: ["averagecost", "premedpon"]
  },
  ct_tft: {
    code: ["code", "codigo", "articulo", "codart", "tft", "referencia_swarco"],
    description: ["description", "descripcion", "referencia_fab", "fabricante"],
    active: ["active", "activo"],
    inches: ["inches", "pulgadas", "tamano"],
    inchesNumber: ["inchesnumber", "tamanonum", "tamaño_num", "tamaño num"],
    format: ["format", "formato", "aspect_ratio"],
    brightness: ["brightness", "luminosidad"],
    resolution: ["resolution", "resolucion"],
    resolutionWidth: ["resolutionwidth", "reslargo"],
    resolutionHeight: ["resolutionheight", "resalto"],
    visibleArea: ["visiblearea", "area_visible", "tamano_area_activa"],
    outerSize: ["outersize", "tamano_exterior", "tamano_1"],
    manufacturer: ["manufacturer", "fabricante"],
    tempRange: ["temprange", "rango_temp", "rango_temp."]
  },
  ct_led: {
    code: ["code", "codigo", "articulo", "codart", "modulo", "referencia_swarco"],
    description: ["description", "descripcion", "col_3"],
    color: ["color", "color_led", "color_de_led"],
    moduleColumns: ["modulecolumns", "resolucion_modulo_x", "resolucion_de_modulo_en_x"],
    moduleRows: ["modulerows", "resolucion_modulo_y", "resolucion_de_modulo_en_y"],
    pitchX: ["pitchx", "paso_x", "paso_en_x"],
    pitchY: ["pitchy", "paso_y", "paso_en_y"],
    pasoxy: ["pasoxy"],
    currentModule: ["currentmodule", "corriente_modulo", "a_total"],
    faCode: ["facode", "codigo_fa", "fa", "fuente", "cod_swarco_fa"],
    faCurrent: ["facurrent", "corriente_fa", "corriente_maxima_fa", "adc_(a)", "adc"],
    faVoltage: ["favoltage", "voltaje_fa", "voltaje", "vdc_(v)", "vdc"],
    dataCableCode: ["datacablecode", "cable_datos", "cable_datos_(50mm)"],
    powerCableCode: ["powercablecode", "cable_potencia", "conector_alimentacion"]
  },
  mecanica: {
    model: ["model", "modelo"],
    technology: ["technology", "tecnologia", "tipo"],
    basePrice: ["baseprice", "precio_base", "precio"],
    pricePerMm2: ["pricepermm2", "precio_mm2"],
    setup: ["setup"],
    version: ["version"]
  },
  dimensiones_base: {
    model: ["model", "modelo", "codigo_equipo", "codigo equipo", "código equipo"],
    morphology: ["morphology", "morfologia"],
    weightKg: ["weightkg", "peso", "kg"],
    inches: ["inches", "pulgadas"],
    aspectRatio: ["aspectratio", "aspect_ratio"],
    totalWidthMm: ["totalwidthmm", "largo_total_(mm)", "largo_total_mm", "largo total (mm)"],
    totalHeightMm: ["totalheightmm", "alto_total_(mm)", "alto_total_mm", "alto total (mm)"],
    visibleWidthMm: ["visiblewidthmm", "largo_visible_(mm)", "largo_visible_mm", "largo visible (mm)"],
    visibleHeightMm: ["visibleheightmm", "alto_visible_(mm)", "alto_visible_mm", "alto visible (mm)"],
    activeWidthMm: ["activewidthmm", "largo_area_activa_(mm)", "largo_area_activa_mm", "largo área activa (mm)"],
    activeHeightMm: ["activeheightmm", "alto_area_activa_(mm)", "alto_area_activa_mm", "alto área activa (mm)"],
    bezelWidthMm: ["bezelwidthmm", "bezel_largo_(mm)", "bezel_largo_mm", "bezel largo (mm)"],
    bezelHeightMm: ["bezelheightmm", "bezel_alto_(mm)", "bezel_alto_mm", "bezel alto (mm)"],
    borderWidthMm: ["borderwidthmm", "borde_largo_(mm)", "borde_largo_mm", "borde largo (mm)"],
    borderHeightMm: ["borderheightmm", "borde_alto_(mm)", "borde_alto_mm", "borde alto (mm)"]
  },
  trl: {
    model: ["model", "modelo", "raiz"],
    group: ["group", "grupo"],
    code: ["code", "codigo", "articulo", "codart"],
    description: ["description", "descripcion", "descripcion_herramienta"],
    type: ["type", "tipo"],
    image: ["image", "imagen"],
    root: ["root", "raiz", "bom_root"],
    default: ["default", "defecto", "por_defecto"]
  }
};

export function normalizeRows(tableName, rows) {
  const key = tableName.toLowerCase();
  return rows
    .map((row) => normalizeRow(key, row))
    .filter((row) => Object.values(row).some((value) => value !== ""))
    .filter((row) => keepAppRow(key, row));
}

function normalizeRow(tableName, row) {
  const result = {};
  const source = {};
  Object.entries(row).forEach(([key, value]) => {
    source[cleanKey(key)] = normalizeValue(value);
  });

  Object.entries(aliases[tableName] ?? {}).forEach(([target, possibleKeys]) => {
    const match = possibleKeys.map(cleanKey).find((alias) => source[alias] !== undefined);
    result[target] = match ? source[match] : "";
  });
  normalizeCodes(tableName, result);

  if (tableName === "trl" && !result.root) result.root = result.code;
  if (tableName === "ct_tft" && result.inches) result.inches = String(result.inches).replace(/''|"/g, "");
  if (tableName === "ct_led") {
    ["moduleColumns", "moduleRows", "pitchX", "pitchY", "currentModule"].forEach((field) => {
      if (result[field] !== undefined) result[field] = toNumber(result[field], 0);
    });
  }
  if (tableName === "cplismat") result.cannec = toNumber(result.cannec, 0);
  if (tableName === "dimensiones_base") {
    ["weightKg", "totalWidthMm", "totalHeightMm", "visibleWidthMm", "visibleHeightMm", "activeWidthMm", "activeHeightMm", "bezelWidthMm", "bezelHeightMm", "borderWidthMm", "borderHeightMm"].forEach((field) => {
      if (result[field] !== undefined) result[field] = toNumber(result[field], 0);
    });
  }
  if (["alart", "gcesp", "alhis", "ct_led", "mecanica"].includes(tableName)) {
    ["pmp", "pultcomp", "price", "realCost", "faCurrent", "faVoltage", "basePrice", "pricePerMm2", "setup"].forEach((field) => {
      if (result[field] !== undefined) result[field] = toNumber(result[field], 0);
    });
  }
  normalizeAppDates(tableName, result);
  return result;
}

function keepAppRow(tableName, row) {
  const cutoff = new Date("2020-01-01T00:00:00");
  const today = startOfToday();
  if (tableName === "alhis") {
    const movementDate = toDate(row.date);
    return Boolean(row.code)
      && String(row.movement || "").trim().toUpperCase() === "E"
      && movementDate !== null
      && movementDate >= cutoff;
  }
  if (tableName === "gcesp") {
    const validFrom = toDate(row.validFrom) || new Date(0);
    const validTo = toDate(row.validTo) || new Date("9999-12-31T00:00:00");
    return Boolean(row.code)
      && validTo > today
      && validTo >= cutoff
      && validFrom < new Date("2027-01-01T00:00:00");
  }
  if (tableName === "cplismat") {
    const validTo = toDate(row.fecfin);
    return Boolean(row.codsup)
      && Boolean(row.codele)
      && Number(row.cannec) > 0
      && validTo !== null
      && validTo >= today;
  }
  return true;
}

function normalizeAppDates(tableName, row) {
  const dateFields = {
    alhis: ["date", "expiration"],
    gcesp: ["validFrom", "validTo"],
    cplismat: ["fecfin"]
  }[tableName] || [];
  dateFields.forEach((field) => {
    if (row[field]) row[field] = formatDate(row[field]);
  });
}

function normalizeCodes(tableName, row) {
  const fields = {
    alart: ["code"],
    alartdv: ["code"],
    cplismat: ["codsup", "codele"],
    gcesp: ["code"],
    alhis: ["code"],
    ct_tft: ["code"],
    ct_led: ["code", "faCode", "dataCableCode", "powerCableCode"],
    mecanica: [],
    dimensiones_base: ["model"],
    trl: ["model", "code", "root"]
  }[tableName] || [];
  fields.forEach((field) => {
    if (row[field]) row[field] = String(row[field]).trim().toUpperCase();
  });
}

function cleanKey(key) {
  return String(key).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value.trim() : value;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + value * 86400000);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  const text = String(value).trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const european = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (european) {
    const year = Number(european[3].length === 2 ? `20${european[3]}` : european[3]);
    return new Date(year, Number(european[2]) - 1, Number(european[1]));
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumber(value, fallback) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}
