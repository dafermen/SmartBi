import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Columns3,
  Copy,
  Download,
  EyeOff,
  FileSpreadsheet,
  Filter,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sun,
  Table2,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Brand } from '../../components/Brand';
import type { DashboardFilters, DashboardFieldConfig, ImportResult } from '../../domain/types';
import { type CsvExportColumn, downloadCsv } from './exportCsv';
import { computeDashboardAnalytics, readRawMetric, readRawDate, type DashboardAnalyticsRow } from './dashboardAnalytics';
import { buildDataProfile, type DataProfileRow } from './dataProfile';
import {
  DEFAULT_REPORT_PAGES,
  REPORT_PAGES_STORAGE_KEY,
  createReportPageId,
  readStoredReportPages,
  type ReportPage,
  type ReportSectionId,
} from './reportPages';

const chartColors = ['#5e60ce', '#4895ef', '#4cc9f0', '#56cfe1', '#3a0ca3', '#f72585', '#b5179e'];
const integer = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
const BUILDER_STORAGE_KEY = 'smartbi:visual-builder';
const DATA_PROFILE_WORKER_THRESHOLD = 5_000;
const TABLE_ROW_HEIGHT = 42;
const TABLE_VIRTUAL_OVERSCAN = 8;

type SortField = 'dimension' | 'description' | 'supplier' | 'secondary' | 'metric' | 'date';
type SortDirection = 'asc' | 'desc';
type BuilderVisualType = 'bar' | 'line' | 'area' | 'card' | 'table' | 'donut';
type BuilderAggregation = 'sum' | 'avg' | 'count' | 'max' | 'min';
type BuilderVisualSize = 'small' | 'medium' | 'large';
type RangeChipType = 'metricMin' | 'metricMax' | 'dateFrom' | 'dateTo';

interface SavedCanvasVisual {
  id: string;
  title?: string;
  dimensionField: string;
  metricField: string;
  visualType: BuilderVisualType;
  aggregation?: BuilderAggregation;
  color?: string;
  size?: BuilderVisualSize;
  pageIds?: string[];
}

interface StoredBuilderConfig {
  dimensionField?: string;
  metricField?: string;
  visualType?: BuilderVisualType;
  aggregation?: BuilderAggregation;
  color?: string;
  size?: BuilderVisualSize;
  canvasVisuals?: SavedCanvasVisual[];
}


interface DashboardViewProps {
  result: ImportResult;
  fieldConfig: DashboardFieldConfig;
  onReset: () => void;
  onOpenDocumentation: () => void;
  onReconfigure: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface SortableChip {
  id: string;
  label: string;
  type: 'requirement' | 'supplier' | 'secondary' | 'dynamic' | 'search' | RangeChipType;
  value: string;
  field?: string;
}

interface TableColumnVisibility {
  description: boolean;
  supplier: boolean;
  secondary: boolean;
  date: boolean;
}

interface QualityReportRow {
  category: string;
  item: string;
  value: string | number;
  detail: string;
}

function isMetricCurrency(metricField: string): boolean {
  return /COSTO|PRECIO|VALOR|MONTO|TOTAL|PAGO|IMPORTE/i.test(metricField);
}

function toSortLabel(value: string): string {
  return value.toLocaleLowerCase('es');
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return `${value}`;
  return String(value);
}

function readAsText(record: ImportResult['records'][number], normalizedHeader?: string): string {
  if (!normalizedHeader) return '';
  const value = record.raw[normalizedHeader];
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function readDate(record: ImportResult['records'][number], normalizedHeader?: string): Date | null {
  if (!normalizedHeader) return null;
  const value = readRawDate(record, normalizedHeader);
  return value ? new Date(value) : null;
}

function toDateInputValue(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function fromDateInputValue(value: string, endOfDay = false): number | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date.getTime();
}

function fromNumberInputValue(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function aggregateValues(values: number[], aggregation: BuilderAggregation): number {
  if (values.length === 0) return 0;
  if (aggregation === 'count') return values.length;
  if (aggregation === 'avg') return values.reduce((total, value) => total + value, 0) / values.length;
  if (aggregation === 'max') return Math.max(...values);
  if (aggregation === 'min') return Math.min(...values);
  return values.reduce((total, value) => total + value, 0);
}

function readStoredBuilderConfig(): StoredBuilderConfig {
  try {
    const rawValue = window.localStorage.getItem(BUILDER_STORAGE_KEY);
    if (!rawValue) return {};
    const parsed = JSON.parse(rawValue) as StoredBuilderConfig;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function isBuilderVisualType(value: unknown): value is BuilderVisualType {
  return value === 'bar' || value === 'line' || value === 'area' || value === 'card' || value === 'table' || value === 'donut';
}

function isBuilderAggregation(value: unknown): value is BuilderAggregation {
  return value === 'sum' || value === 'avg' || value === 'count' || value === 'max' || value === 'min';
}

function isBuilderVisualSize(value: unknown): value is BuilderVisualSize {
  return value === 'small' || value === 'medium' || value === 'large';
}

function sanitizeVisualColor(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : chartColors[0];
}

/**
 * Dashboard principal que ya no depende de columnas fijas.
 *
 * La vista toma la configuración elegida por el usuario y aplica filtros,
 * agrupaciones y ordenamientos sobre esos campos seleccionados.
 */
export function DashboardView({ result, fieldConfig, onReset, onOpenDocumentation, onReconfigure, theme, onToggleTheme }: DashboardViewProps) {
  const savedBuilderConfig = useMemo(() => readStoredBuilderConfig(), []);
  const detectedFieldNames = useMemo(() => new Set(result.detectedColumns.map((column) => column.normalizedHeader)), [result.detectedColumns]);
  const savedDimensionField = savedBuilderConfig.dimensionField && detectedFieldNames.has(savedBuilderConfig.dimensionField)
    ? savedBuilderConfig.dimensionField
    : fieldConfig.dimensionField;
  const savedMetricField = savedBuilderConfig.metricField && result.detectedColumns.some((column) => column.normalizedHeader === savedBuilderConfig.metricField && column.kind === 'number')
    ? savedBuilderConfig.metricField
    : fieldConfig.metricField;
  const savedDimensionKind = result.detectedColumns.find((column) => column.normalizedHeader === savedDimensionField)?.kind;
  const savedVisualType = isBuilderVisualType(savedBuilderConfig.visualType) && (!['line', 'area'].includes(savedBuilderConfig.visualType) || savedDimensionKind === 'date')
    ? savedBuilderConfig.visualType
    : 'bar';
  const savedAggregation = isBuilderAggregation(savedBuilderConfig.aggregation) ? savedBuilderConfig.aggregation : 'sum';
  const savedCanvasVisuals = (savedBuilderConfig.canvasVisuals ?? [])
    .filter((visual) => {
      const dimensionKind = result.detectedColumns.find((column) => column.normalizedHeader === visual.dimensionField)?.kind;
      const hasDimension = detectedFieldNames.has(visual.dimensionField);
      const hasMetric = result.detectedColumns.some((column) => column.normalizedHeader === visual.metricField && column.kind === 'number');
      return hasDimension && hasMetric && isBuilderVisualType(visual.visualType)
        && (!['line', 'area'].includes(visual.visualType) || dimensionKind === 'date');
    })
    .map((visual) => ({
      ...visual,
      color: sanitizeVisualColor(visual.color),
      size: isBuilderVisualSize(visual.size) ? visual.size : 'medium' as BuilderVisualSize,
      pageIds: Array.isArray(visual.pageIds) ? visual.pageIds.filter((id) => typeof id === 'string') : undefined,
    }));
  const [filters, setFilters] = useState<DashboardFilters>({ search: '', requirements: [], suppliers: [], secondaryValues: [], fieldValues: {} });
  const [dismissedNoticeKey, setDismissedNoticeKey] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('section-summary');
  const [builderDimensionField, setBuilderDimensionField] = useState(savedDimensionField);
  const [builderMetricField, setBuilderMetricField] = useState(savedMetricField);
  const [builderVisualType, setBuilderVisualType] = useState<BuilderVisualType>(savedVisualType);
  const [builderAggregation, setBuilderAggregation] = useState<BuilderAggregation>(savedAggregation);
  const [builderColor, setBuilderColor] = useState(() => sanitizeVisualColor(savedBuilderConfig.color));
  const [builderSize, setBuilderSize] = useState<BuilderVisualSize>(() => isBuilderVisualSize(savedBuilderConfig.size) ? savedBuilderConfig.size : 'medium');
  const [editingVisualId, setEditingVisualId] = useState<string | null>(null);
  const [draggedVisualId, setDraggedVisualId] = useState<string | null>(null);
  const [canvasVisuals, setCanvasVisuals] = useState<SavedCanvasVisual[]>(savedCanvasVisuals);
  const initialReportPages = useMemo(() => readStoredReportPages(), []);
  const [reportPages, setReportPages] = useState<ReportPage[]>(initialReportPages);
  const [activeReportPageId, setActiveReportPageId] = useState(() => initialReportPages.find((item) => item.isDefault && !item.isHidden)?.id
    ?? initialReportPages.find((item) => !item.isHidden)?.id
    ?? DEFAULT_REPORT_PAGES[0].id);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const [dataProfileRows, setDataProfileRows] = useState<DataProfileRow[]>([]);
  const reportTabsRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableQuery, setTableQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ field: 'dimension', direction: 'desc' });
  const [visibleColumns, setVisibleColumns] = useState<TableColumnVisibility>(() => ({
    description: true,
    supplier: true,
    secondary: true,
    date: true,
  }));

  const fieldForDimension = fieldConfig.dimensionField;
  const secondaryDimensionFields = useMemo(() => fieldConfig.secondaryDimensionFields ?? [], [fieldConfig.secondaryDimensionFields]);
  const fieldForDescription = fieldConfig.descriptionField || fieldForDimension;
  const metricField = fieldConfig.metricField;
  const fieldForSupplier = fieldConfig.supplierField;
  const fieldForSecondaryFilter = fieldConfig.secondaryFilterField;
  const dateField = fieldConfig.dateField;

  const detectedColumnByField = useMemo(
    () => new Map(result.detectedColumns.map((column) => [column.normalizedHeader, column])),
    [result.detectedColumns],
  );
  const labelForField = useCallback(
    (field?: string, fallback = '') => detectedColumnByField.get(field ?? '')?.header || field || fallback,
    [detectedColumnByField],
  );
  const selectedFilterFields = useMemo(
    () => [...new Set(fieldConfig.filterFields ?? [fieldForSupplier, fieldForSecondaryFilter].filter(Boolean) as string[])]
      .filter((field) => field && field !== fieldForDimension && !secondaryDimensionFields.includes(field)),
    [fieldConfig.filterFields, fieldForDimension, fieldForSecondaryFilter, fieldForSupplier, secondaryDimensionFields],
  );
  const filterLabels = useMemo(
    () => Object.fromEntries(selectedFilterFields.map((field) => [field, labelForField(field)])),
    [labelForField, selectedFilterFields],
  );

  const metricLabel = detectedColumnByField.get(metricField)?.header || metricField || 'Métrica';
  const dimensionLabels = [fieldForDimension, ...secondaryDimensionFields].map((field) => labelForField(field, field));
  const dimensionLabel = dimensionLabels.join(' > ') || 'Agrupación';
  const descriptionLabel = detectedColumnByField.get(fieldForDescription)?.header || 'Descripción';
  const supplierLabel = detectedColumnByField.get(fieldForSupplier ?? '')?.header || 'Filtro destacado';
  const secondaryFilterLabel = detectedColumnByField.get(fieldForSecondaryFilter ?? '')?.header || 'Filtro adicional';
  const dateLabel = detectedColumnByField.get(dateField ?? '')?.header || 'Fecha';
  const hasDateColumn = Boolean(dateField);
  const hasSupplierColumn = Boolean(fieldForSupplier);
  const hasSecondaryFilterColumn = Boolean(fieldForSecondaryFilter);
  const showSupplierFilter = hasSupplierColumn && fieldForSupplier !== fieldForDimension;
  const noticeKey = `${result.fileName}:${result.importedAt.getTime()}:${result.issues.length}`;
  const showImportNotice = result.issues.length > 0 && dismissedNoticeKey !== noticeKey;

  useEffect(() => {
    if (result.issues.length === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setDismissedNoticeKey(noticeKey), 10000);
    return () => window.clearTimeout(timeoutId);
  }, [noticeKey, result.issues.length]);

  useEffect(() => {
    window.localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify({
      dimensionField: builderDimensionField,
      metricField: builderMetricField,
      visualType: builderVisualType,
      aggregation: builderAggregation,
      color: builderColor,
      size: builderSize,
      canvasVisuals,
    }));
  }, [builderAggregation, builderColor, builderDimensionField, builderMetricField, builderSize, builderVisualType, canvasVisuals]);

  useEffect(() => {
    window.localStorage.setItem(REPORT_PAGES_STORAGE_KEY, JSON.stringify(reportPages));
  }, [reportPages]);

  const isCurrency = isMetricCurrency(metricField);
  const formatMetric = useMemo(() => (isCurrency ? currency.format : compact.format), [isCurrency]);
  const analytics = useMemo(
    () => computeDashboardAnalytics({
      records: result.records,
      search: filters.search,
      requirements: filters.requirements,
      suppliers: filters.suppliers,
      secondaryValues: filters.secondaryValues,
      fieldValues: filters.fieldValues,
      metricMin: filters.metricMin,
      metricMax: filters.metricMax,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      fieldForDimension,
      secondaryDimensionFields,
      fieldForDescription,
      metricField,
      fieldForSupplier,
      fieldForSecondaryFilter,
      filterFields: selectedFilterFields,
      filterLabels,
      dateField,
      metricSearchLabel: metricLabel,
    }),
    [result.records, filters.search, filters.requirements, filters.suppliers, filters.secondaryValues, filters.fieldValues, filters.metricMin, filters.metricMax, filters.dateFrom, filters.dateTo, fieldForDimension, secondaryDimensionFields, fieldForDescription, metricField, fieldForSupplier, fieldForSecondaryFilter, selectedFilterFields, filterLabels, dateField, metricLabel],
  );

  const allDimensions = analytics.allDimensions;
  const allFilterValues = analytics.allFilterValues;
  const filtered = analytics.filteredRows;
  const dimensionGroups = analytics.dimensionGroups;
  const supplierGroups = analytics.supplierGroups;
  const secondaryGroups = analytics.secondaryGroups;
  const metricTotal = analytics.metricTotal;
  const metricAverage = analytics.metricAverage;
  const metricMax = analytics.metricMax;
  const positiveMetricRows = analytics.positiveMetricRows;
  const zeroMetricRows = analytics.zeroMetricRows;
  const negativeMetricRows = analytics.negativeMetricRows;

  const visibleRows = useMemo(() => {
    const rows = [...filtered];
    const normalizedTableQuery = tableQuery.trim().toLocaleLowerCase('es');
    rows.sort((left, right) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      let leftValue: string | number;
      let rightValue: string | number;

      if (sort.field === 'dimension') {
        leftValue = left.dimension;
        rightValue = right.dimension;
      } else if (sort.field === 'description') {
        leftValue = left.description;
        rightValue = right.description;
      } else if (sort.field === 'supplier') {
        leftValue = left.supplier;
        rightValue = right.supplier;
      } else if (sort.field === 'secondary') {
        leftValue = left.secondaryValue;
        rightValue = right.secondaryValue;
      } else if (sort.field === 'date' && dateField) {
        leftValue = left.dateValue;
        rightValue = right.dateValue;
      } else {
        leftValue = left.metric;
        rightValue = right.metric;
      }

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction;
      }
      return toSortLabel(String(leftValue)).localeCompare(toSortLabel(String(rightValue))) * direction;
    });

    if (!normalizedTableQuery) return rows;

    return rows.filter((row) => {
      const searchableValues = [
        row.dimension,
        row.description,
        row.supplier,
        row.secondaryValue,
        String(row.metric),
        ...selectedFilterFields.map((field) => readAsText(row.source, field)),
        dateField ? readAsText(row.source, dateField) : '',
      ];
      return searchableValues.some((value) => value.toLocaleLowerCase('es').includes(normalizedTableQuery));
    });
  }, [filtered, tableQuery, sort.direction, sort.field, dateField, selectedFilterFields]);

