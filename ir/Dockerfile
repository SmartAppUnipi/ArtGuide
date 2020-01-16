FROM node:alpine

# install dependencies
ADD ./package.json /art/ir/package.json
ADD ./package-lock.json /art/ir/package-lock.json
WORKDIR /art/ir
RUN npm ci

# copy app and routes.json
ADD . /art/ir

# port
EXPOSE 3000

# run
CMD npm start