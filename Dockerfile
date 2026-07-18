# Stage 1: compile the Vite source into static files.
# Using an LTS Node line keeps the build toolchain predictable.
FROM node:24-alpine AS build

WORKDIR /app

# Copy dependency metadata first so Docker can reuse the npm layer when only
# application source files change.
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: serve only the generated files, not Node or the source tree.
# This makes the runtime image smaller and gives it fewer moving parts.
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# The upstream nginx image already supplies the correct foreground command.
