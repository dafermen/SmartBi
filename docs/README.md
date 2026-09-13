# Documentación técnica de SmartBI

Esta carpeta contiene la documentación técnica y operativa. La guía [Sistema de documentación](DOCUMENTATION.md) explica cómo se une con `doc/` dentro de la biblioteca interactiva, cómo crear capítulos y cómo validar enlaces.

Importante: `doc/` conserva aprendizaje, producto, manuales, planificación y evidencias del MVP. `docs/` conserva arquitectura, calidad, despliegue, operación y continuidad. No se debe duplicar un documento para moverlo de categoría.

## Para empezar

- [Desarrollo local](DEVELOPMENT.md)
- [Sistema de documentación](DOCUMENTATION.md)
- [Solución de problemas](TROUBLESHOOTING.md)

## Arquitectura y contratos

- [Arquitectura](ARCHITECTURE.md)
- [API interna y contratos](API.md)
- [Decisiones de arquitectura](adr/)

## Calidad y experiencia

- [Estrategia de pruebas](TESTING.md)
- [Accesibilidad](ACCESSIBILITY.md)
- [Rendimiento](PERFORMANCE.md)
- La compatibilidad detallada vive en `doc/06_COMPATIBILIDAD_Y_PRUEBAS_NAVEGADORES.md`.

## Entrega y operación

- [Despliegue](DEPLOYMENT.md)
- [Operación](OPERATIONS.md)
- [Seguridad](SECURITY.md)
- [Notas de versión 0.1.0](RELEASE_0.1.0.md)

## Continuidad

Antes de iniciar una nueva sesión de trabajo, leer en este orden:

1. `AGENTS.md`.
2. `CURRENT_STATUS.md`.
3. `README.md`.
4. Este índice.
5. El documento específico de la tarea.

## Validación rápida

```powershell
npm run docs:check
npm run lint
npm run build
```

El build también valida que los Markdown registrados en `src/features/documentation/documents.ts` puedan incorporarse al lector de la aplicación.
