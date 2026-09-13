import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Eye,
  Filter,
  Settings2,
  Sparkles,
} from 'lucide-react';
import type { DashboardFieldConfig, DetectedColumn, ImportResult } from '../../domain/types';

const MAPPING_TEMPLATE_STORAGE_KEY = 'smartbi:mapping-template';

/**
 * Plantilla de configuración guardada en LocalStorage.
 *
 * LocalStorage es una memoria pequeña del navegador. La usamos para que, si el
 * usuario vuelve a cargar un archivo parecido, SmartBI pueda recordar qué
 * columnas eligió la vez anterior.
 *
 * Extiende `DashboardFieldConfig`, es decir: tiene todos los campos necesarios
 * para crear el dashboard, y además guarda dos datos extra:
 * - `savedAt`: fecha en la que se guardó la plantilla.
 * - `sourceName`: nombre del archivo Excel que originó esa plantilla.
 */
interface StoredMappingTemplate extends DashboardFieldConfig {
  savedAt: string;
  sourceName: string;
}

/**
 * Propiedades que recibe el componente FieldConfiguratorView.
 *
 * En React, las "props" son datos que un componente recibe desde su padre.
 * Imagina que este componente es una máquina: las props son los botones,
 * documentos y cables que necesita para funcionar.
 */
interface FieldConfiguratorViewProps {
  /** Resultado de leer el Excel: columnas detectadas, filas y avisos. */
  result: ImportResult;
  /** Indica si el usuario está editando una configuración existente. */
  isReconfiguring?: boolean;
  /** Configuración inicial cuando se entra desde "Editar mapeo". */
  initialConfig?: Partial<DashboardFieldConfig>;
  /** Tema visual activo de la aplicación. */
  theme: 'light' | 'dark';
  /** Función para cambiar entre modo claro y modo oscuro. */
  onToggleTheme: () => void;
  /** Función para volver a la pantalla de carga del archivo. */
  onBackToUpload: () => void;
  /** Función que se ejecuta cuando el usuario termina el wizard. */
  onConfig: (config: DashboardFieldConfig) => void;
}

/**
 * Pasos permitidos del wizard.
 *
 * Usamos `1 | 2 | 3` para que TypeScript nos ayude: si por error intentamos
 * poner paso 4, el editor puede avisarnos.
 */
type MappingStep = 1 | 2 | 3;

/**
 * Normaliza un texto para poder compararlo mejor.
 *
 * Parámetro:
 * - `value`: texto original.
 *
 * Retorna:
 * - El mismo texto en mayúsculas, sin espacios dobles al interior y sin
 *   espacios sobrantes al inicio o al final.
 */
function normalizeLikeUpper(value: string): string {
  return value.toUpperCase().replace(/\s+/g, ' ').trim();
}

/**
 * Devuelve una etiqueta bonita para mostrar el nombre de una columna.
 *
 * Si por alguna razón el encabezado viene vacío, mostramos "Sin nombre" para
 * evitar que la interfaz quede con un hueco extraño.
 */
function fieldLabelFromHeader(header: string): string {
  return header || 'Sin nombre';
}

/**
 * Intenta adivinar si una columna sirve para agrupar.
 *
 * Agrupar significa juntar registros parecidos. Por ejemplo:
 * - agrupar por ciudad,
 * - agrupar por categoría,
 * - agrupar por estado.
 *
 * Esta función NO obliga nada. Solo ayuda a proponer una opción inicial más
 * cómoda para el usuario.
 */
function isLikelyTextForDimension(header: string): boolean {
  const text = normalizeLikeUpper(header);
  return (
    text.includes('CATEGORIA')
    || text.includes('CATEGORÍA')
    || text.includes('CLIENTE')
    || text.includes('SEGMENTO')
    || text.includes('CIUDAD')
    || text.includes('ZONA')
    || text.includes('REGION')
    || text.includes('REGIÓN')
    || text.includes('TIPO')
    || text.includes('ESTADO')
  );
}

