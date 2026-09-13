import plan from '../../../doc/01_PLAN_FASES_Y_TAREAS.md?raw';
import juniorGuide from '../../../doc/02_GUIA_JUNIOR_DEL_PROYECTO.md?raw';
import requirements from '../../../doc/03_REQUERIMIENTOS_E_HISTORIAS.md?raw';
import github from '../../../doc/04_GITHUB_Y_COLABORACION.md?raw';
import learningGuide from '../../../doc/05_GUIA_DIDACTICA_PARA_APRENDER.md?raw';
import codeMap from '../../../doc/06_MAPA_COMENTADO_DEL_CODIGO.md?raw';
import compatibilityDoc from '../../../doc/06_COMPATIBILIDAD_Y_PRUEBAS_NAVEGADORES.md?raw';
import limitationsDoc from '../../../doc/07_LIMITACIONES_Y_BLOQUEOS_MVP.md?raw';
import mvpDeliveryDoc from '../../../doc/08_ENTREGA_MVP_Y_EVIDENCIAS.md?raw';
import finalUserManual from '../../../doc/09_MANUAL_FINAL_DE_USUARIO.md?raw';
import acceptanceChecklist from '../../../doc/10_CHECKLIST_ACEPTACION_FINAL.md?raw';
import currentStatus from '../../../CURRENT_STATUS.md?raw';
import architectureDoc from '../../../docs/ARCHITECTURE.md?raw';
import apiDoc from '../../../docs/API.md?raw';
import developmentDoc from '../../../docs/DEVELOPMENT.md?raw';
import documentationDoc from '../../../docs/DOCUMENTATION.md?raw';
import technicalTestingDoc from '../../../docs/TESTING.md?raw';
import deploymentDoc from '../../../docs/DEPLOYMENT.md?raw';
import operationsDoc from '../../../docs/OPERATIONS.md?raw';
import securityDoc from '../../../docs/SECURITY.md?raw';
import troubleshootingDoc from '../../../docs/TROUBLESHOOTING.md?raw';
import accessibilityDoc from '../../../docs/ACCESSIBILITY.md?raw';
import performanceDoc from '../../../docs/PERFORMANCE.md?raw';
import releaseDoc from '../../../docs/RELEASE_0.1.0.md?raw';

/**
 * Familias utilizadas para ordenar la biblioteca.
 *
 * Piensa en ellas como los estantes de una biblioteca: cada documento sigue
 * siendo independiente, pero ahora una persona puede encontrarlo por tema.
 */
export const DOCUMENTATION_CATEGORIES = [
  'Primeros pasos',
  'Producto',
  'Arquitectura y desarrollo',
  'Calidad y experiencia',
  'Entrega y operación',
  'Gestión del proyecto',
] as const;

export type DocumentationCategory = (typeof DOCUMENTATION_CATEGORIES)[number];

/** Metadatos y contenido de un capítulo de la biblioteca. */
export interface DocumentationPage {
  /** Identificador corto y estable usado en enlaces, progreso y navegación. */
  id: string;
  /** Número visible que ayuda a seguir la ruta de lectura sugerida. */
  number: string;
  title: string;
  description: string;
  audience: string;
  category: DocumentationCategory;
  /** Ubicación real del Markdown. Permite resolver enlaces entre documentos. */
  sourcePath: string;
  content: string;
}

/**
 * Índice central de la biblioteca.
 *
 * Importar los Markdown con `?raw` significa "entrégame este archivo como
 * texto". Así conservamos una sola fuente: si cambia el documento original,
 * la aplicación muestra la nueva versión en el próximo build.
 */
