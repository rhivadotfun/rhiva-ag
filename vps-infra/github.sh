#!/bin/bash

ssh-keygen -t ed25519 -C "oasis.mystre@gmail.com"
git config --global user.name "oasisMystre"
git config --global user.email "oasis.mystre@gmail.com"

cat ~/.ssh/id_ed25519.pub
