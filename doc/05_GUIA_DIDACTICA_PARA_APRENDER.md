# Aprender desarrollo web con SmartBI

> También puedes leer esta guía desde la opción **Documentación** de SmartBI. Allí encontrarás búsqueda, índice y botones para avanzar entre capítulos. Este archivo Markdown continúa siendo la fuente original.

## Antes de comenzar

Hola. Este proyecto parece grande porque tiene muchas carpetas y palabras nuevas, pero ninguna persona necesita entenderlo todo el primer día.

Aprender a programar se parece a aprender un idioma o un instrumento: al principio reconoces pequeñas piezas; después descubres cómo se conectan.

Tu objetivo inicial no es memorizar. Es aprender a:

1. hacer una pregunta sobre el programa;
2. encontrar el archivo relacionado;
3. realizar un cambio pequeño;
4. observar qué ocurrió;
5. deshacerlo si no funcionó;
6. explicar con tus propias palabras lo aprendido.

Si algo no sale, eso no significa “no soy buena programando”. Significa “el programa me acaba de dar una pista”.
Los errores son mensajes, no calificaciones.

## Para la persona adulta que acompaña

No necesitas conocer todas las respuestas.
Tu función más útil es ayudar a pensar sin tomar el teclado inmediatamente.

Preguntas recomendadas:

- “¿Qué esperabas que ocurriera?”
- “¿Qué ocurrió realmente?”
- “¿Qué archivo crees que controla esa parte?”
- “¿Qué cambio mínimo podemos probar?”
- “¿Qué dice exactamente el mensaje de error?”
- “¿Cómo volveríamos al estado anterior?”

Evita convertir cada sesión en una prueba. Una sesión de 30 a 45 minutos con un resultado visible suele ser mejor que varias horas de teoría. Terminen guardando una nota breve: “Hoy descubrimos que…”.

Una metodología sencilla para cada encuentro:

1. Cinco minutos: elegir una pregunta o misión.
2. Diez minutos: leer solo el código relacionado.
3. Quince minutos: hacer un cambio pequeño.
4. Diez minutos: probar y corregir.
5. Cinco minutos: explicar y guardar el cambio.

## Capítulo 1 — ¿Qué estamos construyendo?

SmartBI es una aplicación web. Esto significa que funciona dentro de un navegador, como una página, pero también responde a acciones y procesa información.

Su recorrido principal es:

```text
La persona elige un Excel
            ↓
El navegador lee las hojas
            ↓
El importador revisa y limpia las filas
            ↓
Las reglas calculan totales y grupos
            ↓
React dibuja tarjetas, gráficos y una tabla
            ↓
Los filtros vuelven a calcular la vista
```

Una analogía con una cocina:

- El Excel son los ingredientes que llegan del mercado.
- `excelImporter.ts` lava, revisa y corta los ingredientes, aunque vengan en columnas diferentes.
- El wizard deja que la persona decida qué ingrediente será agrupación, métrica, fecha o filtro.
- `dashboardAnalytics.ts` calcula las métricas dinámicas elegidas por el usuario.
- `dashboardAnalytics.ts` contiene la receta dinámica: calcula usando los campos que la persona eligió en el wizard.
- Los componentes React emplatan la comida.
- CSS decide el color, tamaño y presentación del plato.
- Las pruebas son una persona que comprueba que la receta sigue funcionando.

## Capítulo 2 — Las tres tecnologías principales

### HTML o JSX: la estructura

HTML describe elementos como títulos, botones y tablas. React usa JSX, una forma de escribir estructuras parecidas a HTML dentro de TypeScript.

```tsx
<button>Seleccionar archivo</button>
```

Las etiquetas se abren y cierran. Algunas reciben propiedades:

```tsx
<button disabled={loading}>Procesando</button>
```

Aquí `disabled` depende de una variable. Cuando `loading` es verdadero, el botón queda desactivado.

### CSS: la apariencia

CSS selecciona elementos por sus clases y les asigna reglas visuales:

```css
.primary-button {
  background: #5262d9;
  color: white;
  border-radius: 10px;
}
```

La clase es como una etiqueta colocada sobre el botón. CSS encuentra todos los elementos con esa etiqueta y los pinta.

### TypeScript: la lógica y las reglas

TypeScript es JavaScript con una ayuda adicional: permite declarar qué clase de dato esperamos.

