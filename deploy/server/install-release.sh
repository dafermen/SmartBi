#!/usr/bin/env bash

# Instala un paquete ya compilado dentro de una carpeta con versión y mueve el
# enlace `current` de manera atómica. Nginx nunca observa una carpeta a medio
# copiar: continúa sirviendo la versión anterior hasta que todo está listo.
set -Eeuo pipefail

EXPECTED_ROOT="/var/www/smartbi.innovalogic.tech"
remote_root="${1:-}"
release_id="${2:-}"
archive_path="${3:-}"
expected_sha256="${4:-}"

if [[ "$remote_root" != "$EXPECTED_ROOT" ]]; then
  echo "Ruta remota no autorizada: $remote_root" >&2
  exit 2
fi

if [[ ! "$release_id" =~ ^[0-9]{14}-[0-9a-f]{7,40}$ ]]; then
  echo "Identificador de versión inválido: $release_id" >&2
  exit 2
fi

if [[ "$archive_path" != /tmp/smartbi-*.tar.gz || ! -f "$archive_path" ]]; then
  echo "No se encontró el paquete temporal esperado." >&2
  exit 2
fi

releases_dir="$remote_root/releases"
release_dir="$releases_dir/$release_id"
next_link="$remote_root/current.next"

mkdir -p "$releases_dir" "$remote_root/acme"

# Solo un despliegue o rollback puede mover current a la vez.
exec 9>"$remote_root/.release.lock"
flock -n 9 || { echo "Otra entrega está en curso." >&2; exit 5; }

if [[ ! "$expected_sha256" =~ ^[0-9a-f]{64}$ ]]; then
  echo "Falta un SHA-256 válido del paquete." >&2
  exit 2
fi
printf '%s  %s\n' "$expected_sha256" "$archive_path" | sha256sum --check --status

if [[ -e "$release_dir" ]]; then
  echo "La versión $release_id ya existe; no se reemplazó." >&2
  exit 3
fi

mkdir "$release_dir"
tar --no-same-owner -xzf "$archive_path" -C "$release_dir"

if [[ ! -f "$release_dir/index.html" || ! -d "$release_dir/assets" ]]; then
  echo "El paquete no contiene una compilación válida de Vite." >&2
  exit 4
fi

find "$release_dir" -type d -exec chmod 755 {} +
find "$release_dir" -type f -exec chmod 644 {} +

# Las pestañas abiertas pueden pedir un fragmento JS de la versión anterior.
# Conservamos esos assets con hash sin reemplazar los archivos de la nueva.
if [[ -L "$remote_root/current" ]]; then
  previous_dir="$(readlink -f "$remote_root/current")"
  if [[ "$previous_dir" != "$releases_dir/"* ]]; then
    echo "El enlace anterior sale de la carpeta de versiones." >&2
    exit 6
  fi
  cp -an "$previous_dir/assets/." "$release_dir/assets/"
fi

printf '{"release":"%s"}\n' "$release_id" > "$release_dir/release.json"
chmod 644 "$release_dir/release.json"

ln -sfn "$release_dir" "$next_link"
mv -Tf "$next_link" "$remote_root/current"
rm -f "$archive_path"

echo "Versión activa: $release_id"
