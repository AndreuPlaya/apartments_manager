#!/bin/sh
set -e
chown -R appuser:appgroup /data
exec su-exec appuser "$@"
