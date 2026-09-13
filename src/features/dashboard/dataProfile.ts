import type { DataRecord, DetectedColumn } from '../../domain/types';

/**
 * Resumen educativo de una columna del Excel.
 *
 * Esta interfaz funciona como una ficha: guarda el nombre de la columna, su
 * tipo, cuántos valores distintos tiene, cuántas celdas están vacías y una
 * recomendación sencilla sobre cómo podría usarse en un dashboard.
 */
export interface DataProfileRow {
  field: string;
  header: string;
  kind: string;
  uniqueCount: number;
  emptyCount: number;
  emptyPercent: number;
  recommendation: string;
}

/**
 * Sugiere un uso posible para una columna.
 *
 * La función no toma decisiones por el usuario. Solamente observa el tipo de
 * dato, la cantidad de valores diferentes y el porcentaje de vacíos para dar
 * una pista comprensible.
 */
export function recommendColumnUse(
  kind: string,
  uniqueCount: number,
  totalRows: number,
  emptyPercent: number,
): string {
  if (emptyPercent >= 80) return 'Ignorar o revisar';
  if (kind === 'number') return 'Métrica';
  if (kind === 'date') return 'Fecha / tendencia';
  if (kind === 'boolean') return 'Filtro';
  if (uniqueCount <= Math.max(12, totalRows * 0.08)) return 'Filtro';
  if (uniqueCount <= Math.max(40, totalRows * 0.25)) return 'Agrupación';
  return 'Detalle / búsqueda';
}

/**
 * Construye el perfil de todas las columnas.
 *
 * Parámetros:
 * - `records`: filas importadas del Excel.
 * - `columns`: columnas detectadas por SmartBI.
 *
 * Retorna una ficha `DataProfileRow` por cada columna. La función es pura: no
 * cambia las filas recibidas ni toca la pantalla, por eso puede ejecutarse de
 * forma segura tanto en el hilo principal como dentro de un Web Worker.
 */
export function buildDataProfile(
  records: DataRecord[],
  columns: DetectedColumn[],
): DataProfileRow[] {
  return columns.map((column) => {
    let emptyCount = 0;
    const uniqueValues = new Set<string>();

    records.forEach((record) => {
      const value = record.raw[column.normalizedHeader];
      if (value === null || value === undefined || value === '') {
        emptyCount += 1;
        return;
      }
      uniqueValues.add(String(value).trim());
    });

    const emptyPercent = records.length === 0
      ? 0
      : Math.round((emptyCount / records.length) * 100);

    return {
      field: column.normalizedHeader,
      header: column.header,
      kind: column.kind,
      uniqueCount: uniqueValues.size,
      emptyCount,
      emptyPercent,
      recommendation: recommendColumnUse(
        column.kind,
        uniqueValues.size,
        records.length,
        emptyPercent,
      ),
    };
  });
}
