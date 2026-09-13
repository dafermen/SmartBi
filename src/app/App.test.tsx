import { render, screen } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DataRecord, DetectedColumn, ImportResult } from '../domain/types';
import { App } from './App';

const mockImportExcel = vi.fn();

vi.mock('../features/import/excelImporter', () => ({
  importExcel: mockImportExcel,
}));

vi.mock('recharts', () => ({
  Area: ({ children }: { children?: ReactNode }) => <>{children}</>,
  AreaChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children: ReactNode }) => <>{children}</>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Cell: ({ children }: { children?: ReactNode }) => <>{children}</>,
  CartesianGrid: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Line: ({ children }: { children?: ReactNode }) => <>{children}</>,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children?: ReactNode }) => <>{children}</>,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({
    children,
    width,
    height,
    ...props
  }: { children: ReactNode; width?: unknown; height?: unknown; [key: string]: unknown }) => (
    <div {...props} data-width={width} data-height={height}>
      {children}
    </div>
  ),
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  XAxis: ({ children }: { children?: ReactNode }) => <>{children}</>,
  YAxis: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

function buildMockResult(): ImportResult {
  const records: DataRecord[] = [
    {
      id: 'fila-1',
      raw: {
        CATEGORIA: 'Software',
        DESCRIPCION: 'Licencia anual',
        VALOR: 120,
        CLIENTE: 'Cliente Central',
        SEGMENTO: 'Corporativo',
        FECHA: '2026-01-01',
      },
    },
    {
      id: 'fila-2',
      raw: {
        CATEGORIA: 'Servicios',
        DESCRIPCION: 'Taller de datos',
        VALOR: 60,
        CLIENTE: 'Cliente Norte',
        SEGMENTO: 'Educación',
        FECHA: '2026-02-01',
      },
    },
  ];

  const detectedColumns: DetectedColumn[] = [
    { header: 'CATEGORIA', normalizedHeader: 'CATEGORIA', kind: 'text' },
    { header: 'DESCRIPCION', normalizedHeader: 'DESCRIPCION', kind: 'text' },
    { header: 'VALOR', normalizedHeader: 'VALOR', kind: 'number' },
    { header: 'CLIENTE', normalizedHeader: 'CLIENTE', kind: 'text' },
    { header: 'SEGMENTO', normalizedHeader: 'SEGMENTO', kind: 'text' },
    { header: 'FECHA', normalizedHeader: 'FECHA', kind: 'date' },
  ];

  return {
    fileName: 'mock.xlsx',
    sheetName: 'Matriz',
    importedAt: new Date(),
    totalRows: 2,
    records,
    rejectedRows: 0,
    issues: [],
    unknownColumns: [],
    detectedColumns,
    columnMap: {},
    autoMappingMode: true,
  };
}

describe('App', () => {
  const getCurrentFileInput = (): HTMLInputElement =>
    document.querySelector('input[type="file"]') as HTMLInputElement;

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    mockImportExcel.mockReset();
  });

  const finishWizard = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole('button', { name: /siguiente/i }));
    await user.click(await screen.findByRole('button', { name: /siguiente/i }));
    await user.click(await screen.findByRole('button', { name: /ir al dashboard/i }));
  };

  it('muestra el flujo inicial', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /convierte tu excel/i })).toBeInTheDocument();
    expect(screen.getByText(/carga tu Excel/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /saltar al contenido principal/i })).toHaveAttribute('href', '#upload-content');
  });

  it('muestra el flujo inicial y rechaza archivos con extension no permitida', async () => {
    mockImportExcel.mockRejectedValue(new Error('Selecciona un archivo con extension .xlsx.'));
    render(<App />);
    expect(screen.getAllByText(/convierte tu excel/i)[0]).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.setup().upload(input, new File(['texto'], 'mock.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    expect(mockImportExcel).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent(/\.xlsx/i);
  });

  it('avanza por el flujo de importacion, configuracion y dashboard', async () => {
    mockImportExcel.mockResolvedValue(buildMockResult());
    const user = userEvent.setup();
    render(<App />);

    const input = getCurrentFileInput();
    await user.upload(input, new File(['ok'], 'mock.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }));

    expect(await screen.findByRole('heading', { name: /configura tu dashboard/i })).toBeInTheDocument();
    await finishWizard(user);

    expect(await screen.findByText(/dashboard configurado con tus campos/i, {}, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByText(/Agrupaci.n por CLIENTE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SEGMENTO/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText('Licencia anual')[0]).toBeInTheDocument();

    const reportTabs = screen.getAllByRole('tab');
    expect(reportTabs[0]).toHaveAttribute('aria-selected', 'true');
    reportTabs[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(reportTabs[1]).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: /usar como inicial/i }));
    expect(screen.getByRole('button', { name: /página inicial/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /editar mapeo/i }));
    expect(await screen.findByRole('heading', { name: /configura tu dashboard/i })).toBeInTheDocument();
  });

  it('permite arrepentirse al cambiar archivo y luego reemplazarlo correctamente', async () => {
    const firstResult = buildMockResult();
    const secondResult = { ...buildMockResult(), fileName: 'archivo-segundo.xlsx' };
    const firstResultWithName = { ...firstResult, fileName: 'archivo-primero.xlsx' };

    mockImportExcel
      .mockResolvedValueOnce(firstResultWithName)
      .mockResolvedValueOnce(secondResult);

    const user = userEvent.setup();
    render(<App />);

    const input = getCurrentFileInput();
    await user.upload(input, new File(['ok'], 'mock-primer.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

    await finishWizard(user);
    expect(await screen.findByText(/dashboard configurado con tus campos/i)).toBeInTheDocument();
    expect(screen.getByText(/archivo-primero\.xlsx/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cambiar archivo/i }));
    expect(await screen.findByRole('heading', { name: /carga tu Excel/i })).toBeInTheDocument();
    expect(screen.getByText(/tu dashboard anterior sigue disponible/i)).toBeInTheDocument();

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(await screen.findByText(/archivo-primero\.xlsx/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cambiar archivo/i }));
    expect(await screen.findByRole('heading', { name: /carga tu Excel/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /volver al dashboard/i }));
    expect(await screen.findByText(/archivo-primero\.xlsx/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cambiar archivo/i }));
    expect(await screen.findByRole('heading', { name: /carga tu Excel/i })).toBeInTheDocument();

    const secondInput = getCurrentFileInput();
    await user.upload(secondInput, new File(['ok'], 'mock-segundo.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    await finishWizard(user);
    expect(await screen.findByText(/archivo-segundo\.xlsx/i)).toBeInTheDocument();
    expect(screen.queryByText(/archivo-primero\.xlsx/i)).not.toBeInTheDocument();
  });
});
