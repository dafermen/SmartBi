# Requerimientos e historias de usuario — SmartBI MVP

## 1. Objetivo y actores

El MVP permite a una persona analista convertir un archivo Excel tabular en informacion visual accionable, sin instalar software de escritorio.

SmartBI no incluye inteligencia artificial. El alcance del MVP es BI web local: importacion, validacion, mapeo, filtros, visualizaciones, diagnostico de calidad y exportacion.

Actores:

- Usuario analista: carga, filtra, analiza y exporta.
- Dueño del proceso: valida definiciones y resultados.
- Soporte/desarrollo: diagnostica formato, calidad y errores.

## 2. Requerimientos funcionales

| ID | Requerimiento | Prioridad | Criterio verificable |
|---|---|---:|---|
| RF-001 | Cargar un archivo `.xlsx` mediante selector o arrastre | Alta | Ambos métodos funcionan con teclado y puntero |
| RF-002 | Validar tipo, tamaño y legibilidad antes de procesar | Alta | Un archivo inválido no rompe la app y muestra causa |
| RF-003 | Detectar una hoja tabular con datos | Alta | La hoja con encabezados y filas legibles se procesa |
| RF-004 | Reconocer columnas aunque estén reordenadas | Alta | El mapeo depende del encabezado, no de la posición |
| RF-005 | Permitir mapeo manual cuando no hay plantilla conocida | Alta | El usuario escoge agrupacion, metrica, filtros y fecha en el wizard |
| RF-006 | Excluir la columna `SQL` | Alta | No llega al estado, vistas, logs ni exportación |
| RF-007 | Normalizar cantidades, costos, vacíos y códigos | Alta | Códigos conservan texto y números quedan calculables |
| RF-008 | Mostrar resumen de importación | Alta | Filas leídas, válidas, advertidas y rechazadas visibles |
| RF-009 | Reemplazar o limpiar el archivo | Alta | Datos y filtros previos desaparecen de memoria |
| RF-010 | Mostrar KPIs principales | Alta | Registros, suma, promedio y maximo de la metrica elegida |
| RF-011 | Mostrar distribución por requerimiento | Alta | Incluye categorías presentes y orden de criticidad |
| RF-012 | Mostrar ranking por un campo destacado | Media | Los valores sin dato se muestran como `Sin definir` |
| RF-013 | Filtrar por agrupaciones, campos destacados y campos dinamicos | Alta | Todos los visuales reflejan la combinacion |
| RF-014 | Buscar por código o descripción | Alta | Búsqueda parcial sin distinguir mayúsculas |
| RF-015 | Interacción cruzada entre visuales | Media | Selección crea un filtro visible y reversible |
| RF-016 | Mostrar tabla de detalle | Alta | Ordena y maneja 1.598 filas fluidamente |
| RF-017 | Limpiar uno o todos los filtros | Alta | Resultado retorna al conjunto completo |
| RF-018 | Exportar a CSV los registros filtrados | Media | Exportación respeta filtros y excluye `SQL` |
| RF-019 | Mostrar metadatos de la carga | Media | Nombre, hora, hoja y filas válidas visibles |
| RF-020 | Presentar mensajes de estado | Alta | Hay estados vacío, cargando, éxito, advertencia y error |
| RF-021 | Formatear cifras según configuración regional | Media | Separadores y moneda no alteran el valor interno |
| RF-022 | Operar completamente en navegador en el MVP | Alta | No se requiere servidor para procesar el Excel |

### Columnas minimas para Excel generico

Para generar el dashboard base, el archivo debe tener una forma tabular y el usuario debe poder escoger:

- Una columna de agrupacion.
- Una columna numerica como metrica.
- Opcionalmente columnas de descripcion, fecha y filtros.

SmartBI no exige nombres de columnas especificos. La configuracion minima se realiza en el wizard.

Las columnas adicionales pueden usarse como filtros, detalle o campos disponibles para el constructor visual.

### Reglas genericas de calculo

- Total de metrica: suma de la columna numerica elegida por el usuario.
- Promedio de metrica: total dividido por registros visibles.
- Maximo de metrica: valor mas alto de la seleccion.
- Conteos de perfil: filas con metrica positiva, cero o negativa.



- Fecha: si el usuario la configura, habilita tendencias y filtros por rango.

## 3. Requerimientos no funcionales

