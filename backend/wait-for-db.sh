#!/bin/sh
set -e

host="$1"

echo "⏳ Waiting for database at $host:5432..."

until nc -z "$host" 5432; do
  sleep 2
done

echo "✅ Database is ready!"
