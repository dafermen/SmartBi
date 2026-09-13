import { beforeEach, describe, expect, it, vi } from 'vitest';

const readXlsxFileMock = vi.hoisted(() => vi.fn());

vi.mock('read-excel-file/browser', () => ({ default: readXlsxFileMock }));

import { buildNormalizedHeaders, importExcel, parseNumber } from './excelImporter';

beforeEach(() => readXlsxFileMock.mockReset());

describe('parseNumber', () => {
  it.each([
    ['158,5', 158.5], ['1.234,50', 1234.5], ['1,234.50', 1234.5], [125, 125], ['', 0], ['no-numérico', 0],
  ])('convierte %s en %s', (input, expected) => expect(parseNumber(input)).toBe(expected));

  it.each([
    [null, 0],
    [undefined, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    ['  -1.250,75  ', -1250.75],
    [true, 0],
  ])('maneja de forma segura la entrada extraña %s', (input, expected) => expect(parseNumber(input)).toBe(expected));
});

describe('encabezados genéricos', () => {
  it('hace únicas las columnas repetidas y da nombre a las vacías', () => {
    expect(buildNormalizedHeaders(['Categoría', ' Categoría ', null, 'SQL', 'SQL'])).toEqual([
      'CATEGORIA', 'CATEGORIA_2', 'COLUMNA_3', 'SQL', 'SQL_2',
    ]);
  });

  it('descarta todas las columnas SQL antes del wizard y conserva columnas repetidas', async () => {
    readXlsxFileMock.mockResolvedValue([
      {
        sheet: 'Datos',
        data: [
          ['Categoría', 'Categoría', 'SQL', ' SQL ', null],
          ['Producto', 'Software', 'SELECT 1', 'DROP TABLE', 'Dato libre'],
        ],
      },
    ]);

    const result = await importExcel(new File(['contenido'], 'datos.xlsx'));

    expect(result.detectedColumns.map((column) => column.normalizedHeader)).toEqual([
      'CATEGORIA', 'CATEGORIA_2', 'COLUMNA_5',
    ]);
    expect(result.records[0].raw).toEqual({
      CATEGORIA: 'Producto',
      CATEGORIA_2: 'Software',
      COLUMNA_5: 'Dato libre',
    });
    expect(Object.keys(result.columnMap)).not.toContain('SQL');
    expect(Object.keys(result.columnMap)).not.toContain('SQL_2');
    expect(result.issues).toContainEqual(expect.objectContaining({ column: 'SQL' }));
  });
});
