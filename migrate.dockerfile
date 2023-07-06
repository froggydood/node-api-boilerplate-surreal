FROM node:18-alpine

WORKDIR /nodeapp

ADD ./scripts ./scripts
COPY .env ./
COPY package.json ./

# Installs bash needed to run the wait-for-it script
RUN apk update
RUN apk upgrade
RUN apk add bash

RUN chmod +x ./scripts/wait-for-it.sh
RUN chmod +x ./scripts/wait-migrate.sh

RUN npm i -g pnpm@6.31.0
RUN pnpm i