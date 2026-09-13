# Fase 6.6 — Compatibilidad y pruebas en navegadores

## Objetivo

Dejar trazabilidad clara para comprobar que la app funciona de forma consistente en:

- Google Chrome (2 versiones actuales)
- Microsoft Edge (2 versiones actuales)
- Mozilla Firefox (2 versiones actuales)
- Apple Safari (2 versiones actuales, si aplica acceso a macOS)

El alcance cubre:

1. Render estable de todas las pantallas.
2. Importación de `.xlsx` sin errores de consola.
3. Flujo completo con datos reales:
   - Inicio -> Cargar archivo -> Configurar dashboard -> Filtros -> Exportar CSV -> Volver/Cambiar archivo.
4. Visuales y layout responsive desde móvil (320px) hasta escritorio.

## Checklist de verificación manual

### Pruebas base (por navegador)

1. Abrir `npm run dev` y entrar a `http://localhost:5173`.
2. Verificar que la pantalla inicial carga sin errores.
3. Importar un archivo `.xlsx` tabular de prueba.
4. Confirmar que no aparece error JS repetitivo en consola.
5. Seleccionar campos y entrar al dashboard.
6. Ejecutar:
   - búsqueda por texto,
   - un filtro por agrupación,
   - orden de tabla (dimensión, métrica),
   - paginación,
   - exportar CSV del subconjunto.
7. Cambiar entre pantallas con controles visibles (volver / editar mapeo / cambiar archivo).
8. Tomar evidencia de la vista principal a 320, 768 y 1280 px.
9. Dejar nota: `OK`, `Advertencia` o `Falla` y causa resumida.

## Criterio de aprobación

- Aprobado si no hay bloqueos de navegación, errores JS recurrentes ni diferencias de layout que rompan el uso.
- Si hay divergencia visual menor en un navegador, registrar:
  - pantalla,
  - navegador y versión,
  - captura,
  - prioridad (alta/ media/ baja).

## Registro de evidencia sugerido

| Fecha | Navegador | Versión | Resolución | Resultado | Hallazgos |
|---|---|---:|---:|---|---|
| 2026-07-13 | Chrome | 126 | 1280x720 | OK | Flujo completo funcional |
| 2026-07-13 | Edge | 126 | 375x812 | OK | OK |

## QA automatizado agregado

Se agregó Playwright para ejecutar el recorrido real en navegador:

```powershell
npm run test:e2e
```

El escenario actual:

1. Abre SmartBI.
2. Carga `tests/fixtures/smartbi-synthetic-sample.xlsx`, que contiene solo datos ficticios.
3. Completa el wizard.
4. Entra al dashboard.
5. Verifica navegación del reporte y acción “Cambiar archivo”.
6. Captura evidencia responsive.

## Evidencia real registrada

Fecha de ejecución: 2026-07-15.

Comando ejecutado:

```powershell
npm run test:e2e
```

Resultado actualizado:

- 6 pruebas Playwright aprobadas.
- Navegadores automatizados:
  - Chromium móvil.
  - Chromium tablet.
  - Chromium escritorio.
  - Microsoft Edge escritorio.
  - Firefox escritorio.
  - WebKit escritorio.
- Tamaños cubiertos:
  - móvil,
  - tablet,
  - escritorio.

Capturas guardadas:

| Pantalla | Archivo |
|---|---|
| Inicio móvil | `doc/qa-responsive/home-mobile-390.png` |
| Inicio tablet | `doc/qa-responsive/home-tablet-768.png` |
| Inicio escritorio | `doc/qa-responsive/home-desktop-1440.png` |
| Dashboard móvil | `doc/qa-responsive/dashboard-mobile.png` |
| Dashboard tablet | `doc/qa-responsive/dashboard-tablet.png` |
| Dashboard escritorio | `doc/qa-responsive/dashboard-desktop.png` |
| Dashboard Chromium móvil | `doc/qa-responsive/dashboard-chromium-mobile.png` |
| Dashboard Chromium tablet | `doc/qa-responsive/dashboard-chromium-tablet.png` |
| Dashboard Chromium escritorio | `doc/qa-responsive/dashboard-chromium-desktop.png` |
| Dashboard Edge escritorio | `doc/qa-responsive/dashboard-edge-desktop.png` |
| Dashboard Firefox escritorio | `doc/qa-responsive/dashboard-firefox-desktop.png` |
| Dashboard WebKit escritorio | `doc/qa-responsive/dashboard-webkit-desktop.png` |

Hallazgos corregidos durante QA:

- La CSP inicial bloqueaba un `Web Worker` local usado por la lectura del Excel. Se corrigió agregando `worker-src 'self' blob:`.
- En móvil, el texto visual de “Cambiar archivo” se ocultaba y faltaba nombre accesible. Se corrigió agregando `aria-label`.

## Enlace operativo desde el plan

En el plan principal esta tarea se deja marcada así:

- 6.6.7 — definición del protocolo y checklist: [x]
- 6.6.7 — ejecución responsive automatizada en Chromium: [x]
- 6.6.7 — ejecución automatizada en Microsoft Edge escritorio: [x]
- 6.6.7 — ejecución automatizada en Firefox escritorio: [x]
- 6.6.7 — ejecución automatizada en WebKit escritorio: [x]
- 6.6.7 — ejecución manual en Safari real: [~] pendiente por entorno macOS/iOS físico real.
