FROM node:12.10-alpine

WORKDIR /api

COPY package*.json ./

RUN npm install --quite

EXPOSE 3000
