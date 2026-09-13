# Contribuir a SmartBI

## Antes de empezar

Leer:

1. `AGENTS.md`
2. `CURRENT_STATUS.md`
3. `README.md`
4. Documento relacionado en `docs/`

## Flujo recomendado

1. Crear una rama descriptiva.
2. Hacer cambios pequeños.
3. Actualizar documentación.
4. Ejecutar pruebas.
5. Abrir pull request con evidencia.

## Comandos mínimos

```powershell
npm run test
npm run lint
npm run build
```

Si el cambio afecta UI o flujo principal:

```powershell
npm run test:e2e
```

## Reglas importantes

- No introducir backend sin aprobación explícita.
- No afirmar que SmartBI usa inteligencia artificial.
- No depender de una plantilla fija de Excel.
- No recrear `src/domain/metrics.ts`.
- Mantener documentación didáctica.
