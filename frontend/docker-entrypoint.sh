#!/bin/sh
set -eu

: "${ORDER_SERVICE_URL:=http://localhost:8080}"
: "${CATALOG_SERVICE_URL:=http://localhost:8081}"
export ORDER_SERVICE_URL CATALOG_SERVICE_URL

envsubst '${ORDER_SERVICE_URL} ${CATALOG_SERVICE_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
