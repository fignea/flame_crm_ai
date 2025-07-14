#!/bin/sh

# Sustituir variables de entorno en el archivo de configuración
envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js

# Iniciar nginx
exec nginx -g "daemon off;" 