/**
 * Intenta adivinar si una columna parece un filtro principal.
 *
 * Ejemplos de filtros principales:
 * - cliente,
 * - usuario,
 * - responsable,
 * - cuenta.
 */
function isLikelyMainFilter(header: string): boolean {
  const text = normalizeLikeUpper(header);
  return text.includes('CLIENTE') || text.includes('USUARIO') || text.includes('RESPONSABLE') || text.includes('CUENTA');
}

/**
 * Intenta adivinar si una columna numérica parece métrica.
 *
 * Una métrica es un número que se puede sumar, promediar o comparar:
 * ventas, valor, cantidad, costo, puntaje, etc.
 */
function isLikelyMetric(header: string): boolean {
  const text = normalizeLikeUpper(header);
  return (
    text.includes('SUMA')
    || text.includes('TOTAL')
    || text.includes('CANT')
    || text.includes('CANTIDAD')
    || text.includes('UNIDADES')
    || text.includes('COSTO')
    || text.includes('PRECIO')
    || text.includes('IMPORTE')
    || text.includes('VALOR')
    || text.includes('MONTO')
    || text.includes('VENTA')
    || text.includes('INGRESO')
    || text.includes('PUNTAJE')
  );
}

/**
 * Intenta adivinar si una columna parece un segundo filtro útil.
 *
 * Esto ayuda a encontrar campos como segmento, tipo, estado, grupo o canal.
 */
function isLikelySecondaryFilter(header: string): boolean {
  const text = normalizeLikeUpper(header);
  return text.includes('SEGMENTO') || text.includes('TIPO') || text.includes('ESTADO') || text.includes('GRUPO') || text.includes('CANAL');
}

/**
 * Busca una columna por coincidencias en su encabezado.
 *
 * Parámetros:
 * - `columns`: columnas detectadas en el Excel.
 * - `candidates`: palabras que queremos encontrar.
 *
 * Retorna:
 * - La primera columna que parezca coincidir.
 * - `undefined` si no encuentra ninguna.
 */
function findByCanonicalOrHeader(columns: DetectedColumn[], candidates: string[]): DetectedColumn | undefined {
  return columns.find((column) => {
    const haystack = normalizeLikeUpper(`${column.header} ${column.normalizedHeader}`);
    return candidates.some((candidate) => haystack.includes(normalizeLikeUpper(candidate)));
  });
}

/**
 * Calcula un puntaje para escoger una métrica recomendada.
 *
 * Entre varias columnas numéricas, algunas suelen ser más importantes que
 * otras. Por ejemplo, una columna llamada TOTAL suele ser mejor candidata que
 * una columna llamada CÓDIGO.
 *
 * Retorna:
 * - Un número alto si la columna parece buena métrica.
 * - Un número bajo si no parece tan buena.
 */
function scoreMetricColumn(column: DetectedColumn): number {
  const text = normalizeLikeUpper(`${column.header} ${column.normalizedHeader}`);
  if (text.includes('TOTAL')) return 100;
  if (text.includes('VALOR') || text.includes('MONTO')) return 90;
  if (text.includes('VENTA') || text.includes('INGRESO')) return 80;
  if (text.includes('CANTIDAD') || text.includes('UNIDADES')) return 70;
  if (text.includes('PRECIO') || text.includes('COSTO')) return 60;
  return isLikelyMetric(text) ? 10 : 0;
}

/**
 * Lee desde LocalStorage la última plantilla de mapeo guardada.
 *
 * Retorna:
 * - Una plantilla si existe y se puede leer.
 * - `null` si no hay plantilla o si el navegador entrega algo inválido.
 *
 * El `try/catch` evita que la app se rompa si LocalStorage tiene texto dañado.
 */
