FROM node:6.3.1-wheezy
RUN apt-get update
RUN apt-get install -y vim
COPY . /usr/src/
WORKDIR /usr/src/
RUN npm install
