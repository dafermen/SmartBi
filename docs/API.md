# API interna y contratos — SmartBI

SmartBI no expone una API HTTP. Este documento describe contratos internos entre módulos.

## Importación Excel

### `importExcel(file: File): Promise<ImportResult>`

Ubicación:

```text
src/features/import/excelImporter.ts
```

Entrada:

- `file`: archivo `.xlsx` seleccionado por el usuario.

Salida:

- `ImportResult`: resultado de importación con filas, columnas detectadas, advertencias y metadatos.

Reglas importantes:

- Rechazar archivos que no sean `.xlsx`.
- Respetar límite de tamaño.
- Detectar encabezados tabulares.
- Mantener los datos originales en `raw`.
- Dar identificadores únicos a encabezados repetidos.
- Asignar un nombre seguro a encabezados vacíos.
- Excluir todas las columnas cuyo encabezado sea `SQL` antes del wizard.

## Tipos principales

Ubicación:

```text
src/domain/types.ts
```

Tipos relevantes:

- `CellValue`
- `DataRecord`
- `DetectedColumn`
- `ImportIssue`
- `ImportResult`
- `DashboardFieldConfig`
- `DashboardFilters`

## Cálculo del dashboard

### `computeDashboardAnalytics(input: DashboardAnalyticsInput): DashboardAnalytics`

Ubicación:

```text
src/features/dashboard/dashboardAnalytics.ts
```

Entrada:

- registros importados,
- configuración elegida por el usuario,
- filtros activos,
- campo de métrica,
- campos de dimensión,
- campo de fecha opcional.

Salida:

- KPIs,
- filas filtradas,
- grupos para gráficos,
- opciones para filtros,
- perfil básico de métrica.

Invariantes verificadas:

- las filas filtradas nunca superan las filas de entrada;
- los conteos positivos, cero y negativos coinciden con las filas visibles;
- la suma de grupos coincide con el KPI total;
- totales, promedio y máximo siempre son números finitos;
- un conjunto de métricas negativas conserva su máximo negativo real.

## Páginas del informe

### `sanitizeReportPages(value: unknown): ReportPage[]`

Ubicación:

```text
src/features/dashboard/reportPages.ts
```

Responsabilidad:

- validar datos desconocidos leídos desde LocalStorage;
- descartar páginas inválidas o duplicadas;
- descartar secciones desconocidas;
- mantener una única página inicial visible;
- recuperar la composición predeterminada cuando los datos están dañados.

## Exportación CSV

### `downloadCsv<T>(rows, fileName, columns, suffix?)`

Ubicación:

```text
src/features/dashboard/exportCsv.ts
```

Responsabilidad:

- Exportar el subconjunto visible o el reporte de calidad.

## Contratos que no deben romperse

- `DataRecord.raw` debe conservar las columnas normalizadas.
- `DashboardFieldConfig.metricField` debe apuntar a una columna numérica.
- `DashboardFieldConfig.dimensionField` debe existir en el archivo importado.
- `SQL` no debe llegar al dashboard ni a CSV.
- El dashboard debe soportar archivos con columnas diferentes.
