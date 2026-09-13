# Plan de fases y tareas — SmartBI

Última actualización: 2026-09-12.

## 1. Propósito del proyecto

SmartBI es una aplicación web educativa desarrollada con React, TypeScript y Vite. Permite cargar un archivo Excel tabular, elegir libremente sus campos y construir un dashboard dinámico sin exigir una plantilla fija.

El archivo se procesa dentro del navegador. Esta edición de demostración no usa backend, base de datos, cuentas de usuario ni inteligencia artificial. Las preferencias del reporte se guardan únicamente en `localStorage`.

## 2. Cómo leer el estado de una tarea

- `[x]` Terminada y disponible.
- `[~]` Implementada, pero todavía requiere una validación manual o una mejora menor.
- `[ ]` Pendiente.
- `[Futuro]` Fuera del alcance de la versión `v0.1.0`.

## 3. Estado general

- [x] Fase 0 — Descubrimiento y alcance.
- [x] Fase 1 — Diseño técnico y experiencia.
- [x] Fase 2 — Base del proyecto.
- [x] Fase 3 — Importación genérica de Excel.
- [x] Fase 4 — Configuración mediante wizard.
- [x] Fase 5 — Dashboard, filtros y tabla.
- [x] Fase 6 — Páginas y constructor visual.
- [~] Fase 7 — Accesibilidad y rendimiento.
- [~] Fase 8 — Calidad y seguridad de entrega.
- [~] Fase 9 — Preparación de `v0.1.0` y aceptación.
- [ ] Fase 10 — Evolución posterior al MVP.

## 4. Fases detalladas

### Fase 0 — Descubrimiento y alcance

Objetivo: convertir la idea inicial en un producto verificable.

1. [x] Definir que SmartBI acepta archivos `.xlsx` tabulares.
2. [x] Confirmar que el producto no depende de nombres fijos de columnas.
3. [x] Definir que el usuario elige agrupaciones, métrica, fecha, filtros y columnas incluidas.
4. [x] Mantener el procesamiento local para proteger los datos del archivo.
5. [x] Definir alcance demo con `localStorage`.
6. [x] Excluir autenticación, backend, base de datos, colaboración e inteligencia artificial.
7. [x] Establecer una identidad propia inspirada en herramientas de BI, sin copiar marcas.
8. [x] Identificar como público principal a usuarios básicos y personas jóvenes que aprenden programación.

Criterio de salida: cualquier Excel compatible se puede configurar desde la interfaz sin modificar el código.

### Fase 1 — Diseño técnico y experiencia

Objetivo: crear una arquitectura mantenible y una interfaz comprensible.

1. [x] Elegir React, TypeScript y Vite.
2. [x] Separar importación, tipos, analítica, presentación y documentación.
3. [x] Crear un modelo genérico basado en `DataRecord.raw`.
4. [x] Diseñar estados de carga, error, advertencia, vacío y éxito.
5. [x] Diseñar navegación responsive para escritorio, tableta y celular.
6. [x] Definir temas claro y oscuro.
7. [x] Diseñar el wizard en tres pasos.
8. [x] Definir estrategia de pruebas con Vitest, Testing Library y Playwright.
9. [x] Documentar arquitectura, desarrollo, pruebas, despliegue, operación y seguridad.

Criterio de salida: la arquitectura explica dónde vive cada responsabilidad y cómo probarla.

### Fase 2 — Base del proyecto

Objetivo: disponer de un entorno ejecutable y reproducible.

1. [x] Inicializar Vite con React y TypeScript.
2. [x] Configurar ESLint y Vitest.
3. [x] Crear scripts `dev`, `test`, `lint`, `build`, `preview` y `test:e2e`.
4. [x] Crear estructura por funcionalidades dentro de `src/features`.
5. [x] Crear estilos globales, tokens y breakpoints.
6. [x] Configurar carga diferida del dashboard y la documentación.
7. [x] Crear CI para pruebas, lint y build.
8. [x] Preparar compilación estática independiente del proveedor de hosting.
9. [x] Crear `AGENTS.md` y `CURRENT_STATUS.md` para continuidad entre sesiones.

Criterio de salida: una instalación limpia compila y muestra la pantalla inicial.

### Fase 3 — Importación genérica de Excel

Objetivo: transformar un Excel desconocido en datos seguros y configurables.

