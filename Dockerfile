FROM node:20-alpine

# Build tools required to compile better-sqlite3 native bindings
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first so this layer is cached when only source changes
COPY package*.json ./
RUN npm install

COPY . .

# Ensure the SQLite database directory exists at runtime
RUN mkdir -p database

# Default port — can be overridden with -e PORT=... or in your .env file
ENV PORT=3001

# Enable polling so chokidar detects file changes through volume mounts
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
