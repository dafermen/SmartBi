import { describe, expect, it } from 'vitest';
import type { DataRecord } from '../../domain/types';
import { computeDashboardAnalytics } from './dashboardAnalytics';

function baseRecord(overrides: Partial<DataRecord>): DataRecord {
  return {
    id: 'fila',
    raw: {
      CATEGORIA: 'Servicios',
      DESCRIPCION: 'Registro base',
      VALOR: 2,
      CLIENTE: 'Cliente base',
      FECHA: '2026-01-01',
    },
    ...overrides,
  };
}

describe('computeDashboardAnalytics', () => {
  it('filtra por búsqueda, dimensión y campo secundario y resume métricas', () => {
    const records = [
      baseRecord({
        id: '1',
        raw: { CATEGORIA: 'Software', DESCRIPCION: 'Licencia anual', VALOR: 4, CLIENTE: 'Alpha', FECHA: '2026-01-01' },
      }),
      baseRecord({
        id: '2',
        raw: { CATEGORIA: 'Consultoría', DESCRIPCION: 'Taller de datos', VALOR: 8, CLIENTE: 'Beta', FECHA: '2026-01-03' },
      }),
    ];

    const computed = computeDashboardAnalytics({
      records,
      search: 'taller',
      requirements: ['Consultoría'],
      suppliers: [],
      secondaryValues: [],
      fieldForDimension: 'CATEGORIA',
      fieldForDescription: 'DESCRIPCION',
      metricField: 'VALOR',
      fieldForSupplier: 'CLIENTE',
      fieldForSecondaryFilter: 'SEGMENTO',
      dateField: 'FECHA',
      metricSearchLabel: 'VALOR',
    });

    expect(computed.filteredRows).toHaveLength(1);
    expect(computed.metricTotal).toBe(8);
    expect(computed.metricAverage).toBe(8);
    expect(computed.dimensionGroups[0]).toMatchObject({ name: 'Consultoría', value: 8 });
    expect(computed.supplierGroups[0]).toMatchObject({ name: 'Beta', value: 8 });
    expect(computed.allSecondaryValues).toContain('Sin definir');
    expect(computed.positiveMetricRows).toBe(1);
    expect(computed.zeroMetricRows).toBe(0);
    expect(computed.negativeMetricRows).toBe(0);
  });

  it('mantiene rendimiento razonable con muchas filas', () => {
    const records = Array.from({ length: 50000 }, (_value, index) => {
      const isEven = index % 2 === 0;
      return baseRecord({
        id: `fila-${index}`,
        raw: {
          CATEGORIA: isEven ? 'Canal A' : 'Canal B',
          DESCRIPCION: `Registro-${index}`,
          VALOR: index + 1,
          CLIENTE: isEven ? 'Cliente A' : 'Cliente B',
          FECHA: '2026-01-01',
        },
      });
    });

    const startedAt = Date.now();
    const computed = computeDashboardAnalytics({
      records,
      search: 'registro-',
      requirements: [],
      suppliers: [],
      secondaryValues: [],
      fieldForDimension: 'CATEGORIA',
      fieldForDescription: 'DESCRIPCION',
      metricField: 'VALOR',
      fieldForSupplier: 'CLIENTE',
      fieldForSecondaryFilter: 'SEGMENTO',
      dateField: 'FECHA',
      metricSearchLabel: 'VALOR',
    });
    const elapsedMs = Date.now() - startedAt;

    expect(computed.filteredRows).toHaveLength(50000);
    expect(computed.metricTotal).toBe(1250025000);
    expect(elapsedMs).toBeLessThan(3000);
  });

  it('construye agrupaciones compuestas con campos secundarios', () => {
    const records = [
      baseRecord({
        id: '1',
        raw: { CATEGORIA: 'Norte', SEGMENTO: 'Corporativo', DESCRIPCION: 'Registro A', VALOR: 5, CLIENTE: 'Cliente A', FECHA: '2026-01-01' },
      }),
      baseRecord({
        id: '2',
        raw: { CATEGORIA: 'Norte', SEGMENTO: 'Educación', DESCRIPCION: 'Registro B', VALOR: 7, CLIENTE: 'Cliente A', FECHA: '2026-01-01' },
      }),
    ];

    const computed = computeDashboardAnalytics({
      records,
      search: '',
      requirements: ['Norte > Corporativo'],
      suppliers: [],
      secondaryValues: [],
      fieldForDimension: 'CATEGORIA',
      secondaryDimensionFields: ['SEGMENTO'],
      fieldForDescription: 'DESCRIPCION',
      metricField: 'VALOR',
      fieldForSupplier: 'CLIENTE',
      fieldForSecondaryFilter: 'SEGMENTO',
      dateField: 'FECHA',
      metricSearchLabel: 'VALOR',
    });

    expect(computed.allDimensions).toContain('Norte > Corporativo');
    expect(computed.allDimensions).toContain('Norte > Educación');
    expect(computed.filteredRows).toHaveLength(1);
    expect(computed.dimensionGroups[0]).toMatchObject({ name: 'Norte > Corporativo', value: 5 });
  });

  it('aplica rangos de métrica y fecha antes de calcular KPIs y grupos', () => {
    const records = [
      baseRecord({
        id: '1',
        raw: { CATEGORIA: 'A', DESCRIPCION: 'Registro A', VALOR: 5, CLIENTE: 'Cliente A', FECHA: '2026-01-01' },
      }),
      baseRecord({
        id: '2',
        raw: { CATEGORIA: 'B', DESCRIPCION: 'Registro B', VALOR: 15, CLIENTE: 'Cliente B', FECHA: '2026-02-10' },
      }),
      baseRecord({
        id: '3',
        raw: { CATEGORIA: 'C', DESCRIPCION: 'Registro C', VALOR: 30, CLIENTE: 'Cliente C', FECHA: '2026-03-01' },
      }),
    ];

    const computed = computeDashboardAnalytics({
      records,
      search: '',
      requirements: [],
      suppliers: [],
      secondaryValues: [],
      metricMin: 10,
      metricMax: 20,
      dateFrom: new Date(2026, 1, 1).getTime(),
      dateTo: new Date(2026, 1, 28, 23, 59, 59, 999).getTime(),
      fieldForDimension: 'CATEGORIA',
      fieldForDescription: 'DESCRIPCION',
      metricField: 'VALOR',
      fieldForSupplier: 'CLIENTE',
      dateField: 'FECHA',
      metricSearchLabel: 'VALOR',
    });

    expect(computed.filteredRows.map((row) => row.id)).toEqual(['2']);
    expect(computed.metricTotal).toBe(15);
    expect(computed.dimensionGroups).toEqual([{ name: 'B', value: 15 }]);
  });
});
