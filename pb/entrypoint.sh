#!/bin/sh

DIR="/pb_data"
PORT="${PORT:-8090}"

# Create superuser on first run if credentials are provided
if [ -n "$PB_SUPERUSER_EMAIL" ] && [ -n "$PB_SUPERUSER_PASSWORD" ]; then
  ./pocketbase superuser upsert "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD" --dir="$DIR" --migrationsDir=./pb_migrations
fi

exec ./pocketbase serve --http="0.0.0.0:${PORT}" --dir="$DIR" --migrationsDir=./pb_migrations
