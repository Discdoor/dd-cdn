# Use NODEJS
FROM node:16

# Create app directory
WORKDIR /usr/src/cdn
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8083
CMD [ "node", "index.js" ]