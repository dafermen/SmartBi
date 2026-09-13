# Arquitectura — SmartBI

## Propósito

SmartBI es una aplicación web React + TypeScript + Vite que importa archivos Excel tabulares y genera dashboards dinámicos en el navegador.

No usa backend, base de datos ni inteligencia artificial. El procesamiento ocurre localmente.

## Principios

- Procesamiento local del Excel.
- Configuración flexible de columnas; no depender de una plantilla fija.
- Separación entre importación, configuración, cálculo y presentación.
- Interfaz responsive y didáctica.
- Persistencia demo mediante LocalStorage.
- Seguridad por diseño: descartar `SQL`, CSP base y no envío de datos a terceros.
- Entrega estática mediante Nginx, sin contenedor ni proceso backend.

## Flujo principal

```text
UploadView
  -> excelImporter.importExcel(file)
  -> FieldConfiguratorView
  -> DashboardView
  -> dashboardAnalytics.computeDashboardAnalytics(input)
  -> dataProfile.worker.ts (desde 5.000 filas)
```

## Capas principales

### `src/app`

Coordina el flujo de la aplicación:

- carga inicial,
- wizard,
- dashboard,
- documentación,
- cambio seguro de archivo,
- tema claro/oscuro.

### `src/features/import`

Responsable de leer Excel y configurar campos.

Archivos clave:

- `UploadView.tsx`
- `FieldConfiguratorView.tsx`
- `excelImporter.ts`

### `src/features/dashboard`

Responsable de calcular y presentar análisis.

Archivos clave:

- `DashboardView.tsx`
- `dashboardAnalytics.ts`
- `reportPages.ts`
- `dataProfile.ts`
- `dataProfile.worker.ts`
- `exportCsv.ts`

`dataProfile.ts` contiene una función pura y comprobable. `dataProfile.worker.ts` la ejecuta fuera del hilo principal para archivos grandes y `DashboardView` conserva un respaldo local para navegadores sin Worker.

`reportPages.ts` valida la composición leída desde LocalStorage, elimina identificadores duplicados, descarta secciones desconocidas y garantiza que exista una página inicial visible. Esta lógica se separó de `DashboardView.tsx` para reducir responsabilidades y poder probarla sin renderizar todo el dashboard.

### `src/features/documentation`

Biblioteca de documentación interactiva dentro de la app.

### `src/domain`

Tipos compartidos y contratos internos.

## Persistencia

SmartBI usa LocalStorage para:

- tema visual,
- plantilla de mapeo,
- visual builder,
- páginas del informe,
- página inicial, asociación de visuales, tamaño, color y orden,
- avance de lectura de documentación.

No se persiste el archivo Excel en servidor.

## Arquitectura de producción

```text
Navegador
   ↓ HTTPS
Nginx del servidor
   ↓ archivos estáticos
/var/www/smartbi.innovalogic.tech/current
   ↓ enlace atómico
releases/<fecha>-<commit>
```

Docker no forma parte de SmartBI v0.1.0 porque el build no necesita un proceso
permanente. Nginx aplica TLS, caché, encabezados de seguridad y fallback SPA.
El procedimiento completo vive en `docs/DEPLOYMENT.md`.

La tabla no guarda filas duplicadas: para lotes grandes usa una ventana virtual y renderiza únicamente el rango visible.

## Restricciones conocidas

- No hay autenticación.
- No hay backend.
- No hay colaboración multiusuario.
- Safari real requiere validación manual en macOS/iOS.
