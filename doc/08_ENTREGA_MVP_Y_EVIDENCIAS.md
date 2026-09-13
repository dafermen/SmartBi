# 08 — Entrega MVP y evidencias técnicas

## Objetivo

Cerrar la versión candidata a MVP y dejar trazabilidad clara de qué ya está validado y qué queda pendiente por dependencia de entorno.

## Evidencias técnicas ejecutadas (local)

- `npm test` ✅ (6 archivos, 18 pruebas).
- `npm run lint` ✅.
- `npm run build` ✅ (tsc + bundle de producción).
- `npm run build` con `VITE_BASE_PATH=/` para el subdominio propio.

## Evidencias funcionales

- Importación de `.xlsx` con validación de estructura y reglas de negocio básicas.
- Flujo completo en memoria con:
  - carga,
  - configuración por pasos,
  - dashboard,
  - filtros,
  - exportación CSV,
  - reconfiguración y recarga.
- Dashboard con:
  - KPIs,
  - ranking por agrupacion y campo destacado,
  - perfil generico de la metrica,
  - tabla paginada y ordenable,
  - filtros activos con chips.

## Entrega y despliegue

- CI base implementado: `.github/workflows/ci.yml` (lint, test, build).
- Artefacto manual y verificable preparado en `.github/workflows/release-artifact.yml`.
- Despliegue Nginx sin Docker preparado para `smartbi.innovalogic.tech`.
- Versiones atómicas, rollback y bootstrap HTTPS documentados en `docs/DEPLOYMENT.md`.
- Vite configurado explícitamente para la raíz del subdominio; ya no deduce la
  ruta desde variables internas de GitHub.

## Pendientes para “cerrado comercial” (no bloqueante para demo técnica)

1. Ejecución de QA visual en navegadores y reportar tabla de evidencia real en Chrome/Edge/Firefox/Safari.
2. Auditoría de cabeceras/caché después del primer despliegue.
3. Checklist práctico WCAG AA sobre el flujo principal.
4. Sesión de aceptación con usuarios reales y publicación de nota de versión `v0.1.0`.
5. Primera publicación siguiendo el procedimiento preparado.

## Estado actual sugerido

- El MVP técnico está funcional para pruebas internas y demo privada.
- Para considerar `v0.1.0` oficial, completar los puntos pendientes del bloque 6.8/7.4/7.6/7.7/7.8.
