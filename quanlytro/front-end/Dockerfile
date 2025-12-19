# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . ./

# Build production
RUN npm run build

# Stage 2: Production với Nginx
FROM nginx:alpine

# Copy build output đến Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx config (optional - tạo sau nếu cần)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
