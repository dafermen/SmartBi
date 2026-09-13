# Changelog

Todas las notas relevantes del proyecto se documentarán aquí.

Formato basado en Keep a Changelog.

## [0.1.0] - Candidata a publicación

### Agregado

- Manual ilustrado con diez capturas reales de datos ficticios y generación reproducible.
- Imágenes locales seguras y adaptables dentro del lector documental.
- Pruebas de imágenes en seis perfiles y E2E sobre el build de producción.
- Verificación SHA-256 del paquete, bloqueo de entregas simultáneas y `release.json`.

- Importación local de archivos Excel `.xlsx`.
- Wizard para configurar agrupación, métrica, filtros y columnas incluidas.
- Dashboard dinámico con KPIs, gráficos, filtros y tabla.
- Páginas reales de informe.
- Constructor visual sencillo.
- Exportación CSV.
- Documentación interactiva dentro de la app.
- QA e2e con Playwright en Chromium, Edge, Firefox y WebKit.
- Archivos de continuidad `AGENTS.md` y `CURRENT_STATUS.md`.
- Documentación técnica en `docs/`.
- Páginas reordenables y selección de página inicial.
- Visuales asociados a páginas específicas.
- Tamaño y color configurables por visual.
- Gráfico de área para ejes de fecha.
- Orden de visuales mediante arrastre y botones.
- Virtualización de tabla para lotes grandes.
- Perfil de datos en Web Worker desde 5.000 filas.
- Avisos para archivos de 8 MB, 25.000 filas u 80 columnas.
- Navegación de pestañas con teclado, enlaces de salto, foco reforzado y mensajes para lectores de pantalla.
- Documentos de accesibilidad, rendimiento, versión y aceptación final.
- Biblioteca documental de 24 capítulos organizada en seis categorías.
- Enlaces profundos `/#/docs/<id>` compatibles con despliegue estático.
- Verificación automática `docs:check` para enlaces Markdown locales.
- Navegación documental E2E en los seis perfiles de navegador.
- Dependencia transitiva PostCSS actualizada después de auditoría; resultado final: 0 vulnerabilidades.
- Comando único `npm run dev:5171` para levantar toda la aplicación.
- Pruebas deterministas de invariantes analíticos y entradas extrañas.
- Pruebas de recuperación de páginas guardadas desde LocalStorage.
- Ocho paquetes transitivos actualizados para corregir la vulnerabilidad alta de `nanoid`; dependencias de producción con 0 vulnerabilidades.
- Configuración de producción para `smartbi.innovalogic.tech` mediante Nginx y Certbot.
- Despliegues estáticos atómicos identificados por fecha y commit.
- Comandos `deploy:check`, `deploy:production`, `deploy:bootstrap` y `deploy:rollback`.
- Workflow manual para generar un artefacto de release sin exponer la clave SSH.
- Repositorio local conectado con `origin/main` sin sobrescribir archivos.
- Fixture Excel sintético para E2E y exclusión preventiva de libros reales y capturas.

### Cambiado

- Licencia MIT confirmada por el propietario; documentación y metadatos alineados.

- Se reconstruyó el plan de fases sin referencias a una matriz o plantilla fija.
- Se corrigieron caracteres dañados y saltos de línea literales en documentación antigua.
- El constructor admite hasta 20 visuales y guarda más propiedades en `localStorage`.
- La documentación técnica de `docs/` también se lee desde la aplicación sin duplicar archivos.
- La validación de páginas del informe se extrajo a `reportPages.ts`.
- Los encabezados repetidos ahora reciben claves únicas y los vacíos reciben un nombre seguro.
- Vite usa una ruta base explícita y segura para el subdominio, en lugar de inferir GitHub Pages.
- La CSP base dejó de permitir `unsafe-eval` y scripts inline.

### Corregido

- Botones activos y de guardar visual legibles en modo claro.
- Casillas del wizard con tamaño visible y foco de teclado.
- Borde decorativo de carga sin una capa clara que tape el contenido.

- Los archivos de continuidad y seguridad regresaron a la raíz después de un movimiento accidental.
- Todas las columnas llamadas `SQL` se eliminan antes del wizard, incluso si están repetidas.
- El KPI máximo conserva el valor correcto cuando todas las métricas son negativas.

### Riesgo conocido de desarrollo

- Vitest 4 conserva tres avisos moderados en herramientas de pruebas. npm propone Vitest 5 mediante `--force`; no se aplicó una actualización mayor automática. No afecta el bundle de producción y debe resolverse mediante una migración controlada.

### Pendiente antes de versión oficial

- QA manual en Safari real.
- Validación manual con NVDA o VoiceOver.
- Ejecución y firma del checklist de aceptación final.
- Etiqueta Git y despliegue formal.
