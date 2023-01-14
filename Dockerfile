# Use NODEJS
FROM node:16

# Setup image
WORKDIR /usr/src/cdn
COPY package*.json ./
COPY . ./
RUN npm install
EXPOSE 8083
CMD [ "npm", "run", "start" ]