```ts
const edad: number = 12;
const nombre: string = 'Ana';
```

Si intentamos guardar el texto `'doce'` en una variable de tipo `number`, el editor nos avisa antes de ejecutar el programa.

## Capítulo 3 — Palabras esenciales

### Variable

Una caja con nombre que guarda un valor.

```ts
const pageSize = 10;
```

`const` significa que la caja no será reemplazada por otro valor. Eso no siempre significa que todo lo que contiene sea inmutable, pero es una buena idea inicial.

### Función

Una pequeña máquina: recibe algo, realiza pasos y devuelve un resultado.

```ts
function duplicate(number: number) {
  return number * 2;
}
```

`duplicate(5)` devuelve `10`.

### Array

Una lista ordenada.

```ts
const colors = ['rojo', 'verde', 'azul'];
```

La primera posición es `0`, no `1`. `colors[0]` es `'rojo'`.

### Objeto

Una colección de datos relacionados y nombrados.

```ts
const product = {
  name: 'Cuaderno',
  inventory: 8,
};
```

### Interface

Un molde que indica qué propiedades debe tener un objeto. En SmartBI, `DataRecord` describe una fila limpia del Excel.

### Componente

Una función React que devuelve una parte de la pantalla. Puede recibir propiedades, llamadas `props`.

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hola, {name}</h1>;
}
```

### Estado

La memoria de un componente. Cuando cambia, React actualiza la pantalla.

```ts
const [page, setPage] = useState(1);
```

- `page` es el valor actual.
- `setPage` es la función para cambiarlo.
- `1` es su valor inicial.

### Evento

Algo que ocurre: un clic, escribir, arrastrar o seleccionar un archivo.

```tsx
<button onClick={clearFilters}>Limpiar</button>
```

### Import y export

Permiten compartir código entre archivos.

```ts
export function computeDashboardAnalytics() { /* calcula filtros, KPIs y agrupaciones */ }
import { computeDashboardAnalytics } from './dashboardAnalytics';
```

### Promise, async y await

Algunas acciones tardan, como leer un Excel. Una `Promise` representa un resultado que llegará después. `await` espera sin congelar todo el navegador.

```ts
const result = await importExcel(file);
```

### null y undefined

Ambos representan ausencia, pero tienen matices. En este proyecto `null` se usa de forma intencional para decir “todavía no existe un resultado”. `undefined` suele significar que una propiedad o argumento no fue proporcionado.

## Capítulo 4 — Cómo iniciar el proyecto

Abre PowerShell y escribe:

```powershell
cd C:\Projects\SmartBI
npm install
npm run dev
```

¿Qué significa cada línea?

- `cd` cambia la carpeta actual.
- `npm install` descarga las herramientas declaradas en `package.json`.
- `npm run dev` inicia un servidor local para desarrollar.

La terminal mostrará una dirección parecida a `http://127.0.0.1:5173/`. Ábrela en el navegador.

Para detener el servidor, vuelve a la terminal y presiona `Ctrl + C`.

No escribas comandos que no entiendas tomados de internet. Primero pregunta qué hacen. En especial, no publiques contraseñas, tokens, archivos `.env` ni documentos privados.

## Capítulo 5 — Primer recorrido por los archivos

### `index.html`

Es la página base. Contiene un elemento vacío llamado `root`. React construye toda la interfaz dentro de él.

### `src/main.tsx`

Es el encendido. Busca `root` y coloca allí el componente `App`.

### `src/app/App.tsx`

Es el director. Decide entre dos pantallas:

- Si todavía no existe un resultado, muestra `UploadView`.
- Si el Excel fue leído correctamente, muestra `DashboardView`.

### `src/features/import/UploadView.tsx`

Muestra textos y botones para elegir un archivo. No interpreta Excel; solo entrega el archivo al componente principal.

### `src/features/import/excelImporter.ts`

Es una de las piezas más importantes. Valida el archivo, busca una tabla con encabezados, normaliza valores, elimina `SQL` y conserva las columnas originales en `raw`.

No exige nombres de columnas específicos: importa la tabla y deja que el wizard permita escoger campos manualmente.

### `src/domain/types.ts`

Contiene los moldes de los datos. Si quieres saber qué información tiene un producto, este es el primer archivo que debes mirar.

### `src/features/dashboard/dashboardAnalytics.ts`

