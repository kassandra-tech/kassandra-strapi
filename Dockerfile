FROM node:16.3.0-alpine

ENV NPM_CONFIG_LOGLEVEL info

# Create app directory
WORKDIR /app/src

# Install app dependencies
COPY package*.json ./
RUN npm install --only=production
RUN npm run build

# Bundle app source
COPY . .

EXPOSE 1337
CMD [ "npm", "run", "start"]
