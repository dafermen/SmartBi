# Accesibilidad — SmartBI

Última revisión técnica: 2026-07-31.

## Objetivo

SmartBI busca cumplir WCAG 2.2 nivel AA en su flujo principal. Esta afirmación expresa una meta y una revisión técnica; no sustituye una auditoría independiente ni una validación con personas usuarias de tecnologías de asistencia.

## Alcance revisado

- Pantalla de carga.
- Wizard de tres pasos.
- Dashboard y filtros.
- Páginas del informe.
- Constructor visual.
- Tabla de datos.
- Biblioteca de documentación.
- Modos claro y oscuro.

## Cambios implementados

### Navegación con teclado

- Enlaces para saltar al contenido principal.
- Indicador de foco visible en enlaces, botones, entradas, selectores y elementos programáticamente enfocables.
- Pestañas de páginas navegables con flechas izquierda/derecha, `Inicio` y `Fin`.
- Botones para reordenar visuales como alternativa al arrastre.
- Botones Eje/Valor como alternativa al drag and drop de campos.
- Orden de tabulación basado en el orden natural del documento.

### Lectores de pantalla

- Regiones principales mediante `main`, `nav`, `aside` y encabezados.
- Pestañas con `tablist`, `tab`, `tabpanel`, `aria-selected` y `aria-controls`.
- Anuncio de filtros y registros visibles mediante `aria-live`.
- Mensajes de error con `role="alert"` y avisos no críticos con `role="status"`.
- Nombres accesibles para búsquedas, acciones con iconos, selector de archivo y títulos editables.
- `caption` oculto en tablas de datos, perfil y vista previa.
- `aria-sort` en encabezados ordenables.
- Resúmenes textuales para gráficos principales y visuales guardados.
- Marca SmartBI expuesta como imagen con nombre accesible.

### Percepción y contraste

- Foco de alto contraste con contorno sólido.
- Estados seleccionados acompañados de texto o semántica, no solo color.
- Soporte de `forced-colors` para modos de alto contraste.
- Soporte de `prefers-reduced-motion`.
- Temas claro y oscuro con superficies y textos diferenciados.

## Relación con WCAG 2.2 AA

| Criterio | Estado | Evidencia principal |
|---|---|---|
| 1.1.1 Contenido no textual | Implementado técnicamente | Iconos decorativos ocultos y gráficos con resumen textual |
| 1.3.1 Información y relaciones | Implementado técnicamente | Etiquetas, grupos, tablas, encabezados y regiones semánticas |
| 1.3.2 Secuencia significativa | Implementado técnicamente | Orden DOM coherente y navegación natural |
| 1.4.3 Contraste mínimo | Revisión inicial aprobada; falta medición independiente completa | Paleta y foco reforzados |
| 1.4.10 Reflow | Cubierto por responsive automatizado; falta zoom manual completo | Breakpoints móvil/tableta/escritorio |
| 1.4.11 Contraste no textual | Revisión inicial; requiere comprobación manual completa | Bordes, estados y foco |
| 2.1.1 Teclado | Implementado técnicamente | Acciones por botón y pestañas con flechas |
| 2.1.2 Sin trampa de teclado | Revisión técnica aprobada | No se crean trampas de foco |
| 2.2.2 Pausar/detener/ocultar | No aplica a contenido continuo; aviso temporal no bloqueante | No existen carruseles ni animaciones automáticas |
| 2.4.1 Evitar bloques | Implementado | Enlaces “Saltar al contenido” |
| 2.4.3 Orden del foco | Implementado técnicamente | Orden DOM |
| 2.4.7 Foco visible | Implementado | Regla global `:focus-visible` |
| 2.4.11 Foco no oculto | Revisión técnica; falta recorrido manual | Cabecera fija y `scroll-margin` |
| 2.5.7 Movimientos de arrastre | Implementado | Botones equivalentes para ordenar y asignar campos |
| 3.3.1 Identificación de errores | Implementado | Mensajes claros con `role="alert"` |
| 3.3.2 Etiquetas o instrucciones | Implementado | Etiquetas, ayudas y ejemplos en wizard |
| 4.1.2 Nombre, función y valor | Implementado técnicamente | ARIA de pestañas, botones, búsquedas y estados |
| 4.1.3 Mensajes de estado | Implementado | `aria-live`, `role="status"` y `role="alert"` |

## Validación manual pendiente

Antes de afirmar conformidad completa:

1. Recorrer todo el flujo con teclado sin ratón.
2. Probar NVDA + Firefox o Chrome en Windows.
3. Probar VoiceOver + Safari en macOS y, si es posible, iOS físico.
4. Medir contraste con una herramienta especializada en ambos temas.
5. Probar zoom al 200 % y 400 %.
6. Probar modo de alto contraste de Windows.
7. Confirmar que todos los mensajes se anuncian una sola vez y en el momento correcto.
8. Registrar evidencia y defectos en `doc/10_CHECKLIST_ACEPTACION_FINAL.md`.

## Regla para cambios futuros

Una mejora visual no está terminada si solo puede usarse con ratón, depende únicamente del color o no tiene un nombre comprensible para tecnologías de asistencia.
