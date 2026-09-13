# Seguridad técnica — SmartBI

Este documento complementa `SECURITY.md` de la raíz.

## Modelo de amenazas del MVP

SmartBI procesa archivos Excel locales en el navegador. Los principales riesgos son:

- Archivos malformados.
- Datos sensibles visibles en pantalla o exportación.
- Fórmulas o campos peligrosos interpretados de manera insegura.
- Dependencias vulnerables.
- CSP demasiado permisiva o demasiado restrictiva.

## Controles implementados

- Solo se acepta `.xlsx` en el flujo principal.
- Límite de tamaño de archivo.
- Todas las columnas cuyo encabezado normalizado sea exactamente `SQL` se descartan antes del wizard, incluso si aparecen repetidas.
- Los encabezados repetidos reciben claves únicas para impedir sobrescrituras silenciosas.
- No se ejecutan macros.
- No hay backend ni envío intencional del Excel a terceros.
- CSP base en `index.html` sin `unsafe-eval` ni scripts inline.
- `worker-src 'self' blob:` permitido para que el importador pueda procesar Excel localmente.
- `Referrer-Policy: no-referrer`.
- Pruebas e2e validan que CSP no rompa importación.
- Configuración Nginx preparada con CSP estricta, HSTS, `nosniff`, protección
  contra iframes, política de permisos y aislamiento de origen.
- La clave SSH permanece fuera del repositorio y la conexión conserva la
  comprobación estricta de identidad del servidor.
- Despliegues versionados, atómicos y reversibles.
- `.gitignore` excluye libros Excel y capturas de QA; la única excepción es la
  muestra sintética controlada de `tests/fixtures/`.

## Checklist antes de publicación

```powershell
npm audit
npm audit --omit=dev
npm run test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

Estado al 2026-09-09:

- dependencias de producción: 0 vulnerabilidades;
- herramientas de desarrollo: 3 avisos moderados asociados a Vitest 4;
- la corrección automática requiere Vitest 5, por lo que se dejó como migración controlada en lugar de usar `npm audit fix --force`.

## Pendientes

- Política formal de clasificación de datos de ejemplo.
- Validación manual con archivos anonimizados.
- Revisión periódica de dependencias.
- Revisión de accesibilidad y privacidad en hosting final.
- Revisión externa de headers después de la primera publicación.
