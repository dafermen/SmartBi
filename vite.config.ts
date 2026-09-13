import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Convierte la ruta base recibida por variable de entorno al formato que Vite
 * necesita. En producción SmartBI vive en la raíz de su propio subdominio, por
 * eso el valor normal es `/`.
 *
 * La ruta ya no se deduce desde `GITHUB_REPOSITORY`: GitHub define esa variable
 * también durante otros workflows y podía producir enlaces como
 * `/SmartBi/assets/...` en el dominio `smartbi.innovalogic.tech`.
 */
function normalizeBasePath(value: string | undefined): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue || trimmedValue === '/') {
    return '/';
  }

  return `/${trimmedValue.replace(/^\/+|\/+$/g, '')}/`;
}

const basePath = normalizeBasePath(process.env.VITE_BASE_PATH);

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: { host: '127.0.0.1' },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
