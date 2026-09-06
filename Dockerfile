FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY realtime ./realtime
RUN npm run realtime:build && npm prune --omit=dev

FROM node:22-bookworm-slim
ARG BUILD_SHA=dev
ENV NODE_ENV=production BUILD_SHA=$BUILD_SHA PORT=8080 DATA_DIR=/data
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/realtime/dist ./realtime/dist
RUN mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 8080
CMD ["node", "realtime/dist/server.js"]
