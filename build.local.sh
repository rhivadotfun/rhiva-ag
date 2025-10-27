HOST_IP="127.0.0.1"
cat > docker-compose.yml << EOF
services:
  dev:
    container_name: dev
    build:
      context: .
      dockerfile: Dockerfile.local
      target: dev
    ports:
      - "8000:8000"
      - "8001:8001"
    restart: on-failure
    networks:
      - webnet
    env_file: 
      - .env
    environment: 
      DATABASE_URL: \${APP_DATABASE_URL}
networks:
  webnet:
    driver: bridge
EOF

git pull
sudo docker compose build
sudo docker compose up -d --remove-orphans
