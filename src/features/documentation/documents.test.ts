import { describe, expect, it } from 'vitest';
import {
  DOCUMENTATION_CATEGORIES,
  DOCUMENTATION_PAGES,
  findDocumentationPageByHref,
  getDocumentationPage,
} from './documents';

describe('índice de documentación', () => {
  it('mantiene identificadores, números y fuentes sin duplicados', () => {
    expect(new Set(DOCUMENTATION_PAGES.map((page) => page.id)).size).toBe(DOCUMENTATION_PAGES.length);
    expect(new Set(DOCUMENTATION_PAGES.map((page) => page.number)).size).toBe(DOCUMENTATION_PAGES.length);
    expect(new Set(DOCUMENTATION_PAGES.map((page) => page.sourcePath)).size).toBe(DOCUMENTATION_PAGES.length);
  });

  it('usa solamente categorías oficiales', () => {
    for (const page of DOCUMENTATION_PAGES) {
      expect(DOCUMENTATION_CATEGORIES).toContain(page.category);
      expect(page.content.trim().length).toBeGreaterThan(0);
    }
  });

  it('abre la portada cuando un enlace profundo tiene un identificador desconocido', () => {
    expect(getDocumentationPage('capitulo-inexistente').id).toBe('aprender');
  });

  it('convierte un enlace Markdown local en un capítulo y conserva su sección', () => {
    const destination = findDocumentationPageByHref('../docs/SECURITY.md#controles-actuales');
    expect(destination?.page.id).toBe('seguridad');
    expect(destination?.headingId).toBe('controles-actuales');
  });
});
