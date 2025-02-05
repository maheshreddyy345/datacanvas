# Use Node.js LTS version
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build React app
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["node", "server.prod.js"]
