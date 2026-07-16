# Estructura tecnica de dbo_alhis

## Objetivo

`dbo_alhis.xlsx` se conserva como evidencia de origen en `data/raw/`. El trabajo operativo debe hacerse sobre `data/processed/dbo_alhis.parquet`, que es mas eficiente para lectura analitica, validacion y conversion posterior.

## Archivo original

```text
Ruta: data/raw/dbo_alhis.xlsx
SHA-256 esperado: 3db8f2cad3a119bd1f89e7409bb2c69a1d4f44b2f2768c985136bdbf1ccddde2
Tamaño esperado: 132099336 bytes
```

## Hojas conocidas

```text
Tipos de Movimiento
dbo_alhis
```

La hoja principal es `dbo_alhis`.

## Columnas conocidas

```text
codemp
tipcont
tipmov
codart
fecmov
fecintro
orden
almace
seriel
ubicac
cant
prec
moves
clprfab
numdoc
posicion
impmov
pmedpon
tabauxidhis
tipo
datvar1
datvar2
datvar3
datvar4
datvar5
datvar6
feccad
premedpon
cantdobuni
numsec
tipfac
movmanual
```

## Consulta Power Query de referencia

La version Excel transforma `dbo_alhis` como historico de movimientos:

- Origen Excel: `DATOS_A_IMPORTAR/dbo_alhis.xlsx`, hoja `dbo_alhis`.
- Tipado funcional: `codart` y `moves` como texto; `fecmov`, `fecintro` y `feccad` como fecha; `cant`, `prec`, `clprfab` y `premedpon` como numericos.
- Columnas eliminadas: `codemp`, `tipcont`, `fecintro`, `orden`, `almace`, `seriel`, `ubicac`, `numdoc`, `posicion`, `impmov`, `tabauxidhis`, `tipo`, `datvar1` a `datvar6`, `cantdobuni`, `numsec`, `tipfac`, `movmanual`, `pmedpon` y `tipmov`.
- Filtro principal: `moves = "E"` para conservar entradas de compra/almacen.

El JSON operativo `data/alhis.json` conserva el historico filtrado con estos campos normalizados:

```text
code        = codart
date        = fecmov
quantity    = cant
price       = prec
movement    = moves
supplier    = clprfab
expiration  = feccad
averageCost = premedpon
realCost    = premedpon si existe; si no, prec
```

El motor de costes usa la fila historica mas reciente por `date` con coste positivo, manteniendo compatibilidad con el formato anterior `realCost/date`.

## Fechas

Algunas columnas de fecha pueden estar almacenadas como seriales Excel. No se convierten automaticamente durante la conversion a Parquet. La validacion informa rangos y valores anomalos, pero no reinterpreta el significado funcional de los campos.

## Artefactos generados

```text
data/processed/dbo_alhis_schema.json
data/processed/dbo_alhis.parquet
data/processed/dbo_alhis_sample.csv
data/processed/validation_report.json
data/manifest.yml
```

Todos estos artefactos se pueden regenerar desde el Excel original.
