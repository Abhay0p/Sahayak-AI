FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for node-gyp and prisma
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/healthcare-service/package.json ./services/healthcare-service/
COPY services/game-service/package.json ./services/game-service/
COPY services/ai-service/package.json ./services/ai-service/
COPY services/notification-service/package.json ./services/notification-service/

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN cd packages/database && npx prisma generate

# Build the database workspace first to satisfy dependencies
RUN npm run build --workspace=@sahayak/database

# Build the rest of the workspaces
RUN npm run build --workspaces --if-present

# Set environment variables
ENV NODE_ENV=production
ENV IS_MONOLITH=true
ENV PORT=8000

EXPOSE 8000

# Start the monolithic server
CMD ["npm", "start"]