Contiene los cálculos dinámicos del reporte: filtros, agrupaciones, rangos, totales, promedios y datos para visuales. No dibuja nada; solo prepara información.

### `src/features/dashboard/dataProfile.ts`

Construye una ficha de cada columna: tipo, valores únicos, vacíos y posible uso. Es como una persona bibliotecaria que mira cada estante y escribe una etiqueta para saber qué contiene.

### `src/features/dashboard/dataProfile.worker.ts`

Es un ayudante que trabaja en otra mesa. Cuando el Excel tiene 5.000 filas o más, el navegador le entrega el perfil de columnas para que la pantalla principal pueda seguir respondiendo mientras el cálculo termina.

### `src/features/dashboard/DashboardView.tsx`

Convierte resultados en tarjetas, gráficos, filtros y tabla. Es largo porque coordina muchas piezas visuales.

Ahora también contiene tres ideas visuales inspiradas en herramientas de inteligencia de negocios:

1. `reportTabs`: son los botones Resumen, Visuales, Alertas y Detalle. No cambian los datos; ayudan a moverse por el reporte.
2. `fields-pane`: es el panel derecho de campos. Muestra las columnas detectadas del Excel y marca cuáles se usan como agrupación, métrica, fecha o filtro.
3. `usedFieldRoles`: es un mapa pequeño que responde: “¿para qué estoy usando esta columna?”.
4. `SlicerCard`: son segmentadores rápidos, como botones de filtro visibles dentro del lienzo.
5. `builderDimensionField` y `builderMetricField`: guardan los dos campos que forman el visual editable. Uno responde “¿por qué agrupo?” y el otro “¿qué número sumo?”.
6. `builderVisualType`: guarda cómo se quiere ver el mismo resultado: barras, tarjeta o tabla. Es una idea importante: los datos pueden ser los mismos, pero la forma visual cambia la manera de entenderlos.
7. El visual de línea solo se activa cuando el eje es una fecha. Una línea cuenta una historia en el tiempo; por eso no tendría mucho sentido usarla con nombres o codigos sueltos.
8. `localStorage`: es una cajita pequeña del navegador. SmartBI la usa para recordar el último visual editable. Antes de usar lo guardado, el código verifica que esas columnas existan en el Excel actual.
9. `resetBuilderVisual`: devuelve el constructor visual a su estado inicial y borra lo guardado. Es como decirle al programa: “olvida mis cambios y vuelve al punto de partida”.
10. `includedColumns`: es la lista de columnas que el usuario decidió tener en cuenta. Las columnas necesarias para el mapeo elegido se agregan solas para que el reporte funcione; las demás quedan a elección.
11. La sección “Calidad del archivo” funciona como un semáforo: muestra filas válidas, rechazadas, columnas incluidas, columnas ignoradas y mensajes de importación.
12. `secondaryDimensionFields` permite crear agrupaciones compuestas. Por ejemplo: ciudad + segmento se ve como `Ciudad > Segmento`.
13. La vista previa del wizard muestra algunas filas reales del Excel para escoger campos con más confianza. El modo oscuro/claro cambia una variable global del documento y CSS adapta los colores.
14. El tema elegido y el constructor visual se guardan en `localStorage`, que es memoria local del navegador. El reporte de calidad se puede exportar a CSV para revisar advertencias fuera de SmartBI.
15. `smartbi:mapping-template` es otra cajita de `localStorage`. Guarda la última configuración del wizard: columna principal, agrupaciones secundarias, métrica, filtros y columnas incluidas. Cuando se carga otro Excel, SmartBI primero revisa si esas columnas todavía existen; si no coinciden, no aplica la plantilla para evitar errores.
16. La tarjeta “Plantilla guardada disponible” no obliga al usuario a usar nada. Solo ofrece dos acciones seguras: aplicar la configuración anterior o borrarla y empezar limpio.
17. El constructor visual ahora puede agregar varios gráficos al “lienzo del reporte”. Es como tener una hoja donde vas pegando visuales: una barra, una dona, una tarjeta o una tabla.
18. La tabla de detalle tiene su propio buscador. Esto enseña una idea importante: un filtro global cambia todo el dashboard, pero un buscador de tabla solo ayuda a revisar filas dentro de la tabla.
19. La documentación interactiva guarda progreso en `smartbi:docs-progress`. Marcar un capítulo como leído no cambia el proyecto; solo ayuda a estudiar paso a paso.
20. El perfil de datos del Excel revisa cada columna y responde preguntas sencillas: qué tipo parece tener, cuántos valores únicos hay, cuántos vacíos tiene y para qué podría servir.
21. SmartBI sigue siendo una demo completa sin backend. Por eso sus memorias viven en `localStorage`, dentro del navegador.
22. En el lienzo del constructor visual ahora se puede cambiar el título de cada gráfico. Esto enseña una idea importante de interfaces: el usuario no solo mira datos, también organiza su historia.
23. Los botones de subir y bajar reordenan visuales sin borrar nada. Internamente el programa cambia el orden de la lista `canvasVisuals`, como mover tarjetas sobre una mesa.
24. Duplicar un visual crea una copia con otro identificador. Así se puede partir de un gráfico existente y modificarlo sin empezar desde cero.
25. La agregación responde a la pregunta “¿cómo resumo los números?”: suma, promedio, conteo, máximo o mínimo. Es una de las ideas principales de herramientas como Power BI.
26. Los filtros de rango permiten hacer preguntas como “muéstrame solo valores mayores a 100” o “solo fechas de este mes”. Lo importante es que el filtro se aplica antes de calcular tarjetas, gráficos y tabla.
27. La tabla tiene atajos de vista completa y vista mínima. Esto ayuda a aprender que una misma información puede verse con mucho detalle o de forma resumida, según la necesidad.
28. La prueba nueva de rangos confirma que el programa no solo muestra controles bonitos: también calcula correctamente cuando se filtra por número y fecha.
29. Cada página del informe puede tener visuales propios. El arreglo `pageIds` de un visual funciona como una lista de salones en los que ese cartel debe mostrarse.
30. `isDefault` marca la página que se abrirá primero. Solo una página puede tener esta responsabilidad.
31. `builderColor` y `builderSize` son propiedades del visual. Separar los datos de su presentación permite contar la misma historia con distintas apariencias.
32. La tabla usa virtualización en lotes grandes. Imagina una ventana frente a una fila enorme de tarjetas: React dibuja las que se ven por la ventana y deja espacios del mismo tamaño para conservar el desplazamiento.
33. Los atributos `aria-label`, `aria-live` y `aria-sort` son pistas para tecnologías de asistencia. No cambian el cálculo; ayudan a explicar la pantalla sin depender solamente de la vista.

