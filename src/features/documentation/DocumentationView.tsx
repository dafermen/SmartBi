import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, FileText, GraduationCap, Home, Menu, Moon, Search, Sun, X } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brand } from '../../components/Brand';
import { resolveDocumentationImage } from './documentationAssets';
import {
  DOCUMENTATION_CATEGORIES,
  DOCUMENTATION_PAGES,
  findDocumentationPageByHref,
  getDocumentationPage,
} from './documents';

interface DocumentationViewProps {
  onBack: () => void;
  initialPageId?: string;
  onNavigate: (pageId: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

const DOCS_PROGRESS_STORAGE_KEY = 'smartbi:docs-progress';

function readCompletedPages(): string[] {
  try {
    const rawValue = window.localStorage.getItem(DOCS_PROGRESS_STORAGE_KEY);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

/** Convierte un título en un identificador que sirve como destino de un enlace. */
function slugify(text: string): string {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Extrae los subtítulos Markdown para construir la tabla de contenido. */
function extractHeadings(markdown: string): HeadingItem[] {
  return markdown.split('\n').flatMap((line) => {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) return [];
    const text = match[2].replace(/[`*_]/g, '');
    return [{ level: match[1].length, text, id: slugify(text) }];
  });
}

function childrenToText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  return '';
}

/**
 * Biblioteca de documentación integrada.
 *
 * El contenido sigue viviendo como Markdown en `doc/`. Este componente lo
 * transforma en HTML legible, genera un índice y permite cambiar de capítulo.
 */
export function DocumentationView({ initialPageId, onBack, onNavigate, theme, onToggleTheme }: DocumentationViewProps) {
  const [query, setQuery] = useState('');
  const [mobileIndexOpen, setMobileIndexOpen] = useState(false);
  const [guidedMode, setGuidedMode] = useState(true);
  const [completedPages, setCompletedPages] = useState<string[]>(() => readCompletedPages());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const activeId = getDocumentationPage(initialPageId).id;
  const activeIndex = DOCUMENTATION_PAGES.findIndex((page) => page.id === activeId);
  const activePage = DOCUMENTATION_PAGES[activeIndex] ?? DOCUMENTATION_PAGES[0];
  const headings = useMemo(() => extractHeadings(activePage.content), [activePage.content]);
  const completedCount = DOCUMENTATION_PAGES.filter((page) => completedPages.includes(page.id)).length;
  const completionPercent = Math.round((completedCount / DOCUMENTATION_PAGES.length) * 100);
  const activePageCompleted = completedPages.includes(activePage.id);
  const visiblePages = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return DOCUMENTATION_PAGES;
    return DOCUMENTATION_PAGES.filter((page) => `${page.title} ${page.description} ${page.audience} ${page.content}`.toLocaleLowerCase('es').includes(normalized));
  }, [query]);

  const groupedPages = useMemo(() => DOCUMENTATION_CATEGORIES.map((category) => ({
    category,
    pages: visiblePages.filter((page) => page.category === category),
  })).filter((group) => group.pages.length > 0), [visiblePages]);

  const selectPage = useCallback((id: string, headingId?: string) => {
    onNavigate(id);
    setMobileIndexOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (headingId) {
      window.setTimeout(() => document.getElementById(slugify(headingId))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  }, [onNavigate]);
  const goToHeading = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const openSearch = () => {
    if (window.matchMedia('(max-width: 760px)').matches) setMobileIndexOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };
  const closeMobileIndex = useCallback(() => {
    setMobileIndexOpen(false);
    mobileMenuRef.current?.focus();
  }, []);
  const toggleCompletedPage = () => {
    setCompletedPages((current) => (
      current.includes(activePage.id)
        ? current.filter((id) => id !== activePage.id)
        : [...current, activePage.id]
    ));
  };

  useEffect(() => {
    window.localStorage.setItem(DOCS_PROGRESS_STORAGE_KEY, JSON.stringify(completedPages));
  }, [completedPages]);

  useEffect(() => {
    if (!mobileIndexOpen) return undefined;
    mobileCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileIndex();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [closeMobileIndex, mobileIndexOpen]);

  const markdownComponents = useMemo<Components>(() => ({
    h1: ({ children }) => <h1 id={slugify(childrenToText(children))}>{children}</h1>,
    h2: ({ children }) => <h2 id={slugify(childrenToText(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(childrenToText(children))}>{children}</h3>,
    img: ({ src, alt }) => {
      const imagePath = resolveDocumentationImage(typeof src === 'string' ? src : undefined, activePage.sourcePath);
      return imagePath
        ? <a href={imagePath} target="_blank" rel="noreferrer" title="Abrir captura en tamaño completo">
            <img src={imagePath} alt={alt ?? ''} loading="lazy" decoding="async" />
          </a>
        : <span>{alt || 'Imagen no disponible'}</span>;
    },
    a: ({ href, children }) => {
      const internalDestination = href ? findDocumentationPageByHref(href) : null;
      if (internalDestination) {
        return (
          <a
            href={`#/docs/${internalDestination.page.id}${internalDestination.headingId ? `#${internalDestination.headingId}` : ''}`}
            onClick={(event) => {
              event.preventDefault();
              selectPage(internalDestination.page.id, internalDestination.headingId);
            }}
          >
            {children}
          </a>
        );
      }
      const opensNewWindow = href?.startsWith('http');
      return <a href={href} target={opensNewWindow ? '_blank' : undefined} rel={opensNewWindow ? 'noreferrer' : undefined}>{children}</a>;
    },
  }), [activePage.sourcePath, selectPage]);

  return (
    <div className="docs-shell">
      <a className="skip-link" href="#documentation-content">Saltar al documento</a>
      <header className="docs-topbar">
        <button ref={mobileMenuRef} className="docs-mobile-menu" aria-label="Abrir índice" aria-expanded={mobileIndexOpen} onClick={() => setMobileIndexOpen(true)}><Menu /></button>
        <Brand />
        <div className="docs-topbar__title"><BookOpen size={18} /><span>Centro de aprendizaje</span></div>
        <nav className="docs-topbar__links" aria-label="Accesos rápidos de documentación">
          <button onClick={() => selectPage('manual-final')}>Producto</button>
          <button onClick={() => selectPage('arquitectura')}>Arquitectura</button>
          <button onClick={() => selectPage('estado-actual')}>Estado</button>
          <button onClick={openSearch}><Search size={14} />Buscar</button>
        </nav>
        <button className="docs-theme-button" aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'} title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'} onClick={onToggleTheme}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="docs-back-button" aria-label="Volver a SmartBI" onClick={onBack}><ArrowLeft size={16} /><span>Volver a SmartBI</span></button>
      </header>
      <div className="docs-layout">
        {mobileIndexOpen && <button className="docs-backdrop" aria-label="Cerrar índice" onClick={closeMobileIndex} />}
        <aside className={`docs-sidebar${mobileIndexOpen ? ' is-open' : ''}`} aria-label="Índice de documentación" role={mobileIndexOpen ? 'dialog' : undefined} aria-modal={mobileIndexOpen || undefined}>
          <div className="docs-sidebar__header"><div><span>BIBLIOTECA</span><strong>Documentación</strong></div><button ref={mobileCloseRef} aria-label="Cerrar índice" onClick={closeMobileIndex}><X /></button></div>
          <button className="docs-sidebar__back" onClick={onBack}><ArrowLeft size={16} />Volver a la aplicación</button>
          <label className="docs-search"><Search size={16} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en las guías…" aria-label="Buscar en la documentación" /></label>
          <p className="docs-search-status" role="status" aria-live="polite">{query.trim() ? `${visiblePages.length} resultado${visiblePages.length === 1 ? '' : 's'}` : `${DOCUMENTATION_PAGES.length} capítulos en la biblioteca`}</p>
          <div className="docs-progress-card">
            <span>Progreso de lectura</span>
            <strong>{completionPercent}%</strong>
            <div><i style={{ width: `${completionPercent}%` }} /></div>
            <small>{completedCount} de {DOCUMENTATION_PAGES.length} capítulos marcados</small>
          </div>
          <nav className="docs-pages" aria-label="Capítulos por categoría">
            {groupedPages.map((group) => (
              <section className="docs-category" key={group.category} aria-labelledby={`docs-category-${slugify(group.category)}`}>
                <h2 id={`docs-category-${slugify(group.category)}`}>{group.category}</h2>
                {group.pages.map((page) => (
                  <button key={page.id} className={page.id === activePage.id ? 'is-active' : ''} aria-current={page.id === activePage.id ? 'page' : undefined} onClick={() => selectPage(page.id)}>
                    <span className="docs-page-number">{page.number}</span>
                    <span><strong>{page.title}</strong><small>{page.description}</small><em>{page.audience}</em></span>
                    {completedPages.includes(page.id) ? <CheckCircle2 className="docs-page-check" size={16} /> : <ChevronRight size={16} />}
                  </button>
                ))}
              </section>
            ))}
            {visiblePages.length === 0 && <p className="docs-empty">No encontramos una guía con esas palabras.</p>}
          </nav>
          <div className="docs-sidebar__tip"><BookOpen /><p><strong>Consejo</strong>Lee una sección y prueba algo pequeño antes de continuar.</p></div>
        </aside>
        <main id="documentation-content" className="docs-reader" tabIndex={-1}>
          <div className="docs-reader__breadcrumb"><Home size={13} /><span>Documentación</span><ChevronRight size={13} /><span>{activePage.category}</span><ChevronRight size={13} /><strong>{activePage.title}</strong></div>
          <header className="docs-reader__intro">
            <span>{activePage.audience}</span><h1>{activePage.title}</h1><p>{activePage.description}</p>
            <div className="docs-reader__actions">
              <button type="button" onClick={toggleCompletedPage}>
                <CheckCircle2 size={15} />
                {activePageCompleted ? 'Marcar como pendiente' : 'Marcar como leído'}
              </button>
              <button type="button" className={guidedMode ? 'is-active' : ''} aria-pressed={guidedMode} onClick={() => setGuidedMode((value) => !value)}>
                <GraduationCap size={15} />
                Modo guía
              </button>
            </div>          </header>
          {guidedMode && (
            <aside className="docs-learning-card">
              <GraduationCap size={18} />
              <div>
                <strong>Misión de aprendizaje</strong>
                <p>Lee una sección, vuelve a SmartBI, encuentra la parte relacionada en la interfaz y explícasela a otra persona con tus propias palabras.</p>
              </div>
            </aside>
          )}
          {guidedMode && (
            <section className="docs-concept-grid" aria-label="Conceptos rápidos">
              <article><strong>Agrupar</strong><p>Juntar filas parecidas para responder “¿por quién o por qué estoy mirando?”.</p></article>
              <article><strong>Métrica</strong><p>Un número que se suma, cuenta o compara, como valor, cantidad, costo o puntaje.</p></article>
              <article><strong>Filtro</strong><p>Una lupa que reduce datos para ver solo una parte del Excel.</p></article>
            </section>
          )}
          {headings.length > 0 && (
            <details className="docs-toc">
              <summary>En este capítulo <span>{headings.length} secciones</span></summary>
              <div>{headings.map((heading) => <button key={`${heading.level}-${heading.id}`} className={`level-${heading.level}`} onClick={() => goToHeading(heading.id)}>{heading.text}</button>)}</div>
            </details>
          )}
          <article className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{activePage.content}</ReactMarkdown>
          </article>
          <nav className="docs-next" aria-label="Navegación entre documentos">
            {activeIndex > 0 ? <button onClick={() => selectPage(DOCUMENTATION_PAGES[activeIndex - 1].id)}><ArrowLeft /><span><small>Anterior</small>{DOCUMENTATION_PAGES[activeIndex - 1].title}</span></button> : <span />}
            {activeIndex < DOCUMENTATION_PAGES.length - 1 && <button className="next" onClick={() => selectPage(DOCUMENTATION_PAGES[activeIndex + 1].id)}><span><small>Siguiente</small>{DOCUMENTATION_PAGES[activeIndex + 1].title}</span><ArrowRight /></button>}
          </nav>
        </main>
        <aside className="docs-outline" aria-label="Contenido del capítulo">
          <strong><FileText size={14} /> En esta página</strong>
          <nav>{headings.slice(0, 18).map((heading) => <button key={`${heading.level}-${heading.id}`} className={`level-${heading.level}`} onClick={() => goToHeading(heading.id)}>{heading.text}</button>)}</nav>
          {headings.length > 18 && <small>+ {headings.length - 18} secciones en el índice completo</small>}
        </aside>
      </div>
    </div>
  );
}
