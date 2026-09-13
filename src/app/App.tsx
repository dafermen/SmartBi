import { lazy, Suspense, useEffect, useState } from 'react';
import type { DashboardFieldConfig, ImportResult } from '../domain/types';
import { UploadView } from '../features/import/UploadView';
import { FieldConfiguratorView } from '../features/import/FieldConfiguratorView';

const DashboardView = lazy(() =>
  import('../features/dashboard/DashboardView').then((module) => ({ default: module.DashboardView })),
);
const DocumentationView = lazy(() =>
  import('../features/documentation/DocumentationView').then((module) => ({ default: module.DocumentationView })),
);

const THEME_STORAGE_KEY = 'smartbi:theme';
const DOCUMENTATION_HASH_PREFIX = '#/docs/';

/** Lee el capítulo solicitado desde una ruta segura para aplicaciones estáticas. */
function readDocumentationPageFromHash(): string | null {
  if (!window.location.hash.startsWith(DOCUMENTATION_HASH_PREFIX)) return null;
  const encodedId = window.location.hash.slice(DOCUMENTATION_HASH_PREFIX.length).split('#')[0];
  return encodedId ? decodeURIComponent(encodedId) : 'aprender';
}

/** Construye un enlace compartible sin exigir reglas especiales en el servidor. */
function documentationHash(pageId: string): string {
  return `${DOCUMENTATION_HASH_PREFIX}${encodeURIComponent(pageId)}`;
}

function readSavedTheme(): 'light' | 'dark' {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * App
 * Coordinador principal:
 * - Importa el archivo
 * - Guarda el resultado
 * - Coordina la transición entre:
 *   - carga del archivo
 *   - configuración de campos
 *   - dashboard
 */
export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readSavedTheme());
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fieldConfig, setFieldConfig] = useState<DashboardFieldConfig | null>(null);
  // Cuando entramos en "Editar mapeo", guardamos temporalmente la configuración actual para no perderla.
  const [draftFieldConfig, setDraftFieldConfig] = useState<DashboardFieldConfig | null>(null);
  const [replacingFile, setReplacingFile] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentationPageId, setDocumentationPageId] = useState<string | null>(() => readDocumentationPageFromHash());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const synchronizeDocumentationRoute = () => setDocumentationPageId(readDocumentationPageFromHash());
    window.addEventListener('hashchange', synchronizeDocumentationRoute);
    window.addEventListener('popstate', synchronizeDocumentationRoute);
    return () => {
      window.removeEventListener('hashchange', synchronizeDocumentationRoute);
      window.removeEventListener('popstate', synchronizeDocumentationRoute);
    };
  }, []);

  useEffect(() => {
    if (!replacingFile) {
      return undefined;
    }

    window.history.pushState({ smartbiView: 'replace-file' }, '', window.location.href);

    const cancelReplacementFromBrowserBack = () => {
      setReplacingFile(false);
      setError(null);
    };

    window.addEventListener('popstate', cancelReplacementFromBrowserBack);
    return () => window.removeEventListener('popstate', cancelReplacementFromBrowserBack);
  }, [replacingFile]);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  const openDocumentation = (pageId = 'aprender') => {
    const nextHash = documentationHash(pageId);
    window.history.pushState({ ...window.history.state, smartbiView: 'documentation', smartbiDocsOpenedFromApp: true }, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    setDocumentationPageId(pageId);
  };

  const navigateDocumentation = (pageId: string) => {
    window.history.replaceState({ ...window.history.state, smartbiView: 'documentation' }, '', `${window.location.pathname}${window.location.search}${documentationHash(pageId)}`);
    setDocumentationPageId(pageId);
  };

  const closeDocumentation = () => {
    if (window.history.state?.smartbiDocsOpenedFromApp === true) {
      window.history.back();
      return;
    }
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    setDocumentationPageId(null);
  };

  const handleImport = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const { importExcel } = await import('../features/import/excelImporter');
      setResult(await importExcel(file));
      setFieldConfig(null);
      setDraftFieldConfig(null);
      setReplacingFile(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible procesar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  if (documentationPageId) {
    return (
      <Suspense fallback={<div className="app-loading" role="status" aria-live="polite">Abriendo la biblioteca…</div>}>
        <DocumentationView
          initialPageId={documentationPageId}
          onBack={closeDocumentation}
          onNavigate={navigateDocumentation}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    );
  }

  if (result && !fieldConfig) {
    const isReconfiguring = Boolean(draftFieldConfig);
    return (
      <FieldConfiguratorView
        result={result}
        isReconfiguring={isReconfiguring}
        initialConfig={draftFieldConfig ?? undefined}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackToUpload={() => {
          if (isReconfiguring && draftFieldConfig) {
            setFieldConfig(draftFieldConfig);
            setDraftFieldConfig(null);
            return;
          }

          setResult(null);
          setError(null);
          setFieldConfig(null);
          setDraftFieldConfig(null);
          setReplacingFile(false);
        }}
        onConfig={(selectedConfig) => {
          setFieldConfig(selectedConfig);
          setDraftFieldConfig(null);
        }}
      />
    );
  }

  if (result && fieldConfig) {
    if (replacingFile) {
      return (
        <UploadView
          loading={loading}
          error={error}
          onImport={handleImport}
          onOpenDocumentation={openDocumentation}
          onCancel={() => {
            setReplacingFile(false);
            setError(null);
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      );
    }

    return (
      <Suspense fallback={<div className="app-loading" role="status" aria-live="polite">Preparando dashboard…</div>}>
        <DashboardView
          result={result}
          fieldConfig={fieldConfig}
          onReset={() => {
            setReplacingFile(true);
            setError(null);
            setDraftFieldConfig(null);
          }}
          onOpenDocumentation={openDocumentation}
          onReconfigure={() => {
            setDraftFieldConfig(fieldConfig);
            setFieldConfig(null);
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    );
  }

  return <UploadView loading={loading} error={error} onImport={handleImport} onOpenDocumentation={openDocumentation} theme={theme} onToggleTheme={toggleTheme} />;
}
