# Unlike the main frontend/backend images (production build + npm start),
# this runs Vite's own dev server rather than a static build behind a
# reverse proxy. The admin panel's API calls are same-origin relative paths
# (src/lib/apiClient.js) proxied to the backend by vite.config.js's own
# dev-server proxy — that proxy only exists while the dev server is
# running, so keeping this container in dev mode reuses that mechanism
# as-is instead of standing up a separate reverse proxy (e.g. nginx) just
# to replicate it in front of a static build.
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5174

CMD ["npm", "run", "dev"]
