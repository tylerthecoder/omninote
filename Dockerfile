# Stage 1: Build both client and server
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package.json and package-lock.json for both client and server
COPY src/client/package*.json ./src/client/
COPY src/server/package*.json ./src/server/
COPY package.json ./

# Install dependencies for both client and server
RUN bun install

# Copy source code for both client and server
COPY src ./src

# Typecheck the server
RUN cd src/server && bun run typecheck

# Build the client
RUN cd src/client && bun run build

# Stage 2: Production environment
FROM oven/bun:latest

WORKDIR /app

# Copy built client and server files
COPY --from=builder /app/src/client/dist ./src/client/dist
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/types ./src/types

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "src/server/server.ts"]