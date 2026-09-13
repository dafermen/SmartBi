export interface CsvExportColumn<TRecord> {
  label: string;
  getValue: (record: TRecord) => string | number;
}

function escapeCsv(value: unknown): string {
  // En CSV las comas, saltos de línea y comillas tienen significado especial.
  // Rodeamos esos textos con comillas y duplicamos las comillas internas.
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function createCsv<TRecord>(records: TRecord[], columns: CsvExportColumn<TRecord>[]): string {
  const rows = [
    columns.map((column) => column.label),
    ...records.map((record) => columns.map((column) => column.getValue(record))),
  ];
  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
}

export function downloadCsv<TRecord>(records: TRecord[], sourceName: string, columns: CsvExportColumn<TRecord>[], suffix = 'filtrado') {
  // Blob crea un archivo temporal en memoria. El enlace también es temporal y
  // se libera al terminar para no desperdiciar memoria del navegador.
  const blob = new Blob([createCsv(records, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sourceName.replace(/\.xlsx$/i, '')}-${suffix}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
