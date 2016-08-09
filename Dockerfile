FROM node:6.3.1-wheezy
COPY . /usr/src/
WORKDIR /usr/src/
RUN npm install
