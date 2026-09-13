# Estrategia de pruebas — SmartBI

Este documento define las pruebas requeridas antes de un despliegue.

## Comandos actuales

```powershell
npm run test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

Puerta única preparada para una entrega:

```powershell
npm run deploy:check
```

Este comando reúne las verificaciones automáticas y agrega la auditoría de
producción. Los E2E de entrega usan `npm run test:e2e:production` contra `dist/`
en el puerto exclusivo 4173. No reemplaza la aceptación manual.

Última ejecución completa: 2026-09-12, aprobada con 51 pruebas automatizadas,
18 recorridos E2E, 36 documentos verificados, build correcto y 0
vulnerabilidades en dependencias de producción.

Verificación pública del 2026-09-12: 18/18 aprobados con trazas contra
`https://smartbi.innovalogic.tech`. En el primer intento hubo un timeout aislado
de recarga en Firefox (17/18); la repetición específica pasó 3/3 y la repetición
completa pasó 18/18. La causa exacta no quedó demostrada; conservar este dato
al evaluar la estabilidad, sin ocultarlo mediante reintentos automáticos.

## Pruebas obligatorias antes de desplegar

### 1. Pruebas de aceptación

Objetivo: confirmar que SmartBI cumple el flujo esperado desde la perspectiva del usuario.

Casos mínimos:

- Cargar Excel válido.
- Configurar agrupación, métrica y filtros.
- Entrar al dashboard.
- Filtrar datos.
- Exportar CSV.
- Cambiar archivo y poder arrepentirse.

Estado actual:

- Cubierto parcialmente por pruebas e2e.
- Pendiente sesión formal con usuario final.

### 2. Pruebas unitarias

Objetivo: validar funciones pequeñas aisladas.

Comando:

```powershell
npm run test
```

Cubren:

- importador,
- analytics,
- exportación CSV,
- componentes clave.

### 3. Pruebas de propiedades e invariantes

Objetivo: comprobar reglas que siempre deben cumplirse.

Invariantes sugeridas:

- `SQL` nunca aparece en columnas exportadas.
- Las filas filtradas nunca superan las filas totales.
- Una métrica vacía o inválida se interpreta de forma segura.
- Los filtros vacíos no excluyen registros.

Estado actual:

- Existe una suite determinista que genera conjuntos de 0, 1, 17, 250 y 1.000 filas.
- Verifica límites de filas, suma de grupos, conteos por signo y números finitos.
- Verifica filtros vacíos, opciones inexistentes y conjuntos totalmente negativos.
- Pendiente incorporar una librería de generación aleatoria si el producto pasa de demo a producción.

### 4. Mutation testing

Objetivo: medir si las pruebas detectan cambios dañinos en la lógica.

Herramienta sugerida futura:

- StrykerJS.

Estado actual:

- No implementado.
- No bloqueante para demo, recomendado antes de producción seria.

### 5. Fuzzing

Objetivo: probar entradas raras o inesperadas.

Casos sugeridos:

- Encabezados vacíos.
- Columnas duplicadas.
- Números con separadores inconsistentes.
- Fechas raras.
- Textos enormes.
- Archivos con filas parcialmente vacías.

Estado actual:

- Cubierto parcialmente con casos de `null`, `undefined`, `NaN`, infinito, booleanos, texto inválido y formatos numéricos regionales.
- Se prueban encabezados vacíos, repetidos y varias columnas `SQL`.
- Pendiente generar libros `.xlsx` completos de manera sistemática para campañas de fuzzing extensas.

### 6. Pruebas de integración

Objetivo: validar que módulos colaboran correctamente.

Casos:

- Importador + wizard.
- Wizard + dashboard.
- Dashboard + exportación.
- Filtros + tabla + gráficos.

Estado actual:

- Cubierto por pruebas de componentes y e2e.

### 7. Pruebas de contrato

Objetivo: proteger contratos internos.

Contratos clave:

