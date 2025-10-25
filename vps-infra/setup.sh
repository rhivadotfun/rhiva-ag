#!/bin/bash
set -e 

ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

restore_folder() {
  local path="$1"
  local tag="$2"
  
  if [ ! -d "$path" ]; then 
    echo "[warning] $path does not exist, skipping"
    return
  fi
  
  if [ -z "$(ls -A "$path" 2>/dev/null)" ]; then 
    echo "[restore] $path is empty. Restoring from latest snapshot with $tag ..."
    restic restore latest \
    --target "$path" \
    --include "/data/$tag" || true    
  else 
    echo "[ok] $path has existing data, skipping restore"
  fi 
}

restore_volume(){
  local volume="$1"
  local tag="$2"
  
  if ! sudo docker volume inspect "$volume" >/dev/null 2>&1; then 
    echo "[warning] docker volume $volume does not exist, skipping"
    return
  fi
  
  temp_dir="$(mktemp -d)"
  
  empty=false
  sudo docker run --rm -v "$volume":/data busybox sh -c "ls -A /data" >/dev/null 2>&1 || empty=true 
  
  if [ "$empty" = true ]; then 
     echo "[restore] $volume is empty. Restoring from latest snapshot with $tag ..."
     restic restore latest --target "$temp_dir" --include "/data/$tag" || true 
     sudo docker run --rm -v "$volume":/data -v "$temp_dir":/restore busybox sh -c "cp -a /restore/. /data/"
     rm -rf "$temp_dir"
  else 
    echo "[ok] $volume has existing data, skipping restore"
  fi
}

if [ $SYSTEM_ID = "master" ]; then
  ./bootstrap.master.sh
  
  NETWORKS="redis postgres backend"
  
  for NETWORK in $NETWORKS; do
    if ! sudo docker network ls --format '{{.Name}}' | grep -w "^$NETWORK$" > /dev/null 2>&1; then
      sudo docker network create $NETWORK -d overlay --attachable #--internal not neccessary since we set rules using ufw and cloudflare for internal services
    fi
  done
  
  mkdir -p vault/data
  sudo chown -R 100:100 vault/data
  sudo docker compose -f docker-compose.yml up -d  --remove-orphans
  
  restore_volume "loki_data" "loki"
  restore_volume "grafana_data" "grafana"
  restore_volume "postgres_data" "postgres"
  restore_volume "redis_master_data" "redis"
  restore_volume "prometheus_data" "prometheus"

  restore_folder "./vault/data" "vault"
else
  ./bootstrap.node.sh
fi
