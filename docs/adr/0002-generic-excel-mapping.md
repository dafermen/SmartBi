# ADR 0002 — El Excel no tendrá plantilla fija

## Estado

Aceptada.

## Contexto

El usuario quiere cargar archivos con columnas diferentes y escoger qué campos usar para agrupar, filtrar y calcular métricas.

## Decisión

SmartBI no dependerá de nombres fijos de columnas. El importador detecta columnas y el wizard permite configurar roles.

## Consecuencias

Ventajas:

- Mayor flexibilidad.
- Menos dependencia del archivo piloto.
- Experiencia más parecida a herramientas BI.

Desventajas:

- El usuario debe tomar decisiones en el wizard.
- Se requiere buena vista previa y mensajes claros.
