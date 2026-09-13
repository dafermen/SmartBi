import type { DataRecord } from '../../domain/types';

/**
 * Fila preparada para mostrar en el dashboard.
 *
 * No es la fila original del Excel. Es una versión enriquecida que ya sabe:
 * - cómo se llama su grupo principal,
 * - cuál es su descripción,
 * - cuál es su métrica,
 * - qué fecha tiene,
 * - qué valores de filtro le pertenecen.
 */
export interface DashboardAnalyticsRow {
  id: string;
  dimension: string;
  description: string;
  supplier: string;
  secondaryValue: string;
  filterValues: Record<string, string>;
  metric: number;
  dateValue: number;
  source: DataRecord;
}

/**
 * Grupo para gráficos.
 *
 * Ejemplo:
 * ```ts
 * { name: 'Bogotá', value: 1200 }
 * ```
 */
export interface DashboardGroup {
  name: string;
  value: number;
}

/**
 * Lista de opciones para un filtro dinámico.
 *
 * Si el usuario eligió `CIUDAD` como filtro, aquí podrían vivir valores como:
 * Bogotá, Cali, Medellín, Barranquilla...
 */
export interface DashboardFilterOptionGroup {
  field: string;
  label: string;
  values: string[];
}

/**
 * Resultado completo de calcular el dashboard.
 *
 * Este objeto es como una bandeja con todo listo para que React pinte:
 * - tarjetas,
 * - gráficos,
 * - tabla,
 * - filtros,
 * - rankings.
 */
export interface DashboardAnalytics {
  allDimensions: string[];
  allSuppliers: string[];
  allSecondaryValues: string[];
  allFilterValues: DashboardFilterOptionGroup[];
  filteredRows: DashboardAnalyticsRow[];
  dimensionGroups: DashboardGroup[];
  supplierGroups: DashboardGroup[];
  secondaryGroups: DashboardGroup[];
  metricTotal: number;
  metricMax: number;
  metricAverage: number;
  positiveMetricRows: number;
  zeroMetricRows: number;
  negativeMetricRows: number;
}

/**
 * Datos que entran al cálculo.
 *
 * Aquí se mezclan:
 * - las filas importadas,
 * - los campos que el usuario eligió en el wizard,
 * - los filtros activos.
 */
export interface DashboardAnalyticsInput {
  records: DataRecord[];
  search: string;
  requirements: string[];
  suppliers: string[];
  secondaryValues: string[];
  fieldValues?: Record<string, string[]>;
  metricMin?: number;
  metricMax?: number;
  dateFrom?: number;
  dateTo?: number;
  fieldForDimension: string;
  secondaryDimensionFields?: string[];
  fieldForDescription: string;
  metricField: string;
  fieldForSupplier?: string;
  fieldForSecondaryFilter?: string;
  filterFields?: string[];
  filterLabels?: Record<string, string>;
  dateField?: string;
  metricSearchLabel: string;
}

/**
 * Convierte una celda en número para poder usarla como métrica.
 *
 * Parámetro:
 * - `value`: valor original de una celda.
 *
 * Retorna:
 * - Número seguro para sumar o comparar.
 */