Para una niña que está aprendiendo, una buena forma de leer este archivo es buscar primero `return (`. Ahí empieza “lo que se ve”. Después puede subir hacia arriba y mirar de dónde salen los datos que se muestran.

### `src/styles/global.css`

Define colores, espacios, tamaños y comportamiento responsive.

### Archivos `.test.ts` y `.test.tsx`

Son pruebas automáticas. Crean ejemplos y comparan el resultado con lo esperado.

## Capítulo 6 — Seguir una fila del Excel

Imagina esta fila simplificada:

```text
CATEGORIA=Software | DESCRIPCION=Licencia anual | VALOR=10 | CLIENTE=Cliente A
```

1. La librería de Excel entrega una lista de celdas.
2. `normalizeHeader` hace consistentes los títulos.
3. El importador busca una fila que parezca encabezado de tabla.
4. `rowToRecord` construye una fila con dos partes: campos especiales si existen y `raw` con todas las columnas originales.
5. El wizard pregunta al usuario qué columnas quiere usar.
6. `dashboardAnalytics.ts` suma, agrupa, filtra y ordena usando esa configuración.
7. `DashboardView` formatea el resultado.
8. React actualiza la tarjeta visible.

La separación es importante: cambiar el color de la tarjeta no debe alterar las matemáticas, y cambiar una fórmula no debería obligarnos a reescribir el gráfico.

## Capítulo 7 — Entender filtros sin miedo

`applyFilters` recibe todos los registros y un objeto de filtros. Para cada registro pregunta:

1. ¿Coincide con la búsqueda?
2. ¿Coincide con algún requerimiento seleccionado?
3. ¿Coincide con algun valor seleccionado?

Solo conserva la fila si las tres respuestas son verdaderas.

La expresión `!query || ...` significa:

- si no hay búsqueda, acepta la fila;
- si sí hay búsqueda, revisa los campos.

