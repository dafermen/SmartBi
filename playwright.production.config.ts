import { defineConfig } from '@playwright/test';
import baseConfiguration from './playwright.config';

/**
 * Comprueba el resultado de `npm run build`, no el servidor de desarrollo.
 * Así detectamos fallos de rutas o de seguridad antes de publicar.
 * El puerto es exclusivo: no reutilizamos por accidente otra aplicación.
 */
export default defineConfig(baseConfiguration, {
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