function parseMetric(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;

  const text = String(value).trim().replace(/\s/g, '');
  if (!text) return 0;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');

  let normalized = text;
  if (hasComma && hasDot) {
    normalized =
      text.lastIndexOf(',') > text.lastIndexOf('.')
        ? text.replace(/\./g, '').replace(',', '.')
        : text.replace(/,/g, '');
  } else if (hasComma) {
    normalized = text.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Lee una celda como texto.
 *
 * Parámetros:
 * - `record`: fila importada.
 * - `normalizedHeader`: clave normalizada de la columna.
 *
 * Retorna:
 * - Texto limpio.
 */
function readAsText(record: DataRecord, normalizedHeader?: string): string {
  if (!normalizedHeader) return '';
  const value = record.raw[normalizedHeader];
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/**
 * Crea una dimensión simple o compuesta.
 *
 * Ejemplos:
 * - Solo campo principal: "Bogotá"
 * - Campo principal + secundario: "Bogotá > Corporativo"
 */
function buildCompositeDimension(record: DataRecord, primaryField: string, secondaryFields: string[] = []): string {
  const fields = [primaryField, ...secondaryFields].filter(Boolean);
  const values = fields.map((field) => readAsText(record, field) || 'Sin definir');
  return values.join(' > ');
}

/**
 * Intenta convertir una celda en fecha.
 *
 * Retorna:
 * - `Date` si logra entender la fecha.
 * - `null` si no puede.
 */
function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const fromNumber = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Lee la métrica elegida por el usuario desde una fila.
 */
export function readRawMetric(record: DataRecord, normalizedHeader?: string): number {
  if (!normalizedHeader) return 0;
  return parseMetric(record.raw[normalizedHeader]);
}

/**
 * Lee la fecha elegida por el usuario desde una fila.
 *
 * Retorna un número llamado timestamp. Un timestamp representa una fecha como
 * milisegundos, lo que permite comparar fácilmente “antes” y “después”.
 */
export function readRawDate(record: DataRecord, normalizedHeader?: string): number {
  if (!normalizedHeader) return 0;
  const value = parseDate(record.raw[normalizedHeader]);
  return value ? value.getTime() : 0;
}

/**
 * Calcula todo lo que necesita el dashboard.
 *
 * Parámetro:
 * - `input`: filas, campos configurados y filtros activos.
 *
 * Retorna:
 * - `DashboardAnalytics`, una caja con datos listos para pintar.
 *
 * La función recorre las filas una sola vez. Eso es importante porque un Excel
 * puede tener miles de registros y queremos que la app siga siendo rápida.
 */
export function computeDashboardAnalytics(input: DashboardAnalyticsInput): DashboardAnalytics {
  // Texto del buscador global.
  const query = input.search.trim().toLocaleLowerCase('es');

  // Si no hay búsqueda, todas las filas coinciden. Si hay búsqueda, revisamos
  // si el texto aparece dentro de una frase grande construida con la fila.
  const matchesSearch = !query
    ? () => true
    : (haystack: string) => haystack.includes(query);

  // `Set` evita duplicados. Sirve para construir listas de filtros.
  const allDimensions = new Set<string>();
  const allSuppliers = new Set<string>();
  const allSecondaryValues = new Set<string>();

  // `Map` guarda pares clave -> valor. Aquí lo usamos para acumular opciones y
  // sumas por grupo.
  const allDynamicFilterValues = new Map<string, Set<string>>();
  const dimensionGroups = new Map<string, number>();
  const supplierGroups = new Map<string, number>();
  const secondaryGroups = new Map<string, number>();

  // Aquí guardaremos las filas que pasan todos los filtros.
  const rows: DashboardAnalyticsRow[] = [];

  // Acumuladores de KPIs.
  let metricTotal = 0;
  // Usamos infinito negativo para que un conjunto compuesto únicamente por
  // valores negativos conserve su máximo real (por ejemplo, -2 en vez de 0).
  let metricMax = Number.NEGATIVE_INFINITY;
  let positiveMetricRows = 0;
  let zeroMetricRows = 0;
  let negativeMetricRows = 0;

  // Estos nombres vienen de versiones anteriores, pero hoy significan
  // “campo destacado” y “campo destacado secundario”.
  const hasSupplierColumn = Boolean(input.fieldForSupplier);
  const hasSecondaryFilterColumn = Boolean(input.fieldForSecondaryFilter);

  // Quitamos filtros repetidos usando `Set`.
  const filterFields = [...new Set(input.filterFields ?? [])].filter(Boolean);
  const metricSearchLabel = input.metricSearchLabel.toLocaleLowerCase('es');

  // Creamos una cajita vacía para cada filtro dinámico.
  filterFields.forEach((field) => allDynamicFilterValues.set(field, new Set<string>()));

  for (const record of input.records) {
    const dimension = buildCompositeDimension(record, input.fieldForDimension, input.secondaryDimensionFields);
    const description = readAsText(record, input.fieldForDescription);
    const supplier = hasSupplierColumn ? (readAsText(record, input.fieldForSupplier) || 'Sin definir') : 'Sin definir';
    const secondaryValue = hasSecondaryFilterColumn ? (readAsText(record, input.fieldForSecondaryFilter) || 'Sin definir') : 'Sin definir';
    const filterValues = Object.fromEntries(filterFields.map((field) => [field, readAsText(record, field) || 'Sin definir']));
    const metric = readRawMetric(record, input.metricField);
    const dateValue = readRawDate(record, input.dateField);

    allDimensions.add(dimension);
    if (hasSupplierColumn) allSuppliers.add(supplier);
    if (hasSecondaryFilterColumn) allSecondaryValues.add(secondaryValue);
    filterFields.forEach((field) => {
      allDynamicFilterValues.get(field)?.add(filterValues[field]);
    });

    const dynamicSearchText = Object.values(filterValues).join(' ');
    const haystack = `${dimension} ${description} ${supplier} ${secondaryValue} ${dynamicSearchText} ${metric} ${metricSearchLabel}`;
    const matchesQuery = matchesSearch(haystack.toLocaleLowerCase('es'));
    const matchesRequirement = input.requirements.length === 0 || input.requirements.includes(dimension);
    const matchesSupplier = input.suppliers.length === 0 || input.suppliers.includes(supplier);
    const matchesSecondary = input.secondaryValues.length === 0 || input.secondaryValues.includes(secondaryValue);
    const matchesDynamicFilters = filterFields.every((field) => {
      const selected = input.fieldValues?.[field] ?? [];
      return selected.length === 0 || selected.includes(filterValues[field]);
    });
    const matchesMetricMin = input.metricMin === undefined || metric >= input.metricMin;
    const matchesMetricMax = input.metricMax === undefined || metric <= input.metricMax;
    const matchesDateFrom = input.dateFrom === undefined || (dateValue > 0 && dateValue >= input.dateFrom);
    const matchesDateTo = input.dateTo === undefined || (dateValue > 0 && dateValue <= input.dateTo);

    // Si una fila no cumple cualquier filtro, la saltamos con `continue`.
    if (
      !matchesQuery ||
      !matchesRequirement ||
      !matchesSupplier ||
      !matchesSecondary ||
      !matchesDynamicFilters ||
      !matchesMetricMin ||
      !matchesMetricMax ||
      !matchesDateFrom ||
      !matchesDateTo
    ) {
      continue;
    }

    rows.push({
      id: record.id,
      dimension,
      description,
      supplier,
      secondaryValue,
      filterValues,
      metric,
      dateValue,
      source: record,
    });

    // Sumamos la métrica por cada grupo. Esto alimenta gráficos y rankings.
    dimensionGroups.set(dimension, (dimensionGroups.get(dimension) ?? 0) + metric);
    if (hasSupplierColumn) {
      supplierGroups.set(supplier, (supplierGroups.get(supplier) ?? 0) + metric);
    }
    if (hasSecondaryFilterColumn) {
      secondaryGroups.set(secondaryValue, (secondaryGroups.get(secondaryValue) ?? 0) + metric);
    }

    // Perfil simple de la métrica.
    if (metric > 0) positiveMetricRows += 1;
    else if (metric < 0) negativeMetricRows += 1;
    else zeroMetricRows += 1;

    metricTotal += metric;
    metricMax = Math.max(metricMax, metric);
  }

  // Convierte un Map en una lista ordenada de mayor a menor.
  const buildGroups = (groups: Map<string, number>) =>
    [...groups.entries()].map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value);

  return {
    allDimensions: [...allDimensions].sort(),
    allSuppliers: [...allSuppliers].sort(),
    allSecondaryValues: [...allSecondaryValues].sort(),
    allFilterValues: [...allDynamicFilterValues.entries()].map(([field, values]) => ({
      field,
      label: input.filterLabels?.[field] ?? field,
      values: [...values].sort(),
    })),
    filteredRows: rows,
    dimensionGroups: buildGroups(dimensionGroups),
    supplierGroups: buildGroups(supplierGroups),
    secondaryGroups: buildGroups(secondaryGroups),
    metricTotal,
    metricMax: rows.length === 0 ? 0 : metricMax,
    metricAverage: rows.length === 0 ? 0 : metricTotal / rows.length,
    positiveMetricRows,
    zeroMetricRows,
    negativeMetricRows,
  };
}
