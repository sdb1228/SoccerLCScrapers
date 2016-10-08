FROM node:6.5.0-wheezy
RUN apt-get update
RUN apt-get install -y vim

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Disable npm progress bar to speed up installs
RUN npm set progress=false

# Install global dependencies
RUN npm install pm2 -g

# Install app dependencies
COPY ./server/package.json /usr/src/app/
RUN npm cache clean
RUN npm install --production

ADD ./server /usr/src/app
COPY ./config /usr/src/app/config
COPY ./models /usr/src/app/app/models/imports

EXPOSE 1337
