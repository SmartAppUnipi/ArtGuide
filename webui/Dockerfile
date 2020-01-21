FROM node:alpine

# install dependencies
ADD ./package.json /art/webui/package.json
ADD ./package-lock.json /art/webui/package-lock.json
WORKDIR /art/webui
RUN npm ci

# copy app and routes.json
ADD . /art/webui
RUN npm run build

# port
EXPOSE 8000

# run
CMD npm start