import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, FileSpreadsheet, LockKeyhole, Moon, Sparkles, Sun, UploadCloud } from 'lucide-react';
import { Brand } from '../../components/Brand';

interface UploadViewProps {
  loading: boolean;
  error: string | null;
  onImport: (file: File) => Promise<void>;
  onOpenDocumentation: () => void;
  onCancel?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

/**
 * Primera pantalla de la aplicación.
 *
 * Este componente no sabe interpretar Excel. Su única responsabilidad es
 * recibir un archivo mediante clic o arrastre y entregarlo a `onImport`.
 * Separar responsabilidades hace el código más fácil de probar y cambiar.
 */
export function UploadView({ loading, error, onImport, onOpenDocumentation, onCancel, theme, onToggleTheme }: UploadViewProps) {
  // Una referencia es como un señalador: permite abrir el input de archivo
  // oculto cuando el usuario pulsa nuestra tarjeta o botón más bonitos.
  const inputRef = useRef<HTMLInputElement>(null);

  // Este estado solo sirve para iluminar el área mientras se arrastra un archivo.
  const [dragging, setDragging] = useState(false);

  const receive = (file?: File) => file && void onImport(file);
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => receive(event.target.files?.[0]);
  const handleDrop = (event: DragEvent) => {
    // El navegador normalmente intentaría abrir el archivo. Lo impedimos para
    // poder entregarlo de forma segura a nuestra propia función.
    event.preventDefault();
    setDragging(false);
    receive(event.dataTransfer.files[0]);
  };

  return (
    <main className="welcome">
      <a className="skip-link" href="#upload-content">Saltar al contenido principal</a>
      <header className="welcome__nav">
        <Brand />
        <nav className="welcome__actions" aria-label="Navegación principal">
          {onCancel && <button className="welcome__docs-button" onClick={onCancel}>Volver al dashboard</button>}
          <button className="welcome__docs-button" onClick={onOpenDocumentation}><BookOpen size={16} /> Documentación</button>
          <button className="welcome__docs-button" onClick={onToggleTheme}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</button>
        </nav>
      </header>
      <section id="upload-content" className="welcome__content" aria-labelledby="upload-title">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> Analítica de Excel, en segundos</div>
          <h1 id="upload-title">{onCancel ? 'Carga otro Excel o vuelve a tu' : 'Convierte tu Excel en'}<br /><span>{onCancel ? 'dashboard actual.' : 'decisiones claras.'}</span></h1>
          <p>{onCancel ? 'Tu dashboard anterior sigue disponible. Si te arrepientes, puedes volver sin perder el archivo importado.' : 'Importa un Excel tabular, elige sus columnas en el wizard y obtén un dashboard interactivo con filtros, métricas y visuales dinámicos.'}</p>
          <div className="hero-points">
            <span><CheckCircle2 /> 100% en tu navegador</span>
            <span><CheckCircle2 /> Filtros dinámicos</span>
            <span><CheckCircle2 /> Exportación inmediata</span>
          </div>
        </div>
        <div className="upload-card">
          <div className="upload-card__heading">
            <span className="upload-card__icon"><FileSpreadsheet /></span>
            <div><h2>Carga tu Excel</h2><p>Empieza con un archivo .xlsx</p></div>
          </div>
          <button
            type="button"
            className={`drop-zone${dragging ? ' is-dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            disabled={loading}
            aria-describedby="upload-formats"
          >
            <span className="drop-zone__icon"><UploadCloud /></span>
            <strong>{loading ? 'Analizando el archivo…' : 'Arrastra tu archivo aquí'}</strong>
            <span>o haz clic para explorar</span>
            <em id="upload-formats">Formato .xlsx · Máximo 15 MB. Desde 8 MB puede tardar más.</em>
          </button>
          <input ref={inputRef} className="sr-only" type="file" accept=".xlsx" aria-label="Seleccionar archivo Excel" onChange={handleInput} />
          {error && <div className="import-error" role="alert">{error}</div>}
          <button className="primary-button" type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
            {loading ? 'Procesando…' : 'Seleccionar archivo'} <ArrowRight size={18} />
          </button>
          <p className="upload-card__privacy"><LockKeyhole size={13} aria-hidden="true" /> Tus datos no salen de este dispositivo.</p>
        </div>
      </section>
      <footer className="welcome__footer">SmartBI MVP <span>•</span> Análisis local de archivos Excel</footer>
    </main>
  );
}
