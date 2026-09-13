# Despliegue de SmartBI

## 1. Decisión de arquitectura

SmartBI v0.1.0 se despliega **sin Docker**.

React y Vite generan una aplicación estática en `dist/`. En producción no hay
un proceso Node.js, API, base de datos ni backend que mantener. El servidor ya
tiene Nginx activo, por lo que Nginx puede entregar esos archivos directamente.

Docker aportaría aislamiento si existiera un servicio en ejecución. Para este
caso solo duplicaría el servidor web, consumiría recursos y agregaría otra capa
de configuración. Si SmartBI incorpora un backend en el futuro, la decisión se
debe revisar mediante un ADR nuevo.

## 2. Destino confirmado

Estado: demo publicada con HTTPS el 2026-09-12 (2026-09-13 UTC). El detalle de
validaciones y limitaciones está en [CURRENT_STATUS.md](../CURRENT_STATUS.md).
El bootstrap ya fue ejecutado; las próximas entregas usan únicamente
`npm run deploy:production`.

| Elemento | Valor |
|---|---|
| Repositorio | `https://github.com/dafermen/SmartBi.git` |
| Rama de producción | `main` |
| Dominio | `https://smartbi.innovalogic.tech` |
| Alias SSH local | `ruteza-dev` |
| Servidor | Ubuntu 24.04 LTS, Nginx 1.24 |
| Raíz remota | `/var/www/smartbi.innovalogic.tech` |
| Certificados | Let's Encrypt mediante Certbot |

El 12 de septiembre de 2026 se verificó que el registro A del subdominio apunta
al servidor y que Nginx y la renovación automática de Certbot están activos.

## 3. Seguridad de credenciales

La clave privada permanece únicamente en `C:\Users\dafer\.ssh`. Nunca debe:

- copiarse dentro del proyecto;
- subirse a GitHub;
- pegarse en documentación, issues o capturas;
- convertirse en una variable `VITE_*`, porque esas variables son públicas.

Los scripts usan el alias `ruteza-dev` definido en el archivo SSH local. La
verificación estricta del host permanece habilitada.

Los comandos de despliegue usan PowerShell 7 (`pwsh`), disponible en el equipo
de desarrollo. Esta versión interpreta correctamente los scripts UTF-8 y evita
mensajes con caracteres dañados de Windows PowerShell 5.

`.gitattributes` obliga a conservar finales de línea LF en los scripts Bash,
incluso cuando Git trabaja desde Windows. Esto evita el error `bad interpreter`
al ejecutar los archivos en Ubuntu.

## 4. Modelo de versiones

Cada compilación se instala en una carpeta inmutable:

```text
/var/www/smartbi.innovalogic.tech/releases/AAAAMMDDhhmmss-COMMIT/
```

Nginx sirve el enlace:

```text
/var/www/smartbi.innovalogic.tech/current
```

El instalador extrae primero la versión completa, comprueba `index.html` y
`assets/`, ajusta permisos de solo lectura y finalmente mueve `current`. Este
cambio es atómico: una visita recibe la versión anterior o la nueva, nunca una
copia incompleta.

Además valida el SHA-256 del paquete y usa un bloqueo para impedir despliegues
y rollbacks simultáneos. Conserva assets con hash de la versión anterior para
que las pestañas abiertas puedan terminar de cargar sus módulos.
`/release.json` permite comprobar el identificador exacto que está sirviendo
Nginx, no solo que una página cualquiera responde con estado 200.

Las versiones antiguas no se eliminan automáticamente. Esto favorece un
rollback seguro y evita borrados automáticos en el servidor compartido.

## 5. Preparación única del repositorio

La carpeta local ya está enlazada con `origin/main`. Antes del primer despliegue
se deben confirmar y subir todos los archivos:

```powershell
cd C:\Projects\SmartBI
git status
git add .
git commit -m "Prepare SmartBI v0.1.0 deployment"
git push origin main
```

Revisar antes que ningún Excel privado, `.env` o clave SSH aparezca en
`git status`. `.gitignore` excluye libros Excel y capturas de QA; solo permite la
muestra sintética de `tests/fixtures/` y las imágenes públicas de
`public/docs/screenshots/`, creadas con datos ficticios.

El propietario confirmó MIT a nombre de Dario Meneses y autorizó la publicación
demo el 12 de septiembre de 2026. La licencia local y los metadatos npm ya
coinciden. La aceptación humana formal sigue abierta y no se presenta como
completada por el hecho de desplegar la demo.

## 6. Pruebas que bloquean el despliegue

El comando único es:

```powershell
npm run deploy:check
```

Ejecuta:

1. lint;
2. pruebas unitarias, de integración, contratos e invariantes disponibles;
3. verificación de enlaces documentales;
4. build de producción;
5. E2E en seis perfiles de navegador sobre `dist/`, usando el servidor preview
   aislado del puerto 4173 (`npm run test:e2e:production`);
6. auditoría de dependencias que llegan a producción.

