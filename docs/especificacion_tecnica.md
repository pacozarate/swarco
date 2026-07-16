# Especificacion tecnica

## Arquitectura

La aplicacion es una web HTML/CSS/JavaScript modular. La persistencia inicial es local al navegador y los datos demo viven en `data/`.

Separacion principal:

- `importExcel.js`: lectura de Excel/CSV mediante SheetJS.
- `normalizers.js`: normalizacion de columnas.
- `validators.js`: validaciones criticas.
- `trlEngine.js`: seleccion de modelo, grupos y raices.
- `tftDataEngine.js`: datos tecnicos TFT desde ALARTDV.
- `ledCalculationEngine.js`: calculos LED.
- `mechanicsEngine.js`: coste mecanico independiente.
- `data/dimensiones_base.json`: dimensiones mecanicas base, bordes y areas visibles por modelo.
- `bomExplosionEngine.js`: explosion DFS con profundidad maxima y ciclos.
- `bomConsolidationEngine.js`: agrupacion economica por articulo.
- `costingEngine.js`: GCESP, ALHIS, ALART PMP y mecanica calculada.
- `changeDetectionEngine.js`: recomendacion de actualizar BOM, precios o mecanica.
- `versioningEngine.js`: huella SHA-256 y metadatos de version.

## BOM

La funcion principal es:

```js
explodeBom({ roots, cplismatRows, maxLevel = 6 })
```

La salida contiene `root`, `p1` a `p6`, `article`, `parent`, `quantity`, `level`, `routeId` y `warning`.

### Origen `dbo_cplismat`

La tabla `cplismat` replica la consulta Power Query de la version Excel para la lista de materiales padre-hijo:

- Origen Excel: `DATOS_A_IMPORTAR/dbo_cplismat.xlsx`, hoja `cplismat`.
- Columnas operativas conservadas: `codsup`, `codele`, `cannec`, `fecfin`.
- Limpieza: codigos padre e hijo limpiados como texto tecnico.
- Filtros: `cannec` no nulo y `fecfin >= Date.From(DateTime.LocalNow())`.
- Enriquecimiento: merge left con `alart` usando `codele` contra `codart`, expandiendo `tipart`.
- JSON generado: `data/cplismat.json` con `codsup`, `codele`, `cannec`, `fecfin` y `tipart`.

Este `tipart` queda disponible para filtrar o auditar componentes de BOM sin volver a consultar `alart`.

## LED

Formulas implementadas:

- Resolucion panel: dimensiones / paso LED.
- Modulos: `ceil(columnas_panel / columnas_modulo) * ceil(filas_panel / filas_modulo)`.
- Corriente: `corriente_modulo * numero_modulos * factor_consumo`.
- Fuentes: `ceil(corriente_panel / corriente_maxima_FA)`.
- Consumo: `corriente_panel * voltaje_FA / 0.9`.

## TFT y DimensionesBase

La vista TFT usa `data/dimensiones_base.json` para calcular dimensiones visibles desde la mecanica del modelo. Para evitar ambiguedades, el borde se resta por los dos laterales:

```text
visibleWidthMm = mechanicalWidthMm - (borderWidthMm * 2)
visibleHeightMm = mechanicalHeightMm - (borderHeightMm * 2)
```

En modo `Pulgadas/inches`, las dimensiones mecanicas salen de `DimensionesBase` si existe el modelo y, si no, del tamaño exterior del TFT. En modo `Largo x Alto`, el usuario informa largo, alto y espesor de chapa; el espesor se pasa a `formulaEngine.js` como `sheetThicknessMm`.

## Futuras integraciones

La estructura permite sustituir los JSON y carga local por API backend, SAP, Costech o Calcutech sin mezclar motores de calculo con vistas.

## Formula engine

`formulaEngine.js` contiene las formulas editables y un evaluador restringido para expresiones numericas. El editor se muestra solo a roles NUESO mediante el permiso `FORMULA_EDIT`.

La formula inicial de peso mecanico es:

```text
round(((areaMm2 * sheetThicknessMm * densityKgMm3) * reinforcementFactor) + clockWeightKg + protectionWeightKg, 1)
```

Las variables se construyen desde la configuracion activa y el resultado alimenta `mechanicsEngine.js`.
