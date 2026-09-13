# Notas de versión — SmartBI v0.1.0

Estado: candidata a versión formal; publicación demo autorizada el 2026-09-12.
Falta aceptación humana final. Licencia MIT confirmada.

## Qué incluye

- Importación local de Excel `.xlsx` sin plantilla fija.
- Wizard para agrupaciones, métrica, fecha, columnas y filtros.
- Dashboard responsive con KPIs, gráficos, filtros, tabla y exportación CSV.
- Páginas reordenables con página inicial y secciones configurables.
- Visuales propios por página.
- Constructor con barras, línea, área, dona, tarjeta y tabla.
- Propiedades de color y tamaño por visual.
- Orden por botones y drag and drop.
- Perfil de datos con Web Worker para archivos grandes.
- Tabla virtualizada para lotes grandes.
- Temas claro y oscuro.
- Documentación interactiva y material didáctico.
- Manual ilustrado con diez capturas reales de datos ficticios.
- Mejoras de teclado, lectores de pantalla, foco y movimiento reducido.
- Pruebas unitarias, lint, build y E2E multi-navegador.
- Entrega Nginx preparada para `smartbi.innovalogic.tech`, con versiones
  atómicas, HTTPS, encabezados de seguridad y rollback.

## Seguridad y privacidad

- El Excel se procesa en el dispositivo.
- SmartBI no envía el archivo a un servidor.
- La columna `SQL` se descarta.
- Las preferencias de la demo viven en `localStorage`.
- La entrega incluye CSP y política `no-referrer`.
- La clave SSH no forma parte del repositorio ni del artefacto compilado.

## Limitaciones conocidas

- Solo se acepta `.xlsx` y el límite actual es 15 MB.
- No hay cuentas, servidor, base de datos ni colaboración.
- Borrar los datos del navegador elimina preferencias y composición.
- La detección de tipos es orientativa; el usuario debe revisar el wizard.
- No existe exportación PDF del informe.
- Safari físico y lectores de pantalla todavía requieren evidencia manual final.
- La conformidad WCAG 2.2 AA no debe declararse completa hasta cerrar el checklist manual.

## Condición para publicar

1. Ejecutar la matriz de pruebas definida en `docs/TESTING.md`.
2. Completar `doc/10_CHECKLIST_ACEPTACION_FINAL.md`.
3. Registrar resultados en `CURRENT_STATUS.md`.
4. Crear la etiqueta Git `v0.1.0` solamente después de la aprobación.
5. Ejecutar el primer despliegue y la comprobación posterior descritos en
   `docs/DEPLOYMENT.md`.
