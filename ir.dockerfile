FROM node:alpine

ADD ./ir/package.json /art/ir/package.json
ADD ./ir/package-lock.json /art/ir/package-lock.json

WORKDIR /art/ir
RUN npm ci

ADD ./ir /art/ir
ADD ./docker.json /art/routes.json

EXPOSE 3000

CMD npm start