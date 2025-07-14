#!/bin/bash

# Dirección del backend
BACKEND_URL="http://localhost:8080"

# Credenciales de usuario
EMAIL="admin@flameai.com"
PASSWORD="admin"

echo "Solicitando token de autenticación..."

# Realizar login y extraer el token de la respuesta
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
-H "Content-Type: application/json" \
-d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extraer el token usando jq. Asegúrate de que jq está instalado.
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Error: No se pudo obtener el token de autenticación."
  echo "Respuesta del servidor:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "Token obtenido exitosamente."
echo "---"
echo "Probando endpoint GET /api/conversations..."

# Usar el token para hacer una petición a la ruta de conversaciones
curl -v "$BACKEND_URL/api/conversations?connectionId=all&status=all" \
-H "Authorization: Bearer $TOKEN" 