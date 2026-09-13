# Licencias de terceros

SmartBI usa dependencias npm. Para revisar licencias exactas, consultar `package.json` y `package-lock.json`.

Dependencias principales:

- React
- React DOM
- Vite
- TypeScript
- Recharts
- Lucide React
- read-excel-file
- react-markdown
- remark-gfm
- Vitest
- Testing Library
- Playwright
- ESLint

Antes de publicar comercialmente, generar un reporte formal de licencias con una herramienta especializada y revisar compatibilidad legal.

## Avisos incluidos en esta entrega

Los [avisos de terceros](public/THIRD_PARTY_NOTICES.txt) recopilan los textos
LICENSE, COPYING y NOTICE de las dependencias de producción instaladas.
Se incluyen también en `dist/THIRD_PARTY_NOTICES.txt` para acompañar la entrega
web. El inventario incluye herramientas de build y no afirma que todos los
paquetes se ejecuten en el navegador.

Después de cambiar dependencias, ejecutar `npm ci`, `npm run licenses:generate`
y revisar el resultado antes del commit. Este inventario no sustituye una
revisión legal ni cambia las licencias originales.