  const activeFilterChips = useMemo(() => {
    const chips: SortableChip[] = [];
    if (filters.search.trim()) {
      chips.push({
        id: `search:${filters.search}`,
        label: `Búsqueda: ${filters.search}`,
        type: 'search',
        value: filters.search,
      });
    }

    filters.requirements.forEach((item) => chips.push({
      id: `req:${item}`,
      label: `Agrupación: ${item}`,
      type: 'requirement',
      value: item,
    }));

    filters.suppliers.forEach((item) => chips.push({
      id: `sup:${item}`,
      label: `${supplierLabel}: ${item}`,
      type: 'supplier',
      value: item,
    }));

    filters.secondaryValues.forEach((item) => chips.push({
      id: `sec:${item}`,
      label: `${secondaryFilterLabel}: ${item}`,
      type: 'secondary',
      value: item,
    }));

    Object.entries(filters.fieldValues ?? {}).forEach(([field, values]) => {
      values.forEach((item) => chips.push({
        id: `dyn:${field}:${item}`,
        label: `${filterLabels[field] ?? field}: ${item}`,
        type: 'dynamic',
        value: item,
        field,
      }));
    });

    if (filters.metricMin !== undefined) {
      chips.push({
        id: `metricMin:${filters.metricMin}`,
        label: `${metricLabel} desde ${formatMetric(filters.metricMin)}`,
        type: 'metricMin',
        value: String(filters.metricMin),
      });
    }

    if (filters.metricMax !== undefined) {
      chips.push({
        id: `metricMax:${filters.metricMax}`,
        label: `${metricLabel} hasta ${formatMetric(filters.metricMax)}`,
        type: 'metricMax',
        value: String(filters.metricMax),
      });
    }

    if (filters.dateFrom !== undefined) {
      chips.push({
        id: `dateFrom:${filters.dateFrom}`,
        label: `${dateLabel} desde ${DATE_FORMATTER.format(new Date(filters.dateFrom))}`,
        type: 'dateFrom',
        value: String(filters.dateFrom),
      });
    }

    if (filters.dateTo !== undefined) {
      chips.push({
        id: `dateTo:${filters.dateTo}`,
        label: `${dateLabel} hasta ${DATE_FORMATTER.format(new Date(filters.dateTo))}`,
        type: 'dateTo',
        value: String(filters.dateTo),
      });
    }

    return chips;
  }, [dateLabel, filters.dateFrom, filters.dateTo, filters.fieldValues, filters.metricMax, filters.metricMin, filters.requirements, filters.search, filters.secondaryValues, filters.suppliers, filterLabels, formatMetric, metricLabel, secondaryFilterLabel, supplierLabel]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rowsForCurrentPage = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const shouldVirtualizeTable = rowsForCurrentPage.length > 60;
  const virtualStartIndex = shouldVirtualizeTable
    ? Math.max(0, Math.floor(tableScrollTop / TABLE_ROW_HEIGHT) - TABLE_VIRTUAL_OVERSCAN)
    : 0;
  const virtualVisibleCount = shouldVirtualizeTable
    ? Math.ceil(560 / TABLE_ROW_HEIGHT) + (TABLE_VIRTUAL_OVERSCAN * 2)
    : rowsForCurrentPage.length;
  const virtualEndIndex = Math.min(rowsForCurrentPage.length, virtualStartIndex + virtualVisibleCount);
  const renderedTableRows = rowsForCurrentPage.slice(virtualStartIndex, virtualEndIndex);
  const virtualTopSpacer = shouldVirtualizeTable ? virtualStartIndex * TABLE_ROW_HEIGHT : 0;
  const virtualBottomSpacer = shouldVirtualizeTable ? (rowsForCurrentPage.length - virtualEndIndex) * TABLE_ROW_HEIGHT : 0;
  const visibleTableColumnCount = 2
    + (visibleColumns.description ? 1 : 0)
    + (hasSupplierColumn && visibleColumns.supplier ? 1 : 0)
    + (hasSecondaryFilterColumn && visibleColumns.secondary ? 1 : 0)
    + (dateField && visibleColumns.date ? 1 : 0);
  const activeDynamicCount = Object.values(filters.fieldValues ?? {}).reduce((total, values) => total + values.length, 0);
  const activeRangeCount = [filters.metricMin, filters.metricMax, filters.dateFrom, filters.dateTo].filter((value) => value !== undefined).length;
  const activeCount = filters.requirements.length + filters.suppliers.length + filters.secondaryValues.length + activeDynamicCount + activeRangeCount + (filters.search ? 1 : 0);


  const removeChip = (chip: SortableChip) => {
    if (chip.type === 'search') {
      setFilters((current) => ({ ...current, search: '' }));
      return;
    }

    if (chip.type === 'requirement') {
      setFilters((current) => ({
        ...current,
        requirements: current.requirements.filter((item) => item !== chip.value),
      }));
      return;
    }

    if (chip.type === 'secondary') {
      setFilters((current) => ({
        ...current,
        secondaryValues: current.secondaryValues.filter((item) => item !== chip.value),
      }));
      return;
    }

    if (chip.type === 'dynamic' && chip.field) {
      const field = chip.field;
      setFilters((current) => ({
        ...current,
        fieldValues: {
          ...(current.fieldValues ?? {}),
          [field]: (current.fieldValues?.[field] ?? []).filter((item: string) => item !== chip.value),
        },
      }));
      return;
    }

    if (chip.type === 'metricMin' || chip.type === 'metricMax' || chip.type === 'dateFrom' || chip.type === 'dateTo') {
      setFilters((current) => ({
        ...current,
        [chip.type]: undefined,
      }));
      return;
    }

    setFilters((current) => ({
      ...current,
      suppliers: current.suppliers.filter((item) => item !== chip.value),
    }));
  };

  const toggle = (key: 'requirements' | 'suppliers' | 'secondaryValues', value: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  };

  const applyDimensionFilter = (value: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      requirements: toggleValue(current.requirements, value),
    }));
  };

  const applySupplierFilter = (value: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      suppliers: toggleValue(current.suppliers, value),
    }));
  };

  const toggleDynamicFilter = (field: string, value: string) => {
    setPage(1);
    setFilters((current) => {
      const currentValues = current.fieldValues?.[field] ?? [];
      return {
        ...current,
        fieldValues: {
          ...(current.fieldValues ?? {}),
          [field]: toggleValue(currentValues, value),
        },
      };
    });
  };

  const applySecondaryFilter = (value: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      secondaryValues: toggleValue(current.secondaryValues, value),
    }));
  };

  const clearFilters = () => {
    setFilters({ search: '', requirements: [], suppliers: [], secondaryValues: [], fieldValues: {} });
    setPage(1);
  };

  const updateMetricRange = (field: 'metricMin' | 'metricMax', value: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [field]: fromNumberInputValue(value),
    }));
  };

  const updateDateRange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [field]: fromDateInputValue(value, field === 'dateTo'),
    }));
  };

  const toggleSort = (field: SortField) => {
    setSort((current) => (current.field === field ? {
      field,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    } : {
      field,
      direction: 'asc',
    }));
  };

  const sortIndicator = (field: SortField) => {
    if (sort.field !== field) return '↕';
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  const exportColumns = useMemo<CsvExportColumn<DashboardAnalyticsRow>[]>(() => {
    const columns: CsvExportColumn<DashboardAnalyticsRow>[] = [
      { label: dimensionLabel, getValue: (record) => record.dimension || 'Sin definir' },
      { label: descriptionLabel, getValue: (record) => readAsText(record.source, fieldForDescription) || 'Sin nombre' },
      { label: metricLabel, getValue: (record) => toCsvValue(readRawMetric(record.source, metricField)) },
    ];

    if (hasSupplierColumn && visibleColumns.supplier) {
      columns.push({
        label: supplierLabel,
        getValue: (record) => readAsText(record.source, fieldForSupplier) || 'Sin definir',
      });
    }

    if (hasSecondaryFilterColumn && visibleColumns.secondary) {
      columns.push({
        label: secondaryFilterLabel,
        getValue: (record) => readAsText(record.source, fieldForSecondaryFilter) || 'Sin definir',
      });
    }

    selectedFilterFields.forEach((field) => {
      if (field === fieldForSupplier || field === fieldForSecondaryFilter) return;
      columns.push({
        label: filterLabels[field] ?? field,
        getValue: (record) => readAsText(record.source, field) || 'Sin definir',
      });
    });

    if (dateField && visibleColumns.date) {
      columns.push({
        label: dateLabel,
        getValue: (record) => {
          const value = readDate(record.source, dateField);
          return value ? DATE_FORMATTER.format(value) : '';
        },
      });
    }

    return columns;
  }, [
    dimensionLabel,
    descriptionLabel,
    metricLabel,
    fieldForDescription,
    metricField,
    hasSupplierColumn,
    visibleColumns.supplier,
    fieldForSupplier,
    supplierLabel,
    hasSecondaryFilterColumn,
    visibleColumns.secondary,
    secondaryFilterLabel,
    fieldForSecondaryFilter,
    selectedFilterFields,
    filterLabels,
    dateField,
    visibleColumns.date,
    dateLabel,
  ]);

  const rankingUsesSupplier = showSupplierFilter;
  const rankingUsesSecondary = !rankingUsesSupplier && hasSecondaryFilterColumn;
  const rankingData = rankingUsesSupplier ? supplierGroups : rankingUsesSecondary ? secondaryGroups : dimensionGroups;
  const rankingTitle = rankingUsesSupplier ? `Ranking por ${supplierLabel}` : rankingUsesSecondary ? `Ranking por ${secondaryFilterLabel}` : 'Ranking adicional';
  const rankingSubtitle = rankingUsesSupplier || rankingUsesSecondary ? 'Suma de métrica por grupo' : 'Sin otro filtro configurado';
  const usedFieldRoles = useMemo(() => {
    const roles = new Map<string, string[]>();
    const addRole = (field: string | undefined, role: string) => {
      if (!field) return;
      roles.set(field, [...(roles.get(field) ?? []), role]);
    };

    addRole(fieldForDimension, 'Agrupación');
    secondaryDimensionFields.forEach((field) => addRole(field, 'Agrupación secundaria'));
    addRole(fieldForDescription, 'Descripción');
    addRole(metricField, 'Métrica');
    addRole(dateField, 'Fecha');
    selectedFilterFields.forEach((field) => addRole(field, 'Filtro'));

    return roles;
  }, [dateField, fieldForDescription, fieldForDimension, metricField, secondaryDimensionFields, selectedFilterFields]);
  const safeDetectedColumns = useMemo(
    () => result.detectedColumns.filter((column) => column.normalizedHeader !== 'SQL'),
    [result.detectedColumns],
  );
  const requiredDashboardFields = useMemo(() => [
    fieldForDimension,
    ...secondaryDimensionFields,
    fieldForDescription,
    metricField,
    dateField,
    ...selectedFilterFields,
  ].filter(Boolean), [dateField, fieldForDescription, fieldForDimension, metricField, secondaryDimensionFields, selectedFilterFields]);
  const includedFieldSet = useMemo(() => new Set([
    ...requiredDashboardFields,
    ...(fieldConfig.includedColumns ?? []),
  ]), [fieldConfig.includedColumns, requiredDashboardFields]);
  const visibleDetectedColumns = safeDetectedColumns.filter((column) => includedFieldSet.has(column.normalizedHeader));
  const ignoredColumns = safeDetectedColumns.filter((column) => !includedFieldSet.has(column.normalizedHeader));
  const emptyIncludedColumns = visibleDetectedColumns.filter((column) => column.kind === 'empty');
  useEffect(() => {
    let active = true;

    const calculateOnMainThread = () => {
      if (active) {
        setDataProfileRows(buildDataProfile(result.records, safeDetectedColumns));
      }
    };

    if (result.records.length < DATA_PROFILE_WORKER_THRESHOLD || typeof Worker === 'undefined') {
      calculateOnMainThread();
      return () => { active = false; };
    }

    const worker = new Worker(new URL('./dataProfile.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<DataProfileRow[]>) => {
      if (!active) return;
      setDataProfileRows(event.data);
      worker.terminate();
    };
    worker.onerror = () => {
      worker.terminate();
      calculateOnMainThread();
    };
    worker.postMessage({ records: result.records, columns: safeDetectedColumns });

    return () => {
      active = false;
      worker.terminate();
    };
  }, [result.records, safeDetectedColumns]);
  const profileIsWorking = safeDetectedColumns.length > 0 && dataProfileRows.length === 0;
  const recommendedMetrics = dataProfileRows.filter((row) => row.recommendation === 'Métrica').length;
  const recommendedFilters = dataProfileRows.filter((row) => row.recommendation === 'Filtro').length;
  const recommendedGroups = dataProfileRows.filter((row) => row.recommendation === 'Agrupación').length;
  const qualityWarnings = result.issues.filter((issue) => issue.level === 'warning').length + ignoredColumns.length + emptyIncludedColumns.length;
  const qualityErrors = result.issues.filter((issue) => issue.level === 'error').length + result.rejectedRows;
  const qualityReportRows = useMemo<QualityReportRow[]>(() => [
    { category: 'Resumen', item: 'Archivo', value: result.fileName, detail: result.sheetName },
    { category: 'Resumen', item: 'Filas leídas', value: result.totalRows, detail: 'Total reportado por importación' },
    { category: 'Resumen', item: 'Filas válidas', value: result.records.length, detail: 'Registros disponibles para dashboard' },
    { category: 'Resumen', item: 'Filas rechazadas', value: result.rejectedRows, detail: qualityErrors > 0 ? 'Revisar archivo original' : 'Sin errores críticos' },
    { category: 'Columnas', item: 'Columnas detectadas', value: safeDetectedColumns.length, detail: safeDetectedColumns.map((column) => column.header).join(' | ') },
    { category: 'Columnas', item: 'Columnas incluidas', value: visibleDetectedColumns.length, detail: visibleDetectedColumns.map((column) => column.header).join(' | ') },
    { category: 'Columnas', item: 'Columnas ignoradas', value: ignoredColumns.length, detail: ignoredColumns.map((column) => column.header).join(' | ') || 'Ninguna' },
    { category: 'Columnas', item: 'Columnas vacías incluidas', value: emptyIncludedColumns.length, detail: emptyIncludedColumns.map((column) => column.header).join(' | ') || 'Ninguna' },
    ...dataProfileRows.map((row) => ({
      category: 'Perfil de datos',
      item: row.header,
      value: row.kind,
      detail: `${row.uniqueCount} únicos | ${row.emptyPercent}% vacíos | ${row.recommendation}`,
    })),
    ...result.issues.map((issue) => ({
      category: issue.level === 'error' ? 'Error' : 'Advertencia',
      item: issue.column ?? 'Importación',
      value: issue.row ?? '',
      detail: issue.message,
    })),
  ], [dataProfileRows, emptyIncludedColumns, ignoredColumns, qualityErrors, result.fileName, result.issues, result.records.length, result.rejectedRows, result.sheetName, result.totalRows, safeDetectedColumns, visibleDetectedColumns]);
  const qualityExportColumns: CsvExportColumn<QualityReportRow>[] = [
    { label: 'Categoría', getValue: (row) => row.category },
    { label: 'Elemento', getValue: (row) => row.item },
    { label: 'Valor', getValue: (row) => row.value },
    { label: 'Detalle', getValue: (row) => row.detail },
  ];
  const builderDimensionLabel = labelForField(builderDimensionField, builderDimensionField);
  const builderMetricLabel = labelForField(builderMetricField, builderMetricField);
  const builderMetricIsCurrency = isMetricCurrency(builderMetricField);
  const builderFormatMetric = builderMetricIsCurrency ? currency.format : compact.format;
  const builderDimensionKind = visibleDetectedColumns.find((column) => column.normalizedHeader === builderDimensionField)?.kind;
  const builderCanUseLine = builderDimensionKind === 'date';
  const builderData = useMemo(() => {
    const groups = new Map<string, number[]>();

    filtered.forEach((record) => {
      const name = readAsText(record.source, builderDimensionField) || 'Sin definir';
      const value = readRawMetric(record.source, builderMetricField);
      groups.set(name, [...(groups.get(name) ?? []), value]);
    });

    return Array.from(groups, ([name, values]) => ({ name, value: aggregateValues(values, builderAggregation) }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 10);
  }, [builderAggregation, builderDimensionField, builderMetricField, filtered]);
  const builderLineData = useMemo(() => {
    const groups = new Map<number, number[]>();

    filtered.forEach((record) => {
      const dateTime = readRawDate(record.source, builderDimensionField);
      if (!dateTime) return;
      const date = new Date(dateTime);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const value = readRawMetric(record.source, builderMetricField);
      groups.set(dayStart, [...(groups.get(dayStart) ?? []), value]);
    });

    return Array.from(groups, ([timestamp, values]) => ({
      timestamp,
      name: DATE_FORMATTER.format(new Date(timestamp)),
      value: aggregateValues(values, builderAggregation),
    })).sort((left, right) => left.timestamp - right.timestamp);
  }, [builderAggregation, builderDimensionField, builderMetricField, filtered]);
  const builderTotal = aggregateValues(filtered.map((record) => readRawMetric(record.source, builderMetricField)), builderAggregation);
  const builderTopItem = builderData[0];
  const builderVisualOptions: Array<{ id: BuilderVisualType; label: string; icon: ReactNode; disabled?: boolean; title?: string }> = [
    { id: 'bar', label: 'Barras', icon: <BarChart3 size={14} /> },
    { id: 'line', label: 'Línea', icon: <TrendingUp size={14} />, disabled: !builderCanUseLine, title: builderCanUseLine ? 'Ver tendencia por fecha' : 'Disponible cuando el eje sea una fecha' },
    { id: 'area', label: 'Área', icon: <TrendingUp size={14} />, disabled: !builderCanUseLine, title: builderCanUseLine ? 'Ver evolución acumulada por fecha' : 'Disponible cuando el eje sea una fecha' },
    { id: 'card', label: 'Tarjeta', icon: <TrendingUp size={14} /> },
    { id: 'table', label: 'Tabla', icon: <Table2 size={14} /> },
    { id: 'donut', label: 'Dona', icon: <BarChart3 size={14} /> },
  ];
  const builderAggregationOptions: Array<{ id: BuilderAggregation; label: string }> = [
    { id: 'sum', label: 'Suma' },
    { id: 'avg', label: 'Promedio' },
    { id: 'count', label: 'Conteo' },
    { id: 'max', label: 'Máximo' },
    { id: 'min', label: 'Mínimo' },
  ];
  const labelForAggregation = (aggregation: BuilderAggregation) =>
    builderAggregationOptions.find((option) => option.id === aggregation)?.label ?? 'Suma';
  const builderAggregationLabel = labelForAggregation(builderAggregation);
  const buildVisualData = (dimensionField: string, visualMetricField: string, aggregation: BuilderAggregation, limit = 10) => {
    const groups = new Map<string, number[]>();

    filtered.forEach((record) => {
      const name = readAsText(record.source, dimensionField) || 'Sin definir';
      const value = readRawMetric(record.source, visualMetricField);
      groups.set(name, [...(groups.get(name) ?? []), value]);
    });

    return Array.from(groups, ([name, values]) => ({ name, value: aggregateValues(values, aggregation) }))
      .sort((left, right) => right.value - left.value)
      .slice(0, limit);
  };
  const buildVisualLineData = (dimensionField: string, visualMetricField: string, aggregation: BuilderAggregation) => {
    const groups = new Map<number, number[]>();

    filtered.forEach((record) => {
      const dateTime = readRawDate(record.source, dimensionField);
      if (!dateTime) return;
      const date = new Date(dateTime);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const value = readRawMetric(record.source, visualMetricField);
      groups.set(dayStart, [...(groups.get(dayStart) ?? []), value]);
    });

    return Array.from(groups, ([timestamp, values]) => ({
      timestamp,
      name: DATE_FORMATTER.format(new Date(timestamp)),
      value: aggregateValues(values, aggregation),
    })).sort((left, right) => left.timestamp - right.timestamp);
  };
  const saveCurrentVisual = () => {
    if (editingVisualId) {
      setCanvasVisuals((current) => current.map((visual) => visual.id === editingVisualId ? {
        ...visual,
        dimensionField: builderDimensionField,
        metricField: builderMetricField,
        visualType: builderVisualType,
        aggregation: builderAggregation,
        color: builderColor,
        size: builderSize,
      } : visual));
      setEditingVisualId(null);
      return;
    }

    setCanvasVisuals((current) => [
      ...current,
      {
        id: `visual-${Date.now()}`,
        title: `${builderVisualType} de ${builderMetricLabel}`,
        dimensionField: builderDimensionField,
        metricField: builderMetricField,
        visualType: builderVisualType,
        aggregation: builderAggregation,
        color: builderColor,
        size: builderSize,
        pageIds: [activeReportPage.id],
      },
    ].slice(-20));
  };
  const removeCanvasVisual = (id: string) => {
    setCanvasVisuals((current) => current.filter((visual) => visual.id !== id));
  };
  const duplicateCanvasVisual = (visual: SavedCanvasVisual) => {
    setCanvasVisuals((current) => [
      ...current,
      { ...visual, id: `visual-${Date.now()}`, title: `${visual.title ?? 'Visual'} copia` },
    ].slice(-6));
  };
  const renameCanvasVisual = (id: string, title: string) => {
    setCanvasVisuals((current) => current.map((visual) => (visual.id === id ? { ...visual, title } : visual)));
  };
  const moveCanvasVisual = (id: string, direction: -1 | 1) => {
    setCanvasVisuals((current) => {
      const visibleIds = current
        .filter((visual) => !visual.pageIds || visual.pageIds.includes(activeReportPage.id))
        .map((visual) => visual.id);
      const visibleIndex = visibleIds.indexOf(id);
      const targetVisibleIndex = visibleIndex + direction;
      if (visibleIndex < 0 || targetVisibleIndex < 0 || targetVisibleIndex >= visibleIds.length) return current;
      const index = current.findIndex((visual) => visual.id === id);
      const targetIndex = current.findIndex((visual) => visual.id === visibleIds[targetVisibleIndex]);
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };
  const editCanvasVisual = (visual: SavedCanvasVisual) => {
    setBuilderDimensionField(visual.dimensionField);
    setBuilderMetricField(visual.metricField);
    setBuilderVisualType(visual.visualType);
    setBuilderAggregation(visual.aggregation ?? 'sum');
    setBuilderColor(sanitizeVisualColor(visual.color));
    setBuilderSize(isBuilderVisualSize(visual.size) ? visual.size : 'medium');
    setEditingVisualId(visual.id);
  };
  const moveCanvasVisualToIndex = (visualId: string, targetId: string) => {
    if (visualId === targetId) return;
    setCanvasVisuals((current) => {
      const sourceIndex = current.findIndex((visual) => visual.id === visualId);
      const targetIndex = current.findIndex((visual) => visual.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [visual] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, visual);
      return next;
    });
  };
  const toggleVisualOnActivePage = (visualId: string) => {
    setCanvasVisuals((current) => current.map((visual) => {
      if (visual.id !== visualId) return visual;
      const currentPageIds = visual.pageIds ?? reportPages.map((pageItem) => pageItem.id);
      const isVisible = currentPageIds.includes(activeReportPage.id);
      const pageIds = isVisible
        ? currentPageIds.filter((pageId) => pageId !== activeReportPage.id)
        : [...currentPageIds, activeReportPage.id];
      return { ...visual, pageIds };
    }));
  };
  const renderSavedVisual = (visual: SavedCanvasVisual, height = 220) => {
    const visualAggregation = visual.aggregation ?? 'sum';
    const visualData = buildVisualData(visual.dimensionField, visual.metricField, visualAggregation, visual.visualType === 'donut' ? 7 : 10);
    const visualLineData = buildVisualLineData(visual.dimensionField, visual.metricField, visualAggregation);
    const visualFormatMetric = isMetricCurrency(visual.metricField) ? currency.format : compact.format;
    const visualTotal = aggregateValues(filtered.map((record) => readRawMetric(record.source, visual.metricField)), visualAggregation);
    const visualTopItem = visualData[0];

    if (visual.visualType === 'line') {
      return (
        <div role="img" aria-label={`${visual.title ?? 'Gráfico de línea'}. ${visualLineData.length} puntos de datos.`}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={visualLineData} margin={{ left: 8, right: 18, top: 18, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eaf0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => visualFormatMetric(Number(value))} />
            <Line type="monotone" dataKey="value" stroke={sanitizeVisualColor(visual.color)} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
        </div>
      );
    }

    if (visual.visualType === 'area') {
      return (
        <div role="img" aria-label={`${visual.title ?? 'Gráfico de área'}. ${visualLineData.length} puntos de datos.`}>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={visualLineData} margin={{ left: 8, right: 18, top: 18, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eaf0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => visualFormatMetric(Number(value))} />
              <Area type="monotone" dataKey="value" stroke={sanitizeVisualColor(visual.color)} fill={sanitizeVisualColor(visual.color)} fillOpacity={0.22} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (visual.visualType === 'card') {
      return (
        <div className="builder-card-visual builder-card-visual--compact">
          <span>{labelForAggregation(visualAggregation)} de {labelForField(visual.metricField, visual.metricField)}</span>
          <strong>{visualFormatMetric(visualTotal)}</strong>
          <p>{visualTopItem ? `Mayor grupo: ${visualTopItem.name}` : 'Sin datos visibles'}</p>
        </div>
      );
    }

    if (visual.visualType === 'table') {
      return (
        <div className="builder-table-visual builder-table-visual--compact">
          <table>
            <thead>
              <tr><th>{labelForField(visual.dimensionField, visual.dimensionField)}</th><th>{labelForField(visual.metricField, visual.metricField)}</th></tr>
            </thead>
            <tbody>
              {visualData.map((item) => (
                <tr key={item.name}><td>{item.name}</td><td>{visualFormatMetric(item.value)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (visual.visualType === 'donut') {
      return (
        <div role="img" aria-label={`${visual.title ?? 'Gráfico de dona'}. Muestra los ${visualData.length} grupos principales.`}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={visualData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
              {visualData.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? sanitizeVisualColor(visual.color) : chartColors[index % chartColors.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => visualFormatMetric(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        </div>
      );
    }

    return (
      <div role="img" aria-label={`${visual.title ?? 'Gráfico de barras'}. Muestra los ${visualData.length} grupos principales.`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart layout="vertical" data={visualData} margin={{ left: 5, right: 18 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8eaf0" />
          <XAxis type="number" tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={115}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => (String(value).length > 16 ? `${String(value).slice(0, 15)}...` : String(value))}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(value) => visualFormatMetric(Number(value))} />
          <Bar dataKey="value" fill={sanitizeVisualColor(visual.color)} radius={[0, 5, 5, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    );
  };

  const reportSections: Array<{ id: ReportSectionId; label: string; detail: string; icon: ReactNode }> = [
    { id: 'section-summary', label: 'Resumen', detail: 'KPIs', icon: <LayoutDashboard size={15} /> },
    { id: 'section-visuals', label: 'Visuales', detail: 'Gráficos', icon: <BarChart3 size={15} /> },
    { id: 'section-quality', label: 'Calidad', detail: 'Archivo', icon: <FileSpreadsheet size={15} /> },
    { id: 'section-alerts', label: 'Perfil', detail: 'Métrica', icon: <CalendarDays size={15} /> },
    { id: 'section-detail', label: 'Detalle', detail: 'Tabla', icon: <Table2 size={15} /> },
  ];
  const visibleReportPages = reportPages.filter((reportPage) => !reportPage.isHidden);
  const hiddenReportPages = reportPages.filter((reportPage) => reportPage.isHidden);
  const activeReportPage = visibleReportPages.find((reportPage) => reportPage.id === activeReportPageId) ?? visibleReportPages[0] ?? DEFAULT_REPORT_PAGES[0];
  const activePageSectionIds = new Set(activeReportPage.sectionIds);
  const activeReportSections = reportSections.filter((section) => activePageSectionIds.has(section.id));
  const activeCanvasVisuals = canvasVisuals.filter((visual) => !visual.pageIds || visual.pageIds.includes(activeReportPage.id));
  const activePageIndex = visibleReportPages.findIndex((pageItem) => pageItem.id === activeReportPage.id);
  const canvasSlicers = [
    {
      key: 'dimension',
      title: dimensionLabel,
      helper: 'Agrupación principal',
      values: allDimensions,
      selectedValues: filters.requirements,
      onToggle: applyDimensionFilter,
    },
    ...allFilterValues.slice(0, 2).map((group) => ({
      key: group.field,
      title: group.label,
      helper: 'Filtro elegido en el asistente',
      values: group.values,
      selectedValues: filters.fieldValues?.[group.field] ?? [],
      onToggle: (value: string) => toggleDynamicFilter(group.field, value),
    })),
  ];
  const goToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const createReportPage = () => {
    const nextPage: ReportPage = {
      id: createReportPageId(),
      name: `Página ${reportPages.length + 1}`,
      isHidden: false,
      sectionIds: ['section-summary', 'section-visuals', 'section-detail'],
    };
    setReportPages((current) => [...current, nextPage]);
    setActiveReportPageId(nextPage.id);
    setActiveSection(nextPage.sectionIds[0]);
  };

  const duplicateReportPage = () => {
    const nextPage: ReportPage = {
      ...activeReportPage,
      id: createReportPageId(),
      name: `${activeReportPage.name} copia`.slice(0, 38),
      isHidden: false,
    };
    setReportPages((current) => [...current, nextPage]);
    setCanvasVisuals((current) => current.map((visual) => {
      const pageIds = visual.pageIds ?? reportPages.map((pageItem) => pageItem.id);
      return pageIds.includes(activeReportPage.id)
        ? { ...visual, pageIds: [...new Set([...pageIds, nextPage.id])] }
        : visual;
    }));
    setActiveReportPageId(nextPage.id);
    setActiveSection(nextPage.sectionIds[0]);
  };

  const renameReportPage = () => {
    const nextName = window.prompt('Nuevo nombre de la página', activeReportPage.name)?.trim();
    if (!nextName) return;
    setReportPages((current) => current.map((reportPage) => (
      reportPage.id === activeReportPage.id ? { ...reportPage, name: nextName.slice(0, 38) } : reportPage
    )));
  };

  const hideReportPage = (pageId: string) => {
    const nextVisiblePages = reportPages.filter((reportPage) => !reportPage.isHidden && reportPage.id !== pageId);
    if (nextVisiblePages.length === 0) return;

    setReportPages((current) => current.map((reportPage) => {
      if (reportPage.id === pageId) return { ...reportPage, isHidden: true, isDefault: false };
      if (activeReportPage.isDefault && reportPage.id === nextVisiblePages[0].id) return { ...reportPage, isDefault: true };
      return reportPage;
    }));

    if (activeReportPageId === pageId) {
      setActiveReportPageId(nextVisiblePages[0].id);
      setActiveSection(nextVisiblePages[0].sectionIds[0]);
    }
  };

  const restoreReportPage = (pageId: string) => {
    setReportPages((current) => current.map((reportPage) => (
      reportPage.id === pageId ? { ...reportPage, isHidden: false } : reportPage
    )));
    setActiveReportPageId(pageId);
  };

  const setDefaultReportPage = (pageId: string) => {
    setReportPages((current) => current.map((reportPage) => ({
      ...reportPage,
      isDefault: reportPage.id === pageId,
    })));
  };

  const moveReportPage = (pageId: string, direction: -1 | 1) => {
    setReportPages((current) => {
      const visibleIds = current.filter((reportPage) => !reportPage.isHidden).map((reportPage) => reportPage.id);
      const visibleIndex = visibleIds.indexOf(pageId);
      const targetVisibleIndex = visibleIndex + direction;
      if (visibleIndex < 0 || targetVisibleIndex < 0 || targetVisibleIndex >= visibleIds.length) return current;
      const index = current.findIndex((reportPage) => reportPage.id === pageId);
      const targetIndex = current.findIndex((reportPage) => reportPage.id === visibleIds[targetVisibleIndex]);
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const selectReportPage = (reportPage: ReportPage) => {
    setActiveReportPageId(reportPage.id);
    setActiveSection(reportPage.sectionIds[0]);
  };

  const handleReportTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = visibleReportPages.length - 1;
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? lastIndex
        : event.key === 'ArrowRight'
          ? (index + 1) % visibleReportPages.length
          : (index - 1 + visibleReportPages.length) % visibleReportPages.length;
    const nextPage = visibleReportPages[nextIndex];
    selectReportPage(nextPage);
    const buttons = reportTabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  };

  const resetReportPages = () => {
    setReportPages(DEFAULT_REPORT_PAGES);
    setActiveReportPageId(DEFAULT_REPORT_PAGES[0].id);
    setActiveSection(DEFAULT_REPORT_PAGES[0].sectionIds[0]);
  };

  const toggleReportPageSection = (sectionId: ReportSectionId) => {
    setReportPages((current) => current.map((reportPage) => {
      if (reportPage.id !== activeReportPage.id) return reportPage;
      const nextSectionIds = reportPage.sectionIds.includes(sectionId)
        ? reportPage.sectionIds.filter((item) => item !== sectionId)
        : [...reportPage.sectionIds, sectionId];

      return nextSectionIds.length === 0 ? reportPage : { ...reportPage, sectionIds: nextSectionIds };
    }));
  };
  const assignBuilderField = (field: string, target: 'dimension' | 'metric') => {
    const column = visibleDetectedColumns.find((item) => item.normalizedHeader === field);
    if (!column) return;
    if (target === 'metric' && column.kind !== 'number') return;
    if (target === 'dimension') {
      if (['line', 'area'].includes(builderVisualType) && column.kind !== 'date') {
        setBuilderVisualType('bar');
      }
      setBuilderDimensionField(field);
      return;
    }
    setBuilderMetricField(field);
  };
  const resetBuilderVisual = () => {
    window.localStorage.removeItem(BUILDER_STORAGE_KEY);
    setBuilderDimensionField(fieldConfig.dimensionField);
    setBuilderMetricField(fieldConfig.metricField);
    setBuilderVisualType('bar');
    setBuilderAggregation('sum');
    setBuilderColor(chartColors[0]);
    setBuilderSize('medium');
    setEditingVisualId(null);
    setCanvasVisuals([]);
  };
  const handleBuilderDrop = (event: DragEvent<HTMLElement>, target: 'dimension' | 'metric') => {
    event.preventDefault();
    const field = event.dataTransfer.getData('text/plain');
    assignBuilderField(field, target);
  };
  const allowBuilderDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#dashboard-main">Saltar al contenido del informe</a>
      <header className="topbar">
        <button className="mobile-menu" aria-label="Abrir filtros" onClick={() => setSidebarOpen(true)}>
          <Menu />
        </button>
        <Brand />
        <div className="topbar__source">
          <FileSpreadsheet size={18} />
          <div><strong>{result.fileName}</strong><span>{integer.format(result.records.length)} filas · {result.sheetName}</span></div>
        </div>
        <label className="topbar-search">
          <Search size={15} />
          <input
            value={filters.search}
            onChange={(event) => {
              setFilters({ ...filters, search: event.target.value });
              setPage(1);
            }}
            placeholder="Buscar en todo el reporte"
            aria-label="Buscar en todo el reporte"
          />
        </label>
        <button className="secondary-button topbar__docs" aria-label="Abrir documentación" onClick={onOpenDocumentation}><BookOpen size={16} /><span>Documentación</span></button>
        <button className="secondary-button" aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'} onClick={onToggleTheme}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}<span>{theme === 'light' ? 'Oscuro' : 'Claro'}</span></button>
        <button className="secondary-button" aria-label="Editar mapeo" onClick={onReconfigure}><Settings2 size={16} /><span>Editar mapeo</span></button>
        <button className="secondary-button" aria-label="Cambiar archivo" onClick={onReset}><RefreshCw size={16} /><span>Cambiar archivo</span></button>
      </header>
      <div className="workspace">
        {sidebarOpen && <button className="sidebar-backdrop" aria-label="Cerrar filtros" onClick={() => setSidebarOpen(false)} />}
        <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Filtros del informe">
          <div className="sidebar__head"><strong><Filter size={17} /> Filtros</strong><button type="button" aria-label="Cerrar filtros" onClick={() => setSidebarOpen(false)}><PanelLeftClose /></button></div>
          <label className="search-box">
            <Search size={16} />
            <input
              value={filters.search}
              onChange={(event) => {
                setFilters({ ...filters, search: event.target.value });
                setPage(1);
              }}
              placeholder="Buscar en descripción o código"
              aria-label="Buscar en los datos"
            />
          </label>
          <FilterGroup title="Opciones de tabla">
            <div className="table-view-presets" aria-label="Atajos de columnas de tabla">
              <button
                type="button"
                onClick={() => setVisibleColumns({ description: true, supplier: true, secondary: true, date: true })}
              >
                Vista completa
              </button>
              <button
                type="button"
                onClick={() => setVisibleColumns({ description: false, supplier: false, secondary: false, date: false })}
              >
                Vista mínima
              </button>
            </div>
            <label className="check-filter">
              <input
                type="checkbox"
                checked={visibleColumns.description}
                onChange={() => setVisibleColumns((current) => ({ ...current, description: !current.description }))}
              />
              <span className="custom-check" />
              <span>Mostrar descripción</span>
            </label>
            <label className="check-filter">
              <input
                type="checkbox"
                checked={visibleColumns.supplier}
                disabled={!hasSupplierColumn}
                onChange={() => setVisibleColumns((current) => ({ ...current, supplier: !current.supplier }))}
              />
              <span className="custom-check" />
              <span>Mostrar filtro destacado</span>
            </label>
            <label className="check-filter">
              <input
                type="checkbox"
                checked={visibleColumns.secondary}
                disabled={!hasSecondaryFilterColumn}
                onChange={() => setVisibleColumns((current) => ({ ...current, secondary: !current.secondary }))}
              />
              <span className="custom-check" />
              <span>Mostrar filtro adicional</span>
            </label>
            <label className="check-filter">
              <input
                type="checkbox"
                checked={visibleColumns.date}
                disabled={!hasDateColumn}
                onChange={() => setVisibleColumns((current) => ({ ...current, date: !current.date }))}
              />
              <span className="custom-check" />
              <span>Mostrar fecha (si existe)</span>
            </label>
          </FilterGroup>
          <FilterGroup title="Rangos">
            <div className="range-filter-grid">
              <label>
                <span>{metricLabel} mínimo</span>
                <input
                  type="number"
                  value={filters.metricMin ?? ''}
                  onChange={(event) => updateMetricRange('metricMin', event.target.value)}
                  placeholder="Sin mínimo"
                />
              </label>
              <label>
                <span>{metricLabel} máximo</span>
                <input
                  type="number"
                  value={filters.metricMax ?? ''}
                  onChange={(event) => updateMetricRange('metricMax', event.target.value)}
                  placeholder="Sin máximo"
                />
              </label>
              {hasDateColumn && (
                <>
                  <label>
                    <span>{dateLabel} desde</span>
                    <input
                      type="date"
                      value={toDateInputValue(filters.dateFrom)}
                      onChange={(event) => updateDateRange('dateFrom', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>{dateLabel} hasta</span>
                    <input
                      type="date"
                      value={toDateInputValue(filters.dateTo)}
                      onChange={(event) => updateDateRange('dateTo', event.target.value)}
                    />
                  </label>
                </>
              )}
              {activeRangeCount > 0 && (
                <button
                  type="button"
                  className="filter-clear-group"
                  onClick={() => setFilters((current) => ({
                    ...current,
                    metricMin: undefined,
                    metricMax: undefined,
                    dateFrom: undefined,
                    dateTo: undefined,
                  }))}
                >
                  Limpiar rangos
                </button>
              )}
            </div>
          </FilterGroup>
          <FilterGroup title="Agrupación principal">
            <FilterOptionList
              values={allDimensions}
              selectedValues={filters.requirements}
              color={chartColors[0]}
              onToggle={(name) => toggle('requirements', name)}
              onClear={() => setFilters((current) => ({ ...current, requirements: [] }))}
            />
          </FilterGroup>
          {allFilterValues.map((group) => (
            <FilterGroup key={group.field} title={group.label}>
              <FilterOptionList
                values={group.values}
                selectedValues={filters.fieldValues?.[group.field] ?? []}
                onToggle={(name) => toggleDynamicFilter(group.field, name)}
                onClear={() => setFilters((current) => ({
                  ...current,
                  fieldValues: { ...(current.fieldValues ?? {}), [group.field]: [] },
                }))}
              />
            </FilterGroup>
          ))}
          <button className="clear-button" onClick={clearFilters} disabled={!activeCount}><X size={15} /> Limpiar filtros {activeCount > 0 && `(${activeCount})`}</button>
        </aside>
        <main id="dashboard-main" className="dashboard" tabIndex={-1}>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {activeCount > 0
              ? `${filtered.length} de ${result.records.length} registros visibles con ${activeCount} filtros activos.`
              : `${result.records.length} registros visibles sin filtros.`}
          </div>
          <div className="dashboard__title">
            <div><span className="section-label">PANEL DINÁMICO</span><h1>Dashboard configurado con tus campos</h1><p>Mapeo aplicado desde la pantalla anterior</p></div>
            <button className="export-button" onClick={() => downloadCsv<DashboardAnalyticsRow>(filtered, result.fileName, exportColumns)}>
              <Download size={17} /> Exportar CSV
            </button>
          </div>

          {showImportNotice && result.issues.length > 0 && <div className="notice" role="status"><AlertTriangle size={17} aria-hidden="true" /><span>{result.issues[0].message}</span><strong>{result.rejectedRows ? `${result.rejectedRows} rechazadas` : 'Importación segura'}</strong></div>}
          {activeCount > 0 && <div className="active-filters" role="status"><Filter size={14} aria-hidden="true" /> Mostrando {integer.format(filtered.length)} de {integer.format(result.records.length)} registros <button onClick={clearFilters}>Ver todo</button></div>}
          {activeFilterChips.length > 0 && (
            <section className="active-filter-chips" aria-label="Filtros activos">
              {activeFilterChips.map((chip) => (
                <button key={chip.id} className="active-filter-chip" aria-label={`Quitar filtro ${chip.label}`} onClick={() => removeChip(chip)}>
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              <button className="clear-chip-link" onClick={clearFilters}>Limpiar todo</button>
            </section>
          )}

          <section className="report-pages" aria-label="Páginas del informe">
            <div className="report-pages__header">
              <div>
                <span className="section-label">PÁGINAS DEL INFORME</span>
                <strong>{activeReportPage.name}</strong>
                <p>Cada página puede tener sus propias secciones visibles.</p>
              </div>
              <div className="report-pages__actions">
                <button type="button" onClick={createReportPage}><Plus size={13} /> Nueva</button>
                <button type="button" onClick={duplicateReportPage}><Copy size={13} /> Duplicar</button>
                <button type="button" onClick={renameReportPage}><Pencil size={13} /> Renombrar</button>
                <button type="button" onClick={() => moveReportPage(activeReportPage.id, -1)} disabled={activePageIndex <= 0} aria-label="Mover página a la izquierda">← Mover</button>
                <button type="button" onClick={() => moveReportPage(activeReportPage.id, 1)} disabled={activePageIndex >= visibleReportPages.length - 1} aria-label="Mover página a la derecha">Mover →</button>
                <button type="button" onClick={() => setDefaultReportPage(activeReportPage.id)} disabled={activeReportPage.isDefault}>{activeReportPage.isDefault ? 'Página inicial' : 'Usar como inicial'}</button>
                <button type="button" onClick={() => hideReportPage(activeReportPage.id)} disabled={visibleReportPages.length <= 1}><EyeOff size={13} /> Ocultar</button>
                <button type="button" onClick={resetReportPages}>Restablecer</button>
              </div>
            </div>
            <div ref={reportTabsRef} className="report-pages__tabs" role="tablist" aria-label="Seleccionar página del informe">
              {visibleReportPages.map((reportPage, index) => (
                <button
                  key={reportPage.id}
                  type="button"
                  role="tab"
                  aria-selected={reportPage.id === activeReportPage.id}
                  aria-controls="report-page-panel"
                  tabIndex={reportPage.id === activeReportPage.id ? 0 : -1}
                  className={reportPage.id === activeReportPage.id ? 'is-active' : ''}
                  onClick={() => selectReportPage(reportPage)}
                  onKeyDown={(event) => handleReportTabKeyDown(event, index)}
                >
                  {reportPage.name}
                  <small>{reportPage.sectionIds.length} secciones{reportPage.isDefault ? ' · inicial' : ''}</small>
                </button>
              ))}
            </div>
            <div className="report-pages__sections" aria-label="Secciones visibles en esta página">
              <span>Contenido:</span>
              {reportSections.map((section) => (
                <label key={section.id}>
                  <input
                    type="checkbox"
                    checked={activePageSectionIds.has(section.id)}
                    onChange={() => toggleReportPageSection(section.id)}
                  />
                  {section.label}
                </label>
              ))}
            </div>
            {hiddenReportPages.length > 0 && (
              <div className="report-pages__hidden">
                <span>Páginas ocultas:</span>
                {hiddenReportPages.map((reportPage) => (
                  <button key={reportPage.id} type="button" onClick={() => restoreReportPage(reportPage.id)}>
                    Restaurar {reportPage.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <nav className="report-tabs" aria-label="Navegación del reporte">
            {activeReportSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? 'is-active' : ''}
                aria-current={activeSection === section.id ? 'location' : undefined}
                onClick={() => goToSection(section.id)}
              >
                {section.icon}
                <span>{section.label}</span>
                <small>{section.detail}</small>
              </button>
            ))}
          </nav>

          <div id="report-page-panel" role="tabpanel" aria-label={`Contenido de ${activeReportPage.name}`}>

          <section className="slicer-strip" aria-label="Segmentadores rápidos">
            {canvasSlicers.map((slicer) => (
              <SlicerCard
                key={slicer.key}
                title={slicer.title}
                helper={slicer.helper}
                values={slicer.values}
                selectedValues={slicer.selectedValues}
                onToggle={slicer.onToggle}
              />
            ))}
          </section>

          {activePageSectionIds.has('section-summary') && (
          <section id="section-summary" className="kpi-grid report-section-anchor" aria-label="Indicadores principales">
            <KpiCard icon={<TrendingUp />} label="Registros visibles" value={integer.format(filtered.length)} detail={`${integer.format(result.records.length)} total`} tone="blue" />
            <KpiCard icon={<TrendingUp />} label={`Suma ${metricLabel}`} value={formatMetric(metricTotal)} detail="Base de la selección" tone="orange" />
            <KpiCard icon={<TrendingUp />} label={`Promedio ${metricLabel}`} value={formatMetric(metricAverage)} detail="Valor por registro" tone="purple" />
            <KpiCard icon={<TrendingUp />} label={`Máximo ${metricLabel}`} value={formatMetric(metricMax)} detail="Valor alto" tone="red" />
          </section>
          )}

          {activePageSectionIds.has('section-visuals') && (
          <>
          <section id="section-visuals" className="visual-grid report-section-anchor">
            <article className="panel panel--requirements">
              <PanelTitle title={`Agrupación por ${dimensionLabel}`} subtitle="Suma de métrica por grupo" />
              <p className="sr-only">Gráfico de barras con los diez grupos principales. El grupo con mayor valor es {dimensionGroups[0]?.name ?? 'ninguno'}.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  layout="vertical"
                  data={dimensionGroups.slice(0, 10)}
                  margin={{ left: 5, right: 18 }}
                  onClick={(event: unknown) => {
                    const clicked = event as { activePayload?: Array<{ payload?: { name?: unknown } }> };
                    if (clicked.activePayload?.[0]?.payload?.name) {
                      applyDimensionFilter(String(clicked.activePayload[0].payload.name));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8eaf0" />
                  <XAxis type="number" tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 15)}...` : value)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => formatMetric(Number(value))} />
                  <Bar dataKey="value" fill={chartColors[0]} radius={[0, 5, 5, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </article>
            <article className="panel panel--suppliers">
              <PanelTitle title={rankingTitle} subtitle={rankingSubtitle} />
              <p className="sr-only">Ranking en barras. El primer grupo es {rankingData[0]?.name ?? 'ninguno'}.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  layout="vertical"
                  data={rankingData.slice(0, 10)}
                  margin={{ left: 5, right: 18 }}
                  onClick={(event: unknown) => {
                    const clicked = event as { activePayload?: Array<{ payload?: { name?: unknown } }> };
                    const clickedName = clicked.activePayload?.[0]?.payload?.name;
                    if (!clickedName) return;
                    if (rankingUsesSupplier) {
                      applySupplierFilter(String(clickedName));
                    } else if (rankingUsesSecondary) {
                      applySecondaryFilter(String(clickedName));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8eaf0" />
                  <XAxis type="number" tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 15)}...` : value)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => formatMetric(Number(value))} />
                  <Bar dataKey="value" fill={chartColors[2]} radius={[0, 5, 5, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </article>
            <article className="panel panel--donut">
              <PanelTitle title="Participación por grupo" subtitle={`Distribución de ${metricLabel} en los principales grupos`} />
              <p className="sr-only">Gráfico de dona con la participación de los siete grupos principales.</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={dimensionGroups.slice(0, 7)} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                    {dimensionGroups.slice(0, 7).map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMetric(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </article>
          </section>

          <section className="visual-builder">
            <article className="panel builder-panel">
              <PanelTitle
                title="Constructor visual sencillo"
                subtitle="Arrastra campos desde el panel derecho o usa los botones Eje / Valor. La configuración se recuerda en este navegador."
                action={<span className="table-badge"><BarChart3 size={13} /> Visual editable</span>}
              />
              <div className="builder-panel__body">
                <div className="builder-dropzones">
                  <button
                    type="button"
                    className="builder-dropzone"
                    onDragOver={allowBuilderDrop}
                    onDrop={(event) => handleBuilderDrop(event, 'dimension')}
                  >
                    <span>Eje / categoría</span>
                    <strong>{builderDimensionLabel}</strong>
                    <small>Texto, fecha o código para agrupar</small>
                  </button>
                  <button
                    type="button"
                    className="builder-dropzone"
                    onDragOver={allowBuilderDrop}
                    onDrop={(event) => handleBuilderDrop(event, 'metric')}
                  >
                    <span>Valor / métrica</span>
                    <strong>{builderMetricLabel}</strong>
                    <small>Solo columnas numéricas</small>
                  </button>
                </div>
                <div className="builder-chart">
                  <div className="builder-visual-types" aria-label="Tipo de visual">
                    {builderVisualOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={builderVisualType === option.id ? 'is-active' : ''}
                        aria-pressed={builderVisualType === option.id}
                        disabled={option.disabled}
                        title={option.title}
                        onClick={() => {
                          if (!option.disabled) {
                            setBuilderVisualType(option.id);
                          }
                        }}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                    <label className="builder-aggregation-select">
                      Agregación
                      <select value={builderAggregation} onChange={(event) => setBuilderAggregation(event.target.value as BuilderAggregation)}>
                        {builderAggregationOptions.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="builder-property-select">
                      Tamaño
                      <select value={builderSize} onChange={(event) => setBuilderSize(event.target.value as BuilderVisualSize)}>
                        <option value="small">Pequeño</option>
                        <option value="medium">Mediano</option>
                        <option value="large">Grande</option>
                      </select>
                    </label>
                    <label className="builder-color-picker">
                      Color
                      <input type="color" value={builderColor} onChange={(event) => setBuilderColor(event.target.value)} aria-label="Color principal del visual" />
                    </label>
                    <button type="button" className="builder-reset-button" onClick={resetBuilderVisual}>
                      <RefreshCw size={14} />
                      Restablecer
                    </button>
                    <button type="button" className="builder-add-button" onClick={saveCurrentVisual}>
                      <Plus size={14} />
                      {editingVisualId ? 'Guardar cambios' : 'Agregar a esta página'}
                    </button>
                    {editingVisualId && <button type="button" onClick={() => setEditingVisualId(null)}>Cancelar edición</button>}
                  </div>
                  {builderVisualType === 'bar' && (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart layout="vertical" data={builderData} margin={{ left: 5, right: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8eaf0" />
                        <XAxis type="number" tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={135}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => (String(value).length > 18 ? `${String(value).slice(0, 17)}...` : String(value))}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(value) => builderFormatMetric(Number(value))} />
                        <Bar dataKey="value" fill={builderColor} radius={[0, 5, 5, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {builderVisualType === 'line' && (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={builderLineData} margin={{ left: 8, right: 18, top: 18, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eaf0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => builderFormatMetric(Number(value))} />
                        <Line type="monotone" dataKey="value" stroke={builderColor} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {builderVisualType === 'area' && (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={builderLineData} margin={{ left: 8, right: 18, top: 18, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eaf0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(value) => compact.format(Number(value))} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => builderFormatMetric(Number(value))} />
                        <Area type="monotone" dataKey="value" stroke={builderColor} fill={builderColor} fillOpacity={0.22} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {builderVisualType === 'card' && (
                    <div className="builder-card-visual">
                      <span>{builderAggregationLabel} de {builderMetricLabel}</span>
                      <strong>{builderFormatMetric(builderTotal)}</strong>
                      <p>{builderTopItem ? `Mayor grupo: ${builderTopItem.name} (${builderFormatMetric(builderTopItem.value)})` : 'Sin datos visibles'}</p>
                    </div>
                  )}
                  {builderVisualType === 'table' && (
                    <div className="builder-table-visual">
                      <table>
                        <thead>
                          <tr><th>{builderDimensionLabel}</th><th>{builderMetricLabel}</th></tr>
                        </thead>
                        <tbody>
                          {builderData.map((item) => (
                            <tr key={item.name}><td>{item.name}</td><td>{builderFormatMetric(item.value)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {builderVisualType === 'donut' && (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={builderData.slice(0, 7)} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                          {builderData.slice(0, 7).map((entry, index) => (
                            <Cell key={entry.name} fill={index === 0 ? builderColor : chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => builderFormatMetric(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <section className="builder-canvas" aria-label="Lienzo de visuales guardados">
                <header>
                  <div>
                    <strong>Lienzo del reporte</strong>
                    <p>{activeCanvasVisuals.length > 0 ? `${activeCanvasVisuals.length} visuales en ${activeReportPage.name}` : 'Agrega visuales para construir esta página.'}</p>
                  </div>
                  {activeCanvasVisuals.length > 0 && (
                    <button type="button" onClick={() => activeCanvasVisuals.forEach((visual) => toggleVisualOnActivePage(visual.id))}>
                      <Trash2 size={13} />
                      Vaciar esta página
                    </button>
                  )}
                </header>
                {activeCanvasVisuals.length > 0 ? (
                  <div className="builder-canvas-grid">
                    {activeCanvasVisuals.map((visual, index) => (
                      <article
                        key={visual.id}
                        className={`builder-canvas-card builder-canvas-card--${visual.size ?? 'medium'}`}
                        draggable
                        onDragStart={(event) => {
                          setDraggedVisualId(visual.id);
                          event.dataTransfer.setData('text/smartbi-visual', visual.id);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const sourceId = event.dataTransfer.getData('text/smartbi-visual') || draggedVisualId;
                          if (sourceId) moveCanvasVisualToIndex(sourceId, visual.id);
                          setDraggedVisualId(null);
                        }}
                        onDragEnd={() => setDraggedVisualId(null)}
                      >
                        <header>
                          <div>
                            <span>{visual.visualType}</span>
                            <label className="sr-only" htmlFor={`visual-title-${visual.id}`}>Título del visual</label>
                            <input
                              id={`visual-title-${visual.id}`}
                              className="builder-visual-title-input"
                              value={visual.title ?? ''}
                              onChange={(event) => renameCanvasVisual(visual.id, event.target.value)}
                              placeholder="Título del visual"
                            />
                            <small>{visual.aggregation ?? 'sum'} de {labelForField(visual.metricField, visual.metricField)}</small>
                            <small>{labelForField(visual.dimensionField, visual.dimensionField)}</small>
                          </div>
                          <div>
                            <button type="button" aria-label={`Mover ${visual.title ?? 'visual'} hacia arriba`} disabled={index === 0} onClick={() => moveCanvasVisual(visual.id, -1)}>↑</button>
                            <button type="button" aria-label={`Mover ${visual.title ?? 'visual'} hacia abajo`} disabled={index === activeCanvasVisuals.length - 1} onClick={() => moveCanvasVisual(visual.id, 1)}>↓</button>
                            <button type="button" onClick={() => editCanvasVisual(visual)}>Propiedades</button>
                            <button type="button" onClick={() => duplicateCanvasVisual(visual)}>Duplicar</button>
                            <button type="button" onClick={() => toggleVisualOnActivePage(visual.id)}>Quitar de página</button>
                            <button type="button" aria-label={`Eliminar ${visual.title ?? 'visual'} de todas las páginas`} onClick={() => removeCanvasVisual(visual.id)}><X size={13} /></button>
                          </div>
                        </header>
                        {renderSavedVisual(visual, visual.size === 'large' ? 300 : visual.size === 'small' ? 180 : 220)}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="builder-canvas-empty">
                    <BarChart3 size={18} />
                    <p>Elige tipo de visual, eje, valor y propiedades. Luego agrégalo a esta página.</p>
                  </div>
                )}
              </section>
            </article>
          </section>
          </>
          )}

          {activePageSectionIds.has('section-quality') && (
          <section id="section-quality" className="quality-panel report-section-anchor">
            <article className="panel">
              <PanelTitle
                title="Calidad del archivo importado"
                subtitle="Resumen de lectura, columnas y advertencias antes de tomar decisiones"
                action={<button className="table-badge table-badge--button" onClick={() => downloadCsv<QualityReportRow>(qualityReportRows, result.fileName, qualityExportColumns, 'calidad')}><Download size={13} /> Exportar calidad</button>}
              />
              <div className="quality-grid">
                <article className="quality-card">
                  <span>Filas leídas</span>
                  <strong>{integer.format(result.totalRows)}</strong>
                  <small>{integer.format(result.records.length)} válidas</small>
                </article>
                <article className={`quality-card${qualityErrors > 0 ? ' quality-card--danger' : ''}`}>
                  <span>Filas rechazadas</span>
                  <strong>{integer.format(result.rejectedRows)}</strong>
                  <small>{qualityErrors > 0 ? 'Revisar archivo' : 'Sin errores críticos'}</small>
                </article>
                <article className="quality-card">
                  <span>Columnas incluidas</span>
                  <strong>{integer.format(visibleDetectedColumns.length)}</strong>
                  <small>{integer.format(safeDetectedColumns.length)} detectadas</small>
                </article>
                <article className={`quality-card${qualityWarnings > 0 ? ' quality-card--warning' : ''}`}>
                  <span>Advertencias</span>
                  <strong>{integer.format(qualityWarnings)}</strong>
                  <small>{ignoredColumns.length > 0 ? `${integer.format(ignoredColumns.length)} columnas ignoradas` : 'Sin columnas ignoradas'}</small>
                </article>
              </div>
              <div className="data-profile-summary">
                <article>
                  <span>Métricas sugeridas</span>
                  <strong>{integer.format(recommendedMetrics)}</strong>
                </article>
                <article>
                  <span>Filtros sugeridos</span>
                  <strong>{integer.format(recommendedFilters)}</strong>
                </article>
                <article>
                  <span>Agrupaciones sugeridas</span>
                  <strong>{integer.format(recommendedGroups)}</strong>
                </article>
              </div>
              <div className="data-profile-table">
                <header>
                  <h3>Perfil de datos del Excel</h3>
                  <p>{profileIsWorking ? 'Analizando columnas en segundo plano…' : 'Primeras columnas detectadas con vacíos, valores únicos y uso recomendado.'}</p>
                </header>
                <div>
                  <table aria-busy={profileIsWorking}>
                    <caption className="sr-only">Perfil de columnas del Excel, con tipo, valores únicos, vacíos y recomendación de uso.</caption>
                    <thead>
                      <tr>
                        <th>Columna</th>
                        <th>Tipo</th>
                        <th>Únicos</th>
                        <th>Vacíos</th>
                        <th>Recomendación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataProfileRows.slice(0, 12).map((row) => (
                        <tr key={row.field}>
                          <td><strong>{row.header}</strong><small>{row.field}</small></td>
                          <td>{row.kind}</td>
                          <td>{integer.format(row.uniqueCount)}</td>
                          <td>{row.emptyPercent}%</td>
                          <td><span>{row.recommendation}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="quality-details">
                <div>
                  <h3>Columnas ignoradas por decisión del usuario</h3>
                  {ignoredColumns.length > 0 ? (
                    <div className="quality-tags">
                      {ignoredColumns.slice(0, 18).map((column) => <span key={column.normalizedHeader}>{column.header}</span>)}
                      {ignoredColumns.length > 18 && <span>+{ignoredColumns.length - 18} más</span>}
                    </div>
                  ) : <p>Todas las columnas útiles están incluidas.</p>}
                </div>
                <div>
                  <h3>Mensajes de importación</h3>
                  {result.issues.length > 0 ? (
                    <ul>
                      {result.issues.slice(0, 5).map((issue, index) => (
                        <li key={`${issue.message}-${index}`}>{issue.message}</li>
                      ))}
                    </ul>
                  ) : <p>No se encontraron advertencias durante la importación.</p>}
                </div>
              </div>
            </article>
          </section>
          )}

          {activePageSectionIds.has('section-alerts') && (
          <section id="section-alerts" className="alert-grid report-section-anchor">
            <article className="panel">
              <PanelTitle title="Perfil de la métrica" subtitle={`Distribución básica de ${metricLabel} en los registros visibles`} />
              <div className="alert-grid__content">
                <article className="alert-card">
                  <div>
                    <h3><CalendarDays size={16} /> Valores positivos</h3>
                    <p>{integer.format(positiveMetricRows)} filas</p>
                  </div>
                  <div className="alert-card__meta">
                    <span>Mayor que cero</span>
                    <strong>{compact.format(positiveMetricRows)}</strong>
                  </div>
                </article>
                <article className="alert-card">
                  <div>
                    <h3>Valores en cero</h3>
                    <p>{integer.format(zeroMetricRows)} filas</p>
                  </div>
                  <div className="alert-card__meta">
                    <span>Igual a cero</span>
                    <strong>{compact.format(zeroMetricRows)}</strong>
                  </div>
                </article>
                <article className="alert-card alert-card--total">
                  <div>
                    <h3>Valores negativos</h3>
                    <p>{integer.format(negativeMetricRows)} filas</p>
                  </div>
                  <span className={negativeMetricRows > 0 ? 'status-chip status-chip--danger' : 'status-chip'}>
                    {negativeMetricRows > 0 ? 'Revisar signo' : 'Sin negativos'}
                  </span>
                </article>
              </div>
            </article>
          </section>
          )}

          {activePageSectionIds.has('section-detail') && (
          <article id="section-detail" className="panel table-panel report-section-anchor">
            <PanelTitle
              title="Detalle filtrado"
              subtitle={`${integer.format(visibleRows.length)} registros visibles de ${integer.format(filtered.length)} filtrados`}
              action={<button className="table-badge table-badge--button" onClick={() => downloadCsv<DashboardAnalyticsRow>(visibleRows, result.fileName, exportColumns, 'tabla')}><Download size={13} /> Exportar tabla</button>}
            />
            <div className="table-toolbar">
              <label className="table-search">
                <Search size={14} />
                <input
                  value={tableQuery}
                  onChange={(event) => {
                    setTableQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar solo en la tabla"
                />
              </label>
              <label className="table-page-size">
                Filas por página
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                    setTableScrollTop(0);
                    tableScrollRef.current?.scrollTo({ top: 0 });
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </label>
              {tableQuery && <button type="button" className="table-clear-button" onClick={() => setTableQuery('')}>Limpiar búsqueda</button>}
            </div>
            <div ref={tableScrollRef} className="table-scroll" onScroll={(event) => setTableScrollTop(event.currentTarget.scrollTop)}>
              <table>
                <caption className="sr-only">Detalle de registros filtrados. Usa los botones de los encabezados para ordenar las columnas.</caption>
                <thead>
                  <tr>
                    <th aria-sort={sort.field === 'dimension' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="table-sort-button" onClick={() => toggleSort('dimension')} aria-label={`Ordenar por ${dimensionLabel}`}>{dimensionLabel} {sortIndicator('dimension')}</button></th>
                    {visibleColumns.description && <th aria-sort={sort.field === 'description' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="table-sort-button" onClick={() => toggleSort('description')} aria-label="Ordenar por descripción">Descripción {sortIndicator('description')}</button></th>}
                    {hasSupplierColumn && visibleColumns.supplier && <th aria-sort={sort.field === 'supplier' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="table-sort-button" onClick={() => toggleSort('supplier')} aria-label={`Ordenar por ${supplierLabel}`}>{supplierLabel} {sortIndicator('supplier')}</button></th>}
                    {hasSecondaryFilterColumn && visibleColumns.secondary && <th aria-sort={sort.field === 'secondary' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="table-sort-button" onClick={() => toggleSort('secondary')} aria-label={`Ordenar por ${secondaryFilterLabel}`}>{secondaryFilterLabel} {sortIndicator('secondary')}</button></th>}
                    <th className="number" aria-sort={sort.field === 'metric' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="table-sort-button" onClick={() => toggleSort('metric')} aria-label="Ordenar por métrica">{metricLabel} {sortIndicator('metric')}</button></th>
                    {dateField && visibleColumns.date && <th aria-sort={sort.field === 'date' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="table-sort-button" onClick={() => toggleSort('date')} aria-label="Ordenar por fecha">Fecha {sortIndicator('date')}</button></th>}
                  </tr>
                </thead>
                <tbody>
                  {virtualTopSpacer > 0 && <tr aria-hidden="true"><td colSpan={visibleTableColumnCount} style={{ height: virtualTopSpacer, padding: 0, border: 0 }} /></tr>}
                  {renderedTableRows.map((record) => {
                    const dimension = record.dimension || 'Sin definir';
                    const description = record.description || 'Sin nombre';
                    const supplier = record.supplier || 'Sin definir';
                    const secondaryValue = record.secondaryValue || 'Sin definir';
                    const value = readRawMetric(record.source, metricField);
                    const dateTime = dateField ? readRawDate(record.source, dateField) : 0;
                    const date = dateTime ? new Date(dateTime) : null;
                    return (
                      <tr key={record.id}>
                        <td><strong>{dimension}</strong></td>
                        {visibleColumns.description && <td>{description || 'Sin nombre'}</td>}
                        {hasSupplierColumn && visibleColumns.supplier && <td>{supplier}</td>}
                        {hasSecondaryFilterColumn && visibleColumns.secondary && <td>{secondaryValue}</td>}
                        <td className="number">{formatMetric(value)}</td>
                        {dateField && visibleColumns.date && <td>{date ? DATE_FORMATTER.format(date) : 'Sin fecha'}</td>}
                      </tr>
                    );
                  })}
                  {virtualBottomSpacer > 0 && <tr aria-hidden="true"><td colSpan={visibleTableColumnCount} style={{ height: virtualBottomSpacer, padding: 0, border: 0 }} /></tr>}
                </tbody>
              </table>
            </div>
            <div className="pagination"><span>Página {currentPage} de {pageCount} · {integer.format(rowsForCurrentPage.length)} filas en el lote{shouldVirtualizeTable ? ' · renderizado optimizado' : ''}</span><div><button disabled={currentPage === 1} onClick={() => { setPage((value) => value - 1); setTableScrollTop(0); tableScrollRef.current?.scrollTo({ top: 0 }); }}>Anterior</button><button disabled={currentPage === pageCount} onClick={() => { setPage((value) => value + 1); setTableScrollTop(0); tableScrollRef.current?.scrollTo({ top: 0 }); }}>Siguiente</button></div></div>
          </article>
          )}
          </div>
        </main>
        <aside className="fields-pane" aria-label="Campos detectados del archivo">
          <header className="fields-pane__header">
            <span><Columns3 size={15} /> Campos</span>
            <strong>{visibleDetectedColumns.length}</strong>
          </header>
          <div className="fields-pane__mapping">
            <small>Configuración actual</small>
            <p><strong>{dimensionLabel}</strong> agrupa el reporte.</p>
            <p><strong>{metricLabel}</strong> alimenta los cálculos.</p>
            {selectedFilterFields.length > 0 && <p><strong>{selectedFilterFields.length}</strong> campos están disponibles como filtros.</p>}
          </div>
          <div className="fields-list">
            {visibleDetectedColumns.map((column) => {
              const roles = usedFieldRoles.get(column.normalizedHeader) ?? [];
              return (
                <article
                  key={column.normalizedHeader}
                  className={`field-item${roles.length > 0 ? ' is-used' : ''}`}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', column.normalizedHeader)}
                >
                  <div>
                    <strong title={column.header}>{column.header}</strong>
                    <small>{column.normalizedHeader}</small>
                  </div>
                  <span className={`field-kind field-kind--${column.kind}`}>{column.kind}</span>
                  {roles.length > 0 && <em>{roles.join(' · ')}</em>}
                  <div className="field-item__actions">
                    <button type="button" onClick={() => assignBuilderField(column.normalizedHeader, 'dimension')}>Eje</button>
                    <button type="button" disabled={column.kind !== 'number'} onClick={() => assignBuilderField(column.normalizedHeader, 'metric')}>Valor</button>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="filter-group">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{title}</span>
        <ChevronDown size={15} />
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}

function FilterOptionList({
  values,
  selectedValues,
  color,
  onToggle,
  onClear,
}: {
  values: string[];
  selectedValues: string[];
  color?: string;
  onToggle: (value: string) => void;
  onClear?: () => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const visibleValues = normalizedQuery
    ? values.filter((value) => value.toLocaleLowerCase('es').includes(normalizedQuery))
    : values;

  return (
    <div className="filter-options">
      <label className="filter-search">
        <Search size={13} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar opciones" />
      </label>
      {selectedValues.length > 0 && (
        <button type="button" className="filter-clear-group" onClick={onClear}>
          Limpiar selección ({selectedValues.length})
        </button>
      )}
      <div className="filter-list">
        {visibleValues.map((name) => (
          <CheckFilter key={name} label={name} checked={selectedValues.includes(name)} color={color} onChange={() => onToggle(name)} />
        ))}
        {visibleValues.length === 0 && <p className="filter-empty">Sin coincidencias.</p>}
      </div>
    </div>
  );
}

function SlicerCard({
  title,
  helper,
  values,
  selectedValues,
  onToggle,
}: {
  title: string;
  helper: string;
  values: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  const visibleValues = values.slice(0, 8);
  return (
    <article className="slicer-card">
      <header>
        <div>
          <strong>{title}</strong>
          <small>{helper}</small>
        </div>
        <span>{integer.format(values.length)}</span>
      </header>
      <div className="slicer-card__options">
        {visibleValues.map((value) => (
          <button
            key={value}
            type="button"
            className={selectedValues.includes(value) ? 'is-selected' : ''}
            onClick={() => onToggle(value)}
            title={value}
          >
            {value}
          </button>
        ))}
        {visibleValues.length === 0 && <p>Sin opciones.</p>}
      </div>
    </article>
  );
}

function CheckFilter({ label, checked, color, onChange }: { label: string; checked: boolean; color?: string; onChange: () => void }) {
  return <label className="check-filter"><input type="checkbox" checked={checked} onChange={onChange} /><span className="custom-check" />{color && <i style={{ background: color }} />}<span title={label}>{label}</span></label>;
}

function KpiCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className={`kpi-card kpi-card--${tone}`}><div className="kpi-card__top"><span>{icon}</span><em>Vista actual</em></div><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>;
}

function PanelTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <header className="panel__title"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</header>;
}
