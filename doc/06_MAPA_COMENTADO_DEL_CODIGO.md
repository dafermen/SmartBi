# Mapa comentado del código fuente

## Cómo usar este documento

Este mapa responde “¿dónde está la parte que quiero entender o modificar?”. No leas todos los archivos a la vez. Elige una pregunta y sigue la ruta indicada.

## Vista general

```text
index.html
  └─ src/main.tsx
       └─ src/app/App.tsx
            ├─ UploadView.tsx
            │    └─ excelImporter.ts
            │         └─ domain/types.ts
            └─ DashboardView.tsx                 ├─ exportCsv.ts
                 ├─ Brand.tsx
                 └─ styles/global.css
```

Las flechas significan “usa” o “abre”. Las pruebas viven junto a la pieza que protegen.

## Archivos de configuración

### `package.json`

Es el mapa del proyecto. Contiene:

- nombre y versión;
- comandos disponibles en `scripts`;
- paquetes necesarios en `dependencies`;
- herramientas de desarrollo en `devDependencies`.

No edites versiones al azar. Una actualización puede cambiar comportamientos.

### `vite.config.ts`

Configura Vite, que inicia el servidor y crea el build. También configura Vitest para que las pruebas de componentes tengan un navegador simulado mediante `jsdom`.

### `tsconfig.app.json`

Configura las reglas de TypeScript. `strict: true` hace que TypeScript avise sobre más situaciones peligrosas.

### `eslint.config.js`

Configura la revisión estática. ESLint no ejecuta la aplicación: lee el código y busca patrones problemáticos.

## Entrada de la aplicación

### `index.html`

Contiene metadatos y `<div id="root"></div>`. Ese `div` es el lugar donde React construye la aplicación.

### `src/main.tsx`

Responsabilidades:

- importar estilos globales;
- encontrar `root`;
- iniciar React;
- renderizar `App` bajo `StrictMode`.

Cambiar aquí: casi nunca. Un proyecto normalmente tiene un solo punto de entrada.

## Coordinación

### `src/app/App.tsx`

Estados:

- `result`: resultado del Excel o `null`.
- `loading`: indica que la importación está trabajando.
- `error`: mensaje visible de error o `null`.

Flujo:

```text
result === null  → UploadView
result contiene datos → DashboardView
```

`handleImport` usa `try/catch/finally`:

- `try`: intenta importar.
- `catch`: captura un error y lo convierte en mensaje.
- `finally`: apaga el estado de carga tanto si funcionó como si falló.

`lazy` y `Suspense` cargan el dashboard solo cuando hace falta. Esto se llama code splitting.

## Importación

### `src/features/import/UploadView.tsx`

Responsabilidades visuales:

- selector de archivo;
- arrastrar y soltar;
- indicador de carga;
- mensaje de error;
- explicación de privacidad.

No debe calcular métricas ni leer celdas.

Puntos de aprendizaje:

- `useRef` apunta al input oculto.
- `useState` recuerda si se está arrastrando.
- `ChangeEvent` y `DragEvent` describen eventos.
- `onImport` es una función recibida como prop.

### `src/features/import/excelImporter.ts`

Responsabilidades de datos:

1. comprobar `.xlsx`;
2. comprobar 15 MB;
3. leer todas las hojas;
4. detectar encabezados;
5. conservar columnas originales en `raw`;
6. importar también tablas genéricas cuando no existe plantilla conocida;
7. convertir filas;
8. excluir `SQL`;
9. entregar `ImportResult`.

Funciones:

- `normalizeHeader`: unifica encabezados.
- `parseNumber`: entiende varios formatos numéricos.
- `asText`: convierte una celda en texto seguro.
- `findHeaderRow`: localiza la fila de títulos.
- `rowToRecord`: convierte una fila a `DataRecord`.
- `importExcel`: coordina el proceso completo.

Una decisión de seguridad importante está dentro de `rowToRecord`: `raw` conserva las columnas originales para dashboards dinámicos, pero nunca `SQL`.

## Dominio

La carpeta `domain` guarda ideas del negocio sin depender de la pantalla.

