/**
 * Herramientas para guardar y recuperar las páginas de un informe.
 *
 * Este módulo no dibuja botones ni gráficos. Su única responsabilidad es
 * proteger la estructura guardada en LocalStorage antes de que React la use.
 * Separarlo del componente principal hace que sea más fácil de comprender y
 * permite probar datos dañados sin abrir todo el dashboard.
 */

export const REPORT_PAGES_STORAGE_KEY = 'smartbi:report-pages:v2';

export type ReportSectionId =
  | 'section-summary'
  | 'section-visuals'
  | 'section-quality'
  | 'section-alerts'
  | 'section-detail';

export const REPORT_SECTION_IDS: ReportSectionId[] = [
  'section-summary',
  'section-visuals',
  'section-quality',
  'section-alerts',
  'section-detail',
];

export interface ReportPage {
  id: string;
  name: string;
  isHidden: boolean;
  isDefault?: boolean;
  sectionIds: ReportSectionId[];
}

export const DEFAULT_REPORT_PAGES: ReportPage[] = [
  { id: 'page-executive', name: 'Informe completo', isHidden: false, isDefault: true, sectionIds: REPORT_SECTION_IDS },
  { id: 'page-quality', name: 'Calidad y perfil', isHidden: false, sectionIds: ['section-quality', 'section-alerts'] },
  { id: 'page-detail', name: 'Detalle de datos', isHidden: false, sectionIds: ['section-detail'] },
];

/** Comprueba que un texto sea el identificador de una sección conocida. */
function isReportSectionId(value: unknown): value is ReportSectionId {
  return typeof value === 'string' && REPORT_SECTION_IDS.includes(value as ReportSectionId);
}

/** Crea un identificador suficientemente único para una página local. */
export function createReportPageId(): string {
  return `page-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Limpia datos desconocidos antes de convertirlos en páginas del informe.
 *
 * Parámetro:
 * - `value`: cualquier valor leído desde LocalStorage.
 *
 * Retorna páginas válidas con una única página inicial visible. Si el contenido
 * está roto o todas las páginas están ocultas, retorna la composición inicial.
 */
export function sanitizeReportPages(value: unknown): ReportPage[] {
  if (!Array.isArray(value)) return DEFAULT_REPORT_PAGES;

  const usedIds = new Set<string>();
  const pages = value
    .map((item): ReportPage | null => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as Partial<ReportPage>;
      const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
      const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
      const sectionIds = Array.isArray(candidate.sectionIds)
        ? [...new Set(candidate.sectionIds.filter(isReportSectionId))]
        : [];

      if (!id || usedIds.has(id) || !name || sectionIds.length === 0) return null;
      usedIds.add(id);

      return {
        id,
        name: name.slice(0, 38),
        isHidden: Boolean(candidate.isHidden),
        isDefault: Boolean(candidate.isDefault),
        sectionIds,
      };
    })
    .filter((page): page is ReportPage => Boolean(page));

  if (!pages.some((page) => !page.isHidden)) return DEFAULT_REPORT_PAGES;

  const preferredDefault = pages.find((page) => page.isDefault && !page.isHidden)
    ?? pages.find((page) => !page.isHidden);
  return pages.map((page) => ({ ...page, isDefault: page.id === preferredDefault?.id }));
}

/** Lee LocalStorage sin permitir que un JSON inválido rompa la aplicación. */
export function readStoredReportPages(storage: Pick<Storage, 'getItem'> = window.localStorage): ReportPage[] {
  try {
    const rawValue = storage.getItem(REPORT_PAGES_STORAGE_KEY);
    if (!rawValue) return DEFAULT_REPORT_PAGES;
    return sanitizeReportPages(JSON.parse(rawValue));
  } catch {
    return DEFAULT_REPORT_PAGES;
  }
}
