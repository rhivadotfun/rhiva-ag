#!/bin/bash
set -e 

ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [ -d "$HOME/certs" ]; then
  sudo mkdir -p /etc/rolesanywhere/certs
  sudo cp -r ~/certs/* /etc/rolesanywhere/certs/
  sudo chown -R root:root /etc/rolesanywhere
  sudo chmod 700 /etc/rolesanywhere
  sudo chmod 600 /etc/rolesanywhere/certs/private_key.pem
  sudo chmod 644 /etc/rolesanywhere/certs/certificate.pem
  sudo chmod 644 /etc/rolesanywhere/certs/certificate_chain.txt
  # todo remove --passin function in production
  sudo openssl rsa -in /etc/rolesanywhere/certs/private_key.pem --out /etc/rolesanywhere/certs/decrypted_private_key.pem --passin pass:$AWS_CA_PASSWORD
  sudo chmod 644 /etc/rolesanywhere/certs/decrypted_private_key.pem  
else 
  echo "aws roleanywhere not setup, make sure you copy cert folder."
  exit 1
fi 

AWS_CONFIG_FILE="$HOME/.aws/credentials"
AWS_CA_CERT="/etc/rolesanywhere/certs/certificate.pem"
AWS_CERT_FILE="/etc/rolesanywhere/certs/certificate_chain.txt"
AWS_PRIVATE_KEY_FILE="/etc/rolesanywhere/certs/decrypted_private_key.pem"
