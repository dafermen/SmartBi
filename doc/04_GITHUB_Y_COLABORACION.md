# GitHub y colaboración — SmartBI

## 1. Repositorio y licencia

El repositorio oficial es [dafermen/SmartBi](https://github.com/dafermen/SmartBi).
La rama de entrega es `main`. El propietario confirmó la licencia MIT el
12 de septiembre de 2026; el texto completo está en [LICENSE](../LICENSE).
Las dependencias conservan sus licencias originales.

Git guarda versiones del proyecto; GitHub permite compartirlas. Imagina que
cada commit es una fotografía del trabajo con una explicación de qué cambió.
Subir un commit no despliega automáticamente la aplicación.

## 2. Descargar y ejecutar por primera vez

Necesitas Git y Node.js 24 LTS con npm. En una carpeta de proyectos:

```powershell
git clone https://github.com/dafermen/SmartBi.git SmartBI
cd SmartBI
npm ci
npm run dev:5171
```

Abre `http://127.0.0.1:5171`. No necesitas iniciar un backend.
Si ya tienes la carpeta de trabajo, no vuelvas a ejecutar `git init` ni crees
una segunda copia: revisa primero `git status` y [AGENTS.md](../AGENTS.md).

## 3. Qué se publica y qué no

Se publican código, documentación, pruebas, configuración de entrega y capturas
con datos ficticios. La única muestra Excel pública permitida es
`tests/fixtures/smartbi-synthetic-sample.xlsx`.

No se publican archivos Excel personales, claves SSH, contraseñas, `.env`,
`node_modules/`, `dist/`, paquetes temporales ni capturas antiguas de QA.
El [.gitignore](../.gitignore) ayuda, pero siempre revisa el contenido que vas
a confirmar. Un archivo excluido no está protegido si ya se había confirmado.

## 4. Trabajar en una mejora

```powershell
git switch -c docs/mejorar-manual
git status
```

Haz un cambio pequeño, pruébalo y actualiza la documentación correspondiente.
Antes de confirmar:

```powershell
npm run deploy:check
git diff
git add RUTA_DEL_ARCHIVO
git diff --cached
git commit -m "docs: mejora el manual ilustrado"
git push -u origin docs/mejorar-manual
```

Sustituye `RUTA_DEL_ARCHIVO` por un archivo real revisado. No ejecutes un
`git add .` a ciegas si hay documentos o datos privados en la carpeta.

Prefijos útiles: `feat:` para funciones nuevas, `fix:` para correcciones,
`docs:` para documentación y `test:` para pruebas. La rama `main` debe
conservarse estable y nunca se debe sobrescribir con un force-push.

## 5. Pull requests y revisión

Un pull request propone incorporar una rama a `main`. Explica:

- qué cambió y por qué;
- cómo se probó;
- qué imágenes ayudan a entenderlo;
- qué limitaciones siguen pendientes.

Las plantillas de [.github/](../.github/) ayudan a preparar issues y revisiones.
Se recomienda proteger `main` y pedir revisión, pero no se afirma que esas
reglas estén activadas: su configuración depende del propietario del repositorio.

## 6. Automatización de calidad

El workflow [ci.yml](../.github/workflows/ci.yml) se ejecuta en pushes y pull
requests. Instala las dependencias exactas, audita producción, ejecuta lint,
pruebas, verificación de enlaces, build y recorridos en navegadores sobre el
resultado compilado. Si falla, no debe desplegarse esa versión.

El workflow manual [release-artifact.yml](../.github/workflows/release-artifact.yml)
genera un paquete validado de `dist/`. No contiene claves y no cambia el servidor.

## 7. Entrega y recuperación

La demo se entrega en [SmartBI](https://smartbi.innovalogic.tech) como archivos
estáticos mediante Nginx, sin Docker ni backend.
Consulta [Despliegue](../docs/DEPLOYMENT.md) para el procedimiento autorizado,
la comprobación posterior y el rollback.

Los scripts exigen un commit limpio y publicado en `origin/main`, ejecutan
pruebas y conservan versiones anteriores. La etiqueta formal `v0.1.0` espera
la aceptación final; publicar una demo no equivale a certificar todas las
pruebas manuales de accesibilidad.

## 8. Continuidad del proyecto

Antes de cerrar una mejora, actualiza [CURRENT_STATUS.md](../CURRENT_STATUS.md),
[CHANGELOG.md](../CHANGELOG.md) y el
[plan de fases](01_PLAN_FASES_Y_TAREAS.md). Otra persona debe poder saber qué
está terminado, qué se comprobó y qué falta sin adivinarlo a partir del chat.
