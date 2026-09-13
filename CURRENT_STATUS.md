# CURRENT_STATUS.md — Estado actual de SmartBI

Última actualización: 2026-09-12.

## 1. Resumen ejecutivo

SmartBI es un MVP avanzado y candidato a la versión `v0.1.0`.

La aplicación importa archivos Excel `.xlsx` tabulares sin exigir una plantilla fija. El usuario elige agrupaciones, métrica, fecha, columnas incluidas y filtros desde un wizard. Después puede explorar un dashboard, organizar páginas, crear visuales, filtrar, revisar la tabla y exportar CSV.

El proyecto continúa siendo 100 % frontend y local-first: no usa backend, base de datos, autenticación ni inteligencia artificial. La composición demo se guarda en `localStorage`.

La demo está publicada en [smartbi.innovalogic.tech](https://smartbi.innovalogic.tech)
con HTTPS y licencia MIT, según autorización del propietario del 2026-09-12.
El manual ilustrado está integrado al sitio y el código está en `origin/main`.
La aceptación humana formal continúa pendiente y no se declara WCAG completa.

## 2. Ubicación real

```text
C:\Projects\SmartBI
```

Algunas sesiones de Codex todavía pueden abrirse en `C:\Projects\PowerAI`. Deben leer `AGENTS.md` y localizar `SmartBI`; nunca deben crear una copia nueva.

## 3. Funcionalidades terminadas

### Importación y wizard

- Importación genérica `.xlsx` hasta 15 MB.
- Avisos desde 8 MB, 25.000 filas u 80 columnas.
- Detección de tabla, encabezados y tipos de columnas.
- Encabezados repetidos conservados mediante claves únicas y encabezados vacíos con nombre seguro.
- Conservación genérica de columnas en `DataRecord.raw`.
- Descarte de todas las columnas `SQL`, incluso si aparecen repetidas.
- Wizard de tres pasos que siempre inicia en el paso 1.
- Agrupación principal y varias secundarias.
- Métrica, descripción, fecha opcional, columnas incluidas y filtros.
- Checkboxes opcionales inicialmente desmarcados.
- Seleccionar todo/deseleccionar y vista previa.
- Plantilla de mapeo validada en `localStorage`.
- Cambio de archivo cancelable sin perder el dashboard anterior.

### Dashboard

- KPIs, gráficos principales, segmentadores y filtros laterales.
- Búsqueda global, chips, rangos numéricos y rangos de fecha.
- Tabla con búsqueda, orden, paginación, columnas visibles y exportación CSV.
- Lotes de 10, 25, 50, 100 y 250 filas.
- Virtualización de tabla para lotes superiores a 60 filas.
- Calidad y perfil del Excel.
- Perfil calculado en Web Worker desde 5.000 filas, con respaldo local.
- Exportación CSV de datos filtrados, tabla y calidad.

### Páginas de informe

- Crear, duplicar, renombrar, ocultar y restaurar.
- Reordenar páginas.
- Elegir la página inicial.
- Elegir secciones visibles por página.
- Asociar visuales específicos por página.
- Conservar composición en `localStorage`.
- Validar y recuperar de forma segura composiciones dañadas o incompatibles.

### Constructor visual

- Eje, métrica y agregación.
- Barras, línea, área, dona, tarjeta y tabla.
- Línea y área restringidas a ejes de fecha.
- Color y tamaño por visual.
- Editar título y propiedades.
- Duplicar, quitar de una página y eliminar globalmente.
- Reordenar con botones o drag and drop.
- Hasta 20 visuales guardados en la demo.

### Accesibilidad técnica

- Enlaces “Saltar al contenido”.
- Foco visible reforzado.
- Pestañas de páginas con flechas, `Inicio` y `Fin`.
- Semántica `tablist`, `tab` y `tabpanel`.
- Mensajes de estado mediante `aria-live`, `role="status"` y `role="alert"`.
- Nombres accesibles para búsquedas, controles y títulos editables.
- Captions de tablas y `aria-sort`.
- Resúmenes textuales de gráficos.
- Alternativas por botón para acciones de arrastre.
- Soporte de movimiento reducido y colores forzados.

La revisión está documentada en `docs/ACCESSIBILITY.md`. Todavía falta evidencia manual con lector de pantalla y Safari físico; por eso no se declara conformidad WCAG completa.

### Documentación y continuidad

- Documentación interactiva con 24 capítulos y seis categorías temáticas.
- Contenido original reutilizado desde `doc/` y `docs/`, sin copias paralelas.
- Enlaces profundos compartibles con formato `/#/docs/<id>`, seguros para hosting estático.
- Historial coherente al abrir la biblioteca desde SmartBI o mediante un enlace directo.
- Búsqueda por título, descripción y contenido con cantidad de resultados.
- Accesos rápidos a Producto, Arquitectura y Estado.
- Tema claro/oscuro disponible dentro del lector.
- Enlaces Markdown internos convertidos en navegación entre capítulos.
- Verificador `npm run docs:check` integrado al CI.
- Menú móvil con Escape, devolución de foco, nombre accesible y objetivos táctiles de 44 píxeles.
- Plan de fases reconstruido en UTF-8 y sin referencias a una matriz fija.
- Guía didáctica ampliada con Worker, virtualización y accesibilidad.
- Manual final actualizado.
- Manual ilustrado con diez capturas reales de datos ficticios, visibles también
  en la biblioteca y adaptables a móvil.
- Capturas reproducibles mediante `npm run docs:screenshots`.
- Licencia MIT confirmada; metadatos npm y documentación alineados.
- Documentos de accesibilidad, rendimiento y notas de versión.
- Checklist de aceptación final.
- `AGENTS.md` y este archivo para futuras sesiones.
- Archivos de continuidad restaurados a la raíz después de un movimiento accidental.

### Preparación de producción

- Carpeta local enlazada con `https://github.com/dafermen/SmartBi.git` y rama `main`.
- DNS del subdominio confirmado contra el servidor.
- Servidor confirmado con Ubuntu 24.04, Nginx y renovación automática de Certbot.
- Decisión documentada: Nginx directo, sin Docker, porque SmartBI es estático.
- Ruta base de Vite corregida para evitar `/SmartBi/` dentro del subdominio.
- CSP base endurecida sin `unsafe-eval` ni scripts inline.
- Configuración Nginx preparada con HTTPS, caché, fallback SPA y headers.
- Instalación atómica por versiones y rollback preparados.
- Clave SSH conservada fuera del repositorio.
- Workflow manual para producir un artefacto, sin despliegue automático ni secretos.

## 4. Archivos principales

### Coordinación

- `src/main.tsx`
- `src/app/App.tsx`
- `src/domain/types.ts`

### Importación

- `src/features/import/UploadView.tsx`
- `src/features/import/FieldConfiguratorView.tsx`
- `src/features/import/excelImporter.ts`

### Dashboard

- `src/features/dashboard/DashboardView.tsx`
- `src/features/dashboard/dashboardAnalytics.ts`
- `src/features/dashboard/reportPages.ts`
- `src/features/dashboard/dataProfile.ts`
- `src/features/dashboard/dataProfile.worker.ts`
- `src/features/dashboard/exportCsv.ts`

### Documentación

- `src/features/documentation/DocumentationView.tsx`
- `src/features/documentation/documents.ts`
- `doc/`
- `docs/`

## 5. Validaciones de esta iteración

Resultados de la iteración del 2026-09-09:

- `npm run docs:check`: OK, 35 Markdown sin enlaces locales rotos.
- `npm run test`: OK, 9 archivos y 40 pruebas.
- `npm run lint`: OK.
- `npm run build`: OK; el bundle incluye `dataProfile.worker`.
- `npm run test:e2e -- --reporter=line`: OK, 12 recorridos de documentación y dashboard en Chromium móvil, Chromium tableta, Chromium escritorio, Edge, Firefox y WebKit.
- Analítica de 50.000 filas: OK en 416 ms en el equipo de desarrollo; umbral automatizado de 3.000 ms.
- Invariantes analíticos verificadas con conjuntos deterministas de hasta 1.000 filas.
- LocalStorage de páginas probado ante JSON roto, páginas duplicadas, secciones desconocidas y ausencia de páginas visibles.
- Importador probado con encabezados repetidos/vacíos, varias columnas `SQL` y valores numéricos extraños.
- `npm audit --omit=dev`: OK, 0 vulnerabilidades de producción después de actualizar 8 paquetes compatibles.
- `npm audit`: mantiene 3 avisos moderados en herramientas de prueba Vitest; la corrección propuesta exige Vitest 5 y no se forzó para evitar un cambio mayor sin migración controlada.

Resultados de preparación de entrega del 2026-09-12:

- `npm run deploy:check`: OK de principio a fin.
- Sintaxis de los tres scripts PowerShell: OK.
- Sintaxis de los tres scripts Bash validada en el servidor: OK.
- `nginx -t` sobre las configuraciones HTTP y HTTPS en entorno temporal: OK.
- `npm run lint`: OK.
- `npm run test`: OK, 9 archivos y 40 pruebas.
- `npm run docs:check`: OK, 36 Markdown sin enlaces locales rotos.
- `npm run build`: OK; assets generados desde la raíz `/` del subdominio.
- `npm run test:e2e -- --reporter=line`: OK, 12 recorridos en los seis perfiles.
- `npm audit --omit=dev`: OK, 0 vulnerabilidades de producción.
- Búsqueda de bloques de claves privadas dentro del proyecto: sin hallazgos.
- Excel original y capturas de QA excluidos de Git; E2E migrado a una muestra
  sintética de 12 filas.
- Seguro de despliegue ante cambios sin commit: verificado; el script se detuvo
  antes de conectarse al servidor.

### Verificación de manual ilustrado y entrega demo (2026-09-12)

- `npm run docs:screenshots`: diez capturas regeneradas con datos ficticios e inspeccionadas.
- `npm run deploy:check`: 51 pruebas, 18 recorridos E2E sobre producción,
  36 Markdown sin enlaces rotos, lint/build correctos y 0 avisos de producción.
- Lector de imágenes: rutas locales permitidas, textos alternativos y carga diferida.
- Correcciones visuales: botones activos legibles, casillas del wizard y borde sin superposición.
- Avisos de licencias de 169 paquetes instalados conservados en la entrega.
- Instaladores Bash y PowerShell revisados; Bash con finales de línea LF.
- Seguridad de entrega reforzada con SHA-256, bloqueo compartido de despliegue/rollback,
  assets anteriores conservados y comprobación de `/release.json`.
- GitHub: primer commit completo `21f4635c1a14`, con CI aprobado.
- Primera instalación: `20260912221637-21f4635c1a14`.
- HTTP redirige a HTTPS con 308; HTTPS responde 200 y entrega CSP, HSTS,
  nosniff, DENY, no-referrer, permisos restringidos, COOP y CORP.
- Certificado de Let's Encrypt válido hasta 2026-12-12, con `certbot.timer`
  activo y hook de recarga de Nginx configurado.
- Caché de assets comprobada en un año; HTML con revalidación.
- `/release.json` coincide con la versión instalada. El listado de rollback
  funciona; no se simuló una reversión para no interrumpir la demo.
- Pruebas públicas: se obtuvo una ejecución de 18/18 y una repetición específica
  de Firefox de 3/3. Sin embargo, dos ejecuciones completas dieron 17/18 debido
  a una espera intermitente al recargar documentación en Firefox. No se declara
  esa comprobación como estable o resuelta.
- Diagnóstico con trazas: la pantalla nueva aparece renderizada, los recursos
  responden y un observador del evento `load` se ejecuta; aun así, Playwright
  queda esperando la navegación. Cambiar el evento esperado o enfocar la pestaña
  no resolvió de forma fiable el problema. Esos cambios experimentales se retiraron.
- El comportamiento coincide con un
  [reporte de Playwright para Firefox 1.61.1](https://github.com/microsoft/playwright/issues/42183),
  pero no se ha demostrado que sea exactamente la misma causa. El siguiente paso
  es validar recarga en Firefox manual y evaluar una actualización controlada del
  controlador. La prueba original sigue activa; no se omite ni se fuerza su éxito.

## 6. Pendientes reales antes de publicar v0.1.0 formal

### Bloquean una declaración formal de aceptación

1. Ejecutar `doc/10_CHECKLIST_ACEPTACION_FINAL.md` con una persona usuaria.
2. Probar NVDA en Windows o VoiceOver en un dispositivo compatible.
3. Probar Safari real en macOS/iOS físico; WebKit automatizado no sustituye esta prueba.
4. Medir contraste completo con una herramienta especializada en temas claro y oscuro.
5. Probar zoom al 200 % y 400 %.
6. Registrar tiempos y memoria con datasets pequeño, medio y grande.

### Técnicos no bloqueantes para la demo

1. Dividir `DashboardView.tsx` en componentes más pequeños.
2. Mover más cálculos analíticos al Worker si las mediciones lo justifican.
3. Agregar pruebas automatizadas específicas para propiedades avanzadas de cada visual.
4. Incorporar mutation testing y fuzzing sistemático de libros completos antes de un uso productivo serio.
5. Incorporar una librería especializada de property-based testing si el proyecto supera el alcance demo.
6. Evaluar la migración controlada a Vitest 5 para cerrar los avisos moderados exclusivos del entorno de pruebas.
7. Resolver o acotar la intermitencia del controlador de Firefox al recargar
   documentación. No declarar una suite pública repetible hasta cerrar este punto.

## 7. Próximo paso recomendado

1. Ejecutar aceptación manual y accesibilidad con una persona usuaria.
2. Medir importación, memoria y experiencia con archivos grandes en varios equipos.
3. Registrar hallazgos aquí.
4. Corregir únicamente los bloqueos encontrados.
5. Mantener el despliegue demo mediante el procedimiento verificado; no repetir
   `deploy:bootstrap` en un sitio ya configurado.
6. Crear la etiqueta Git `v0.1.0` solo después de la aceptación formal pendiente.

## 8. Comandos obligatorios antes de despliegue

```powershell
npm run test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

El comando equivalente preparado para entrega es `npm run deploy:check`.

Revisar además las 13 categorías de `docs/TESTING.md`.

## 9. Nota obligatoria para futuras sesiones

No recrear `src/domain/metrics.ts`. Ese archivo es obsoleto. Los cálculos actuales viven en `src/features/dashboard/dashboardAnalytics.ts`.

La navegación documental está descrita en `docs/DOCUMENTATION.md`. Mantener los identificadores de `DOCUMENTATION_PAGES` estables porque forman parte de enlaces y del progreso guardado en `localStorage`.

Para levantar toda la aplicación local usar `npm run dev:5171`. SmartBI continúa siendo 100 % frontend y no necesita un segundo proceso de backend.

Para producción, leer `docs/DEPLOYMENT.md`. No se utiliza Docker y no se debe
publicar, ejecutar rollback ni tocar Nginx sin una solicitud explícita.

## 10. Registro de entrega demo

La primera publicación se realizó el 12 de septiembre de 2026, hora del equipo
de desarrollo (13 de septiembre en UTC). Se utilizó Nginx directo, sin Docker,
sin servicios Node.js en el servidor y sin copiar Excel privados ni credenciales.

El [CI de la primera publicación](https://github.com/dafermen/SmartBi/actions/runs/34732616658)
quedó aprobado. La versión vigente se consulta en
[`release.json`](https://smartbi.innovalogic.tech/release.json); puede ser posterior
a la primera versión al incorporar este registro documental.

Nginx conserva dos advertencias previas sobre opciones de protocolo en otro
sitio del servidor. Ya existían antes de SmartBI; `nginx -t` pasa. No se cambió
la configuración de esa otra aplicación.
