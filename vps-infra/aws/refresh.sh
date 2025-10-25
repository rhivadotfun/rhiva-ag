#!/bin/bash
# register this script as a cron task when setting up machine
set -e

ENV_FILE="$HOME/vps-infra/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  touch $ENV_FILE # required this to exist for this script to work
fi

AWS_CONFIG_FILE="$HOME/.aws/credentials"
AWS_CA_CERT="/etc/rolesanywhere/certs/certificate.pem"
AWS_CERT_FILE="/etc/rolesanywhere/certs/certificate_chain.txt"
AWS_PRIVATE_KEY_FILE="/etc/rolesanywhere/certs/decrypted_private_key.pem"

refresh_aws_credentials(){
  echo "🔄 Refreshing AWS credentials via RolesAnywhere..."

  CREDS=$(sudo aws_signing_helper credential-process \
    --certificate $AWS_CA_CERT \
    --private-key $AWS_PRIVATE_KEY_FILE \
    --trust-anchor-arn $AWS_TRUST_ANCHOR_ARN \
    --profile-arn $AWS_PROFILE_ARN \
    --role-arn $AWS_ROLE_ARN)


  AWS_EXPIRATION=$(echo $CREDS | jq -r '.Expiration')
  AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.AccessKeyId')
  AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.SessionToken')
  AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.SecretAccessKey')

  AWS_CONFIG_FOLDER="$HOME/.aws"
  mkdir -p "$AWS_CONFIG_FOLDER"

  cat > "$AWS_CONFIG_FOLDER/credentials" <<EOF
[default]
  output=json
  region=${AWS_REGION}
  aws_access_key_id=${AWS_ACCESS_KEY_ID}
  aws_session_token=${AWS_SESSION_TOKEN}
  aws_secret_access_key=${AWS_SECET_ACCESS_KEY}
EOF

  for variable in AWS_EXPIRATION AWS_ACCESS_KEY_ID AWS_SESSION_TOKEN AWS_SECRET_ACCESS_KEY; do
    value="${!variable}"

    if grep -q "^$variable=" $ENV_FILE; then
      sed -i "s|^$variable=.*|$variable=$value|" $ENV_FILE
    else
      echo "$variable=$value" >> $ENV_FILE
    fi
  done

  echo "✅ AWS credentials refreshed successfully."
  for container in "$AWS_DEPENDANT_CONTAINERS"; do
    sudo docker ps --filter "name=$container" --format "{{.Names}}" | xargs -r sudo docker restart
  done
}

check_expiration(){
  if [ -z "$AWS_EXPIRATION" ]; then
    return 1
  fi

  now_epoch=$(date +%s)
  expiration_epoch=$(date -d "$AWS_EXPIRATION" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$AWS_EXPIRATION" +%s)

  if [ $((expiration_epoch - now_epoch)) -lt 60 ]; then
    return 1
  fi

  return 0
}

if ! check_expiration; then
  refresh_aws_credentials
else
  echo "⌛️ credentials still valid until $AWS_EXPIRATION"
fi
