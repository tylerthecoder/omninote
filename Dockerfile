# Stage 1: Build both client and server
FROM oven/bun:latest AS builder

WORKDIR /app/tt-services

# Copy package.json and package-lock.json for both client and server
COPY tt-services/package.json ./
COPY tt-services/src ./src

# Install dependencies for both client and server
RUN bun install

WORKDIR /app/planner

# Copy package.json and package-lock.json for both client and server
COPY planner/package.json ./

# Install dependencies for both client and server
RUN bun install

# Copy source code for both client and server
COPY planner ./

# Build the client
RUN bun run build

RUN bun install

# Typecheck the server
# RUN bun run typecheck:server

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "server/server.ts"]
# CMD ["/bin/bash"]