1. [x] Permitir selección y arrastre de archivos.
2. [x] Validar extensión `.xlsx`.
3. [x] Limitar el archivo a 15 MB para esta demo.
4. [x] Avisar desde 8 MB que el procesamiento puede tardar más.
5. [x] Buscar automáticamente una hoja con estructura tabular.
6. [x] Detectar la fila de encabezados dentro de las primeras filas.
7. [x] Normalizar encabezados sin imponer nombres específicos.
8. [x] Detectar tipos aproximados: texto, número, fecha, booleano y vacío.
9. [x] Conservar valores originales en `raw`.
10. [x] Ignorar filas completamente vacías.
11. [x] Descartar la columna `SQL`.
12. [x] Advertir cuando existan 25.000 filas o más.
13. [x] Advertir cuando existan 80 columnas o más.
14. [x] Reemplazar el archivo anterior solo después de una nueva importación válida.
15. [x] Permitir cancelar “Cambiar archivo” con botón o flecha atrás del navegador.
16. [x] Conservar encabezados repetidos con claves únicas en lugar de sobrescribir columnas.
17. [x] Asignar nombres seguros a columnas cuyo encabezado esté vacío.
18. [x] Eliminar todas las columnas `SQL` antes del wizard, incluso cuando estén repetidas.

Criterio de salida: SmartBI importa tablas genéricas, muestra advertencias comprensibles y no conserva `SQL`.

### Fase 4 — Wizard de configuración

Objetivo: permitir que una persona básica construya el significado de su dashboard.

1. [x] Empezar siempre en el paso 1.
2. [x] Elegir agrupación principal.
3. [x] Elegir varias agrupaciones secundarias opcionales.
4. [x] Elegir descripción.
5. [x] Elegir métrica numérica.
6. [x] Elegir campo de fecha opcional.
7. [x] Elegir columnas adicionales incluidas.
8. [x] Elegir campos de filtro mediante checklist.
9. [x] Mantener los checkboxes opcionales desmarcados inicialmente.
10. [x] Agregar “Seleccionar todo” y “Deseleccionar”.
11. [x] Mostrar vista previa de las primeras filas.
12. [x] Mostrar perfil rápido de columnas.
13. [x] Guardar y validar una plantilla de mapeo en `localStorage`.
14. [x] Permitir editar el mapeo sin volver a cargar el Excel.
15. [x] Estabilizar la altura del wizard con scroll interno y pie fijo.
16. [x] Asociar etiquetas y grupos accesibles a los controles.

Criterio de salida: el usuario entiende qué está eligiendo y llega al dashboard con una configuración válida.

### Fase 5 — Dashboard, filtros y tabla

Objetivo: explorar los datos con una experiencia visual clara.

1. [x] Mostrar KPIs de registros, suma, promedio y máximo.
2. [x] Mostrar gráficos de agrupación, ranking y participación.
3. [x] Implementar búsqueda global.
4. [x] Implementar filtros laterales elegidos en el wizard.
5. [x] Limitar cada lista de opciones con buscador y scroll interno.
6. [x] Implementar segmentadores rápidos.
7. [x] Implementar filtros por rango numérico y fecha.
8. [x] Mostrar chips de filtros activos.
9. [x] Permitir limpiar un filtro, un grupo o todos.
10. [x] Mantener KPIs, gráficos, tabla y exportación sincronizados.
11. [x] Implementar tabla ordenable y paginada.
12. [x] Elegir columnas visibles con vista completa y mínima.
13. [x] Congelar la primera columna en desplazamiento horizontal.
14. [x] Buscar exclusivamente dentro de la tabla.
15. [x] Exportar datos filtrados, tabla y calidad a CSV.
16. [x] Mostrar calidad y perfil del Excel.
17. [x] Mantener temas claro y oscuro diferenciados.

Criterio de salida: todos los componentes muestran el mismo conjunto filtrado y funcionan desde 320 px.

### Fase 6 — Páginas y constructor visual

Objetivo: acercar SmartBI a una herramienta BI sencilla.

1. [x] Crear, duplicar, renombrar, ocultar y restaurar páginas.
2. [x] Elegir las secciones visibles de cada página.
3. [x] Reordenar páginas.
4. [x] Elegir la página inicial.
5. [x] Guardar páginas y página inicial en `localStorage`.
6. [x] Asociar visuales específicos a cada página.
7. [x] Copiar asociaciones de visuales al duplicar una página.
8. [x] Elegir eje, valor y agregación.
9. [x] Soportar barras, línea, área, dona, tarjeta y tabla.
10. [x] Restringir línea y área a ejes de fecha.
11. [x] Configurar color por visual.
12. [x] Configurar tamaño pequeño, mediano o grande.
13. [x] Editar título y propiedades.
14. [x] Duplicar y eliminar visuales.
15. [x] Reordenar con botones accesibles.
16. [x] Reordenar arrastrando y soltando.
17. [x] Guardar composición y propiedades en `localStorage`.
18. [x] Conservar botones Eje/Valor como alternativa al arrastre.

