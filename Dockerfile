# syntax = docker/dockerfile:1.2

FROM oven/bun:latest as base

ENV NODE_ENV="production"

RUN apt-get update \
    && apt-get install -y curl unzip bash ca-certificates 

ENV PATH="/root/.bun/bin:$PATH"

FROM base as codegen
WORKDIR /usr/src/app

# Copy source code
COPY packages ./packages
COPY servers ./servers
COPY turbo.json ./turbo.json
COPY bun.lock ./bun.lock
COPY package.json ./package.json

# Run turbo prune for docker build
RUN bun install turbo --global && \
    bun x turbo prune @rhiva-ag/trpc --docker

FROM base as builder
WORKDIR /usr/src/app
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=codegen /usr/src/app/out/json .
RUN --mount=type=cache,target=/root/.bun/cache\
    bun install --frozen-lockfine

COPY --from=codegen /usr/src/app/out/full . 
COPY --from=codegen /usr/src/app/servers/ecosystem.config.js servers/ecosystem.config.js

FROM base as runtime
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/ .

ENV HOST="0.0.0.0"
ENV NODE_ENV=production

FROM runtime as dev
WORKDIR /usr/src/app/servers
CMD sh -c "cd packages/datasource && \
  bun x drizzle-kit migrate && \
  cd - && \
  bun x pm2-runtime start ecosystem.config.js"

FROM runtime as trpc 
WORKDIR /usr/src/app/servers/trpc
CMD ["bun", "src/index.ts"]
