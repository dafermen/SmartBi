# Seguridad de SmartBI

## Alcance de datos

SmartBI procesa archivos Excel localmente en el navegador. En esta versión demo no hay autenticación, backend, base de datos ni envío intencional del contenido del Excel a terceros.

## Reporte de vulnerabilidades

Si encuentras un problema de seguridad:

1. No publiques datos sensibles ni archivos reales en issues públicos.
2. Describe el problema, pasos para reproducirlo e impacto esperado.
3. Adjunta capturas solo si no contienen información privada.
4. Valida si el problema ocurre con un archivo de prueba anónimo.

## Controles actuales

- Importación limitada a `.xlsx`.
- Límite de tamaño de archivo en el importador.
- Todas las columnas `SQL` descartadas antes del wizard, incluso si están repetidas.
- Encabezados repetidos convertidos en claves únicas para evitar sobrescrituras silenciosas.
- Procesamiento local en navegador.
- CSP base en `index.html` sin permitir evaluación dinámica de scripts.
- Política `no-referrer`.
- CI con lint, pruebas, enlaces documentales y build.
- Nginx de producción preparado con HTTPS, HSTS, CSP estricta y otros headers.
- Despliegues versionados con cambio atómico y rollback.
- Clave SSH conservada fuera del repositorio.
- Archivos Excel y capturas de QA excluidos de Git; E2E usa una muestra sintética.

## Pendientes de endurecimiento

- Auditoría periódica de dependencias.
- Migración controlada a Vitest 5 para resolver avisos moderados exclusivos del entorno de pruebas.
- Evidencia manual de navegadores objetivo.
- Verificación externa de headers después del primer despliegue.
- Revisión WCAG completa del flujo principal.
