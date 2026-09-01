# syntax=docker/dockerfile:1

FROM node:22.11-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.11-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data

RUN addgroup -S rack && adduser -S rack -G rack \
    && mkdir -p /data \
    && chown -R rack:rack /app /data

COPY --from=build --chown=rack:rack /app/dist ./dist
COPY --chown=rack:rack server.js ./server.js

USER rack
EXPOSE 8080
VOLUME ["/data"]

CMD ["node", "server.js"]
