# ADR 0001 — SmartBI será local-first y sin backend en el MVP

## Estado

Aceptada.

## Contexto

El objetivo del MVP es permitir que un usuario cargue un Excel y genere dashboards dinámicos sin complejidad de infraestructura.

## Decisión

SmartBI procesará archivos Excel localmente en el navegador y usará LocalStorage para preferencias demo.

## Consecuencias

Ventajas:

- Menor complejidad.
- Mayor privacidad para archivos de prueba.
- Despliegue estático sencillo.

Desventajas:

- No hay colaboración multiusuario.
- No hay historial centralizado.
- Archivos muy grandes dependen de recursos del equipo del usuario.
