FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# PUBLIC_* vars must be present at BUILD time — Vite inlines them into the
# client bundle, unlike server-only vars (see lib/pocketbase.ts note, which
# deliberately does the opposite: process.env at runtime, not a build ARG).
ARG PUBLIC_TURNSTILE_SITE_KEY
ENV PUBLIC_TURNSTILE_SITE_KEY=$PUBLIC_TURNSTILE_SITE_KEY
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "./dist/server/entry.mjs"]
