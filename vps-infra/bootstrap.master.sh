#!/bin/bash 
set -e

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

CPU=4
QUORUM=$(((CPU / 2) + 1))

mkdir -p redis
OUTPUT_FILE="docker-compose.yml"

cat > $OUTPUT_FILE <<EOF
services:
  redis-master:
    image: redis:latest
    container_name: redis-master
    ports:
      - "$HOST_BIND:6379:6379"
      - "$PRIVATE_NETWORK:6379:6379"
    networks:
      redis:
        aliases:
          - redis-master
    volumes:
      - redis_master_data:/data
    command: >
      redis-server
      --replica-announce-ip $PRIVATE_NETWORK
      --replica-announce-port 6379
      --appendonly yes
      --repl-diskless-load on-empty-db
      --protected-mode no
  postgres:
    image: timescale/timescaledb-ha:pg17 
    container_name: postgres
    restart: unless-stopped
    ports:
      - "$HOST_BIND:5432:5432"
      - "$PRIVATE_NETWORK:5432:5432"
    networks:
      - postgres
    env_file: .env
    environment:
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes: 
      - postgres_data:/var/lib/postgresql/data
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "$HOST_BIND:9090:9090"
      - "$PRIVATE_NETWORK:9090:9090"
    volumes:
      - prometheus_data:/prometheus/data
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alert-rules.yml:/etc/prometheus/alert-rules.yml
    networks:
      - monitor        
  alert-manager:
    image: prom/alertmanager:latest
    container_name: alert-manager
    ports:
      - "$HOST_BIND:9093:9093"
      - "$PRIVATE_NETWORK:9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - "--config.file=/etc/alertmanager/alertmanager.yml"    
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "$HOST_BIND:3100:3100"
      - "$PRIVATE_NETWORK:3100:3100"
    volumes:
      - loki_data:/loki
      - type: bind 
        source: ./loki/local-config.yaml
        target: /etc/loki/local-config.yaml
    command: "-config.file=/etc/loki/local-config.yaml"
    networks:
      - monitor    
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
        - "$HOST_BIND:3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - type: bind 
        source: ./grafana/grafana.ini
        target: /etc/grafana/grafana.ini
      - type: bind
        source: ./grafana/provisioning/datasources/ds.yaml
        target: /etc/grafana/provisioning/datasources/ds.yaml
    networks:
      - monitor
    environment:
      - GF_SERVER_HTTP_ADDR=0.0.0.0
  vault:
    image: hashicorp/vault:latest
    hostname: vault
    container_name: vault
    restart: unless-stopped 
    networks:
      - backend
    ports:
      - "$HOST_BIND:8200:8200"
      - "$PRIVATE_NETWORK:8200:8200"
    cap_add:
      - IPC_LOCK
    user: root
    env_file: .env 
    environment:
      - VAULT_SEAL_TYPE=awskms
      - AWS_REGION=\${AWS_REGION}
      - VAULT_ADDR=\${VAULT_API_ADDR}
      - VAULT_API_ADDR=\${VAULT_API_ADDR}
      - VAULT_TCP_ADDRESS=\${VAULT_TCP_ADDRESS}
      - AWS_SESSION_TOKEN=\${AWS_SESSION_TOKEN}
      - AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
      - VAULT_AWSKMS_SEAL_KEY_ID=\${AWS_KMS_KEY_ID}
      - VAULT_CLUSTER_ADDR=\${VAULT_CLUSTER_ADDR}
    volumes: 
      - ~/.aws:/root/.aws:ro
      - ./vault/data:/vault/data 
      - ./vault/cert:/vault/certs
      - ./vault/config:/vault/config
    command: vault server --config=/vault/config/config.hcl
  restic: 
    image: ghcr.io/lobaro/restic-backup-docker:latest
    container_name: restic 
    privileged: true 
    depends_on: 
      - vault 
      - grafana 
      - loki 
      - redis-master
      - prometheus
      - alert-manager
    volumes: 
      - ./ssh:/root/.ssh:ro 
      - ./vault/data:/data/vault:ro 
      - loki_data:/data/loki:ro 
      - grafana_data:/data/grafana:ro 
      - postgres_data:/data/postgres:ro
      - redis_master_data:/data/redis/:ro
      - prometheus_data:/data/prometheus:ro 
    env_file: .env
    environment: 
      - TZ=Africa/Lagos
      - BACKUP_CRON="0 2 * * *"
      - CHECK_CRON="0 3 * * 0"
      - B2_ACCOUNT_ID=\${B2_ACCOUNT_ID}
      - B2_ACCOUNT_KEY=\${B2_ACCOUNT_KEY}
      - RESTIC_PASSWORD=\${RESTIC_PASSWORD}
      - RESTIC_REPOSITORY=\${RESTIC_REPOSITORY}
      - RESTIC_FORGET_ARGS=--prune --keep-daily 1 --keep-weekly 1 --keep-monthly=1
