FROM node:14-alpine

# install Git & Bash
RUN apk update && apk add git && apk add bash && apk add dumb-init

WORKDIR /volavote
COPY . .

# yarn install
RUN yarn install

EXPOSE 80

CMD ["dumb-init", "yarn","start"]
