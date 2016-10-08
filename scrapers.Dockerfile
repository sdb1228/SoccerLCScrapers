FROM node:6.5.0-wheezy
RUN apt-get update
RUN apt-get install -y vim
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY scrapers/package.json /usr/src/app
RUN npm install
ADD ./scrapers /usr/src/app
COPY ./config /usr/src/app/config
COPY ./models /usr/src/app/models
COPY ./migrations /usr/src/app/migrations
