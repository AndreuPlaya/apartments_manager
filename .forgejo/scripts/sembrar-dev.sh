#!/bin/sh
# Rehace el /data de `pms-dev` con una copia de la base de PRODUCCIÓN.
#
#     sembrar-dev.sh <imagen-de-dev>
#
# Lo llama la pipeline `desarrollo` justo antes de redesplegar el stack
# `ixa-apps-dev`, y se apoya en el socket de Docker del host que el runner monta
# en el contenedor del job.
#
# Contra producción sólo LEE. La copia se toma con `VACUUM INTO` dentro del
# contenedor `pms`: no lo para, no escribe en su volumen y no captura una
# escritura a medias, que es lo que pasaría copiando el .db a pelo estando la
# base en modo WAL. Es el mismo método de it_admin/scripts/pms-export.sh.
#
# Lo que sí borra sin preguntar es el /data de DESARROLLO, entero. Está dicho
# en el compose del stack: ahí no se guarda nada que importe.
set -eu

IMAGEN_DEV=${1:?falta la imagen de desarrollo}
PROD=${PROD_CONTENEDOR:-pms}
DEV=${DEV_CONTENEDOR:-pms-dev}
DEV_DIR=${DEV_DATA_DIR:-/var/lib/docker-data/ixa-apps-dev/pms}
TMP=/tmp/pms-dev-seed

docker inspect -f '{{.State.Running}}' "$PROD" 2>/dev/null | grep -q true || {
  echo "FALLO: el contenedor de producción «$PROD» no está en marcha; sin él no"
  echo "       hay nada que copiar. Se aborta antes de tocar el /data de dev."
  exit 1
}

echo "-- copia consistente de la base de $PROD"
docker exec -i "$PROD" node - <<'NODE'
const { DatabaseSync } = require('node:sqlite')
const { rmSync, mkdirSync } = require('node:fs')

rmSync('/tmp/pms-dev-seed', { recursive: true, force: true })
mkdirSync('/tmp/pms-dev-seed/database', { recursive: true })

const db = new DatabaseSync('/data/database/app.db')
db.exec("VACUUM INTO '/tmp/pms-dev-seed/database/app.db'")
// Los nombres son los del glosario. Si una de estas tablas no existe, el job
// se para aquí, y eso es lo que se quiere: significaría que producción y esta
// pipeline hablan esquemas distintos, y sembrar dev con eso no lleva a nada
// bueno.
const n = db.prepare('SELECT count(*) AS n FROM reservations').get().n
const c = db.prepare('SELECT count(*) AS n FROM guests').get().n
db.close()
console.log(`   ${c} huéspedes, ${n} reservas`)
NODE

# Las cuentas viven en config/settings.json, no en la base: sin esto no se
# podría entrar en la instancia de desarrollo.
docker exec "$PROD" cp -a /data/config "$TMP/"

echo "-- rehaciendo $DEV_DIR"
# El contenedor de dev, fuera: no puede estar con la base abierta mientras se
# le cambia el fichero debajo. El redespliegue lo vuelve a crear.
docker rm -f "$DEV" >/dev/null 2>&1 || true
# `docker run -v` crea el directorio del host si no existe: sirve de mkdir -p.
docker run --rm -v "$DEV_DIR":/data alpine \
  sh -c 'rm -rf /data/..?* /data/.[!.]* /data/* 2>/dev/null || true'
docker exec "$PROD" tar -czf - -C "$TMP" . \
  | docker run --rm -i -v "$DEV_DIR":/data alpine tar -xzf - -C /data
docker exec "$PROD" rm -rf "$TMP"

echo "-- secret_key propio para desarrollo"
# Se deja vacío en vez de inventar uno: la propia aplicación lo regenera al
# arrancar (infrastructure/settings.ts). Así las sesiones abiertas en producción
# no valen aquí ni al revés. Las contraseñas SÍ son las de producción.
#
# Consecuencia, y es a propósito: cada siembra tira las sesiones abiertas EN
# DESARROLLO, así que después de cada push a master hay que volver a entrar. La
# aplicación lo dice y lleva al login (api/client.ts, SessionExpiredError); si
# en vez de eso vieras una pantalla de ceros, eso sí es un fallo.
#
# Se usa la imagen de dev y no `alpine` porque hace falta node; de paso su
# entrypoint deja el /data con el dueño que espera la aplicación.
docker run --rm -v "$DEV_DIR":/data "$IMAGEN_DEV" node -e "
const fs = require('node:fs')
const p = '/data/config/settings.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
s.secret_key = ''
fs.writeFileSync(p, JSON.stringify(s, null, 2))
console.log('   settings.json:', Object.keys(s.admin_users || {}).length, 'cuentas, secret_key a regenerar')
"

echo "-- $DEV_DIR sembrado"
