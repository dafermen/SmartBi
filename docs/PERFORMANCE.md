# Rendimiento y archivos grandes — SmartBI

Última actualización: 2026-09-09.

## Objetivo

Mantener la interfaz utilizable al analizar archivos grandes dentro de las limitaciones de un navegador y de un producto sin backend.

## Límites y avisos

- Límite duro del MVP: 15 MB por archivo `.xlsx`.
- Aviso de peso: 8 MB o más.
- Aviso de filas: 25.000 o más.
- Aviso de columnas: 80 o más.
- Recomendación: incluir y filtrar únicamente campos necesarios.

Un archivo pequeño con muchísimas celdas puede exigir más memoria que otro archivo más pesado pero sencillo. El tamaño en MB no es la única medida relevante.

## Optimizaciones actuales

### Memoización

Los filtros, agrupaciones, etiquetas y conjuntos derivados importantes usan `useMemo` o `useCallback` para no repetir trabajo cuando sus entradas no cambian.

### Virtualización de tabla

La tabla permite lotes de 10, 25, 50, 100 y 250 filas. Cuando un lote supera 60 filas, solo se renderiza la ventana visible con un margen adicional. Los espaciadores conservan la altura total y el desplazamiento.

### Web Worker

Desde 5.000 filas, el perfil de columnas se calcula en `dataProfile.worker.ts`. El Worker cuenta vacíos y valores únicos fuera del hilo principal. Si el navegador no soporta Workers o el proceso falla, SmartBI usa un cálculo local seguro como respaldo.

### Carga diferida

Dashboard y documentación se cargan únicamente cuando se necesitan.

## Perfil de rendimiento recomendado

Probar al menos tres escenarios en un equipo representativo:

| Escenario | Filas | Columnas | Qué medir |
|---|---:|---:|---|
| Pequeño | 1.000 | 15 | Importación, primer dashboard y filtro |
| Medio | 10.000 | 40 | Respuesta del wizard, perfil y tabla |
| Grande | 25.000 o más | 80 | Tiempo, memoria, scroll y cambio de filtros |

Registrar:

1. navegador, versión, sistema operativo y memoria del equipo;
2. tamaño del archivo y cantidad de celdas;
3. tiempo hasta el wizard;
4. tiempo hasta el dashboard;
5. tiempo de aplicar un filtro;
6. fluidez del scroll de tabla;
7. consumo máximo aproximado de memoria;
8. errores o cierres del navegador.

## Criterios orientativos para la demo

- La pantalla debe continuar respondiendo durante el perfil en segundo plano.
- El scroll de la tabla no debe crear cientos de filas DOM innecesarias.
- Un filtro común debería responder en menos de dos segundos en el equipo de prueba.
- El navegador no debe cerrarse ni perder el dashboard al mostrar una advertencia.

Estos tiempos son objetivos de experiencia, no garantías universales: dependen del dispositivo y del contenido del Excel.

## Evidencia automatizada disponible

El 2026-09-09 se ejecutó aisladamente la prueba analítica con 50.000 filas en el equipo de desarrollo:

- cálculo de filtros, agrupaciones y KPIs: 416 ms;
- criterio automatizado vigente: menos de 3.000 ms;
- resultado: aprobado.

Esta medición protege contra regresiones evidentes, pero no reemplaza las pruebas manuales de importación, memoria, scroll y filtros en varios equipos.

## Mejoras futuras

- Mover más cálculos analíticos al Worker.
- Medir tiempos automáticamente con la API `Performance`.
- Agregar cancelación del análisis pesado.
- Incorporar datasets sintéticos de rendimiento al proceso de QA.
- Estudiar almacenamiento local por bloques si el alcance futuro lo requiere.