El método `.some(...)` pregunta si al menos un elemento cumple una condición. El método `.includes(...)` pregunta si un texto o lista contiene algo.

## Capítulo 8 — Entender `map`, `filter` y `reduce`

Son tres herramientas comunes para trabajar con listas.

### map: transformar

```ts
[1, 2, 3].map((number) => number * 2); // [2, 4, 6]
```

No elimina elementos; produce una nueva versión de cada uno.

### filter: seleccionar

```ts
[1, 2, 3, 4].filter((number) => number > 2); // [3, 4]
```

Conserva solo los elementos cuya condición es verdadera.

### reduce: acumular

```ts
[1, 2, 3].reduce((total, number) => total + number, 0); // 6
```

Lee la lista y mantiene un acumulador. SmartBI usa `reduce` para calcular todos los KPI en un solo recorrido.

## Capítulo 9 — Diseño responsive

Una pantalla de computador tiene más espacio que un teléfono. CSS usa `@media` para cambiar reglas cuando el ancho disminuye.

```css
@media (max-width: 760px) {
  .sidebar {
    position: fixed;
  }
}
```

Esto no crea otra aplicación. Es la misma estructura con reglas visuales distintas.

Prueba responsablemente:

1. Abre las herramientas del navegador con `F12`.
2. Activa la barra de dispositivos.
3. Prueba anchos como 375, 768 y 1440 píxeles.
4. Comprueba que no desaparezcan botones importantes.

## Capítulo 10 — Pruebas automáticas

Ejecuta:

```powershell
npm test
```

Una prueba tiene normalmente tres partes:

1. Preparar datos.
2. Ejecutar una función.
3. Comparar el resultado.

```ts
const result = parseNumber('158,5');
expect(result).toBe(158.5);
```

Esto protege un comportamiento. Si alguien cambia `parseNumber` y deja de aceptar la coma, la prueba avisa.

Otros comandos:

```powershell
npm run lint
npm run build
```

`lint` es como un corrector que busca patrones problemáticos. `build` intenta fabricar la versión que se publicaría.

## Capítulo 11 — Cómo investigar un error

No cambies cinco cosas a la vez. Usa esta secuencia:

1. Lee el mensaje completo.
2. Busca el primer archivo propio mencionado, no uno dentro de `node_modules`.
3. Identifica la línea.
4. Explica qué datos llegan allí.
5. Formula una hipótesis.
6. Cambia una sola cosa.
7. vuelve a ejecutar la prueba.

Ejemplo:

```text
Expected 10, received 8
```

La prueba esperaba 10 y recibió 8. No dice que la computadora esté dañada; dice que debemos revisar la regla, los datos del ejemplo o la expectativa.

## Capítulo 12 — Misiones progresivas

Haz una misión a la vez. Antes de cada una, comprueba que `npm test` funciona. Después, vuelve a ejecutarlo.

### Nivel 1: cambios visuales seguros

1. Cambia el texto “Seleccionar archivo” por “Elegir mi Excel”.
2. Cambia el color `--primary` en `global.css`.
3. Modifica el redondeo de `.upload-card` de `19px` a `8px` y observa la diferencia.
4. Cambia el título principal y vuelve a restaurarlo.

Qué aprenderás: texto JSX, clases CSS, variables y experimentación reversible.

### Nivel 2: componentes

1. Agrega una frase debajo del pie de página.
2. Añade una propiedad opcional a `Brand` para cambiar su tamaño.
3. Crea un componente pequeño llamado `Tip` que muestre un consejo.

Qué aprenderás: props, componentes y reutilización.

### Nivel 3: datos

1. En una prueba, crea dos registros y calcula el total de una métrica a mano.
2. Añade una prueba para búsqueda por código.
3. Cambia temporalmente el limite de elementos de ranking de 8 a 5.

Qué aprenderás: arrays, objetos, funciones y pruebas.

### Nivel 4: una función nueva

Crea en una prueba una lista de registros y cuenta cuántos tienen un campo vacío:

```ts
export function countEmptyField(records: DataRecord[], field: string) {
  return records.filter((record) => !record.raw[field]).length;
}
```

Después escribe una prueba. No agregues todavía la tarjeta visual; primero comprueba que la regla funciona.

### Nivel 5: proyecto personal

