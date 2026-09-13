#!/usr/bin/env bash

# Configura el virtual host y el primer certificado. Se ejecuta una sola vez,
# después de instalar la primera versión estática.
set -Eeuo pipefail

domain="${1:-}"
remote_root="${2:-}"
http_config="${3:-}"
https_config="${4:-}"

if [[ "$domain" != "smartbi.innovalogic.tech" ]]; then
  echo "Dominio no autorizado: $domain" >&2
  exit 2
fi

if [[ "$remote_root" != "/var/www/smartbi.innovalogic.tech" ]]; then
  echo "Ruta remota no autorizada: $remote_root" >&2
  exit 2
fi

if [[ ! -f "$remote_root/current/index.html" ]]; then
  echo "Primero debe instalarse una versión con deploy-production.ps1 -Initial." >&2
  exit 3
fi

if [[ ! -f "$http_config" || ! -f "$https_config" ]]; then
  echo "Faltan los archivos temporales de configuración Nginx." >&2
  exit 3
fi

available_site="/etc/nginx/sites-available/$domain"
enabled_site="/etc/nginx/sites-enabled/$domain"

if [[ -e "$available_site" || -L "$enabled_site" || -e "$enabled_site" ]]; then
  echo "El sitio ya existe. No se sobrescribe: use el despliegue habitual." >&2
  exit 5
fi

# Ante un fallo retiramos solo los dos archivos de ESTE sitio, nunca los de
# otras aplicaciones. El certificado y las versiones quedan conservados.
rollback_bootstrap() {
  trap - ERR
  rm -f "$available_site" "$enabled_site"
  nginx -t && systemctl reload nginx
  echo "Bootstrap incompleto; configuración de SmartBI retirada de forma segura." >&2
  exit 6
}
trap rollback_bootstrap ERR

mkdir -p "$remote_root/acme"
install -m 644 "$http_config" "$available_site"
ln -sfn "$available_site" "$enabled_site"
nginx -t
systemctl reload nginx

certbot certonly \
  --webroot \
  --webroot-path "$remote_root/acme" \
  --domain "$domain" \
  --non-interactive \
  --agree-tos \
  --keep-until-expiring \
  --deploy-hook "nginx -t && systemctl reload nginx"

install -m 644 "$https_config" "$available_site"

nginx -t

systemctl reload nginx
curl --fail --silent --show-error --head "https://$domain/" >/dev/null
trap - ERR

rm -f "$http_config" "$https_config"
echo "Nginx y HTTPS quedaron activos para $domain."
