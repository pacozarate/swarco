# Configurador SWARCO

## Uso basico

1. Abra la aplicacion en un navegador.
2. En `Tablas`, cargue los Excel actualizados por cada tabla: ALART, ALHIS, GCESP, ALARTDV, CPLISMAT, ct_TFT, ct_LED, mecanica, DimensionesBase y PNxxxy-TRL.
3. Valide las tablas.
4. Seleccione el modelo en `Modelo`.
5. Configure TFT o LED en `Configurador`.
6. Revise `Mecanica`.
7. Genere BOM desde `BOM` usando un rol con permiso.
8. Revise costes y exporte la BOM consolidada desde `Coste`.

La BOM no se recalcula automaticamente al cambiar tablas u opciones. Si hay cambios que afectan estructura o tecnica, la aplicacion marca la BOM como pendiente hasta que un usuario autorizado pulse `Actualizar BOM`.

## Filtros TFT

En la interfaz TFT, `Pulgadas disponibles` y `Aspect ratio` son criterios obligatorios.

Los campos `Luminosidad`, `Resolucion`, `Rango Temp.` y `Fabricante` admiten `Todos`. Cuando estan en `Todos`, no filtran y se muestran los TFT que coinciden con pulgadas y aspect ratio. Si se informa un valor, el TFT debe cumplir tambien ese criterio.

## Tamaño TFT y dimensiones base

El campo `Tamaño` permite dos modos:

- `Pulgadas/inches`: selecciona un TFT real filtrado por pulgadas, aspect ratio y criterios opcionales.
- `Largo x Alto`: permite informar `Largo mecanica mm`, `Alto mecanica mm` y `Espesor de chapa mm`.

El largo y alto mecanicos admiten hasta 8 digitos. El configurador calcula el area visible con la tabla `DimensionesBase`:

```text
Largo visible = Largo mecanica - 2 * Borde Largo
Alto visible = Alto mecanica - 2 * Borde Alto
```

El peso de la parte mecanica se muestra en la pantalla TFT y usa el espesor de chapa en la formula editable por NUESO.

## Editor de formulas

El menu `Formulas` solo aparece para roles NUESO: `Tecnico NUESO`, `Responsable tecnico` y `Administrador`.

Desde este editor se pueden ver todos los campos calculados y editar las formulas habilitadas, empezando por `Peso mecanica calculado` y `Coste mecanico`. Las formulas usan variables visibles en la tabla `Variables disponibles`, como `areaMm2`, `densityKgMm3`, `sheetThicknessMm`, `reinforcementFactor`, `clockWeightKg` y `protectionWeightKg`.

## Formato de columnas esperado

La importacion acepta nombres equivalentes en castellano o ingles. Campos recomendados:

- ALART: `code`, `description`, `pmp`, `type`
- ALARTDV: `code`, `dva17`, `dva18`, `dva19`, `dva20`, `dva37`, `dva38`
- CPLISMAT: `codsup`, `codele`, `cannec`
- GCESP: `code`, `price`, `validFrom`, `batch`
- ALHIS: `code`, `realCost`, `date`
- ct_TFT: `code`, `description`, `active`
- ct_LED: `code`, `description`, `faCode`, `faCurrent`, `faVoltage`, `dataCableCode`, `powerCableCode`
- mecanica: `model`, `technology`, `basePrice`, `pricePerMm2`, `setup`, `version`
- DimensionesBase: `model`, `morphology`, `weightKg`, `inches`, `aspectRatio`, `totalWidthMm`, `totalHeightMm`, `visibleWidthMm`, `visibleHeightMm`, `borderWidthMm`, `borderHeightMm`
- TRL: `model`, `group`, `code`, `description`, `type`, `image`, `root`, `default`
