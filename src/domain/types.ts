/**
 * Valor permitido dentro de una celda importada desde Excel.
 *
 * Excel puede traer textos, números, fechas, valores verdadero/falso o celdas
 * vacías. Este tipo enumera esas posibilidades para que TypeScript nos ayude.
 */
export type CellValue = string | number | boolean | Date | null;

/**
 * Fila genérica importada desde Excel.
 *
 * Campos:
 * - `id`: identificador único de la fila dentro de SmartBI.
 * - `raw`: objeto con todos los valores originales de la fila.
 *
 * Ejemplo de `raw`:
 * ```ts
 * {
 *   CATEGORIA: 'Software',
 *   VALOR: 120,
 *   FECHA: '2026-01-01'
 * }
 * ```
 *
 * La palabra `raw` significa “crudo” u “original”. Guardamos los datos así
 * porque SmartBI no sabe de antemano qué columnas traerá cada Excel.
 */
export interface DataRecord {
  id: string;
  raw: Record<string, CellValue>;
}

/**
 * Nivel de una incidencia detectada al importar.
 *
 * - `warning`: algo que conviene avisar, pero no impide continuar.
 * - `error`: algo más serio. En este MVP casi todo se maneja como advertencia
 *   para que el usuario pueda seguir aprendiendo y explorando.
 */
export type IssueLevel = 'error' | 'warning';

/**
 * Mensaje sobre algo encontrado durante la importación.
 *
 * Campos:
 * - `level`: gravedad del mensaje.
 * - `row`: fila relacionada, si aplica.
 * - `column`: columna relacionada, si aplica.
 * - `message`: explicación para el usuario.
 */
export interface ImportIssue {
  level: IssueLevel;
  row?: number;
  column?: string;
  message: string;
}

/**
 * Tipos simples que SmartBI puede detectar en una columna.
 *
 * Estos tipos no son una verdad absoluta: son una ayuda para que el wizard
 * pueda sugerir qué columnas sirven como métrica, fecha o filtro.
 */
export type DetectedColumnKind = 'text' | 'number' | 'date' | 'boolean' | 'empty';

/**
 * Descripción de una columna detectada en el Excel.
 *
 * Campos:
 * - `header`: título original, como lo escribió la persona en Excel.
 * - `normalizedHeader`: versión segura para usar como clave en código.
 * - `kind`: tipo aproximado de datos de esa columna.
 */
export interface DetectedColumn {
  header: string;
  normalizedHeader: string;
  kind: DetectedColumnKind;
}

/**
 * Resultado completo de importar un archivo Excel.
 *
 * Este objeto viaja desde el importador hacia el wizard y luego al dashboard.
 * Se puede imaginar como una caja grande que contiene:
 * - información del archivo,
 * - filas importadas,
 * - columnas detectadas,
 * - advertencias,
 * - datos útiles para configurar el reporte.
 */
export interface ImportResult {
  fileName: string;
  sheetName: string;
  importedAt: Date;
  totalRows: number;
  records: DataRecord[];
  rejectedRows: number;
  issues: ImportIssue[];
  unknownColumns: string[];
  detectedColumns: DetectedColumn[];
  columnMap: Record<string, string>;
  autoMappingMode: boolean;
}

/**
 * Configuración elegida por el usuario en el wizard.
 *
 * Campos importantes:
 * - `dimensionField`: columna principal para agrupar datos.
 * - `secondaryDimensionFields`: columnas extra para formar agrupaciones compuestas.
 * - `descriptionField`: columna que ayuda a describir cada fila.
 * - `metricField`: columna numérica que se suma, promedia o compara.
 * - `includedColumns`: columnas que el usuario decidió conservar en el análisis.
 * - `filterFields`: columnas que aparecerán como filtros.
 * - `supplierField`: nombre heredado internamente; hoy significa “filtro destacado”.
 * - `secondaryFilterField`: segundo campo destacado para ranking o filtro.
 * - `dateField`: columna de fecha, opcional.
 */
export interface DashboardFieldConfig {
  dimensionField: string;
  secondaryDimensionFields?: string[];
  descriptionField: string;
  metricField: string;
  includedColumns?: string[];
  filterFields?: string[];
  supplierField?: string;
  secondaryFilterField?: string;
  dateField?: string;
}

/**
 * Filtros activos del dashboard.
 *
 * Estos valores cambian cuando el usuario busca, marca checkboxes o define
 * rangos. El dashboard se recalcula usando esta información.
 */
export interface DashboardFilters {
  search: string;
  requirements: string[];
  suppliers: string[];
  secondaryValues: string[];
  fieldValues?: Record<string, string[]>;
  metricMin?: number;
  metricMax?: number;
  dateFrom?: number;
  dateTo?: number;
}
