FROM node:6.5.0-wheezy
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY notifier/package.json /usr/src/app
RUN npm install
ADD ./notifier /usr/src/app
COPY ./config /usr/src/app/config
COPY ./models /usr/src/app/models
COPY ./migrations /usr/src/app/migrations