export const DOCUMENTATION_PAGES: DocumentationPage[] = [
  { id: 'aprender', number: '01', title: 'Aprender con SmartBI', description: 'La mejor puerta de entrada: conceptos, analogías y misiones.', audience: 'Para comenzar', category: 'Primeros pasos', sourcePath: 'doc/05_GUIA_DIDACTICA_PARA_APRENDER.md', content: learningGuide },
  { id: 'mapa-codigo', number: '02', title: 'Mapa del código', description: 'Descubre qué hace cada carpeta, archivo y función.', audience: 'Para explorar', category: 'Primeros pasos', sourcePath: 'doc/06_MAPA_COMENTADO_DEL_CODIGO.md', content: codeMap },
  { id: 'guia-junior', number: '03', title: 'Guía del proyecto', description: 'Instalación, estructura, cambios seguros y depuración.', audience: 'Desarrollo', category: 'Primeros pasos', sourcePath: 'doc/02_GUIA_JUNIOR_DEL_PROYECTO.md', content: juniorGuide },

  { id: 'manual-final', number: '04', title: 'Manual final de usuario', description: 'Guía paso a paso desde cargar el Excel hasta exportar.', audience: 'Usuario final', category: 'Producto', sourcePath: 'doc/09_MANUAL_FINAL_DE_USUARIO.md', content: finalUserManual },
  { id: 'requerimientos', number: '05', title: 'Requerimientos e historias', description: 'Qué debe hacer SmartBI y cómo comprobarlo.', audience: 'Producto', category: 'Producto', sourcePath: 'doc/03_REQUERIMIENTOS_E_HISTORIAS.md', content: requirements },
  { id: 'limitaciones', number: '06', title: 'Limitaciones y bloqueos', description: 'Qué puede afectar el uso hoy y qué mejora después.', audience: 'Equipo y aprendizaje', category: 'Producto', sourcePath: 'doc/07_LIMITACIONES_Y_BLOQUEOS_MVP.md', content: limitationsDoc },

  { id: 'arquitectura', number: '07', title: 'Arquitectura', description: 'Cómo se organizan las capas y cómo viajan los datos.', audience: 'Desarrollo', category: 'Arquitectura y desarrollo', sourcePath: 'docs/ARCHITECTURE.md', content: architectureDoc },
  { id: 'api-contratos', number: '08', title: 'API interna y contratos', description: 'Tipos y acuerdos que conectan las partes del sistema.', audience: 'Desarrollo', category: 'Arquitectura y desarrollo', sourcePath: 'docs/API.md', content: apiDoc },
  { id: 'desarrollo-local', number: '09', title: 'Desarrollo local', description: 'Preparación del entorno y flujo seguro de cambios.', audience: 'Desarrollo', category: 'Arquitectura y desarrollo', sourcePath: 'docs/DEVELOPMENT.md', content: developmentDoc },
  { id: 'sistema-documentacion', number: '10', title: 'Sistema de documentación', description: 'Cómo se organiza, enlaza y valida esta biblioteca.', audience: 'Desarrollo y continuidad', category: 'Arquitectura y desarrollo', sourcePath: 'docs/DOCUMENTATION.md', content: documentationDoc },

  { id: 'accesibilidad', number: '11', title: 'Accesibilidad', description: 'Teclado, contraste, lectores de pantalla y WCAG 2.2 AA.', audience: 'Diseño y QA', category: 'Calidad y experiencia', sourcePath: 'docs/ACCESSIBILITY.md', content: accessibilityDoc },
  { id: 'rendimiento', number: '12', title: 'Archivos grandes', description: 'Límites, virtualización, Web Worker y medición.', audience: 'Desarrollo y QA', category: 'Calidad y experiencia', sourcePath: 'docs/PERFORMANCE.md', content: performanceDoc },
  { id: 'compatibilidad', number: '13', title: 'Compatibilidad y navegadores', description: 'Checklist y protocolo de pruebas por navegador.', audience: 'Control de calidad', category: 'Calidad y experiencia', sourcePath: 'doc/06_COMPATIBILIDAD_Y_PRUEBAS_NAVEGADORES.md', content: compatibilityDoc },
  { id: 'pruebas-despliegue', number: '14', title: 'Pruebas antes de despliegue', description: 'La estrategia completa de calidad y regresión.', audience: 'QA y despliegue', category: 'Calidad y experiencia', sourcePath: 'docs/TESTING.md', content: technicalTestingDoc },

  { id: 'despliegue', number: '15', title: 'Despliegue', description: 'Cómo preparar y publicar una versión verificable.', audience: 'Entrega', category: 'Entrega y operación', sourcePath: 'docs/DEPLOYMENT.md', content: deploymentDoc },
  { id: 'operacion', number: '16', title: 'Operación', description: 'Cuidados y comprobaciones durante el uso del demo.', audience: 'Operación', category: 'Entrega y operación', sourcePath: 'docs/OPERATIONS.md', content: operationsDoc },
  { id: 'seguridad', number: '17', title: 'Seguridad', description: 'Alcance, controles actuales y endurecimiento pendiente.', audience: 'Desarrollo y QA', category: 'Entrega y operación', sourcePath: 'docs/SECURITY.md', content: securityDoc },
  { id: 'solucion-problemas', number: '18', title: 'Solución de problemas', description: 'Síntomas frecuentes, causas y pasos de recuperación.', audience: 'Todo el equipo', category: 'Entrega y operación', sourcePath: 'docs/TROUBLESHOOTING.md', content: troubleshootingDoc },
  { id: 'version-010', number: '19', title: 'Versión v0.1.0', description: 'Contenido de la versión y limitaciones conocidas.', audience: 'Entrega', category: 'Entrega y operación', sourcePath: 'docs/RELEASE_0.1.0.md', content: releaseDoc },
  { id: 'entrega', number: '20', title: 'Entrega y evidencias MVP', description: 'Validaciones ejecutadas, despliegue y pendientes.', audience: 'Cierre técnico', category: 'Entrega y operación', sourcePath: 'doc/08_ENTREGA_MVP_Y_EVIDENCIAS.md', content: mvpDeliveryDoc },

  { id: 'fases', number: '21', title: 'Plan y fases', description: 'El camino completo del producto y sus tareas.', audience: 'Proyecto', category: 'Gestión del proyecto', sourcePath: 'doc/01_PLAN_FASES_Y_TAREAS.md', content: plan },
  { id: 'estado-actual', number: '22', title: 'Estado actual del proyecto', description: 'Continuidad, validaciones y próximos pasos.', audience: 'Codex y equipo', category: 'Gestión del proyecto', sourcePath: 'CURRENT_STATUS.md', content: currentStatus },
  { id: 'github', number: '23', title: 'GitHub y colaboración', description: 'Ramas, commits, revisiones, seguridad y entregas.', audience: 'Equipo', category: 'Gestión del proyecto', sourcePath: 'doc/04_GITHUB_Y_COLABORACION.md', content: github },
  { id: 'aceptacion-final', number: '24', title: 'Aceptación final', description: 'Checklist para validar SmartBI con una persona usuaria real.', audience: 'Usuario y QA', category: 'Gestión del proyecto', sourcePath: 'doc/10_CHECKLIST_ACEPTACION_FINAL.md', content: acceptanceChecklist },
];

