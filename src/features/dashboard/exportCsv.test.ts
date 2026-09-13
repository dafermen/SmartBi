import { expect, it } from 'vitest';
import { createCsv } from './exportCsv';

it('escapa texto y exporta solo columnas explícitas', () => {
  const record = {
    raw: {
      CODIGO: 'A1',
      DESCRIPCION: 'Registro, especial',
      CLIENTE: 'Cliente "Uno"',
      SQL: 'SELECT * FROM datos',
    },
  };

  const csv = createCsv([record], [
    { label: 'Código', getValue: (row) => row.raw.CODIGO },
    { label: 'Descripción', getValue: (row) => row.raw.DESCRIPCION },
    { label: 'Cliente', getValue: (row) => row.raw.CLIENTE },
  ]);

  expect(csv).toContain('"Registro, especial"');
  expect(csv).toContain('"Cliente ""Uno"""');
  expect(csv).not.toContain('SQL');
});

it('soporta columnas custom para exportación', () => {
  const record = {
    codigo: 'A1',
    valor: 5,
  };
  const csv = createCsv([record], [
    { label: 'Código', getValue: (row) => row.codigo },
    { label: 'Valor', getValue: (row) => row.valor },
  ]);
  expect(csv).toContain('Código,Valor');
  expect(csv).toContain('A1,5');
});
