FROM node:10-stretch

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN yarn bundle

EXPOSE 51001
CMD ["node", "dist/index.js"]
