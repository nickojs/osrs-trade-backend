FROM node:16-alpine

WORKDIR /usr/app

COPY . .

RUN yarn run build

CMD ["node", "dist/main.js"]