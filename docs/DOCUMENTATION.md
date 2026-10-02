# Sistema de documentación de SmartBI

Este documento explica cómo se organiza, navega y valida la documentación. Su objetivo es que una persona nueva —o una futura sesión de Codex— pueda encontrar la fuente correcta sin crear copias contradictorias.

## Una biblioteca, dos carpetas

SmartBI conserva dos carpetas por una razón concreta:

- `doc/` contiene guías didácticas, producto, manual de usuario, planificación y evidencias históricas del MVP.
- `docs/` contiene arquitectura, desarrollo, calidad, seguridad, despliegue y operación.

No deben copiarse documentos de una carpeta a la otra. La aplicación importa ambos grupos como texto Markdown y los presenta en una sola biblioteca.

## Navegación dentro de la aplicación

La documentación utiliza rutas con fragmento:

```text
/#/docs/aprender
/#/docs/arquitectura
/#/docs/estado-actual
```

Se eligió este formato porque SmartBI es una aplicación estática. El fragmento situado después de `#` lo interpreta el navegador y no exige una ruta física equivalente en Nginx u otro servidor estático. Así, un enlace puede copiarse, recargarse y abrirse directamente sin producir un error 404.

El botón **Documentación** abre la biblioteca. El botón **Volver a SmartBI** y la flecha Atrás del navegador regresan a la vista desde la que se abrió.

## Categorías oficiales

El índice visual utiliza estas categorías y este orden:

1. Primeros pasos.
2. Producto.
3. Arquitectura y desarrollo.
4. Calidad y experiencia.
5. Entrega y operación.
6. Gestión del proyecto.

Las categorías no cambian la ubicación física de los archivos. Solo funcionan como estantes para encontrarlos con más facilidad.

## Cómo publicar un documento en la biblioteca

1. Crear o actualizar el Markdown en `doc/` o `docs/`.
2. Abrir `src/features/documentation/documents.ts`.
3. Importar el archivo con el sufijo `?raw`.
4. Agregar una entrada a `DOCUMENTATION_PAGES` con:
   - `id` único y estable;
   - `number` visible;
   - `title` y `description` comprensibles;
   - `audience`;
   - `category` existente;
   - `sourcePath` real;
   - `content` importado.
5. Ejecutar las validaciones indicadas al final de este documento.

No debe reutilizarse un `id`: ese valor se guarda en LocalStorage para recordar el progreso de lectura y también forma parte del enlace compartible.

## Enlaces entre documentos

Los enlaces Markdown deben ser relativos al archivo que los contiene. Ejemplo desde `docs/`:

```markdown
[Revisar seguridad](SECURITY.md)
```

Cuando el archivo enlazado pertenece a la biblioteca, SmartBI abre el capítulo correspondiente sin abandonar la aplicación. Los vínculos externos se abren en una pestaña nueva.

Evitar:

- rutas absolutas de un computador, como `C:\Projects\SmartBI`;
- enlaces inventados a documentos que todavía no existen;
- crear una carpeta `docs/docs/`;
- duplicar contenido para que aparezca en otra categoría.

## Reglas de experiencia de lectura

La biblioteca debe conservar:

- buscador local por título, descripción y contenido;
- página activa claramente identificada;
- categorías visibles;
- tabla de contenido del capítulo;
- navegación Anterior/Siguiente;
- modo claro y oscuro;
- retorno visible a la aplicación;
- menú móvil operable con teclado y botón de cierre;
- objetivos táctiles de al menos 44 por 44 píxeles en pantallas pequeñas;
- foco visible y respeto por `prefers-reduced-motion`.

## Capturas reales del producto

El manual de usuario contiene diez capturas en `public/docs/screenshots/`.
Solo se usa `tests/fixtures/smartbi-synthetic-sample.xlsx`, con datos inventados.
Las capturas antiguas de `doc/qa-responsive/` no deben publicarse: pueden
contener datos privados de pruebas históricas.

Para regenerarlas, inicia SmartBI en una terminal con `npm run dev:5171` y,
en otra terminal, ejecuta `npm run docs:screenshots`. El script crea una sesión
de navegador limpia y recorre el asistente, dashboard y biblioteca. Si cambias
el diseño, inspecciona las imágenes antes de confirmarlas en Git.

