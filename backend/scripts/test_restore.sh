#!/bin/bash
# Script para restaurar y verificar un backup ENCRIPTADO localmente usando Docker
# Uso: ./test_restore.sh ruta/al/backup.dump.gpg
#
# El script pide la passphrase por terminal (no queda en el historial)

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./test_restore.sh <archivo_backup.dump.gpg>"
    echo "Ejemplo: ./test_restore.sh backup_2026-03-06_03-00-00.dump.gpg"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: No se encontró el archivo: $BACKUP_FILE"
    exit 1
fi

# Pedir passphrase de forma segura (no se muestra en pantalla)
read -s -p "Ingresá la passphrase del backup: " BACKUP_PASSPHRASE
echo ""

if [ -z "$BACKUP_PASSPHRASE" ]; then
    echo "ERROR: La passphrase no puede estar vacía"
    exit 1
fi

# Desencriptar
DUMP_FILE="${BACKUP_FILE%.gpg}"
echo "=== Desencriptando backup ==="
gpg --batch --yes --decrypt \
    --passphrase "$BACKUP_PASSPHRASE" \
    --output "$DUMP_FILE" \
    "$BACKUP_FILE"

echo "Backup desencriptado: $DUMP_FILE"

CONTAINER_NAME="backup_test_postgres"
DB_NAME="restore_test"
DB_USER="test_user"
DB_PASS="test_password"

echo ""
echo "=== Iniciando PostgreSQL en Docker ==="

# Eliminar contenedor previo si existe
docker rm -f $CONTAINER_NAME 2>/dev/null || true

docker run -d \
    --name $CONTAINER_NAME \
    -e POSTGRES_DB=$DB_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD=$DB_PASS \
    -p 5433:5432 \
    postgres:16

echo "Esperando que PostgreSQL inicie..."
sleep 5

# Esperar a que esté listo
for i in {1..30}; do
    if docker exec $CONTAINER_NAME pg_isready -U $DB_USER 2>/dev/null; then
        break
    fi
    sleep 1
done

echo ""
echo "=== Restaurando backup ==="

# Copiar backup al contenedor
docker cp "$DUMP_FILE" $CONTAINER_NAME:/tmp/backup.dump

# Restaurar
docker exec $CONTAINER_NAME pg_restore \
    --no-owner \
    --no-privileges \
    --dbname=$DB_NAME \
    -U $DB_USER \
    /tmp/backup.dump

echo ""
echo "=== Verificando tablas ==="

docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "\dt"

echo ""
echo "=== Conteo de registros ==="

docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
    SELECT schemaname, relname AS tabla, n_live_tup AS registros
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
"

echo ""
echo "=== Limpiando ==="
docker rm -f $CONTAINER_NAME
# Eliminar el .dump desencriptado
rm -f "$DUMP_FILE"

echo ""
echo "Restauración verificada exitosamente"
