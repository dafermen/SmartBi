import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REPORT_PAGES,
  REPORT_PAGES_STORAGE_KEY,
  readStoredReportPages,
  sanitizeReportPages,
} from './reportPages';

describe('páginas guardadas del informe', () => {
  it('recupera las páginas predeterminadas cuando LocalStorage tiene JSON roto', () => {
    const storage = { getItem: (key: string) => key === REPORT_PAGES_STORAGE_KEY ? '{json roto' : null };
    expect(readStoredReportPages(storage)).toEqual(DEFAULT_REPORT_PAGES);
  });

  it('descarta páginas y secciones inválidas y conserva una sola página inicial', () => {
    const pages = sanitizeReportPages([
      { id: 'resumen', name: '  Resumen del negocio  ', isDefault: true, sectionIds: ['section-summary', 'inventada', 'section-summary'] },
      { id: 'detalle', name: 'Detalle', isDefault: true, sectionIds: ['section-detail'] },
      { id: 'detalle', name: 'Duplicada', sectionIds: ['section-quality'] },
      { id: '', name: 'Sin identificador', sectionIds: ['section-quality'] },
    ]);

    expect(pages).toEqual([
      { id: 'resumen', name: 'Resumen del negocio', isHidden: false, isDefault: true, sectionIds: ['section-summary'] },
      { id: 'detalle', name: 'Detalle', isHidden: false, isDefault: false, sectionIds: ['section-detail'] },
    ]);
  });

  it('restaura una composición utilizable cuando todas las páginas están ocultas', () => {
    expect(sanitizeReportPages([
      { id: 'oculta', name: 'Oculta', isHidden: true, sectionIds: ['section-summary'] },
    ])).toEqual(DEFAULT_REPORT_PAGES);
  });
});
