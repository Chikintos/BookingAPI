FROM node:14

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .
RUN yarn add bcrypt --force
RUN yarn build

EXPOSE 4000

CMD ["yarn", "run", "start"]