/** Devuelve una página usando su identificador; si no existe, usa la portada. */
export function getDocumentationPage(id: string | null | undefined): DocumentationPage {
  return DOCUMENTATION_PAGES.find((page) => page.id === id) ?? DOCUMENTATION_PAGES[0];
}

/**
 * Busca qué capítulo representa un enlace Markdown local.
 *
 * Ejemplo: un vínculo a `../docs/SECURITY.md#controles` se convierte en el
 * capítulo `seguridad` y conserva `controles` como destino dentro de la página.
 */
export function findDocumentationPageByHref(href: string): { page: DocumentationPage; headingId?: string } | null {
  const [pathPart, headingPart] = href.split('#', 2);
  if (!pathPart.toLocaleLowerCase('es').endsWith('.md')) return null;

  const decodedPath = decodeURIComponent(pathPart).replace(/\\/g, '/');
  const fileName = decodedPath.split('/').filter(Boolean).at(-1)?.toLocaleLowerCase('es');
  if (!fileName) return null;

  const page = DOCUMENTATION_PAGES.find((candidate) => candidate.sourcePath.split('/').at(-1)?.toLocaleLowerCase('es') === fileName);
  return page ? { page, headingId: headingPart ? decodeURIComponent(headingPart) : undefined } : null;
}
