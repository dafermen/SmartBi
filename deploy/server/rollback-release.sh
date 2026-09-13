#!/usr/bin/env bash

# Cambia `current` a una versión existente. No elimina datos ni releases.
set -Eeuo pipefail

expected_root="/var/www/smartbi.innovalogic.tech"
remote_root="${1:-}"
release_id="${2:-}"

if [[ "$remote_root" != "$expected_root" ]]; then
  echo "Ruta remota no autorizada: $remote_root" >&2
  exit 2
fi

if [[ ! "$release_id" =~ ^[0-9]{14}-[0-9a-f]{7,40}$ ]]; then
  echo "Identificador de versión inválido: $release_id" >&2
  exit 2
fi

release_dir="$remote_root/releases/$release_id"
next_link="$remote_root/current.next"

exec 9>"$remote_root/.release.lock"
flock -n 9 || { echo "Otra entrega está en curso." >&2; exit 5; }

if [[ ! -f "$release_dir/index.html" || ! -d "$release_dir/assets" ]]; then
  echo "La versión solicitada no existe o está incompleta: $release_id" >&2
  exit 3
fi

ln -sfn "$release_dir" "$next_link"
mv -Tf "$next_link" "$remote_root/current"
echo "Rollback completado. Versión activa: $release_id"
