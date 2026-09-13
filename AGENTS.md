# AGENTS.md — Instrucciones para futuras sesiones de Codex

Este archivo es obligatorio para cualquier sesión futura de Codex que trabaje en SmartBI.

## 1. Contexto del proyecto

SmartBI es una aplicación React + TypeScript + Vite para cargar archivos Excel tabulares y generar dashboards dinámicos en el navegador.

El proyecto antes se llamaba PowerAI, pero se renombró a SmartBI porque no usa inteligencia artificial. Si una sesión aparece ubicada en `C:\Projects\PowerAI`, debe verificar si la carpeta real del proyecto es `C:\Projects\SmartBI`.

## 2. Ubicación esperada

Ruta principal actual:

```text
C:\Projects\SmartBI
```

Si el entorno apunta a otra ruta, revisar primero:

```powershell
Get-ChildItem C:\Projects
```

No crear una copia nueva del proyecto si `SmartBI` ya existe.

## 3. Archivos que deben leerse antes de cambiar código

Antes de implementar cambios, leer:

1. `CURRENT_STATUS.md`
2. `README.md`
3. `docs/README.md` y `docs/TESTING.md`
4. `doc/01_PLAN_FASES_Y_TAREAS.md`
4. `doc/09_MANUAL_FINAL_DE_USUARIO.md`
5. El archivo específico que se va a modificar.

Para cambios de importación Excel:

- `src/features/import/excelImporter.ts`
- `src/features/import/FieldConfiguratorView.tsx`
- `src/domain/types.ts`

Para cambios de dashboard:

- `src/features/dashboard/dashboardAnalytics.ts`
- `src/features/dashboard/DashboardView.tsx`
- `src/features/dashboard/reportPages.ts`
- `src/features/dashboard/exportCsv.ts`

Para documentación interactiva:

- `src/features/documentation/documents.ts`
- `src/features/documentation/DocumentationView.tsx`
- Archivos Markdown en `doc/` y `docs/`
- `docs/DOCUMENTATION.md` para las reglas de navegación y publicación

La documentación usa enlaces estáticos seguros con el formato `/#/docs/<id>`. No cambiar a rutas físicas `/docs/` sin confirmar primero que el alojamiento tiene fallback de SPA.

## 4. Reglas de producto

- SmartBI debe seguir funcionando sin backend.
- El archivo Excel se procesa localmente en el navegador.
- No agregar inteligencia artificial ni sugerir que el sistema usa IA.
- No volver a usar el nombre PowerAI en interfaz o documentación nueva.
- No depender de una plantilla fija de Excel.
- El usuario debe poder escoger columnas, filtros y agrupaciones desde el wizard.
- Los checkboxes opcionales del wizard no deben venir seleccionados automáticamente.
- La columna `SQL` debe descartarse por seguridad.
- El botón “Cambiar archivo” debe permitir arrepentirse y volver al dashboard anterior mientras no se importe otro archivo correctamente.

## 5. Reglas técnicas

- Mantener React + TypeScript + Vite.
- Mantener LocalStorage como mecanismo de persistencia demo.
- No agregar backend, base de datos ni autenticación sin autorización explícita.
- Documentar código de forma didáctica, pensando en una persona joven que está aprendiendo programación.
- Preferir funciones pequeñas y nombres claros.
- Evitar lógica de negocio dentro de componentes visuales cuando pueda ir a módulos de dominio o analytics.
- Usar `npm run dev:5171` para levantar toda la aplicación local en el puerto acordado.

## 6. Validaciones obligatorias antes de cerrar cambios

Ejecutar, en lo posible:

