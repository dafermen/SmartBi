import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// Fotografías reales de la aplicación, siempre con una sesión vacía y datos
// inventados. No reutilizamos el navegador personal ni un Excel empresarial.
const outputDirectory = path.resolve('public/docs/screenshots');
const baseURL = process.env.SMARTBI_SCREENSHOT_URL || 'http://127.0.0.1:5171';
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 }, locale: 'es-CO', reducedMotion: 'reduce',
});
const page = await context.newPage();

/** Espera las fuentes y guarda solo la vista o componente solicitado. */
async function capture(name, target = page) {
  await page.evaluate(() => document.fonts.ready);
  await target.screenshot({ path: path.join(outputDirectory, `${name}.jpg`),
    type: 'jpeg', quality: 85, animations: 'disabled' });
  console.log(`Captura: ${name}.jpg`);
}

/** Busca la opción por su texto, porque la clave interna puede normalizar tildes. */
async function chooseField(selector, label) {
  const value = await page.locator(`${selector} option`).filter({ hasText: label }).first().getAttribute('value');
  if (!value) throw new Error(`No encontramos la columna ${label}`);
  await page.locator(selector).selectOption(value);
}

try {
  await page.goto(baseURL);
  await expect(page.getByRole('heading', { name: /convierte tu excel/i })).toBeVisible();
  await capture('01-inicio');
  await page.locator('input[type="file"]').setInputFiles(path.resolve('tests/fixtures/smartbi-synthetic-sample.xlsx'));
  await expect(page.getByRole('heading', { name: /configura tu dashboard/i })).toBeVisible();
  await chooseField('#dimensionField', /Región/i);
  await capture('02-asistente-agrupacion');
  await page.getByRole('button', { name: /siguiente/i }).click();
  await chooseField('#descriptionField', /Producto/i);
  await chooseField('#metricField', /Ventas/i);
  await capture('03-asistente-metrica');
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.getByRole('group', { name: 'Columnas que se tendrán en cuenta' }).getByRole('checkbox', { name: /Canal/i }).check();
  await page.getByRole('group', { name: 'Campos para filtrar' }).getByRole('checkbox', { name: /Canal/i }).check();
  await chooseField('#dateField', /^Fecha/i);
  await page.locator('.wizard-card__body').evaluate((element) => { element.scrollTop = 150; });
  await capture('04-asistente-filtros');
  await page.getByRole('button', { name: /ir al dashboard/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard configurado/i })).toBeVisible();
  await page.waitForTimeout(1800); // Recharts termina de dibujar sus transiciones.
  await capture('05-dashboard');
  await capture('06-constructor', page.locator('.builder-panel'));
  await page.getByRole('tab', { name: /Detalle de datos/i }).click();
  await capture('07-tabla', page.locator('.table-panel'));
  await page.getByRole('tab').first().click();
  await page.getByRole('button', { name: /Cambiar a modo oscuro/i }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1800);
  await capture('08-dashboard-oscuro');
  await page.getByRole('button', { name: /Cambiar a modo claro/i }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('09-movil');
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseURL}/#/docs/aprender`);
  await expect(page.getByRole('heading', { level: 1, name: /aprender/i }).first()).toBeVisible();
  await capture('10-documentacion');
} finally {
  await browser.close();
}
