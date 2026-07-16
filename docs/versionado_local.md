# Versionado local del configurador

Para evitar que el navegador abra una mezcla de ficheros antiguos y nuevos, cada version consolidada debe usar un identificador unico de build.

Version actual:

```text
Version funcional: 4.1.33
Build cache: 20260716-v4-1-33
```

## Donde se aplica

El identificador de build debe aparecer en:

```text
index.html
css/styles.css?v=...
js/app.js?v=...
js/app.js
importaciones internas con ?v=...
```

La version funcional se muestra en la cabecera de la aplicacion:

```text
Configurador SWARCO
NUESO TECH / NUESO GROUP · v4.1.33
```

## Regla operativa

Cada vez que se consolide una version visible para pruebas:

1. Incrementar la version funcional.
2. Incrementar el build cache.
3. Recargar local con una URL nueva, por ejemplo:

```text
http://127.0.0.1:4173/?fresh=20260716-v4-1-33
```

4. Cerrar pestanas antiguas del navegador o usar recarga fuerte.

## Motivo

La aplicacion es estatica y usa modulos ES. Si una pestana antigua conserva modulos cargados con una URL anterior, puede mostrar una combinacion vieja de vistas, router o CSS. El build cache fuerza URLs nuevas y evita esa mezcla.
