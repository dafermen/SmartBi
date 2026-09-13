import readXlsxFile, { type Row } from 'read-excel-file/browser';
import type { CellValue, DataRecord, DetectedColumn, DetectedColumnKind, ImportIssue, ImportResult } from '../../domain/types';

/**
 * Tamaño máximo del archivo que SmartBI acepta en este MVP.
 *
 * Una computadora y un navegador tienen memoria limitada. Si dejamos que el
 * usuario cargue archivos gigantes, la página podría ponerse lenta o quedarse
 * congelada. Por eso definimos un límite claro.
 *
 * Dato curioso:
 * - 1 KB = 1024 bytes
 * - 1 MB = 1024 * 1024 bytes
 * - 15 MB = 15 * 1024 * 1024 bytes
 */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/**
 * Umbrales de aviso, no de bloqueo.
 *
 * SmartBI permite continuar, pero explica que un archivo grande puede tardar
 * más dependiendo de la memoria y velocidad del dispositivo.
 */
export const LARGE_FILE_WARNING_BYTES = 8 * 1024 * 1024;
export const LARGE_ROW_WARNING = 25_000;
export const LARGE_COLUMN_WARNING = 80;

/**
 * Convierte un encabezado de Excel en una clave fácil de usar por el programa.
 *
 * Parámetro:
 * - `value`: el texto original de una celda de encabezado.
 *
 * Retorna:
 * - Un texto en mayúsculas, sin tildes y con guiones bajos.
 *
 * Ejemplos:
 * - "Fecha de venta" se convierte en "FECHA_DE_VENTA"
 * - "Categoría" se convierte en "CATEGORIA"
 *
 * ¿Por qué hacemos esto?
 * Porque las personas pueden escribir encabezados de muchas formas. El código
 * necesita una versión estable para guardar y buscar columnas.
 */
function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

/**
 * Crea claves únicas incluso cuando Excel trae encabezados vacíos o repetidos.
 *
 * Ejemplo: `Ciudad`, `Ciudad`, celda vacía se convierte en `CIUDAD`,
 * `CIUDAD_2`, `COLUMNA_3`. Así una columna nunca sobrescribe silenciosamente
 * a otra dentro de `DataRecord.raw`.
 */
export function buildNormalizedHeaders(headers: Row): string[] {
  const repetitions = new Map<string, number>();

  return headers.map((header, index) => {
    const baseName = normalizeHeader(header) || `COLUMNA_${index + 1}`;
    const repetition = (repetitions.get(baseName) ?? 0) + 1;
    repetitions.set(baseName, repetition);
    return repetition === 1 ? baseName : `${baseName}_${repetition}`;
  });
}

/**
 * Convierte diferentes maneras humanas de escribir números a un `number`.
 *
 * Parámetro:
 * - `value`: una celda que podría contener un número.
 *
 * Retorna:
 * - Un número válido de JavaScript.
 * - Si no se puede interpretar, retorna `0`.
 *
 * Ejemplos:
 * - "158,5" -> 158.5
 * - "1.234,50" -> 1234.5
 * - "1,234.50" -> 1234.5
 *
 * Esta función existe porque Excel puede traer números como texto y porque los
 * separadores cambian según el país.
 */
