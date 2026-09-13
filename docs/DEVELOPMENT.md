# Desarrollo local — SmartBI

## Requisitos

- Node.js instalado.
- npm instalado.
- Navegador moderno.

## Instalación

```powershell
cd C:\Projects\SmartBI
npm install
```

## Levantar servidor

```powershell
npm run dev:5171
```

Este comando levanta toda la aplicación en `http://127.0.0.1:5171`. No existe un segundo proceso de backend.

Para permitir que Vite elija su puerto automáticamente:

```powershell
npm run dev
```

## Scripts disponibles

```powershell
npm run test
npm run lint
npm run docs:check
npm run build
npm run test:e2e
```

## Convenciones

- Código React en `src/`.
- Pruebas unitarias cerca del código (`*.test.ts` / `*.test.tsx`).
- E2E en `tests/e2e/`.
- Documentación técnica en `docs/`.
- Documentación interactiva basada en fuentes Markdown de `doc/` y `docs/`.

## Antes de modificar

Leer:

1. `AGENTS.md`
2. `CURRENT_STATUS.md`
3. `README.md`
4. Documento técnico relacionado en `docs/`

## Reglas de cambios seguros

- Hacer cambios pequeños y verificables.
- No recrear `src/domain/metrics.ts`.
- No introducir backend sin autorización.
- No cambiar el alcance a inteligencia artificial.
- Actualizar documentación cuando cambie comportamiento.
- Ejecutar pruebas proporcionales al cambio.
- Conservar alternativas por teclado cuando se agreguen acciones de arrastre.
- Revisar `docs/ACCESSIBILITY.md` para cambios visuales o interactivos.
- Revisar `docs/PERFORMANCE.md` para cambios sobre filas, filtros o perfiles.
