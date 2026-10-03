# Navegación web de documentación · InnovaLogic v1

Actualización local: 2026-10-03. Entrada: `/#/docs/<id>`.

## Experiencia de lectura

Biblioteca, búsqueda, categorías, índice, recorridos, fragmentos y copia de código. Preferencia visual con tolerancia al almacenamiento bloqueado.

La documentación comparte azul `#2563eb`, cian `#0ea5e9`, superficies neutras y alternativa oscura. La aplicación conserva su propia identidad. Los colores son una base editable para la futura firma visual de InnovaLogic.

## Mantenimiento

Editar los tokens `--docs-accent`, `--docs-ink`, `--docs-muted` y las superficies en [src/features/documentation/innovalogic.css](../src/features/documentation/innovalogic.css); verificar ambos temas. Mantener Markdown como fuente y conservar identificadores/enlaces existentes. Agregar documentos solo al catálogo explícito: no rastrear carpetas privadas. No editar los artefactos generados.

## Evidencia y alcance

deploy:check completo: 51 pruebas y 18 E2E; navegador en 1440/390 px. Se revisaron teclado, navegación móvil, búsqueda, copia y desbordamientos según los controles disponibles. Las pruebas de interfaz con datos sintéticos no sustituyen la validación del backend real ni una auditoría WCAG completa.

Esta revisión permanece local: no se ha publicado en GitHub ni desplegado. Se mantienen las exclusiones del portafolio y los bloqueos de producto o publicación anteriores. Siguiente paso: revisar el cambio y seguir el procedimiento de entrega del proyecto cuando corresponda.