export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;

  let text = String(value).trim().replace(/\s/g, '');
  if (!text) return 0;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');

  if (hasComma && hasDot) {
    text = text.lastIndexOf(',') > text.lastIndexOf('.') ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (hasComma) {
    text = text.replace(',', '.');
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Convierte cualquier valor en texto limpio.
 *
 * Parámetro:
 * - `value`: valor original de una celda.
 *
 * Retorna:
 * - Texto sin espacios sobrantes.
 * - Si la celda está vacía, retorna `''`.
 */
function asText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Pregunta si una celda está vacía.
 *
 * Parámetro:
 * - `value`: valor de una celda.
 *
 * Retorna:
 * - `true` cuando no hay un dato útil.
 * - `false` cuando la celda tiene algún contenido.
 *
 * Se usa para ignorar filas completamente vacías.
 */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * Intenta adivinar el tipo de datos de una columna.
 *
 * Parámetro:
 * - `values`: varias celdas tomadas de una misma columna.
 *
 * Retorna:
 * - `'number'` si la mayoría parecen números.
 * - `'date'` si la mayoría parecen fechas.
 * - `'boolean'` si la mayoría parecen sí/no o true/false.
 * - `'text'` si parecen texto normal.
 * - `'empty'` si no hay datos suficientes.
 *
 * No busca ser perfecto. Solo ayuda a que el wizard sugiera buenas opciones.
 */
function detectColumnKind(values: unknown[]): DetectedColumnKind {
  const sample = values
    .map(asText)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (sample.length === 0) return 'empty';

  const numberHits = sample.filter((value) => parseNumber(value) > 0 || /^-?\d+([.,]\d+)?$/.test(value)).length;
  if (numberHits / sample.length >= 0.65) return 'number';

  const dateHits = sample.filter((value) => Number.isFinite(Date.parse(value))).length;
  if (dateHits / sample.length >= 0.5) return 'date';

  const booleanHits = sample.filter((value) => ['si', 'sí', 'no', 'true', 'false', '0', '1'].includes(value.toLowerCase())).length;
  if (booleanHits / sample.length >= 0.65) return 'boolean';

  return 'text';
}

/**
 * Da puntos a una fila para saber si parece encabezado de tabla.
 *
 * Parámetros:
 * - `rows`: todas las filas de una hoja.
 * - `index`: número de la fila que estamos evaluando.
 *
 * Retorna:
 * - Un puntaje. Más alto significa “parece más encabezado”.
 *
 * Una fila parece encabezado cuando:
 * - Tiene varios textos no vacíos.
 * - La fila siguiente tiene datos.
 * - Sus encabezados no están repetidos.
 */
function scoreTabularHeaderRow(rows: Row[], index: number): number {
  const row = rows[index] ?? [];
  const nextRow = rows[index + 1] ?? [];
  const headers = row.map(normalizeHeader).filter(Boolean);
  const uniqueHeaders = new Set(headers);
  const nextRowValues = nextRow.filter((value) => !isEmpty(value)).length;

  if (uniqueHeaders.size < 2 || nextRowValues === 0) return 0;
  return uniqueHeaders.size + Math.min(nextRowValues, uniqueHeaders.size);
}

/**
 * Encuentra la fila de encabezados dentro de una hoja.
 *
 * Parámetro:
 * - `rows`: filas de una hoja de Excel.
 *
 * Retorna:
 * - El índice de la mejor fila encontrada.
 * - `-1` si no encontró una tabla clara.
 *
 * Solo revisa las primeras 15 filas porque muchos Excel tienen títulos o notas
 * arriba, pero normalmente la tabla empieza cerca del inicio.
 */
function findHeaderRow(rows: Row[]): number {
  let bestIndex = -1;
  let bestScore = 0;

  rows.slice(0, 15).forEach((_row, index) => {
    const score = scoreTabularHeaderRow(rows, index);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore > 0 ? bestIndex : -1;
}

/**
 * Construye la lista inicial de columnas detectadas.
 *
 * Parámetro:
 * - `headers`: fila del Excel que contiene los títulos.
 *
 * Retorna:
 * - Un arreglo de columnas con:
 *   - nombre original,
 *   - nombre normalizado,
 *   - tipo inicial.
 *
 * Al inicio marcamos todo como texto. Después `refineDetectedKinds` mejora esa
 * información mirando datos reales.
 */
function buildDetectedColumns(headers: Row, normalizedHeaders: string[]): DetectedColumn[] {
  return headers.map((header, index) => ({
    header: String(header ?? '').trim() || `Columna ${index + 1}`,
    normalizedHeader: normalizedHeaders[index],
    kind: 'text',
  }));
}

/**
 * Ajusta el tipo detectado de cada columna mirando ejemplos reales.
 *
 * Parámetros:
 * - `detectedColumns`: columnas encontradas en el encabezado.
 * - `rows`: todas las filas de la hoja.
 * - `headerIndex`: posición donde está la fila de encabezados.
 *
 * Retorna:
 * - Las mismas columnas, pero con el campo `kind` más preciso.
 */
function refineDetectedKinds(
  detectedColumns: DetectedColumn[],
  rows: Row[],
  headerIndex: number,
): DetectedColumn[] {
  return detectedColumns.map((column, colIndex) => {
    const values = rows.slice(headerIndex + 1, headerIndex + 21).map((row) => row[colIndex]);
    return { ...column, kind: detectColumnKind(values) };
  });
}

/**
 * Convierte una fila de Excel en un `DataRecord`.
 *
 * Parámetros:
 * - `row`: la fila original del Excel.
 * - `rawIndex`: mapa que dice en qué posición está cada columna.
 * - `rowNumber`: número real de fila para ayudar a crear un id.
 *
 * Retorna:
 * - Un objeto con:
 *   - `id`: identificador de la fila.
 *   - `raw`: datos originales de la fila, usando encabezados normalizados.
 *
 * Nota de seguridad:
 * Si existe una columna llamada `SQL`, no la copiamos. SmartBI analiza datos,
 * no ejecuta ni conserva instrucciones SQL.
 */
function rowToRecord(row: Row, rawIndex: Map<string, number>, rowNumber: number): DataRecord {
  const raw: DataRecord['raw'] = {};

  rawIndex.forEach((index, key) => {
    if (key !== 'SQL') raw[key] = row[index] as CellValue;
  });

  const fallbackId = Object.values(raw).map(asText).find(Boolean) ?? 'fila';

  return {
    id: `${fallbackId}-${rowNumber}`,
    raw,
  };
}

/**
 * Importa un archivo Excel y lo transforma en datos que SmartBI entiende.
 *
 * Parámetro:
 * - `file`: archivo `.xlsx` que seleccionó el usuario.
 *
 * Retorna:
 * - Una promesa (`Promise`) con un `ImportResult`.
 *
 * ¿Qué hace esta función?
 * 1. Valida extensión y tamaño.
 * 2. Lee las hojas del Excel.
 * 3. Busca una hoja con forma de tabla.
 * 4. Detecta encabezados.
 * 5. Detecta tipos de columnas.
 * 6. Convierte cada fila en `DataRecord`.
 * 7. Devuelve todo listo para el wizard.
 */
export async function importExcel(file: File): Promise<ImportResult> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Selecciona un archivo con extensión .xlsx.');
  if (file.size > MAX_FILE_BYTES) throw new Error('El archivo supera el límite de 15 MB del MVP.');

  const sheets = await readXlsxFile(file);
  if (sheets.length === 0) throw new Error('El libro no contiene hojas legibles.');

  let selected: { name: string; rows: Row[]; headerIndex: number } | undefined;
  for (const sheet of sheets) {
    const rows = sheet.data;
    const headerIndex = findHeaderRow(rows);
    if (headerIndex >= 0 && (!selected || rows.length > selected.rows.length)) {
      selected = { name: sheet.sheet, rows, headerIndex };
    }
  }

  if (!selected) throw new Error('No se encontró una hoja tabular con encabezados y datos legibles.');

  const headers = selected.rows[selected.headerIndex];
  const normalizedHeaders = buildNormalizedHeaders(headers);
  // Se revisa el encabezado original para excluir todas las columnas llamadas
  // SQL, incluso si estaban repetidas y recibieron un sufijo como `SQL_2`.
  const safeHeaderEntries = normalizedHeaders
    .map((name, index) => ({ name, index, originalName: normalizeHeader(headers[index]) }))
    .filter((entry) => entry.originalName !== 'SQL');
  const rawHeaderToIndex = new Map<string, number>(safeHeaderEntries.map(({ name, index }) => [name, index]));
  const detectedColumns = refineDetectedKinds(buildDetectedColumns(headers, normalizedHeaders), selected.rows, selected.headerIndex)
    .filter((_column, index) => normalizeHeader(headers[index]) !== 'SQL');

  const issues: ImportIssue[] = [];
  if (headers.some((header) => normalizeHeader(header) === 'SQL')) {
    issues.push({ level: 'warning', column: 'SQL', message: 'La columna SQL fue descartada por seguridad.' });
  }

  if (file.size >= LARGE_FILE_WARNING_BYTES) {
    issues.push({
      level: 'warning',
      message: 'El archivo pesa más de 8 MB. El análisis puede tardar un poco en equipos con poca memoria.',
    });
  }

  const records: DataRecord[] = [];
  selected.rows.slice(selected.headerIndex + 1).forEach((row, offset) => {
    const rowNumber = selected.headerIndex + offset + 2;
    if (row.every(isEmpty)) return;
    records.push(rowToRecord(row, rawHeaderToIndex, rowNumber));
  });

  if (!records.length) throw new Error('La hoja seleccionada no contiene registros válidos.');

  if (records.length >= LARGE_ROW_WARNING) {
    issues.push({
      level: 'warning',
      message: `El archivo contiene ${records.length.toLocaleString('es-CO')} filas. SmartBI activará optimizaciones para mantener la interfaz fluida.`,
    });
  }

  if (detectedColumns.length >= LARGE_COLUMN_WARNING) {
    issues.push({
      level: 'warning',
      message: `Se detectaron ${detectedColumns.length} columnas. Selecciona únicamente las necesarias para reducir el trabajo del navegador.`,
    });
  }

  const columnMap: Record<string, string> = Object.fromEntries(safeHeaderEntries.map(({ name }) => [name, name]));

  return {
    fileName: file.name,
    sheetName: selected.name,
    importedAt: new Date(),
    totalRows: records.length,
    records,
    rejectedRows: 0,
    issues,
    unknownColumns: [],
    detectedColumns,
    columnMap,
    autoMappingMode: false,
  };
}
