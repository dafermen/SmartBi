import { describe, expect, it } from 'vitest';
import type { DataRecord, DetectedColumn } from '../../domain/types';
import { buildDataProfile } from './dataProfile';

describe('buildDataProfile', () => {
  it('cuenta valores únicos y celdas vacías sin modificar los datos', () => {
    const records: DataRecord[] = [
      { id: '1', raw: { CIUDAD: 'Cali', TOTAL: 10 } },
      { id: '2', raw: { CIUDAD: 'Cali', TOTAL: null } },
      { id: '3', raw: { CIUDAD: 'Bogotá', TOTAL: 25 } },
    ];
    const columns: DetectedColumn[] = [
      { header: 'Ciudad', normalizedHeader: 'CIUDAD', kind: 'text' },
      { header: 'Total', normalizedHeader: 'TOTAL', kind: 'number' },
    ];

    const profile = buildDataProfile(records, columns);

    expect(profile[0]).toMatchObject({ uniqueCount: 2, emptyCount: 0 });
    expect(profile[1]).toMatchObject({ uniqueCount: 2, emptyCount: 1, recommendation: 'Métrica' });
    expect(records[1].raw.TOTAL).toBeNull();
  });
});