```powershell
npm run test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

Estado esperado actual:

- `npm run test`: debe pasar.
- `npm run lint`: debe pasar.
- `npm run docs:check`: debe pasar sin enlaces locales rotos.
- `npm run build`: debe pasar.
- `npm run test:e2e`: debe pasar en Chromium móvil/tablet/escritorio, Edge escritorio, Firefox escritorio y WebKit escritorio.

Si una validación no puede ejecutarse por permisos, red, navegador faltante o entorno, documentar la causa en `CURRENT_STATUS.md`.

## 7. Pruebas responsive

La evidencia responsive vive en:

```text
doc/qa-responsive
```

La prueba automatizada principal vive en:

```text
tests/e2e/responsive-dashboard.spec.ts
```

## 8. Archivos obsoletos o confusos

`src/domain/metrics.ts` ya no existe y no debe recrearse. Si VS Code lo muestra como pestaña abierta, es una pestaña fantasma de una versión anterior.

Los cálculos actuales viven en:

```text
src/features/dashboard/dashboardAnalytics.ts
```

## 9. Pendientes conocidos

Ver `CURRENT_STATUS.md`.

Los pendientes principales al momento de crear este archivo son:

- QA manual en Safari real sobre macOS/iOS físico.
- Validación manual con NVDA o VoiceOver.
- Medición completa de contraste y zoom para cerrar WCAG 2.2 AA.
- Sesión de aceptación usando `doc/10_CHECKLIST_ACEPTACION_FINAL.md`.
- Medición formal de rendimiento con datasets grande en varios equipos.

Ya se completaron la corrección de caracteres, páginas reordenables, página inicial, visuales propios por página, propiedades de visual, virtualización y Web Worker para perfil de datos.

## 10. Estilo de comunicación con el usuario

El usuario prefiere avanzar de forma incremental, con buenas prácticas, pruebas y documentación actualizada.

Responder en español, con tono claro, colaborativo y didáctico.


## 11. Pruebas obligatorias antes de despliegue

Antes de recomendar o ejecutar un despliegue, revisar `docs/TESTING.md` y considerar las siguientes categorías:

1. Pruebas de aceptación.
2. Pruebas unitarias.
3. Pruebas de propiedades e invariantes.
4. Mutation testing.
5. Fuzzing.
6. Pruebas de integración.
7. Pruebas de contrato.
8. Pruebas de extremo a extremo.
9. Pruebas de regresión.
10. Pruebas de seguridad.
11. Concurrencia y resiliencia.
12. Rendimiento y recursos.
13. Compatibilidad y despliegue.

El mínimo automatizado actual antes de una demo es:

```powershell
npm run test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

## 12. Producción preparada

El destino definido es `https://smartbi.innovalogic.tech` y el procedimiento
canónico está en `docs/DEPLOYMENT.md`.

Reglas obligatorias:

- SmartBI se sirve como aplicación estática directamente con Nginx; no agregar
  Docker solo para servir `dist/`.
- No leer, copiar, imprimir ni confirmar en Git claves de
  `C:\Users\dafer\.ssh`.
- Usar el alias SSH `ruteza-dev`, que mantiene verificación estricta del host.
- No ejecutar bootstrap, despliegue, rollback, creación de tag o push sin una
  solicitud explícita del usuario.
- No desplegar con cambios sin commit ni con un commit distinto de
  `origin/main`.
- Ejecutar `npm run deploy:check` y registrar resultados antes de publicar.
- `deploy:check` prueba `dist/` en el puerto exclusivo 4173. Las pruebas contra
  el sitio público usan `SMARTBI_E2E_BASE_URL` y nunca un Excel privado.
- Las capturas públicas viven en `public/docs/screenshots/`; regenerarlas con
  `npm run docs:screenshots` y revisar su contenido antes de hacer push.
- La licencia MIT fue confirmada por el propietario el 2026-09-12. No cambiarla
  por una licencia restrictiva ni modificar la autoría sin nueva autorización.
- El primer despliegue usa `deploy:production -- -Initial` y luego
  `deploy:bootstrap`; las actualizaciones solo usan `deploy:production`.
- Conservar las versiones anteriores hasta que el usuario autorice una política
  de retención.
