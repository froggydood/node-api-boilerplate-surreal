FROM node:18-alpine

WORKDIR /nodeapp

ADD ./scripts ./scripts

COPY .env* pnpm* *config* package.json ./

RUN chmod 777 /nodeapp
RUN npm i -g pnpm@6.31.0
RUN pnpm i