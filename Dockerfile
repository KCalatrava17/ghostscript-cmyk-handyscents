FROM node:20

# Install Ghostscript
RUN apt-get update && apt-get install -y ghostscript

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all files
COPY . .

# Expose app port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]