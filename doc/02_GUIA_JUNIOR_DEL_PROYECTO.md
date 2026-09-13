# Guía para una persona desarrolladora junior — SmartBI

## 1. Estado actual

Por ahora el repositorio contiene el Excel piloto y documentación. La estructura de código descrita aquí es la estructura objetivo que deberá crearse en la fase de implementación. No busques todavía archivos como `package.json` o `src/`: aún no existen.

## 2. Herramientas recomendadas

- Node.js LTS y npm.
- Git.
- Visual Studio Code.
- Chrome o Edge con DevTools.
- React, Vite y TypeScript.

Cuando el proyecto se inicialice, el flujo esperado será:

```powershell
cd C:\Projects\SmartBI
npm install
npm run dev
```

La terminal mostrará una dirección local, normalmente `http://localhost:5173`. Para validar cambios antes de entregarlos:

```powershell
npm run lint
npm test
npm run build
```

No ejecutes comandos de instalación hasta que exista `package.json`. No subas `node_modules` a Git.

## 3. Estructura objetivo

```text
SmartBI/
├─ doc/                         documentación y archivo piloto
├─ public/                      archivos públicos estáticos
├─ src/
│  ├─ app/                      arranque, rutas y configuracion global
│  ├─ assets/                   imágenes y fuentes propias
│  ├─ components/               componentes reutilizables
│  │  ├─ layout/                barra, navegación, panel y contenedores
│  │  ├─ charts/                envoltorios de gráficos
│  │  ├─ filters/               filtros y chips activos
│  │  └─ ui/                    botones, tarjetas, diálogos y mensajes
│  ├─ features/
│  │  ├─ import/                lectura, validación y vista previa de Excel
│  │  └─ dashboard/             KPIs, filtros, gráficos y tabla de detalle
│  ├─ domain/                   tipos y reglas puras del negocio
│  ├─ hooks/                    hooks reutilizables
│  ├─ services/                 adaptadores de archivo y exportación
│  ├─ store/                    estado compartido
│  ├─ styles/                   tokens, temas y estilos globales
│  ├─ test/                     utilidades y datos de prueba
│  ├─ main.tsx                  punto de entrada
│  └─ vite-env.d.ts
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 4. Dónde modificar cada cosa

| Necesidad | Ubicación objetivo |
|---|---|
| Cambiar colores, espacios o breakpoints | `src/styles/` |
| Cambiar navegación o distribución | `src/components/layout/` |
| Agregar un gráfico | `src/components/charts/` y configuración en `features/dashboard/` |
| Cambiar un KPI, agrupación o fórmula | `src/features/dashboard/dashboardAnalytics.ts` y `src/features/dashboard/dashboardAnalytics.test.ts` |
| Aceptar otro nombre de columna | `src/features/import/columnAliases.ts` |
| Cambiar validaciones del Excel | `src/features/import/validation/` |
| Modificar filtros | `src/components/filters/` y `src/features/dashboard/` |

> Nota de limpieza técnica: si VS Code todavía muestra `src/domain/metrics.ts` en una pestaña, puedes cerrarla con tranquilidad. Ese archivo pertenecía a una versión anterior. Los cálculos actuales viven en `src/features/dashboard/dashboardAnalytics.ts`.
| Cambiar tabla de detalle | `src/features/dashboard/components/` |
| Agregar una página | `src/app/routes/` |
| Agregar datos de prueba | `src/test/fixtures/` |

Regla clave: un componente visual no debe inventar fórmulas. Las fórmulas viven en `domain`; la lectura del Excel vive en `features/import`; el componente solo presenta resultados.

## 5. Recorrido de los datos

1. El usuario selecciona el `.xlsx`.
2. El servicio de lectura obtiene hojas y celdas en el navegador.
3. El importador identifica encabezados y excluye `SQL`.
4. El validador crea incidencias y filas normalizadas.
5. El adaptador convierte cada fila a `DataRecord`, un registro interno genérico basado en `raw`.
6. El store guarda los registros válidos y filtros.
7. `dashboardAnalytics.ts` calcula métricas y agrupaciones usando el mapeo elegido por el usuario.
8. Tarjetas, gráficos y tabla reciben datos derivados.

Si un valor se ve mal, revisa el recorrido en ese orden. No arregles un error de parsing agregando una excepción visual al gráfico.

## 6. Modelo base sugerido

El modelo se basa en `raw`: allí quedan las columnas originales normalizadas del Excel.

Los códigos deben ser `string`, aunque Excel los muestre como número. Las cantidades y costos deben ser `number | null`.

```ts
export interface DataRecord {`r`n  id: string;`r`n  raw: Record<string, string | number | boolean | Date | null>;`r`n}
```

No es necesario exponer las 59 columnas de negocio en todos los componentes. El modelo puede conservar campos adicionales para la tabla de detalle.

## 7. Cómo hacer un cambio seguro

1. Lee la historia de usuario y su criterio de aceptación.
2. Localiza la capa correcta con la tabla de la sección 4.
3. Crea o actualiza primero una prueba que represente el comportamiento.
4. Haz el cambio más pequeño que resuelva el caso.
5. Prueba manualmente archivo válido, archivo inválido y pantalla pequeña.
6. Ejecuta lint, pruebas y build.
7. Revisa `git diff` y evita archivos no relacionados.
8. Actualiza documentación si cambian estructura, comandos o reglas.
9. Crea un commit corto y descriptivo.

## 8. Convenciones

- Componentes y tipos: `PascalCase`.
- Funciones, variables y hooks: `camelCase`; hooks comienzan por `use`.
- Constantes globales: `UPPER_SNAKE_CASE`.
- Archivos de componentes: `PascalCase.tsx`; utilidades: `camelCase.ts`.
- Evita `any`; usa `unknown` y valida antes de convertir.
- Prefiere funciones puras para métricas.
- No guardes el archivo completo en varios estados.
- No uses el índice de la fila como identidad si existe un código estable.
- Todo texto visible debe poder centralizarse para futura internacionalización.

## 9. Depuración rápida

- Pantalla en blanco: revisa la consola y la terminal de Vite.
- Archivo rechazado: revisa extensión, hoja elegida y encabezados normalizados.
- KPI incorrecto: compara registros filtrados, regla del dominio y formato visual.
- Código convertido a notación científica: se trató como número; normalízalo como texto.
- Interfaz lenta: comprueba renders, memoización, tabla virtual y parsing en Web Worker.
- Filtro afecta solo un gráfico: ese gráfico no está usando el conjunto filtrado común.
- Cambio responsive roto: prueba 320, 768, 1024 y 1440 px.
- Plantilla de mapeo rara: borra `smartbi:mapping-template` desde `localStorage` o usa el botón **Borrar** de la tarjeta del wizard. Esa plantilla solo debe aplicarse si el nuevo Excel conserva columnas compatibles.
- Lienzo visual o progreso de documentación extraño: revisa `smartbi:visual-builder` y `smartbi:docs-progress` en `localStorage`. Son memorias locales del navegador; no viajan al servidor.

## 10. Datos delicados

El Excel puede contener información comercial. No lo envíes a servicios externos, analítica, logs remotos ni herramientas públicas sin autorización. Nunca renderices ni ejecutes la columna `SQL`; debe descartarse durante la importación.

## 11. Antes de pedir revisión

- La aplicación inicia desde una instalación limpia.
- No hay errores en consola.
- Las pruebas cubren el cambio.
- Se verificó teclado y responsive.
- Los totales del piloto siguen reconciliando cuando el cambio toca datos.
- El commit no incluye Excel adicionales, secretos, `.env`, builds o `node_modules`.
