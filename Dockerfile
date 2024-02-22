FROM node:20

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY . .

ENTRYPOINT [ "./docker-start.sh" ]
