FROM node:24.4-alpine3.21 AS builder

WORKDIR /app

RUN npm install -g typescript

COPY package.json tsconfig.json ./

RUN npm i --production

COPY src src

RUN npm run build


CMD ["node", "dist/index.js"]