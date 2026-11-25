#!/bin/zsh
# Arranca el bot leyendo el token de un archivo privado, para no ponerlo en la línea de comandos ni en el repositorio.
# Archivo: ~/.config/porfinlar/bot.env  (permisos 600), con una línea:  TELEGRAM_BOT_TOKEN=...
set -e
ENV_FILE="$HOME/.config/porfinlar/bot.env"
[ -f "$ENV_FILE" ] || { echo "Falta $ENV_FILE (ver bot/README.md)"; exit 1; }
set -a; source "$ENV_FILE"; set +a
cd "$(dirname "$0")"
exec node bot.js
