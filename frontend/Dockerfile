# Stage 1: Build the React application
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy application source code and build production assets
COPY . ./
RUN pnpm build

# Stage 2: Serve with lightweight Nginx web server
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy for /api/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