No reemplaza las validaciones humanas pendientes: aceptación, lector de
pantalla, zoom/contraste y Safari físico. Las 13 categorías y su estado están
en `docs/TESTING.md`.

El script de despliegue vuelve a ejecutar estas verificaciones y se detiene ante
cualquier error. También exige:

- árbol Git sin cambios;
- rama `main`;
- commit local idéntico a `origin/main`.

## 7. Primer despliegue

Con autorización explícita de publicación demo y el commit ya subido:

```powershell
cd C:\Projects\SmartBI
npm run deploy:production -- -Initial
npm run deploy:bootstrap
```

El primer comando instala la primera versión, pero no cambia Nginx. El segundo:

1. instala temporalmente un sitio HTTP que solo permite el desafío del certificado;
2. valida Nginx antes de recargar;
3. solicita el certificado de `smartbi.innovalogic.tech` con Certbot;
4. instala la configuración HTTPS definitiva;
5. vuelve a validar Nginx;
6. comprueba el sitio y encabezados esenciales.

El bootstrap se niega a sobrescribir un sitio existente. Si falla, retira solo
los archivos de configuración que acaba de crear para SmartBI y valida Nginx
antes de recargarlo. Conserva certificados y versiones, sin tocar otras apps.
La renovación del certificado incluye un hook que valida y recarga Nginx.

## 8. Despliegues posteriores

Con Nginx y HTTPS ya preparados:

```powershell
cd C:\Projects\SmartBI
npm run deploy:production
```

El flujo completo es:

```text
Git limpio y sincronizado
        ↓
npm ci + pruebas + build + auditoría
        ↓
paquete temporal de dist/
        ↓
nueva carpeta releases/<versión>
        ↓
cambio atómico del enlace current
        ↓
comprobación HTTPS
```

## 9. Rollback

Para listar las versiones disponibles sin modificar el servidor:

```powershell
npm run deploy:rollback
```

Para activar una versión concreta:

```powershell
npm run deploy:rollback -- -ReleaseId 20260912183000-abc1234
```

El script valida el formato, confirma que la versión contiene una compilación y
comprueba nuevamente el sitio público. No borra ninguna versión.

## 10. Archivos de infraestructura

```text
deploy/
├── README.md
├── nginx/
│   ├── smartbi-http.conf
│   ├── smartbi.conf
│   └── nginx-test-wrapper.conf
└── server/
    ├── bootstrap-smartbi.sh
    ├── install-release.sh
    └── rollback-release.sh

scripts/
├── bootstrap-production.ps1
├── deploy-production.ps1
└── rollback-production.ps1
```

El workflow `release-artifact.yml` permite generar manualmente en GitHub un
artefacto de `dist/` validado. No despliega al servidor y no necesita copiar la
clave SSH a GitHub.

## 11. Verificación posterior

Comprobaciones mínimas:

```powershell
curl.exe -I https://smartbi.innovalogic.tech/
```

Esperar:

- estado `200`;
- `Content-Security-Policy`;
- `Strict-Transport-Security`;
- `X-Content-Type-Options: nosniff`;
- redirección de HTTP a HTTPS.

Después completar un recorrido real:

1. abrir la página principal;
2. cargar un `.xlsx` anónimo;
3. recorrer los tres pasos del wizard;
4. crear un dashboard y aplicar filtros;
5. abrir documentación mediante un enlace profundo;
6. recargar y usar Atrás/Adelante;
7. probar escritorio y móvil.

Los recorridos automatizados también pueden ejecutarse contra el sitio real:

```powershell
$env:SMARTBI_E2E_BASE_URL = 'https://smartbi.innovalogic.tech'
npm run test:e2e
Remove-Item Env:SMARTBI_E2E_BASE_URL
```

Usan una sesión vacía y datos inventados. No suben el Excel al servidor.

## 12. Diagnóstico

Consultar Nginx sin cambiar el servidor:

```powershell
ssh ruteza-dev "nginx -t"
ssh ruteza-dev "tail -n 100 /var/log/nginx/smartbi-error.log"
```

Ver la versión activa:

```powershell
ssh ruteza-dev "readlink -f /var/www/smartbi.innovalogic.tech/current"
```

Problemas frecuentes:

- **El script rechaza cambios locales:** hacer commit y push; no omitir el control.
- **El certificado falla:** confirmar DNS, puerto 80 y revisar Certbot.
- **Los assets dan 404:** confirmar `VITE_BASE_PATH=/` y repetir el build.
- **Un enlace recargado falla:** confirmar `try_files ... /index.html` en Nginx.
- **La nueva versión falla:** ejecutar el rollback con el identificador anterior.

## 13. Qué no automatizamos todavía

- La aceptación de una persona usuaria.
- Las pruebas físicas con Safari y lector de pantalla.
- El borrado de versiones antiguas.
- El despliegue automático al hacer push.
- La copia de claves privadas a servicios externos.

Estas decisiones son deliberadas para que la primera publicación sea observable
y reversible.