- `ImportResult`.
- `DashboardFieldConfig`.
- `DashboardAnalyticsInput`.
- CSV export columns.

Estado actual:

- Cubierto parcialmente por TypeScript.
- `reportPages.test.ts` verifica el contrato persistido ante JSON roto, identificadores duplicados, secciones desconocidas y páginas ocultas.
- Pendiente ampliar contratos explícitos del wizard y del constructor visual.

### 8. Pruebas de extremo a extremo

Objetivo: ejecutar flujo real en navegador.

Comando:

```powershell
npm run test:e2e
```

Cobertura actual:

- Chromium móvil.
- Chromium tablet.
- Chromium escritorio.
- Microsoft Edge escritorio real.
- Firefox escritorio.
- WebKit escritorio.

Los recorridos incluyen el manual con diez imágenes, textos alternativos,
ausencia de desbordamiento horizontal, agrupación y métrica elegidas en el
wizard, filtros opcionales inicialmente vacíos, errores JavaScript y ausencia
de solicitudes POST/PUT/PATCH al importar el archivo de prueba.

### 9. Pruebas de regresión

Objetivo: evitar que una mejora rompa algo ya aprobado.

Mínimo antes de merge/despliegue:

```powershell
npm run test
npm run test:e2e
```

Además, comparar capturas nuevas con evidencia previa en `doc/qa-responsive/` cuando el cambio sea visual.

### 10. Pruebas de seguridad

Objetivo: revisar riesgos del procesamiento local.

Checklist:

- `SQL` descartado.
- CSP no bloquea importación Excel.
- No se envían archivos a terceros.
- Dependencias auditadas.
- No se exponen datos en logs.

Comandos sugeridos:

```powershell
npm audit
npm audit --omit=dev
```

Estado al 2026-09-09:

- producción: 0 vulnerabilidades;
- desarrollo: 3 avisos moderados de Vitest 4;
- no se usó `--force` porque instalaría una versión mayor que debe probarse como migración separada.

### 11. Concurrencia y resiliencia

Objetivo: validar comportamiento ante acciones repetidas o estados intermedios.

Casos:

- Cargar archivo mientras otro está procesando.
- Cambiar archivo y arrepentirse.
- Volver con flecha del navegador.
- Borrar LocalStorage.
- Cargar archivo inválido después de uno válido.

Estado actual:

- El flujo “Cambiar archivo y arrepentirse” está cubierto.

### 12. Rendimiento y recursos

Objetivo: confirmar que archivos grandes no bloquean excesivamente la UI.

Revisar:

- Tiempo de importación.
- Tiempo al aplicar filtros.
- Consumo de memoria aproximado.
- Rendimiento de tabla.

Pendiente recomendado:

- La tabla ya virtualiza lotes superiores a 60 filas.
- El perfil de columnas usa Web Worker desde 5.000 filas.
- La analítica de 50.000 filas se ejecutó en 416 ms en el equipo de desarrollo el 2026-09-09.
- Pendiente medición formal de importación, memoria y experiencia con datasets grandes en varios equipos.

Guía detallada:

- `docs/PERFORMANCE.md`.

### 13. Compatibilidad y despliegue

Objetivo: validar navegadores y build final.

Comandos:

```powershell
npm run build
npm run test:e2e
```

Cobertura actual:

- Chromium.
- Edge.
- Firefox.
- WebKit.

Pendiente:

- Safari real en macOS/iOS físico.

## Accesibilidad antes de desplegar

Ejecutar también el recorrido manual descrito en `docs/ACCESSIBILITY.md`:

- teclado completo;
- zoom 200 % y 400 %;
- contraste en claro y oscuro;
- NVDA o VoiceOver;
- Safari físico cuando esté disponible.

## Criterio mínimo para despliegue demo

Antes de desplegar demo:

```powershell
npm run test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

Todos deben pasar o documentarse explícitamente en `CURRENT_STATUS.md` con causa y riesgo.
