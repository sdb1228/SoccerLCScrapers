FROM node:6.3.1-wheezy
RUN apt-get update
RUN apt-get install -y vim
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install
COPY . /usr/src/app
