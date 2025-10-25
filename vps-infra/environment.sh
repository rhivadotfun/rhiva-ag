#!/bin/bash
set -e

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

./aws/setup.sh
./aws/refresh.sh

AWS_REFRESH_FILE="$PWD/aws/refresh.sh"
CRON_ENTRY="*/5 * * * * $AWS_REFRESH_FILE >> $PWD/aws-refresh.log 2>&1"

if ! crontab -l 2>/dev/null | grep -Fq "$AWS_REFRESH_FILE"; then
  (crontab -l 2>/dev/null || true; echo "$CRON_ENTRY") | crontab -
fi

sudo ufw default deny incoming
sudo ufw default allow outgoing

PUBLIC_PORTS=(22 80 443) # ssh http https

for port in "${PUBLIC_PORTS[@]}"; do
  sudo ufw allow "$port/tcp"
done

SERVICE_UDP_PORTS=(7946) #vault
SERVICE_TCP_PORTS=(5432 3000 3100 8200 7946 9093) # posgres grafana loki vault alert-manager
SERVICE_TCP_PORT_RANGES=(26379:26383 6379:6387) # sentines redis

for port in "${SERVICE_UDP_PORTS[@]}"; do
  sudo ufw deny "$port/udp"
done

for port in "${SERVICE_TCP_PORTS[@]}"; do
  sudo ufw deny "$port/tcp"
done
for port in "${SERVICE_TCP_PORT_RANGES[@]}"; do
  sudo ufw deny "$port/tcp"
done

declare -A PRIVATE_PORTS=(
  [8200]="Vault"
  [3100]="Loki"
  [6379]="Redis"
  [5432]="Postgres"
  [9093]="Prometheus"
  [26379]="Redis Sentinels"
)

declare -A CLOUDFLARE_ZERO_TRUST_PORTS=(
  [8200]="Vault"
  [3000]="Grafana"
)

for port in "${!PRIVATE_PORTS[@]}"; do
  sudo ufw allow from "$PRIVATE_NETWORK" to any port "$port"
done

for port in "${!CLOUDFLARE_ZERO_TRUST_PORTS[@]}"; do
  sudo ufw allow from 127.0.0.1 to any port "$port"
done

sudo ufw enable