### `src/domain/types.ts`

Contiene contratos:

- `DataRecord`: fila limpia generica.
- `ImportIssue`: advertencia o error de una fila.
- `ImportResult`: resultado completo.
- `DashboardFilters`: filtros actuales.

### `src/features/dashboard/dashboardAnalytics.ts`

Calcula agrupaciones, filtros, rangos, KPIs y datos de visuales según el mapeo elegido por el usuario.

### `src/features/dashboard/dataProfile.ts`

Cuenta vacíos y valores únicos y recomienda posibles usos para cada columna. Se mantiene separado de React para poder probarlo y ejecutarlo dentro de un Worker.

### `src/features/dashboard/dataProfile.worker.ts`

Recibe filas y columnas, llama a `buildDataProfile` y devuelve el resultado sin bloquear la interfaz cuando el archivo es grande.

Una función pura no modifica cosas externas. Es más fácil de entender y probar.

## Dashboard

### `src/features/dashboard/DashboardView.tsx`

Secciones principales:

1. Formateadores y colores.
2. Estados de filtros, panel móvil y página.
3. Valores derivados mediante `useMemo`.
4. Funciones para activar o limpiar filtros.
5. Barra superior.
6. Panel lateral.
7. Tarjetas KPI.
8. Gráfico por requerimiento.
9. Ranking por campo destacado.
10. Tabla y paginación.
11. Componentes pequeños reutilizables.

`useMemo` guarda un cálculo hasta que cambian sus dependencias. No es una base de datos; es una optimización local.

### `src/features/dashboard/exportCsv.ts`

`CSV_COLUMNS` es una lista permitida. `escapeCsv` protege comas y comillas. `createCsv` construye el texto. `downloadCsv` crea una descarga temporal.

## Estilos

### `src/styles/global.css`

Orden:

1. fuentes y variables;
2. reglas generales;
3. marca;
4. bienvenida;
5. estructura de la aplicación;
6. filtros;
7. KPI;
8. gráficos;
9. tabla;
10. reglas responsive;
11. reducción de movimiento por accesibilidad.

Convención BEM:

- `.kpi-card`: bloque.
- `.kpi-card__top`: elemento interno.
- `.kpi-card--blue`: variante.

## Pruebas

### `src/features/dashboard/dashboardAnalytics.test.ts`

Comprueba sumas, filtros, rangos y agrupaciones.

### `src/features/import/excelImporter.test.ts`

Comprueba números con punto, coma, combinaciones y entradas inválidas.

### `src/features/dashboard/exportCsv.test.ts`

Comprueba comas, comillas y exclusión de `SQL`.

### `src/app/App.test.tsx`

Renderiza el componente, simula la selección de un archivo incorrecto y verifica el mensaje.

## Rutas rápidas según la pregunta

| Pregunta | Archivo inicial |
|---|---|
| ¿Dónde cambio un texto de bienvenida? | `UploadView.tsx` |
| ¿Dónde cambio un color? | `global.css` |
| ¿Dónde agrego una columna especial reconocida automáticamente? | `types.ts` y `excelImporter.ts` |
| ¿Dónde cambio una suma dinámica del dashboard? | `dashboardAnalytics.ts` |
| ¿Dónde agrego una prueba? | Archivo `.test` junto a la función |
| ¿Dónde cambio el gráfico? | `DashboardView.tsx` |
| ¿Dónde cambio la exportación? | `exportCsv.ts` |
| ¿Dónde cambio el límite de archivo? | `excelImporter.ts` |
| ¿Dónde se elimina SQL? | `excelImporter.ts` |
| ¿Dónde cambio el diseño móvil? | Media queries en `global.css` |

## Regla de oro para modificar

```text
Interfaz → componente
Color o tamaño → CSS
Lectura del Excel → importador
Forma de datos → types
Regla o cálculo → dashboardAnalytics
Comportamiento que debe conservarse → prueba
```

Si una regla de negocio termina escrita dentro de una clase CSS o una suma importante dentro del texto de un gráfico, probablemente está en la capa equivocada.
