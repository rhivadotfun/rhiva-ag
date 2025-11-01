#!/bin/sh 

export $(grep -v '^#' .env.prod | xargs) && \
for var in $(grep -v '^#' .env.prod | cut -d= -f1); do
  gh secret set "$var" --body "${!var}"
done
