#!/usr/bin/env bash
set -euo pipefail

echo "Starting infra (Postgres, Redis) ..."
docker compose up -d

echo "Waiting a bit for services to warm up ..."
sleep 8

echo "Done. Now run: mvn spring-boot:run"