Elige otro tema que te interese: libros, animales, videojuegos o películas. Dibuja en papel un pequeño dashboard y responde:

- ¿Qué representa una fila?
- ¿Qué columnas necesitaría?
- ¿Qué tres totales serían útiles?
- ¿Qué filtro usaría?
- ¿Qué gráfico ayudaría realmente?

Diseñar datos es parte de programar.

## Capítulo 13 — Git como máquina del tiempo

Git guarda versiones. Antes de usarlo, revisa qué cambió:

```powershell
git status
git diff
```

Cuando el cambio está probado:

```powershell
git add src/ruta/del/archivo
git commit -m "docs: explain upload component"
```

No copies comandos destructivos. Nunca uses `git reset --hard` para “probar” algo sin ayuda, porque puede borrar cambios.

Una buena práctica educativa es que cada misión pequeña tenga su propio commit. Así pueden comparar versiones y volver atrás.

## Capítulo 14 — Seguridad y ciudadanía digital

- No compartas nombres, direcciones, teléfonos, documentos o contraseñas.
- Un archivo de trabajo puede contener información privada aunque no lo parezca.
- No publiques el Excel piloto sin permiso.
- No ejecutes código copiado sin entender su propósito.
- Las dependencias también son código de otras personas; por eso se auditan.
- La aplicación descarta `SQL` porque no es necesario para analizar y podría contener instrucciones sensibles.
- Pedir ayuda es una habilidad profesional.

## Capítulo 15 — Glosario corto

| Palabra | Explicación sencilla |
|---|---|
| API | Acuerdo para que dos piezas de software se comuniquen |
| Bug | Comportamiento incorrecto o inesperado |
| Build | Versión optimizada lista para publicar |
| Callback | Función entregada para que otra pieza la llame después |
| Componente | Pieza reutilizable de una interfaz React |
| CSS | Reglas de apariencia |
| Dashboard | Pantalla que resume datos con indicadores y gráficos |
| Dependencia | Paquete de código externo usado por el proyecto |
| Estado | Memoria que cambia dentro de un componente |
| Fixture | Datos preparados especialmente para una prueba |
| Hook | Función especial de React, como `useState` |
| Importador | Código que transforma un formato externo al modelo interno |
| Interface | Molde de datos en TypeScript |
| JSX | Sintaxis parecida a HTML usada por React |
| KPI | Indicador importante resumido |
| Lint | Revisión automática de estilo y posibles errores |
| MVP | Versión mínima que ya resuelve el problema principal |
| Prop | Dato que un componente recibe de su padre |
| Responsive | Diseño que se adapta al tamaño de pantalla |
| TypeScript | JavaScript con comprobación de tipos |
| UI | Interfaz que ve y usa una persona |
| Accesibilidad | Crear una interfaz que también pueda usarse con diferentes capacidades y herramientas |
| ARIA | Atributos que explican controles y cambios a tecnologías de asistencia |
| Contraste | Diferencia visual entre un texto o control y su fondo |
| LocalStorage | Memoria pequeña del navegador para preferencias locales |
| Virtualización | Dibujar solamente los elementos visibles de una lista grande |
| Web Worker | Ayudante del navegador que ejecuta cálculos fuera del hilo principal |

## Capítulo 16 — Mini laboratorio de accesibilidad

Prueba estas misiones sin cambiar código:

1. Guarda el ratón y usa únicamente `Tab`, `Shift + Tab`, `Enter` y `Espacio`.
2. En las páginas del informe usa flechas izquierda y derecha; prueba también `Inicio` y `Fin`.
3. Aumenta el zoom del navegador al 200 % y comprueba que todavía puedes usar los botones.
4. Activa “Reducir movimiento” en el sistema operativo y observa que SmartBI evita animaciones largas.
5. Imagina que no ves los gráficos. Lee sus títulos, KPIs y descripciones y pregunta si aún puedes entender la idea principal.

Ejercicio de reflexión:

> Una función puede ser técnicamente correcta y aun así ser difícil de usar. ¿Qué cambio pequeño haría que otra persona entendiera mejor esa función?

## Capítulo 17 — Diario de aprendizaje

Después de cada sesión, completa cuatro líneas:

```text
Hoy quería:
Probé:
Descubrí:
La próxima vez quiero:
```

Dentro de varias semanas este diario mostrará algo que a veces no se nota día a día: cuánto has aprendido.
