import { describe, expect, it } from 'vitest';
import type { DataRecord } from '../../domain/types';
import { computeDashboardAnalytics, type DashboardAnalyticsInput } from './dashboardAnalytics';

/** Generador determinista: produce variedad sin convertir la prueba en una lotería. */
function buildRecords(amount: number): DataRecord[] {
  const metricValues = [12, -4, 0, '1.250,5', 'dato inválido', null] as const;
  return Array.from({ length: amount }, (_unused, index) => ({
    id: `fila-${index}`,
    raw: {
      GRUPO: `Grupo ${index % 7}`,
      DETALLE: index % 9 === 0 ? null : `Registro ${index}`,
      VALOR: metricValues[index % metricValues.length],
      REGION: index % 2 === 0 ? 'Norte' : 'Sur',
      FECHA: index % 11 === 0 ? 'fecha extraña' : `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
    },
  }));
}

function inputFor(records: DataRecord[], overrides: Partial<DashboardAnalyticsInput> = {}): DashboardAnalyticsInput {
  return {
    records,
    search: '',
    requirements: [],
    suppliers: [],
    secondaryValues: [],
    fieldValues: {},
    fieldForDimension: 'GRUPO',
    fieldForDescription: 'DETALLE',
    metricField: 'VALOR',
    filterFields: ['REGION'],
    metricSearchLabel: 'Valor',
    ...overrides,
  };
}

describe('propiedades que siempre debe cumplir la analítica', () => {
  it.each([0, 1, 17, 250, 1_000])('mantiene totales y conteos coherentes con %i filas', (amount) => {
    const result = computeDashboardAnalytics(inputFor(buildRecords(amount)));
    const groupTotal = result.dimensionGroups.reduce((total, group) => total + group.value, 0);

    expect(result.filteredRows.length).toBeLessThanOrEqual(amount);
    expect(result.positiveMetricRows + result.zeroMetricRows + result.negativeMetricRows).toBe(result.filteredRows.length);
    expect(groupTotal).toBeCloseTo(result.metricTotal, 8);
    expect(Number.isFinite(result.metricTotal)).toBe(true);
    expect(Number.isFinite(result.metricAverage)).toBe(true);
    expect(Number.isFinite(result.metricMax)).toBe(true);
  });

  it('un filtro vacío no elimina registros y uno desconocido no agrega filas', () => {
    const records = buildRecords(120);
    const withoutSelection = computeDashboardAnalytics(inputFor(records, { fieldValues: { REGION: [] } }));
    const unknownSelection = computeDashboardAnalytics(inputFor(records, { fieldValues: { REGION: ['No existe'] } }));

    expect(withoutSelection.filteredRows).toHaveLength(records.length);
    expect(unknownSelection.filteredRows).toHaveLength(0);
  });

  it('calcula el máximo real cuando todas las métricas son negativas', () => {
    const records: DataRecord[] = [
      { id: 'a', raw: { GRUPO: 'A', DETALLE: 'Uno', VALOR: -10 } },
      { id: 'b', raw: { GRUPO: 'B', DETALLE: 'Dos', VALOR: -2 } },
    ];
    const result = computeDashboardAnalytics(inputFor(records));

    expect(result.metricMax).toBe(-2);
    expect(result.metricTotal).toBe(-12);
    expect(result.negativeMetricRows).toBe(2);
  });
});