Criterio de salida: cada página cuenta una parte distinta de la historia y conserva su composición al recargar.

### Fase 7 — Accesibilidad y rendimiento

Objetivo: facilitar el uso con teclado, lector de pantalla y archivos exigentes.

1. [x] Agregar enlaces “Saltar al contenido”.
2. [x] Mejorar foco visible en botones, enlaces, entradas y selectores.
3. [x] Implementar flechas, Inicio y Fin en pestañas de páginas.
4. [x] Marcar pestañas, paneles y página activa semánticamente.
5. [x] Anunciar cantidad de filas y filtros mediante `aria-live`.
6. [x] Agregar nombres accesibles a búsquedas, acciones e inputs de título.
7. [x] Agregar captions ocultos a tablas.
8. [x] Comunicar orden de columnas con `aria-sort`.
9. [x] Agregar alternativas textuales para gráficos principales.
10. [x] Respetar `prefers-reduced-motion`.
11. [x] Agregar soporte básico para modo de colores forzados.
12. [x] Virtualizar lotes de tabla superiores a 60 filas.
13. [x] Permitir lotes de 100 y 250 filas.
14. [x] Calcular el perfil de datos en un Web Worker desde 5.000 filas.
15. [x] Memoizar cálculos derivados principales.
16. [~] Verificar WCAG 2.2 AA mediante revisión técnica documentada.
17. [ ] Validar manualmente con NVDA o VoiceOver.
18. [ ] Validar manualmente Safari real en macOS/iOS físico.
19. [ ] Medir tiempos y memoria con archivos grandes en varios equipos.
20. [x] Medir automáticamente la analítica de 50.000 filas; 416 ms en el equipo de desarrollo.

Criterio de salida: pruebas automáticas aprobadas y checklist manual registrado sin bloqueos críticos.

### Fase 8 — Calidad y seguridad de entrega

Objetivo: reducir defectos antes de publicar.

1. [x] Mantener pruebas unitarias de importación, analítica, perfil y exportación.
2. [x] Mantener pruebas de componentes del flujo principal.
3. [x] Mantener E2E responsive en Chromium, Edge, Firefox y WebKit.
4. [x] Configurar CSP y política `no-referrer`.
5. [x] Preparar `_headers` para hosting compatible.
6. [x] Documentar seguridad, privacidad y operación.
7. [x] Documentar las 13 categorías de pruebas antes de despliegue.
8. [x] Ejecutar auditoría de dependencias; se corrigió PostCSS y el resultado final fue 0 vulnerabilidades.
9. [x] Ejecutar prueba completa final: 18 unitarias, lint, build y 6 E2E aprobados.
10. [x] Registrar resultados y pendientes manuales en `CURRENT_STATUS.md`.
11. [x] Organizar la biblioteca interactiva por categorías sin duplicar los Markdown.
12. [x] Crear enlaces profundos `/#/docs/<id>` compatibles con hosting estático y navegación Atrás.
13. [x] Incorporar los documentos técnicos de `docs/` a la biblioteca de la aplicación.
14. [x] Agregar búsqueda con cantidad de resultados, accesos rápidos y selector de tema.
15. [x] Agregar `docs:check` al proyecto y al CI para detectar enlaces locales rotos.
16. [x] Probar la navegación documental en móvil, tableta, Chromium, Edge, Firefox y WebKit.
17. [x] Restaurar `AGENTS.md`, `CURRENT_STATUS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md` y licencias a la raíz del proyecto.
18. [x] Extraer y probar la validación de páginas guardadas en `reportPages.ts`.
19. [x] Agregar pruebas deterministas de invariantes y entradas extrañas.
20. [x] Corregir el KPI máximo cuando todas las métricas son negativas.
21. [x] Agregar el comando único `npm run dev:5171`.
22. [x] Conectar la carpeta local con `origin/main` sin sobrescribir el trabajo.
23. [x] Verificar DNS, sistema operativo, Nginx, Certbot y espacio del servidor.
24. [x] Elegir Nginx directo sin Docker para la aplicación estática.
25. [x] Preparar despliegues atómicos por versión y rollback.
26. [x] Preparar configuración HTTPS y encabezados de seguridad para el subdominio.
27. [x] Crear `npm run deploy:check` como puerta automatizada de calidad.
28. [x] Sustituir el Excel original en E2E por una muestra sintética.
29. [x] Excluir de Git los Excel reales y las capturas de QA.

