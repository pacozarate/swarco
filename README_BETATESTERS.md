# Configurador SWARCO - paquete beta

## Arranque rapido

1. Descomprima el ZIP en una carpeta local.
2. No abra `index.html` directamente con doble clic. Los navegadores bloquean las tablas locales cuando se usa `file://`.
3. macOS: haga doble clic en `start_beta.command`.
4. Windows: haga doble clic en `start_windows.bat`.
5. Abra `http://127.0.0.1:4173/` si el navegador no se abre automaticamente.

Alternativa manual:

```bash
python3 scripts/beta_server.py 4173
```

En Windows tambien puede usar:

```bat
py scripts\beta_server.py 4173
```

Si el puerto 4173 esta ocupado, los lanzadores buscan automaticamente otro puerto entre 4174 y 4199. Use siempre la URL que aparece en la ventana de terminal.

## Validacion

- Revise la seleccion de modelos TFT y LED.
- En TFT, compruebe el selector `Tamaño`, los filtros por pulgadas/aspect ratio y los filtros opcionales.
- En modo `Largo x Alto`, informe `Largo mecanica mm`, `Alto mecanica mm` y `Espesor de chapa mm`.
- Verifique que se muestran `Largo Visible`, `Alto Visible` y `Peso Mecanica`.
- Cambie el rol a `Tecnico NUESO`, `Responsable tecnico` o `Administrador` para abrir `Formulas`.

## Datos locales

La aplicacion no envia datos a ningun servidor. Los Excel cargados desde `Tablas` se leen en el navegador y quedan en el almacenamiento local de ese equipo.

Para volver al estado inicial, borre los datos del sitio en el navegador o abra la aplicacion en una ventana privada.
