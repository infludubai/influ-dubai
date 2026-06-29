#!/bin/bash
cd ~/node-api || exit 1

# Remove real node_modules folder if it exists (CloudLinux needs symlink here)
if [ -d node_modules ] && [ ! -L node_modules ]; then
  rm -rf node_modules
  echo "Removed real node_modules folder."
fi

# Write .env — include HOME and STORAGE_PATH explicitly so Node can find storage
LARAVEL_ENV=~/laravel-api/.env
if [ -f "$LARAVEL_ENV" ]; then
  DB_HOST=$(grep "^DB_HOST=" "$LARAVEL_ENV" | cut -d= -f2- | tr -d '\r')
  DB_PORT=$(grep "^DB_PORT=" "$LARAVEL_ENV" | cut -d= -f2- | tr -d '\r')
  DB_DATABASE=$(grep "^DB_DATABASE=" "$LARAVEL_ENV" | cut -d= -f2- | tr -d '\r')
  DB_USERNAME=$(grep "^DB_USERNAME=" "$LARAVEL_ENV" | cut -d= -f2- | tr -d '\r')
  DB_PASSWORD=$(grep "^DB_PASSWORD=" "$LARAVEL_ENV" | cut -d= -f2- | tr -d '\r')

  STORAGE_PATH="$HOME/laravel-api/storage/app/public"

  printf 'NODE_ENV=production\nPORT=8080\nAPI_PREFIX=/api\nHOME=%s\nSTORAGE_PATH=%s\nDB_HOST=%s\nDB_PORT=%s\nDB_DATABASE=%s\nDB_USERNAME=%s\nDB_PASSWORD=%s\n' \
    "$HOME" "$STORAGE_PATH" \
    "${DB_HOST:-127.0.0.1}" "${DB_PORT:-3306}" "${DB_DATABASE:-amir_platform}" \
    "${DB_USERNAME:-root}" "${DB_PASSWORD}" > .env

  echo ".env written. Storage path: $STORAGE_PATH"
else
  echo "Warning: Laravel .env not found."
fi

# Signal Passenger to restart
mkdir -p tmp
touch tmp/restart.txt
echo "Node backend deployed successfully."
