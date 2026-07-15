export const tftTabs = [
  { id: "mecanica", label: "Mecánica" },
  { id: "tfts", label: "TFTs" },
  { id: "modulos", label: "Módulos" }
];

export const tftClockPositionOptions = [
  { value: "", label: "Seleccione posicion" },
  { value: "SUPERIOR", label: "Superior" },
  { value: "LATERAL", label: "Lateral" }
];

export const tftMechanicalRules = {
  offsets: {
    default: { left: 50, right: 50, top: 50, bottom: 50 }
  },
  materials: {
    GALVA: { densityKgM3: 7850, thicknessMm: 2, developmentFactor: 1.18 },
    ALU: { densityKgM3: 2700, thicknessMm: 3, developmentFactor: 1.18 },
    INOX: { densityKgM3: 8000, thicknessMm: 2, developmentFactor: 1.18 }
  },
  groupFactors: {},
  defaultValues: {
    material: "GALVA"
  }
};

export const equipmentImages = {
  PN524A: {
    mainImage: "equipment-images/PN524A.PNG",
    description: "Equipo TFT PN524A"
  },
  PN531A: {
    mainImage: "equipment-images/PN531A.PNG",
    description: "Equipo TFT PN531A"
  },
  PN532A: {
    mainImage: "equipment-images/PN532A.PNG",
    description: "Equipo TFT PN532A"
  },
  PN533A: {
    mainImage: "equipment-images/PN533A.PNG",
    description: "Equipo LED PN533A"
  },
  PN534A: {
    mainImage: "equipment-images/PN534A.PNG",
    description: "Equipo LED PN534A"
  }
};