Desde un Markdown de `doc/` o `docs/`, usa rutas relativas como
`../public/docs/screenshots/01-inicio.jpg` y un texto alternativo que explique
la imagen. El lector transforma esa ruta a la URL pública sin duplicar archivos.
Solo admite capturas locales JPG, PNG y WebP de esa carpeta; no carga imágenes
remotas de seguimiento. Las imágenes se cargan al acercarse a ellas y respetan
el ancho disponible en móvil.

Al pulsar una captura, se abre su tamaño completo en otra pestaña, sin perder
la página del manual ni el informe que estaba cargado.

Los tests E2E comprueban la carga de las diez imágenes, sus textos alternativos
y la ausencia de desbordamiento horizontal en los seis perfiles de navegador.

## Validaciones después de modificar la biblioteca

Después de cambiar documentación o navegación:

```powershell
npm run docs:check
npm run test
npm run lint
npm run build
npm run test:e2e
```

`docs:check` verifica que los enlaces locales de los Markdown apunten a archivos existentes. El build de Vite confirma que los documentos importados pueden formar parte de la biblioteca.

La revisión manual mínima incluye:

- abrir Documentación desde la pantalla inicial y desde el dashboard;
- buscar una palabra con resultados y otra sin resultados;
- abrir un capítulo de cada categoría;
- usar Anterior y Siguiente;
- copiar y recargar un enlace `#/docs/...`;
- volver con el botón visible y con Atrás del navegador;
- probar claro y oscuro;
- probar el menú a 390 píxeles de ancho con teclado.

## Decisión consciente sobre `/docs/`

No se creó un segundo sitio ni se migró a VitePress, Docusaurus u otra herramienta. La solución React actual ya integra aprendizaje y producto, reutiliza la identidad visual y evita mantener dos builds.

Una ruta física `/docs/` solo debe adoptarse si el alojamiento garantiza redirecciones de SPA o si se publica un sitio documental independiente. Hasta entonces, `/#/docs/...` es la alternativa más estable y portable.

## DOC-STD-20261002 — Fuentes canónicas y mantenimiento

Adopción del estándar documental v1.0 del catálogo de proyectos. Idioma principal: español. Perfil: web estática; el procesamiento del Excel ocurre en el navegador.

| Necesidad | Fuente oficial |
| --- | --- |
| Probar y aprender | [Manual ilustrado](../doc/09_MANUAL_FINAL_DE_USUARIO.md) |
| Conocer el estado y continuar | [Estado actual](../CURRENT_STATUS.md) |
| Instalar y desarrollar | [Desarrollo](DEVELOPMENT.md) |
| Comprender componentes y contratos | [Arquitectura](ARCHITECTURE.md) y [API interna](API.md) |
| Verificar calidad y límites | [Pruebas](TESTING.md), [accesibilidad](ACCESSIBILITY.md) y [rendimiento](PERFORMANCE.md) |
| Publicar y recuperar | [Despliegue](DEPLOYMENT.md) y [operación](OPERATIONS.md) |
| Proteger los datos | [Seguridad](SECURITY.md) |
| Resolver fallos | [Solución de problemas](TROUBLESHOOTING.md) |

El estado vigente pertenece a CURRENT_STATUS; los informes de entrega y el changelog conservan historia. Los contratos de API son internos: no implican un servicio remoto. No se necesita un archivo de claves de backend para ejecutar SmartBI.

Para una persona que evalúa el portafolio: abrir el manual, probar con datos sintéticos y consultar las limitaciones. Para desarrollar: leer desarrollo, arquitectura y pruebas. Para operar: usar despliegue y operación, conservando versiones anteriores.

Al cambiar un comando, ruta, comportamiento o captura, actualizar su guía de origen y ejecutar las validaciones de este documento. Mantener la separación de doc/ y docs/ y los identificadores actuales de la biblioteca. No copiar el mismo procedimiento a varios documentos.

La revisión documental no cierra la aceptación humana, accesibilidad, Safari físico ni la intermitencia de Firefox registradas en el estado actual. Cada validación debe indicar fecha, entorno y resultado; una compilación correcta no certifica esas pruebas manuales.
