#!/usr/bin/env python3
"""Redespliega un stack Git de Portainer cambiando algunas variables de entorno.

    redesplegar.py ixa-apps PMS_VERSION=v1.2.3 [OTRA=valor ...]

Se usa desde el workflow de despliegue para apuntar `ixa-apps` a la imagen
recién publicada. Lee el env que el stack ya tiene, cambia sólo las claves que
se le pasan y lo devuelve entero: Portainer BORRA las variables que no vengan
en el redespliegue, así que no vale con mandar la que cambia. Es la misma
cautela que documenta scripts/relanzar-stacks.sh en docker-stacks.

`pullImage` va a True, al revés que en el relanzado semanal: ahí las imágenes
están fijadas y no hay nada nuevo que traer, aquí acabamos de publicar una
etiqueta que el host todavía no tiene.

Credenciales por entorno: PORTAINER_URL, PORTAINER_USER, PORTAINER_PASSWORD.
"""
import json
import os
import ssl
import sys
import urllib.error
import urllib.request

TIMEOUT = 300

base = os.environ["PORTAINER_URL"].rstrip("/")
# Portainer suele ir con certificado propio en el LAN; el trayecto no sale de casa.
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

_jwt = None


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    if _jwt:
        req.add_header("Authorization", "Bearer " + _jwt)
    if data:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, context=ctx, timeout=TIMEOUT) as resp:
        return resp.status, resp.read().decode()


def morir(msg):
    print("FALLO: " + msg, flush=True)
    sys.exit(1)


def main(argv):
    global _jwt

    if len(argv) < 2:
        morir("uso: redesplegar.py <stack> CLAVE=valor [CLAVE=valor ...]")
    objetivo = argv[0]
    cambios = {}
    for par in argv[1:]:
        if "=" not in par:
            morir("«%s» no tiene la forma CLAVE=valor" % par)
        k, v = par.split("=", 1)
        cambios[k] = v

    try:
        _, body = call("POST", "/api/auth", {
            "username": os.environ["PORTAINER_USER"],
            "password": os.environ["PORTAINER_PASSWORD"],
        })
        _jwt = json.loads(body)["jwt"]
    except Exception as e:
        morir("no se pudo autenticar contra Portainer: %s" % e)

    _, body = call("GET", "/api/stacks")
    stacks = [s for s in json.loads(body) if s["Name"] == objetivo]
    if not stacks:
        morir("no existe el stack «%s» en Portainer" % objetivo)
    stack = stacks[0]
    if not stack.get("GitConfig"):
        morir("«%s» no es un stack Git; este script no sabe redesplegarlo" % objetivo)

    sid, eid = stack["Id"], stack["EndpointId"]

    # El env llega como [{"name": ..., "value": ...}]. Se conserva el orden y
    # se añaden al final las claves que no existieran todavía.
    env = list(stack.get("Env") or [])
    vistas = set()
    for var in env:
        if var["name"] in cambios:
            var["value"] = cambios[var["name"]]
            vistas.add(var["name"])
    for k, v in cambios.items():
        if k not in vistas:
            env.append({"name": k, "value": v})

    print("-- %s (id %s): %s" % (
        objetivo, sid, ", ".join("%s=%s" % kv for kv in sorted(cambios.items()))), flush=True)

    peticion = {
        "env": env,
        "pullImage": True,
        "prune": True,
        "repositoryAuthentication": True,
        "repositoryUsername": os.environ.get("FORGEJO_USER", ""),
        "repositoryPassword": os.environ.get("FORGEJO_TOKEN", ""),
    }
    try:
        st, rb = call("PUT", "/api/stacks/%s/git/redeploy?endpointId=%s" % (sid, eid), peticion)
    except urllib.error.HTTPError as e:
        morir("redespliegue HTTP %s: %s" % (e.code, e.read().decode()[:300]))
    except Exception as e:
        morir("redespliegue: %s" % e)

    if st != 200:
        morir("redespliegue HTTP %s: %s" % (st, rb[:300]))
    print("   redesplegado", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
