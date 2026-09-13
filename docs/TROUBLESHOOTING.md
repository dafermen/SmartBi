# Solución de problemas — SmartBI

## El puerto está ocupado

Síntoma:

```text
Error: Port 5171 is already in use
```

Diagnóstico:

```powershell
netstat -ano | Select-String ':5171'
```

Si el proceso es Vite de SmartBI, la app probablemente ya está levantada.

## La app quedó en una configuración extraña

Solución:

1. Abrir DevTools.
2. Ir a Application / Storage.
3. Limpiar LocalStorage del sitio.
4. Recargar.

## El Excel no carga

Revisar:

- Que sea `.xlsx`.
- Que no exceda el tamaño máximo.
- Que tenga forma tabular.
- Que tenga encabezados claros.

## El wizard no muestra la columna esperada

Revisar:

- Si la columna está vacía en muchas filas.
- Si el encabezado tiene espacios raros.
- Si el tipo detectado no corresponde.

## El dashboard no muestra datos

Revisar:

- Filtros activos.
- Rango de métrica.
- Rango de fecha.
- Campo de métrica seleccionado.

## CSP bloquea importación

Si en consola aparece error de Web Worker bloqueado, revisar que exista:

```text
worker-src 'self' blob:
```

en la CSP de `index.html` y en `public/_headers`.

## VS Code muestra `src/domain/metrics.ts`

Ese archivo ya no existe. Cerrar la pestaña. Los cálculos actuales viven en:

```text
src/features/dashboard/dashboardAnalytics.ts
```
