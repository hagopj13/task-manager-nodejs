FROM node:12.10-alpine

RUN mkdir -p /usr/src/api

WORKDIR /usr/src/api

COPY package*.json ./

RUN npm install --quite

COPY . .

EXPOSE 3000
