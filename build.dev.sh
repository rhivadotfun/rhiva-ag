cat > docker-compose.yml << EOF
services:
  dev:
    build:
      context: .
      target: dev
    ports:
      - "8000:8000"
    restart: on-failure
    networks:
      - webnet
      - redis
    env_file: .env
    environment: 
      APP_DATABASE_URL: \${APP_DATABASE_URL}
networks:
  webnet:
    driver: bridge
  redis:
    external: true
EOF

git pull
sudo docker compose build
sudo docker compose up -d --remove-orphans