function readStoredMappingTemplate(): StoredMappingTemplate | null {
  try {
    const rawValue = window.localStorage.getItem(MAPPING_TEMPLATE_STORAGE_KEY);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue) as StoredMappingTemplate;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Revisa si una plantilla guardada todavía sirve para el Excel actual.
 *
 * Ejemplo:
 * Si ayer el usuario guardó una plantilla con la columna "VENTAS", pero hoy
 * carga un Excel que no tiene "VENTAS", no debemos aplicar esa plantilla a la
 * fuerza porque causaría errores o resultados confusos.
 *
 * Parámetros:
 * - `template`: plantilla leída desde LocalStorage.
 * - `columns`: columnas detectadas en el Excel actual.
 *
 * Retorna:
 * - La plantilla limpia si todavía es compatible.
 * - `null` si no se puede usar.
 */
function sanitizeMappingTemplate(template: StoredMappingTemplate | null, columns: DetectedColumn[]): StoredMappingTemplate | null {
  if (!template) return null;
  const columnMap = new Map(columns.map((column) => [column.normalizedHeader, column]));
  const hasField = (field?: string) => Boolean(field && columnMap.has(field));
  const hasNumberField = (field?: string) => Boolean(field && columnMap.get(field)?.kind === 'number');

  if (!hasField(template.dimensionField) || !hasField(template.descriptionField) || !hasNumberField(template.metricField)) {
    return null;
  }

  return {
    ...template,
    secondaryDimensionFields: (template.secondaryDimensionFields ?? []).filter(hasField),
    includedColumns: (template.includedColumns ?? []).filter(hasField),
    filterFields: (template.filterFields ?? []).filter(hasField),
    supplierField: hasField(template.supplierField) ? template.supplierField : undefined,
    secondaryFilterField: hasField(template.secondaryFilterField) ? template.secondaryFilterField : undefined,
    dateField: hasField(template.dateField) ? template.dateField : undefined,
  };
}

/**
 * Asistente que reemplaza reglas rígidas por decisiones simples del usuario:
 * primero elegir cómo leer su tabla, luego renderizar el dashboard.
 */
export function FieldConfiguratorView({
  result,
  onBackToUpload,
  onConfig,
  theme,
  onToggleTheme,
  isReconfiguring = false,
  initialConfig,
}: FieldConfiguratorViewProps) {
  // Columnas que pueden mostrarse como texto. También dejamos pasar fechas y
  // booleanos porque visualmente se pueden leer en un filtro o en una tabla.
  const textOptions = result.detectedColumns.filter((column) => column.kind === 'text' || column.kind === 'date' || column.kind === 'boolean');

  // Columnas numéricas. Son candidatas para ser métrica: valor, cantidad,
  // total, ventas, costo, puntaje, etc.
  const numberOptions = result.detectedColumns.filter((column) => column.kind === 'number');

  // Opciones que parecen filtros importantes. No se seleccionan por obligación,
  // solo ayudan a escoger buenos valores predeterminados.
  const mainFilterOptions = textOptions.filter((column) => isLikelyMainFilter(column.header) || isLikelyMainFilter(column.normalizedHeader));
  const secondaryFilterOptions = textOptions.filter((column) => isLikelySecondaryFilter(column.header) || isLikelySecondaryFilter(column.normalizedHeader));

  // Fechas detectadas. Se usan para que el dashboard pueda filtrar por rangos
  // de tiempo cuando el Excel trae una columna de fecha.
  const dateOptions = result.detectedColumns.filter((column) => column.kind === 'date');

  // Mejor candidato inicial para la agrupación principal. La app intenta
  // ayudar, pero el usuario siempre puede cambiarlo en el paso 1.
  const defaultDimension = mainFilterOptions[0]
    || secondaryFilterOptions[0]
    || findByCanonicalOrHeader(textOptions, ['CATEGORIA', 'CATEGORÍA', 'SEGMENTO', 'TIPO', 'ESTADO'])
    || textOptions.find((column) => isLikelyTextForDimension(column.header))
    || textOptions.find((column) => isLikelyTextForDimension(column.normalizedHeader))
    || textOptions[0];

  // Mejor candidato inicial para la descripción visible en la tabla.
  const defaultDescription = findByCanonicalOrHeader(textOptions, ['DESCRIPCION', 'DESCRIPCIÓN', 'NOMBRE', 'DETALLE'])
    || textOptions.find((column) => !isLikelyMainFilter(column.normalizedHeader) && !isLikelySecondaryFilter(column.normalizedHeader))
    || defaultDimension
    || textOptions[0];

  // Mejor candidato inicial para la métrica. Ordenamos las columnas numéricas
  // usando `scoreMetricColumn`, de mayor puntaje a menor puntaje.
  const defaultMetric = [...numberOptions].sort((left, right) => scoreMetricColumn(right) - scoreMetricColumn(left))[0];

  const defaultSupplier = mainFilterOptions[0];
  const defaultSecondaryFilter = secondaryFilterOptions[0];
  const defaultDate = dateOptions[0];

  // Plantilla guardada, si existe y si todavía sirve para este Excel.
  const [savedTemplate, setSavedTemplate] = useState<StoredMappingTemplate | null>(() => sanitizeMappingTemplate(readStoredMappingTemplate(), result.detectedColumns));

  // Valores iniciales. Si venimos desde "Editar mapeo", usamos `initialConfig`.
  // Si es una carga nueva, usamos las columnas recomendadas automáticamente.
  const initialDimension = initialConfig?.dimensionField || defaultDimension?.normalizedHeader || '';
  const initialSecondaryDimensionFields: string[] = initialConfig?.secondaryDimensionFields ?? [];
  const initialDescription = initialConfig?.descriptionField || defaultDescription?.normalizedHeader || '';
  const initialMetric = initialConfig?.metricField || defaultMetric?.normalizedHeader || '';

  // Por decisión de diseño, los checkboxes opcionales arrancan vacíos. Esto
  // evita que SmartBI seleccione demasiadas columnas sin permiso del usuario.
  const initialFilterFields: string[] = [];
  const initialDate = initialConfig?.dateField || defaultDate?.normalizedHeader || '';
  const initialIncludedColumns: string[] = [];

  // Estados principales del wizard. Cada `useState` guarda un pedacito de la
  // elección del usuario.
  const [dimensionField, setDimensionField] = useState(initialDimension);
  const [secondaryDimensionFields, setSecondaryDimensionFields] = useState<string[]>(initialSecondaryDimensionFields);
  const [descriptionField, setDescriptionField] = useState(initialDescription);
  const [metricField, setMetricField] = useState(initialMetric);
  const [filterFields, setFilterFields] = useState<string[]>(initialFilterFields);
  const [includedColumns, setIncludedColumns] = useState<string[]>(initialIncludedColumns);
  const [dateField, setDateField] = useState(initialDate);
  const [step, setStep] = useState<MappingStep>(1);

  // Reglas para habilitar botones. Por ejemplo, no dejamos continuar si todavía
  // falta la columna principal de agrupación.
  const canContinue = !!dimensionField && !!descriptionField && !!metricField;
  const canGoToStep2 = !!dimensionField;
  const canGoToStep3 = canContinue;

  // Columnas obligatorias para que el dashboard funcione. Estas siempre quedan
  // incluidas aunque el usuario no las marque en la lista opcional.
  const requiredColumns = [...new Set([dimensionField, ...secondaryDimensionFields, descriptionField, metricField, dateField].filter(Boolean))];

  // Opciones secundarias: se excluye la agrupación principal para no repetir el
  // mismo campo dos veces en la dimensión compuesta.
  const secondaryDimensionOptions = textOptions.filter((column) => column.normalizedHeader !== dimensionField);

  // Columnas adicionales que el usuario puede incluir. Excluimos SQL por
  // seguridad y también quitamos las columnas obligatorias para no duplicarlas.
  const optionalColumns = result.detectedColumns.filter((column) => column.normalizedHeader !== 'SQL' && !requiredColumns.includes(column.normalizedHeader));

  // Texto educativo que cambia según el paso actual.
  const stepDescription = {
    1: 'Primero elegimos la columna principal para juntar registros parecidos.',
    2: 'Luego escogemos qué texto mostrar y qué número sumar.',
    3: 'Por último, puedes añadir columnas opcionales para filtrar mejor.',
  } as const;

  /**
   * Finaliza el wizard.
   *
   * Parámetro:
   * - `event`: evento del formulario HTML.
   *
   * Qué hace:
   * 1. Evita que el navegador recargue la página.
   * 2. Construye la configuración final del dashboard.
   * 3. Guarda una plantilla en LocalStorage.
   * 4. Entrega la configuración al componente padre con `onConfig`.
   */
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canContinue) return;
    const config: DashboardFieldConfig = {
      dimensionField,
      secondaryDimensionFields,
      descriptionField,
      metricField,
      includedColumns: [...new Set([...requiredColumns, ...includedColumns, ...filterFields])],
      filterFields,
      supplierField: filterFields.find((field) => field === defaultSupplier?.normalizedHeader),
      secondaryFilterField: filterFields.find((field) => field === defaultSecondaryFilter?.normalizedHeader),
      dateField: dateField || undefined,
    };
    window.localStorage.setItem(MAPPING_TEMPLATE_STORAGE_KEY, JSON.stringify({
      ...config,
      savedAt: new Date().toISOString(),
      sourceName: result.fileName,
    } satisfies StoredMappingTemplate));
    onConfig(config);
  };

  /**
   * Marca o desmarca una columna como filtro lateral.
   *
   * Si el campo ya está en la lista, lo quitamos.
   * Si no está, lo agregamos.
   */
  const toggleFilterField = (field: string) => {
    setFilterFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  };

  /**
   * Marca o desmarca una columna como "incluida".
   *
   * Una columna incluida queda disponible para exploración y detalle, aunque no
   * necesariamente aparece como filtro lateral.
   */
  const toggleIncludedColumn = (field: string) => {
    setIncludedColumns((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  };

  /**
   * Marca o desmarca una agrupación secundaria.
   *
   * Sirve para crear grupos compuestos, por ejemplo:
   * Ciudad > Segmento > Estado.
   */
  const toggleSecondaryDimensionField = (field: string) => {
    setSecondaryDimensionFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  };

  /**
   * Aplica una plantilla guardada.
   *
   * Esto rellena automáticamente los campos del wizard con la última
   * configuración compatible.
   */
  const applySavedTemplate = () => {
    if (!savedTemplate) return;
    setDimensionField(savedTemplate.dimensionField);
    setSecondaryDimensionFields(savedTemplate.secondaryDimensionFields ?? []);
    setDescriptionField(savedTemplate.descriptionField);
    setMetricField(savedTemplate.metricField);
    setIncludedColumns(savedTemplate.includedColumns ?? []);
    setFilterFields(savedTemplate.filterFields ?? []);
    setDateField(savedTemplate.dateField ?? '');
  };

  /**
   * Borra la plantilla guardada.
   *
   * Es útil cuando el usuario quiere empezar desde cero.
   */
  const forgetSavedTemplate = () => {
    window.localStorage.removeItem(MAPPING_TEMPLATE_STORAGE_KEY);
    setSavedTemplate(null);
  };

  /**
   * Dibuja una opción dentro de un `<select>`.
   *
   * Retorna JSX, que es la forma en que React describe elementos visuales.
   */
  const renderOption = (column: DetectedColumn) => (
    <option key={column.normalizedHeader} value={column.normalizedHeader}>
      {fieldLabelFromHeader(column.header)} ({column.kind})
    </option>
  );

  // Columnas usadas en la vista previa. Cambian según el paso para mostrar solo
  // lo que importa en ese momento y no abrumar al usuario.
  const previewColumns = (step === 1 ? [dimensionField, ...secondaryDimensionFields] : step === 2 ? [descriptionField, metricField] : requiredColumns)
    .filter(Boolean)
    .slice(0, 6);

  // Para la vista previa no necesitamos mostrar todo el Excel. Cinco filas son
  // suficientes para que el usuario confirme si eligió la columna correcta.
  const previewRows = result.records.slice(0, 5);

  /**
   * Lee una celda de la vista previa y la convierte en texto visible.
   *
   * Parámetros:
   * - `record`: una fila importada del Excel.
   * - `field`: columna que queremos mostrar.
   *
   * Retorna:
   * - Una fecha corta si el valor es fecha.
   * - Un guion si está vacío.
   * - Texto normal para cualquier otro valor.
   */
  const readPreviewValue = (record: ImportResult['records'][number], field: string) => {
    const value = record.raw[field];
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  };

  return (
    <main className="welcome">
      <a className="skip-link" href="#wizard-form">Saltar a la configuración</a>
      <header className="welcome__nav">
        <span className="welcome__logo">SmartBI</span>
        <div className="welcome__actions">
          <button className="secondary-button" type="button" onClick={onToggleTheme}>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</button>
          <button className="secondary-button" onClick={onBackToUpload}><ArrowLeft size={16} /> {isReconfiguring ? 'Volver al dashboard' : 'Volver'}</button>
        </div>
      </header>
      <section className="welcome__content" aria-labelledby="wizard-title">
        <div className="hero-copy">
          <div className="eyebrow"><Settings2 size={15} /> Mapeo de campos</div>
          <h1 id="wizard-title">Conecta tu reporte como tú quieras</h1>
          <p>La app ya leyó los encabezados. Ahora elegimos, uno por uno, las columnas correctas para tu primer dashboard.</p>
          <div className="wizard-hints">
            <p><Sparkles size={13} /> En cada paso solo aparece lo esencial.</p>
            <p><CircleHelp size={13} /> Si algo no encaja, puedes cambiarlo y probar otra columna.</p>
          </div>
          <div className="hero-points">
            <span><CheckCircle2 /> Lista de columnas detectadas</span>
            <span><CheckCircle2 /> Puedes elegir solo 2-3 campos</span>
            <span><CheckCircle2 /> Después todo se filtra y grafica aquí</span>
          </div>
        </div>
        <form id="wizard-form" className="upload-card wizard-card" aria-label="Asistente para configurar el dashboard" onSubmit={submit}>
          <div className="upload-card__heading">
            <span className="upload-card__icon"><Filter /></span>
            <div>
              <h2>Configura tu dashboard</h2>
              <p>Campos mínimos para empezar</p>
            </div>
          </div>
          <div className="step-progress" aria-live="polite">
            <span>Paso {step} de 3</span>
            <strong>{stepDescription[step]}</strong>
          </div>
          <div className="wizard-profile-strip" aria-label="Perfil rápido del Excel">
            <span>{result.detectedColumns.length} columnas</span>
            <span>{textOptions.length} texto</span>
            <span>{numberOptions.length} numéricas</span>
            <span>{dateOptions.length} fechas</span>
          </div>

          <div className="wizard-card__body">
          {savedTemplate && (
            <section className="mapping-template-card" aria-label="Plantilla de mapeo guardada">
              <div>
                <strong>Plantilla guardada disponible</strong>
                <p>Creada desde {savedTemplate.sourceName}. Puedes aplicarla y luego revisar cada paso.</p>
              </div>
              <div>
                <button type="button" onClick={applySavedTemplate}>Aplicar plantilla</button>
                <button type="button" onClick={forgetSavedTemplate}>Borrar</button>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="wizard-step" aria-labelledby="wizard-step-1-title">
              <h3 id="wizard-step-1-title" className="sr-only">Paso 1: agrupación</h3>
              <details className="wizard-tip">
                <summary>¿Qué es agrupar?</summary>
                <p>Agrupar significa juntar filas que comparten un mismo valor. Si agrupas por categoría, SmartBI suma la métrica por cada categoría.</p>
              </details>
              <label htmlFor="dimensionField">¿Qué columna te ayuda a agrupar?</label>
              <p className="step-helper">Ejemplos: categoría, cliente, ciudad, segmento, estado o canal.</p>
              <select
                className="field-select"
                id="dimensionField"
                value={dimensionField}
                onChange={(event) => {
                  setDimensionField(event.target.value);
                  setSecondaryDimensionFields((current) => current.filter((field) => field !== event.target.value));
                }}
              >
                {textOptions.length === 0 ? <option value="">Sin campos de texto</option> : textOptions.map(renderOption)}
              </select>
              <span className="wizard-field-label" id="secondary-groups-label">Agrupaciones secundarias (opcional)</span>
              <p className="step-helper">Puedes marcar más campos para crear grupos como Ciudad &gt; Segmento.</p>
              <div className="checklist-actions">
                <span>{secondaryDimensionFields.length} de {secondaryDimensionOptions.length} secundarias seleccionadas</span>
                <div>
                  <button type="button" onClick={() => setSecondaryDimensionFields(secondaryDimensionOptions.map((column) => column.normalizedHeader))}>Seleccionar todo</button>
                  <button type="button" onClick={() => setSecondaryDimensionFields([])}>Deseleccionar</button>
                </div>
              </div>
              <div className="field-checklist" role="group" aria-labelledby="secondary-groups-label">
                {secondaryDimensionOptions.map((column) => (
                  <label key={column.normalizedHeader} className="check-filter">
                    <input
                      type="checkbox"
                      checked={secondaryDimensionFields.includes(column.normalizedHeader)}
                      onChange={() => toggleSecondaryDimensionField(column.normalizedHeader)}
                    />
                    <span className="custom-check" />
                    <span>{fieldLabelFromHeader(column.header)} ({column.kind})</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="wizard-step" aria-labelledby="wizard-step-2-title">
              <h3 id="wizard-step-2-title" className="sr-only">Paso 2: descripción y métrica</h3>
              <details className="wizard-tip">
                <summary>¿Qué es una métrica?</summary>
                <p>Una métrica es un número que se suma, promedia o compara. Por ejemplo: valor, cantidad, ventas, costo o puntaje.</p>
              </details>
              <label htmlFor="descriptionField">¿Qué texto quieres mostrar en la tabla?</label>
              <p className="step-helper">Suele ser el nombre o la descripción del producto.</p>
              <select
                className="field-select"
                id="descriptionField"
                value={descriptionField}
                onChange={(event) => setDescriptionField(event.target.value)}
              >
                {textOptions.length === 0 ? <option value="">Sin campos de texto</option> : textOptions.map(renderOption)}
              </select>
              <label htmlFor="metricField">¿Qué valor quieres sumar o comparar?</label>
              <p className="step-helper">Ej: valor, total, cantidad, costo, ventas o puntaje.</p>
              <select
                className="field-select"
                id="metricField"
                value={metricField}
                onChange={(event) => setMetricField(event.target.value)}
              >
                {numberOptions.length === 0 ? <option value="">Sin campos numéricos</option> : numberOptions.map(renderOption)}
              </select>
            </section>
          )}

          {step === 3 && (
            <section className="wizard-step" aria-labelledby="wizard-step-3-title">
              <h3 id="wizard-step-3-title" className="sr-only">Paso 3: columnas y filtros</h3>
              <details className="wizard-tip">
                <summary>¿Qué diferencia hay entre columna incluida y filtro?</summary>
                <p>Una columna incluida queda disponible para explorar. Un filtro aparece en el panel lateral para reducir los datos visibles.</p>
              </details>
              <span className="wizard-field-label" id="included-columns-label">Columnas que se tendrán en cuenta</span>
              <p className="step-helper">Las columnas necesarias para el mapeo ya quedan incluidas. Marca aquí columnas adicionales para detalle, exploración y panel de campos.</p>
              <div className="checklist-actions">
                <span>{includedColumns.length} de {optionalColumns.length} adicionales seleccionadas</span>
                <div>
                  <button type="button" onClick={() => setIncludedColumns(optionalColumns.map((column) => column.normalizedHeader))}>Seleccionar todo</button>
                  <button type="button" onClick={() => setIncludedColumns([])}>Deseleccionar</button>
                </div>
              </div>
              <div className="field-checklist" role="group" aria-labelledby="included-columns-label">
                {optionalColumns.map((column) => (
                  <label key={column.normalizedHeader} className="check-filter">
                    <input
                      type="checkbox"
                      checked={includedColumns.includes(column.normalizedHeader)}
                      onChange={() => toggleIncludedColumn(column.normalizedHeader)}
                    />
                    <span className="custom-check" />
                    <span>{fieldLabelFromHeader(column.header)} ({column.kind})</span>
                  </label>
                ))}
              </div>
              <span className="wizard-field-label" id="filter-fields-label">Campos para filtrar</span>
              <p className="step-helper">Marca solo las columnas que quieres ver como filtros laterales. Ningún filtro viene seleccionado automáticamente.</p>
              <div className="checklist-actions">
                <span>{filterFields.length} de {textOptions.length} filtros seleccionados</span>
                <div>
                  <button type="button" onClick={() => setFilterFields(textOptions.map((column) => column.normalizedHeader))}>Seleccionar todo</button>
                  <button type="button" onClick={() => setFilterFields([])}>Deseleccionar</button>
                </div>
              </div>
              <div className="field-checklist" role="group" aria-labelledby="filter-fields-label">
                {textOptions.map((column) => (
                  <label key={column.normalizedHeader} className="check-filter">
                    <input
                      type="checkbox"
                      checked={filterFields.includes(column.normalizedHeader)}
                      onChange={() => toggleFilterField(column.normalizedHeader)}
                    />
                    <span className="custom-check" />
                    <span>{fieldLabelFromHeader(column.header)} ({column.kind})</span>
                  </label>
                ))}
              </div>
              <label htmlFor="dateField">Campo fecha (opcional)</label>
              <p className="step-helper">Puedes elegirlo si tu archivo tiene fecha de carga o corte.</p>
              <select
                className="field-select"
                id="dateField"
                value={dateField}
                onChange={(event) => setDateField(event.target.value)}
              >
                <option value="">Sin fecha</option>
                {dateOptions.map(renderOption)}
              </select>
            </section>
          )}

          {previewColumns.length > 0 && (
            <section className="wizard-preview" aria-label="Vista previa del Excel">
              <header>
                <strong>Vista previa del Excel</strong>
                <span>Primeras {previewRows.length} filas</span>
              </header>
              <div>
                <table>
                  <caption className="sr-only">Primeras filas del Excel con las columnas elegidas.</caption>
                  <thead>
                    <tr>
                      {previewColumns.map((field) => <th key={field}>{fieldLabelFromHeader(result.detectedColumns.find((column) => column.normalizedHeader === field)?.header ?? field)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((record) => (
                      <tr key={record.id}>
                        {previewColumns.map((field) => <td key={field}>{readPreviewValue(record, field)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          </div>

          <footer className="wizard-card__footer">
            <div className="wizard-nav">
            {step > 1 && (
              <button type="button" className="secondary-button" onClick={() => setStep(step === 2 ? 1 : 2 as MappingStep)}>
                Atrás
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (step === 1 && canGoToStep2) setStep(2 as MappingStep);
                  if (step === 2 && canGoToStep3) setStep(3 as MappingStep);
                }}
                disabled={step === 1 ? !canGoToStep2 : !canGoToStep3}
              >
                <span>Siguiente</span>
                <ArrowRight size={18} />
              </button>
            )}
            {step === 3 && (
              <button className="primary-button" type="submit" disabled={!canContinue}>
                <Eye size={16} />
                {isReconfiguring ? 'Actualizar dashboard' : 'Ir al dashboard'}
                <ArrowRight size={18} />
              </button>
            )}
          </div>

            <p className="upload-card__privacy">
            Tip: si un valor no se ve claro, prueba otra columna. Guardamos tu configuración de la sesión.
            </p>
          </footer>
        </form>
      </section>
    </main>
  );
}
