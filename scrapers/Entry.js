global.Promise = require('bluebird')

const LetsPlay = require('./LetsPlay')
const UtahSoccer = require('./UtahSoccer')
const SportCity = require('./SportCity')

LetsPlay.scrape()
UtahSoccer.scrape()
SportCity.scrape()
