/**
 * Convierte la ruta de una captura en Markdown en su dirección pública.
 *
 * Piensa en dos puertas hacia la misma foto: GitHub entra por `public/`,
 * mientras Vite publica su contenido directamente en la web.
 * No copiamos la foto: solo adaptamos la dirección al lugar donde se lee.
 *
 * @param source Ruta escrita en el Markdown, relativa al propio documento.
 * @param documentPath Archivo original, por ejemplo `doc/manual.md`.
 * @param basePath Carpeta pública de la aplicación; normalmente es `/`.
 * @returns Dirección de una captura local autorizada, o undefined si no es válida.
 */
export function resolveDocumentationImage(
  source: string | undefined,
  documentPath: string,
  basePath = import.meta.env.BASE_URL,
): string | undefined {
  // Esta lista permitida evita imágenes remotas de seguimiento o archivos
  // ajenos al manual. Los nombres sencillos facilitan revisar los cambios.
  if (!source || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(source)) return undefined;
  try {
    const address = new URL(source, `https://documentation.invalid/${documentPath}`);
    const match = /^\/public\/docs\/screenshots\/([a-z0-9][a-z0-9._-]*\.(?:png|jpg|jpeg|webp))$/i.exec(address.pathname);
    if (!match || address.search || address.hash) return undefined;
    return `${basePath.replace(/\/?$/, '/')}docs/screenshots/${match[1]}`;
  } catch {
    return undefined;
  }
}
