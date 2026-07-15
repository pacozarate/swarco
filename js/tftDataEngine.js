export function getTftDetails(tftCode, tables) {
  const tft = tables.ct_tft.find((row) => row.code === tftCode);
  const dv = tables.alartdv.find((row) => row.code === tftCode) || {};
  return {
    code: tftCode,
    description: tft?.description || tftCode,
    inches: dv.dva17 || tft?.inches || "",
    format: dv.dva18 || tft?.format || "",
    brightness: dv.dva19 || tft?.brightness || "",
    resolution: dv.dva20 || tft?.resolution || "",
    outerSize: tft?.outerSize || dv.dva37 || "",
    visibleArea: tft?.visibleArea || dv.dva38 || ""
  };
}