| ID | Requerimiento | Meta inicial |
|---|---|---|
| RNF-001 | Responsive | Utilizable desde 320 px y sin scroll horizontal global |
| RNF-002 | Rendimiento de carga | Archivo piloto procesado en ≤ 3 s en equipo de referencia |
| RNF-003 | Respuesta a filtros | Actualización perceptible en ≤ 300 ms para 10.000 filas |
| RNF-004 | Escalabilidad de cliente | Objetivo MVP de 50.000 filas; medir antes de prometer más |
| RNF-005 | Accesibilidad | WCAG 2.2 AA en flujo principal; teclado y foco visibles |
| RNF-006 | Compatibilidad | Dos versiones actuales de Chrome, Edge, Firefox y Safari |
| RNF-007 | Privacidad | Archivo procesado localmente y no enviado a terceros |
| RNF-008 | Seguridad | No ejecutar macros, fórmulas, HTML ni SQL del archivo |
| RNF-009 | Mantenibilidad | TypeScript estricto, capas separadas, lint y pruebas |
| RNF-010 | Confiabilidad | Un error por fila no invalida filas sanas; reporte completo |
| RNF-011 | Observabilidad | Errores técnicos sin contenido sensible del archivo |
| RNF-012 | Calidad | Cobertura objetivo ≥ 80 % en importación y métricas |
| RNF-013 | Despliegue | Build estático reproducible desde CI |
| RNF-014 | Usabilidad | Flujo cargar→dashboard realizable sin manual para archivo válido |
| RNF-015 | Identidad visual | Inspirada en BI, con diseño y marca propios |
| RNF-016 | Recuperación | Sustituir archivo devuelve la app a estado consistente |

## 4. Historias de usuario

### HU-001 - Cargar un Excel

Como analista, quiero arrastrar o seleccionar un Excel tabular para comenzar el analisis sin instalar una aplicacion.

Aceptación:

- Dado un `.xlsx` compatible, cuando lo selecciono, entonces se muestra progreso y resultado de importación.
- Dado un tipo no permitido, no se procesa y se explica cómo corregirlo.
- El archivo no sale del navegador.

### HU-002 — Comprender errores del archivo

Como analista, quiero saber qué columnas o filas tienen problemas para corregir la fuente sin ayuda técnica.

Aceptación:

- Se distinguen errores bloqueantes y advertencias.
- Cada incidencia identifica hoja, fila, columna y causa cuando aplica.
- Puedo continuar si solo hay advertencias y existen filas válidas.

### HU-003 — Confirmar la carga

Como analista, quiero ver cuántas filas fueron aceptadas para confiar en el resultado.

Aceptación: se muestran filas leídas, válidas, advertidas y rechazadas; con el piloto se reconocen 1.598 filas de datos.

### HU-004 — Ver situación general



Aceptación: los KPIs usan las reglas documentadas, reaccionan a filtros y presentan cero sin ocultar la tarjeta.

### HU-005 — Priorizar por estado



Aceptación: el gráfico respeta el orden de criticidad, permite selección y muestra etiqueta, cantidad y porcentaje.

### HU-006 - Analizar ranking por campo destacado



Aceptacion: puedo ordenar por metrica, filtrar un valor destacado y distinguir registros sin dato.

### HU-007 — Encontrar un artículo

Como analista, quiero buscar por código o descripción para revisar rápidamente un producto.

Aceptación: admite coincidencia parcial, no distingue mayúsculas y actualiza KPIs, gráficos y tabla.

### HU-008 — Combinar filtros

Como analista, quiero combinar varios filtros para estudiar un segmento específico.

Aceptación: se aplica lógica AND entre grupos, los filtros activos son visibles y puedo quitarlos individualmente.

### HU-009 — Revisar el detalle

Como analista, quiero consultar las filas que explican un indicador para auditar el resultado.

Aceptación: la tabla admite orden, scroll/paginación y conserva códigos como texto; no muestra `SQL`.

### HU-010 — Exportar el resultado

Como analista, quiero descargar las filas filtradas para compartir o continuar un análisis autorizado.

Aceptación: el CSV contiene solo el conjunto filtrado, encabezados claros y ninguna columna excluida.

### HU-011 — Usar la aplicación desde móvil

Como coordinador, quiero consultar el dashboard desde un teléfono o tableta para revisar alertas fuera del escritorio.

Aceptación: no hay scroll horizontal global, los filtros se abren en panel y los controles táctiles son utilizables.

### HU-012 — Reemplazar la fuente

Como analista, quiero cambiar de Excel sin recargar la web para analizar otra matriz.

Aceptación: se solicita confirmación si corresponde, se borran filtros y se liberan datos anteriores.

## 5. Criterios de aceptación del archivo piloto



## 6. Fuera de alcance del MVP

Inicio de sesión, permisos, almacenamiento central, historial, edición de datos, colaboración, conexión a ERP, actualización programada, diseñador libre de reportes, IA generativa, exportación a Power BI y ejecución de SQL.

## 7. Preguntas pendientes para cierre funcional

1. ¿Cuál es la moneda de `COSTO_UNITARIO` y `PRECIO`?
2. ¿Qué representan exactamente SMN, SAT, PAF, CTC y los cuatro períodos de consumo?

4. ¿Las categorías Latente y Emergencia pueden aparecer en otros archivos?

6. ¿Cuál será el tamaño máximo real de archivo y filas?
7. ¿La exportación CSV es necesaria en el primer corte o puede pasar a una segunda iteración?
