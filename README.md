# Configurador SWARCO

Aplicacion web estatica para configurar modelos SWARCO, cargar tablas Excel/CSV locales, calcular mecanica, editar formulas para roles NUESO y generar BOM.

Este repositorio tambien contiene una estructura tecnica para custodiar y procesar el fichero pesado `dbo_alhis.xlsx` sin tratarlo como un binario Git normal.

## Abrir en local

No abra `index.html` directamente. Use el lanzador:

```bash
./start_beta.command
```

El terminal mostrara la URL exacta, por ejemplo:

```text
http://127.0.0.1:4173/?fresh=...
```

Si el puerto 4173 esta ocupado, el lanzador usara el siguiente puerto libre.

## Publicar en GitHub Pages

Este repositorio esta preparado para GitHub Pages mediante `.github/workflows/pages.yml`.

1. Cree un repositorio vacio en GitHub.
2. Suba este proyecto a la rama `main`.
3. En GitHub, vaya a `Settings > Pages`.
4. En `Build and deployment`, seleccione `GitHub Actions`.
5. Espere a que termine el workflow `Deploy static site to Pages`.

La aplicacion publicada funcionara desde una URL HTTPS sin necesidad de `start_beta.command`.

## Version local consolidada

La version local actual es `4.1.2` con build cache `20260715-v4-1-2`. La version se muestra en la cabecera de la aplicacion.

Para evitar cache de modulos antiguos al probar cambios locales, abra:

```text
http://127.0.0.1:4173/?fresh=20260715-v4-1-2
```

El procedimiento completo esta en `docs/versionado_local.md`.

## Datos

Los datos base estan en `data/`. Las tablas que el usuario cargue desde la pantalla `Tablas` se leen en el navegador y quedan en el almacenamiento local de ese equipo.

## Dataset pesado dbo_alhis

El archivo original `data/raw/dbo_alhis.xlsx` contiene el historico de movimientos de almacen/articulos procedente de ERP. Por su tamaño, debe gestionarse con Git LFS y no como archivo binario normal en Git.

Archivo original esperado:

```text
data/raw/dbo_alhis.xlsx
SHA-256: 3db8f2cad3a119bd1f89e7409bb2c69a1d4f44b2f2768c985136bdbf1ccddde2
Tamaño: 132099336 bytes
Hoja principal: dbo_alhis
```

Para trabajo operativo use preferentemente:

```text
data/processed/dbo_alhis.parquet
```

El CSV de muestra sirve solo para pruebas ligeras:

```text
data/processed/dbo_alhis_sample.csv
```

## Git LFS

Instale y active Git LFS antes de añadir el Excel original o procesados binarios al commit:

```bash
git lfs install
git lfs track "*.xlsx"
git lfs track "*.parquet"
git lfs track "*.duckdb"
git add .gitattributes
```

El repositorio incluye `.gitattributes` con:

```text
*.xlsx filter=lfs diff=lfs merge=lfs -text
*.parquet filter=lfs diff=lfs merge=lfs -text
*.duckdb filter=lfs diff=lfs merge=lfs -text
```

## Reproducir el pipeline

Instale dependencias:

```bash
pip install -r requirements.txt
```

Ejecute el flujo completo desde la raiz del repositorio:

```bash
python scripts/01_inspect_excel.py
python scripts/02_convert_excel_to_parquet.py
python scripts/03_generate_sample_csv.py
python scripts/04_validate_dbo_alhis.py
python scripts/05_generate_manifest.py
```

Opcionalmente cree una base DuckDB local:

```bash
python scripts/06_create_duckdb.py
```

## Trazabilidad

La inspeccion genera:

```text
data/processed/dbo_alhis_schema.json
```

La validacion genera:

```text
data/processed/validation_report.json
```

El manifest auditable queda en:

```text
data/manifest.yml
```

Para comprobar manualmente el SHA-256:

```bash
shasum -a 256 data/raw/dbo_alhis.xlsx
```

## Reglas de tratamiento

- No se transforman fechas automaticamente; campos como `fecmov`, `fecintro` y `feccad` se preservan inicialmente como valores originales.
- No se eliminan filas durante la conversion.
- No se sobrescribe el Excel original.
- Los procesados son regenerables desde `data/raw/dbo_alhis.xlsx`.
- Los errores de scripts se muestran por consola y detienen el proceso.
