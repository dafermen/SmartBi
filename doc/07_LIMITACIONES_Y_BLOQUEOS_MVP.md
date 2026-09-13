# 07 — Limitaciones conocidas y bloqueos del MVP

## Objetivo

Esta lista ayuda a trabajar con transparencia: qué funciona hoy, qué funciona con restricciones y qué necesitamos para escalar el MVP sin romper la experiencia para usuarios básicos.

## 1) Limitaciones funcionales del MVP (actual)

- El MVP importa archivos Excel tabulares; no interpreta archivos con varias tablas mezcladas en la misma hoja sin revisión manual.
- Para generar dashboard, el usuario debe escoger en el wizard al menos una columna de agrupacion y una columna numerica como metrica.
- En esta versión:
  - No hay autenticación ni separación por usuarios.
  - No hay historial de cargas ni persistencia en nube.
  - No se soportan conexiones directas a ERP/servicios externos.
  - No hay “refresh” automático de fuente externa: la carga es siempre manual por archivo local.

## 2) Limitaciones técnicas reales detectadas

- Compatibilidad multi-navegador: el protocolo y checklist están creados, pero falta evidencia ejecutada en entornos de:
  - Microsoft Edge (real).
  - Mozilla Firefox (real).
  - Apple Safari (real).
- No hay pruebas automatizadas end-to-end con navegador en este entorno todavía.
- El análisis grande en navegador puede requerir optimización si los archivos superan el volumen objetivo inicial.
- Cuando no se reconoce una plantilla especial, la app importa la tabla como generica y exige revisar/ajustar el mapeo de campos para continuar.
- Columnas con fórmulas, celdas fusionadas o formatos muy inusuales pueden degradar la lectura; se trata como caso a validar.
- La exportación actual produce un subconjunto CSV, pero no exporta PDF/imagen ni plantillas de reporte todavía.

## 3) Limitaciones de datos

- El campo `SQL` se descarta intencionalmente del modelo analítico y la exportación por diseño MVP.
- Los números con formatos mixtos (por ejemplo separador coma/punto) se normalizan con reglas robustas; si una celda trae texto fuera de ese patrón se deja en advertencia.
- Los valores negativos de la métrica se conservan y se muestran en el perfil de la métrica para revisión del usuario.`r`n
## 4) Criterio pedagógico

- Priorizamos que una persona básica pueda:
  - importar,
  - entender advertencias,
  - filtrar,
  - revisar detalle,
  - exportar, y
  - repetir.
- Cualquier característica avanzada que complique ese camino puede quedarse para la siguiente versión.

## 5) Riesgos abiertos para próximos incrementos

1. Entrada de archivos sin forma tabular clara, encabezados mezclados o varias tablas en la misma hoja.
2. Archivos con más de 100.000 filas sin paginación/virtualización más agresiva.
3. Ajustes visuales finos por navegador y preferencias de alto contraste.
4. Auditoría de accesibilidad AAA (hoy se prioriza AA en flujo base).
5. Control de versiones de plantillas de mapeo por usuario.

## 6) Recomendación de evolución

- Completar ahora:
  - prueba manual de navegadores con evidencia (Chrome, Edge, Firefox, Safari),
  - pruebas E2E en CI o entorno local,
  - accesibilidad del flujo principal.
- Luego:
  - soporte de plantillas guardables,
  - historial de cargas local,
  - exportación de configuración de dashboard.

## 7) Estado del bloque para el MVP

- No hay restricciones críticas que impidan usar la app en un entorno de enseñanza/validación.
- Bloqueo menor: evidencia de compatibilidad completa aún pendiente fuera de este entorno.
