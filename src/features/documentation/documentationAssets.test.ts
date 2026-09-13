import { describe, expect, it } from 'vitest';
import { resolveDocumentationImage } from './documentationAssets';

describe('imágenes locales del manual', () => {
  it.each(['doc/manual.md', 'docs/manual.md'])('resuelve desde %s', (documentPath) => {
    expect(resolveDocumentationImage('../public/docs/screenshots/inicio.jpg', documentPath, '/'))
      .toBe('/docs/screenshots/inicio.jpg');
  });

  it('conserva la ruta base y funciona desde README', () => {
    expect(resolveDocumentationImage('public/docs/screenshots/inicio.jpg', 'README.md', '/demo/'))
      .toBe('/demo/docs/screenshots/inicio.jpg');
  });

  it.each([undefined, 'https://example.com/photo.jpg', '//example.com/photo.jpg',
    'data:image/png;base64,AAAA', '../LICENSE', '../public/docs/screenshots/../../secret.jpg',
    '../public/docs/screenshots/inicio.svg', '../public/docs/screenshots/inicio.jpg?track=1'])('rechaza una ruta no autorizada: %s', (source) => {
    expect(resolveDocumentationImage(source, 'doc/manual.md', '/')).toBeUndefined();
  });
});
