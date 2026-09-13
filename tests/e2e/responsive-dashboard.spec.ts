import { expect, test } from '@playwright/test';
import path from 'node:path';

// Este libro contiene únicamente datos inventados. Las pruebas nunca deben
// depender de un archivo entregado por una persona usuaria o una empresa real.
const excelFixture = path.resolve('tests/fixtures/smartbi-synthetic-sample.xlsx');

test('abre un enlace documental, navega la biblioteca y vuelve a SmartBI', async ({ page }) => {
  await page.goto('/#/docs/arquitectura');

  await expect(page.getByRole('heading', { level: 1, name: 'Arquitectura' })).toBeVisible();
  await expect(page).toHaveURL(/#\/docs\/arquitectura$/);

  const mobileMenu = page.getByRole('button', { name: 'Abrir índice' });
  if (await mobileMenu.isVisible()) await mobileMenu.click();

  await page.getByLabel('Buscar en la documentación').fill('endurecimiento pendiente');
  await expect(page.getByRole('status')).toContainText(/resultado/i);
  await page.getByRole('button', { name: /Seguridad/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Seguridad' })).toBeVisible();
  await expect(page).toHaveURL(/#\/docs\/seguridad$/);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Seguridad' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a SmartBI' }).click();
  await expect(page.getByRole('heading', { name: /convierte tu excel/i })).toBeVisible();
});

test('el manual ilustrado carga sus imágenes sin desbordar la pantalla', async ({ page }) => {
  await page.goto('/#/docs/manual-final');
  const illustrations = page.locator('.markdown-body img');
  await expect(illustrations).toHaveCount(10);
  for (const illustration of await illustrations.all()) {
    await illustration.scrollIntoViewIfNeeded();
    await expect(illustration).toHaveAttribute('alt', /\S/);
    await expect(illustration.locator('..')).toHaveAttribute('target', '_blank');
    await expect.poll(() => illustration.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('carga un Excel, completa el wizard y muestra el dashboard responsive', async ({ page }, testInfo) => {
  const runtimeErrors: string[] = [];
  const dataUploads: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method())) dataUploads.push(request.url());
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /convierte tu excel/i })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(excelFixture);

  await expect(page.getByRole('heading', { name: /configura tu dashboard/i })).toBeVisible({ timeout: 60_000 });
  await page.locator('#dimensionField').selectOption('REGION');
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.locator('#descriptionField').selectOption('PRODUCTO');
  await page.locator('#metricField').selectOption('VENTAS');
  await page.getByRole('button', { name: /siguiente/i }).click();
  const canalFilter = page.getByRole('group', { name: 'Campos para filtrar' }).getByRole('checkbox', { name: /^Canal/i });
  await expect(canalFilter).not.toBeChecked();
  await canalFilter.check();
  const checkboxVisual = canalFilter.locator('+ .custom-check');
  expect((await checkboxVisual.boundingBox())?.width).toBeGreaterThanOrEqual(14);
  await page.getByRole('button', { name: /ir al dashboard/i }).click();

  await expect(page.getByText(/dashboard configurado con tus campos/i)).toBeVisible();
  await expect(page.getByRole('navigation', { name: /navegación del reporte/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /cambiar archivo/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /saltar al contenido del informe/i })).toHaveAttribute('href', '#dashboard-main');

  const reportTabs = page.getByRole('tab');
  await reportTabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(reportTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(reportTabs.first()).toHaveAttribute('aria-selected', 'true');

  await expect(page.getByRole('heading', { name: 'Agrupación por Región', exact: true })).toBeVisible();
  await expect(page.locator('.kpi-card').filter({ hasText: 'Registros visibles' }).locator(':scope > strong')).toHaveText('12');
  expect(runtimeErrors).toEqual([]);
  expect(dataUploads).toEqual([]);

  await page.screenshot({
    path: path.resolve('doc/qa-responsive', `dashboard-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
