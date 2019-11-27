FROM node:alpine
ADD ./IR /art/ir
ADD ./routes.json /art/routes.json
WORKDIR /art/ir
RUN npm i
EXPOSE 3000
CMD npm start