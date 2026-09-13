# Infraestructura de despliegue de SmartBI

Esta carpeta contiene archivos que preparan el servidor, pero **ninguno se
ejecuta automáticamente** al instalar dependencias o al abrir la aplicación.

## Decisión: Nginx sin Docker

SmartBI es una aplicación React que, después de `npm run build`, se convierte
en HTML, CSS, JavaScript y otros archivos estáticos dentro de `dist/`. No existe
un proceso Node.js ni un backend que deba permanecer encendido.

El servidor ya utiliza Nginx 1.24 como entrada pública. Servir `dist/`
directamente evita:

- mantener una imagen y un contenedor solo para archivos estáticos;
- reservar otro puerto local;
- duplicar Nginx dentro de Docker;
- consumir memoria y sumar una capa de diagnóstico sin necesidad.

Docker sigue siendo apropiado para las otras aplicaciones del servidor que sí
tienen procesos, API o bases de datos. No es necesario para SmartBI v0.1.0.

## Archivos

- `nginx/smartbi-http.conf`: configuración temporal para solicitar HTTPS.
- `nginx/smartbi.conf`: configuración final con SPA fallback, caché y headers.
- `nginx/nginx-test-wrapper.conf`: envoltura aislada para validar con `nginx -t`.
- `server/install-release.sh`: instala una compilación mediante versiones.
- `server/bootstrap-smartbi.sh`: prepara Nginx y Certbot una sola vez.
- `server/rollback-release.sh`: reactiva una versión anterior.

Los scripts de Windows que coordinan estos archivos viven en `scripts/`.

## Estructura creada en el servidor

```text
/var/www/smartbi.innovalogic.tech/
├── acme/                         # validaciones de Let's Encrypt
├── current -> releases/...       # versión que Nginx sirve ahora
└── releases/
    ├── 20260912180000-abc1234/
    └── 20260913103000-def5678/
```

El cambio del enlace `current` es atómico. Las versiones anteriores no se
borran automáticamente y permiten rollback.

## Orden del primer despliegue

1. Aprobar las pruebas manuales descritas en `doc/10_CHECKLIST_ACEPTACION_FINAL.md`.
2. Confirmar y subir el código a `origin/main`.
3. Ejecutar `npm run deploy:production -- -Initial`.
4. Ejecutar `npm run deploy:bootstrap`.
5. Revisar `https://smartbi.innovalogic.tech` en escritorio y móvil.

Para despliegues siguientes solo se usa `npm run deploy:production`.

Los detalles, precondiciones y solución de problemas están en
`docs/DEPLOYMENT.md`.
