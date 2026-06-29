# Configurador SWARCO

Aplicacion web estatica para configurar modelos SWARCO, cargar tablas Excel/CSV locales, calcular mecanica, editar formulas para roles NUESO y generar BOM.

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

## Datos

Los datos base estan en `data/`. Las tablas que el usuario cargue desde la pantalla `Tablas` se leen en el navegador y quedan en el almacenamiento local de ese equipo.

