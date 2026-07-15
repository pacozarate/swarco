# Estrategia GitHub LFS

## Motivo

`dbo_alhis.xlsx` pesa aproximadamente 126 MB. Subirlo a GitHub como binario normal dificulta clones, diffs y auditoria del repositorio. Por eso se configura Git LFS para archivos Excel y, si se versionan, tambien para procesados binarios como Parquet o DuckDB.

## Configuracion

Ejecutar una vez en la maquina de trabajo:

```bash
git lfs install
git lfs track "*.xlsx"
git lfs track "*.parquet"
git lfs track "*.duckdb"
git add .gitattributes
```

El fichero `.gitattributes` debe incluir:

```text
*.xlsx filter=lfs diff=lfs merge=lfs -text
*.parquet filter=lfs diff=lfs merge=lfs -text
*.duckdb filter=lfs diff=lfs merge=lfs -text
```

## Reglas operativas

- El Excel original vive en `data/raw/dbo_alhis.xlsx`.
- El Excel original no se modifica desde los scripts.
- Los formatos procesados se regeneran desde el Excel original.
- Antes de publicar, revisar con `git status --short` y confirmar que `data/raw/dbo_alhis.xlsx` y los procesados binarios que se quieran versionar seran gestionados por LFS.

## Limitacion local detectada

Si el comando `git lfs version` falla, Git LFS no esta instalado en esa maquina. En ese caso no se debe hacer commit del Excel hasta instalar Git LFS.

## Consultas DuckDB de ejemplo

```sql
SELECT codart, SUM(CAST(cant AS DOUBLE)) AS cantidad_total
FROM dbo_alhis
GROUP BY codart
ORDER BY cantidad_total DESC
LIMIT 20;

SELECT tipmov, moves, COUNT(*) AS movimientos
FROM dbo_alhis
GROUP BY tipmov, moves
ORDER BY movimientos DESC;

SELECT codart, AVG(CAST(prec AS DOUBLE)) AS precio_medio, SUM(CAST(impmov AS DOUBLE)) AS importe_total
FROM dbo_alhis
GROUP BY codart
ORDER BY importe_total DESC
LIMIT 50;
```
