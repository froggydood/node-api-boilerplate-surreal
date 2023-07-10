# node-api-boilerplate-surreal

## Description

This is a boilerplate node rest api using [koa](https://www.npmjs.com/package/koa) as the webserver and [surrealdb](https://surrealdb.com/) as the database.

## Setup

1. First this project uses `pnpm` as its package manager, so if not already installed install it with `npm i -g pnpm`
2. Next install the `dotenv-cli` package globally using `pnpm i -g dotenv-cli`
	- We do this, because when using github actions as our CI pipeline, their shell already has a builtin `dotenv` command. And the `dotenv-cli` command doesn't seem to work in the github actions environment for some reason.
	- This means when running locally we use the `dotenv-cli` package, and in the CI pipeline, we use their in built `dotenv` command and it all seems to work okay
3. Create a `.env` file, look at the `.env.example` for what variables you need to provide.
4. Run `npm run docker:dev` to run all the docker containers for development.
   - This will run the following containers:
     - `backend`: Our node koa webserver
     - `database`: Our surrealdb database
     - `migrations`: Our container for running migrations against the database
     - `redis`: Our redis container used for fast `kv` style access. We use it mainly for JWT invalidation

This will setup everything necessary for you to develop, there are a few things you need to be aware of though.

1. If you want to rebuild the containers, run `npm run docker:dev-rebuild`, this will rebuild all local containers.
	- This is needed if you change some files that aren't used as volumes for the container
	- E.g. you add a new npm package and that changes the `package.json`, this means you will have to stop the server and run `npm run docker:dev-rebuild` to rebuild all containers to make sure they get the latest packages

## Tests

To run all the tests, just have all containers running, e.g. `npm run docker:dev`. And then run `npm run test`, and this will run all our tests against the local running containers.