# SmartBI

SmartBI es una aplicación educativa hecha con React y TypeScript. Permite cargar archivos Excel tabulares directamente en el navegador y convertirlos en dashboards con indicadores, filtros, gráficos, páginas de informe y tabla de detalle.

SmartBI no usa inteligencia artificial ni modelos generativos. El nombre se enfoca en BI: analítica, visualización y exploración local de datos.

La opción **Documentación** abre una biblioteca responsive con búsqueda, categorías, enlaces compartibles, tema claro/oscuro y navegación entre capítulos. Los Markdown de `doc/` y `docs/` son las fuentes originales; la aplicación no mantiene copias.

## Inicio rápido

![SmartBI con un informe de ventas, filtros elegidos por el usuario y gráficos de ejemplo.](public/docs/screenshots/05-dashboard.jpg)

Consulta el [manual ilustrado](doc/09_MANUAL_FINAL_DE_USUARIO.md) para recorrer
la aplicación paso a paso. Todas las imágenes usan datos ficticios.

```powershell
cd C:\Projects\SmartBI
npm ci
npm run dev:5171
```

Abre `http://127.0.0.1:5171`, carga un archivo `.xlsx` tabular y configura sus campos desde el wizard.

Después de instalar dependencias, `npm run dev:5171` es el único comando necesario para levantar toda la aplicación. SmartBI no requiere iniciar un backend.

## Verificaciones

```powershell
npm test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

- `test` comprueba automáticamente reglas importantes.
- `lint` busca errores y malas prácticas.
- `docs:check` detecta enlaces locales rotos en la documentación.
- `build` confirma que se puede crear la versión de producción.
- `test:e2e` ejecuta el recorrido real en navegador con Playwright.

## Despliegue del MVP

El destino preparado es `https://smartbi.innovalogic.tech`. SmartBI se sirve
como aplicación estática mediante el Nginx existente; no necesita Docker ni un
backend en ejecución.

Comprobación completa previa:

```powershell
npm run deploy:check
```

La publicación demo fue autorizada por el propietario. La aceptación formal
y las comprobaciones manuales de accesibilidad siguen pendientes. Confirmar el
código en `origin/main` y seguir la guía [Despliegue](docs/DEPLOYMENT.md). El primer
despliegue y los siguientes están separados para que la configuración de Nginx
y certificados no se modifique accidentalmente.

## Ruta de aprendizaje

Si estás aprendiendo, no comiences leyendo todos los archivos. Sigue este orden:

1. [Guía didáctica para aprender con SmartBI](doc/05_GUIA_DIDACTICA_PARA_APRENDER.md).
2. [Mapa comentado del código](doc/06_MAPA_COMENTADO_DEL_CODIGO.md).
3. `src/main.tsx`.
4. `src/app/App.tsx`.
5. `src/features/import/UploadView.tsx`.
6. `src/features/import/FieldConfiguratorView.tsx`.
7. `src/features/import/excelImporter.ts`.
8. `src/features/dashboard/dashboardAnalytics.ts`.
9. `src/features/dashboard/DashboardView.tsx`.

La documentación de producto y aprendizaje usada por la app está en [`doc/`](doc/).

## Documentación técnica profesional

La documentación técnica complementaria está en [`docs/`](docs/):

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API.md`](docs/API.md)
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)
- [`docs/TESTING.md`](docs/TESTING.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md)
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md)
- [`docs/RELEASE_0.1.0.md`](docs/RELEASE_0.1.0.md)
- [`docs/adr/`](docs/adr/)

El checklist humano previo a la versión está en [`doc/10_CHECKLIST_ACEPTACION_FINAL.md`](doc/10_CHECKLIST_ACEPTACION_FINAL.md).

Antes de desplegar, revisar especialmente [`docs/TESTING.md`](docs/TESTING.md).

## Privacidad

El Excel se procesa localmente. La columna `SQL` se elimina durante la importación y no llega al dashboard ni a la exportación CSV.

Los libros Excel personales o empresariales se excluyen mediante `.gitignore`.
Las pruebas usan únicamente `tests/fixtures/smartbi-synthetic-sample.xlsx`, una
muestra pequeña con datos inventados.

## Licencia

El código y su documentación se distribuyen bajo [MIT](LICENSE), con
copyright de Dario Meneses (2026). Las dependencias mantienen sus propias
[licencias de terceros](THIRD_PARTY_LICENSES.md). Los Excel privados no forman
parte de esta publicación.

## Seguridad y reporte de problemas

Consulta [SECURITY.md](docs/SECURITY.md) para conocer el alcance de seguridad, controles actuales y pendientes de endurecimiento.