EOF

for index in $(seq 1 $CPU); do
REPLICA_PORT=$((6379 + index))
REPLICA_NAME="redis-replica-$index"

cat >> $OUTPUT_FILE <<EOF
  "$REPLICA_NAME":
    image: redis:latest
    container_name: $REPLICA_NAME
    hostname: $REPLICA_NAME
    depends_on:
      - redis-master
    ports:
      - "$HOST_BIND:$REPLICA_PORT:6379"
      - "$PRIVATE_NETWORK:$REPLICA_PORT:6379"
    networks:
      - redis
    volumes:
      - redis_slave_data_$index:/data
    command: >
      redis-server
      --replica-announce-ip $PRIVATE_NETWORK
      --replica-announce-port $REPLICA_PORT
      --repl-diskless-load on-empty-db
      --replicaof redis-master 6379
      --appendonly yes
      --protected-mode no
EOF
done
for index in $(seq 1 $CPU); do
  SENTINEL_NAME="redis-sentinel-$index"
  SENTINEL_PORT=$((26379 + (index-1)))
  {
    cat <<EOF
  "$SENTINEL_NAME":
    image: redis:latest
    container_name: $SENTINEL_NAME
    ports:
      - "$HOST_BIND:$SENTINEL_PORT:26379"
      - "$PRIVATE_NETWORK:$SENTINEL_PORT:26379"
    depends_on:
      - redis-master
EOF
    for idx in $(seq 1 $CPU); do 
      echo "      - redis-replica-$idx"
    done
    
    cat <<EOF
    networks:
      - redis
    command: >
      sh -c "
      mkdir -p /etc/redis/ &&
      echo 'bind 0.0.0.0' > /etc/redis/sentinel.conf &&
      echo 'sentinel monitor master redis-master 6379 $QUORUM' >> /etc/redis/sentinel.conf &&
      echo 'sentinel resolve-hostnames yes' >> /etc/redis/sentinel.conf &&
      echo 'sentinel down-after-milliseconds master 10000' >> /etc/redis/sentinel.conf &&
      echo 'sentinel failover-timeout master 10000' >> /etc/redis/sentinel.conf &&
      echo 'sentinel parallel-syncs master 1' >> /etc/redis/sentinel.conf &&
      echo 'sentinel announce-ip $PRIVATE_NETWORK' >> /etc/redis/sentinel.conf &&
      echo 'sentinel announce-port $SENTINEL_PORT' >> /etc/redis/sentinel.conf &&
      redis-sentinel /etc/redis/sentinel.conf
      "
EOF
  } >> $OUTPUT_FILE
done

{
cat <<EOF
volumes:
  loki_data:
    name: loki_data
  grafana_data:
    name: grafana_data
  postgres_data:
    name: postgres_data
  prometheus_data:
    name: prometheus_data
  redis_master_data:
    name: redis_master_data
EOF
for index in $(seq 1 $CPU); do 
  echo "  redis_slave_data_$index:"
done
cat <<EOF
networks:
  redis:
    name: redis
    driver: bridge
  monitor:
    name: monitor
    driver: bridge
  postgres:
    external: true
  backend: 
    external: true
EOF
} >> $OUTPUT_FILE