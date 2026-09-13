# Operación — SmartBI

## Alcance operativo

SmartBI opera como aplicación estática. No hay servidor de aplicación, base de datos ni cola de trabajos.

## Datos

- Los Excel se procesan localmente en el navegador.
- No se guarda el contenido del Excel en servidor.
- LocalStorage guarda preferencias y configuración demo, no archivos completos.

## Monitoreo recomendado

Para una demo local:

- Verificar que la app carga.
- Verificar que el wizard abre después de importar Excel.
- Verificar que el dashboard responde a filtros.
- Revisar consola del navegador si hay errores.

Para el hosting público preparado en `smartbi.innovalogic.tech`:

- Monitorear disponibilidad de la página.
- Revisar errores JavaScript con herramienta compatible, cuidando no enviar datos sensibles.
- Medir tiempos de carga de assets.
- Revisar `/var/log/nginx/smartbi-error.log` cuando falle una solicitud.
- Confirmar periódicamente que `certbot.timer` continúa activo.

## Versión activa y rollback

Nginx sirve el enlace remoto:

```text
/var/www/smartbi.innovalogic.tech/current
```

Para listar versiones sin cambiar nada:

```powershell
npm run deploy:rollback
```

Para reactivar una versión conocida:

```powershell
npm run deploy:rollback -- -ReleaseId IDENTIFICADOR
```

La guía completa está en `docs/DEPLOYMENT.md`.

## Limpieza local

Si la app queda en estado extraño:

1. Abrir DevTools.
2. Limpiar LocalStorage del sitio.
3. Recargar la página.
4. Importar nuevamente el Excel.

## Evidencia de QA

La evidencia responsive está en:

```text
doc/qa-responsive
```
