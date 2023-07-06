#!/usr/bin/env bash
./scripts/wait-for-it.sh $1
sleep 5
npm run migrate:up