Criterio de salida: `test`, `lint`, `build` y `test:e2e` pasan, o el riesgo queda documentado.

### Fase 9 — Preparación de v0.1.0 y aceptación

Objetivo: convertir el MVP avanzado en una primera entrega formal.

1. [x] Preparar notas de versión `v0.1.0`.
2. [x] Registrar funcionalidades incluidas.
3. [x] Registrar limitaciones conocidas.
4. [x] Crear checklist de aceptación final.
5. [x] Crear espacio para observaciones y firma de la sesión.
6. [ ] Ejecutar la sesión con una persona usuaria final.
7. [ ] Corregir bloqueos encontrados en aceptación.
8. [ ] Confirmar Safari físico y lector de pantalla.
9. [ ] Crear etiqueta Git `v0.1.0` después de aprobar todo.
10. [x] Publicar la demo autorizada en el hosting elegido; aceptación formal pendiente.
11. [x] Definir `smartbi.innovalogic.tech` y el servidor Nginx como destino.
12. [x] Documentar primer despliegue, actualizaciones, verificación y rollback.
13. [x] Preparar scripts locales que conservan la clave SSH fuera del repositorio.
14. [x] Confirmar y aplicar MIT a código y documentación (autorización 2026-09-12).
15. [x] Ilustrar el manual con diez capturas reales usando exclusivamente datos ficticios.
16. [x] Integrar las imágenes al lector y añadir pruebas de rutas e imágenes responsive.
17. [x] Añadir comprobaciones sobre el build de producción, no solo desarrollo.
18. [x] Registrar publicación demo, HTTPS y pruebas públicas en `CURRENT_STATUS.md`,
    incluyendo la incidencia aislada de recarga observada en Firefox.

Criterio de salida: aceptación firmada, validaciones verdes, limitaciones conocidas y versión etiquetada.

### Fase 10 — Evolución posterior al MVP

Estas tareas no forman parte de `v0.1.0`:

1. [Futuro] Exportación PDF con diseño del informe.
2. [Futuro] Más gráficos avanzados y formatos condicionales.
3. [Futuro] Panel de propiedades desacoplado del componente principal.
4. [Futuro] Persistencia de varios informes locales.
5. [Futuro] Historial local de configuraciones.
6. [Futuro] Pruebas de propiedades con generación automática de casos.
7. [Futuro] Mutation testing con StrykerJS.
8. [Futuro] Fuzzing sistemático de archivos y encabezados.
9. [Futuro] Backend, autenticación o colaboración, únicamente con autorización explícita.

## 5. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Excel sin estructura tabular | No se puede configurar | Mensaje claro y manual de preparación |
| Demasiadas filas o columnas | Lentitud o memoria alta | Límites, avisos, Worker y virtualización |
| Tipo de columna mal detectado | Sugerencia poco útil | Vista previa y elección manual en wizard |
| Datos privados publicados | Riesgo de privacidad | Procesamiento local y revisión antes de GitHub |
| `localStorage` borrado | Se pierde composición | Explicar alcance demo y permitir reconstrucción |
| Visual basado solo en color | Barrera de accesibilidad | Etiquetas, texto alternativo y valores visibles |
| Navegador no probado físicamente | Diferencia de comportamiento | Checklist Safari, NVDA y VoiceOver |

## 6. Definición de terminado para v0.1.0

La versión puede considerarse terminada cuando:

1. una persona carga un Excel genérico válido;
2. configura los campos sin ayuda técnica;
3. filtra, navega y organiza páginas;
4. crea al menos un visual personalizado;
5. consulta la tabla y exporta CSV;
6. puede completar el flujo principal con teclado;
7. no encuentra defectos críticos en aceptación;
8. las pruebas obligatorias están aprobadas;
9. las limitaciones están documentadas;
10. `CURRENT_STATUS.md` y `CHANGELOG.md` coinciden con el producto.

## 7. Próximo paso humano

Ejecutar `doc/10_CHECKLIST_ACEPTACION_FINAL.md` con una persona usuaria. La
etiqueta formal espera esa evidencia. El propietario autorizó previamente una
publicación demo supervisada; no equivale a cerrar la aceptación formal.
