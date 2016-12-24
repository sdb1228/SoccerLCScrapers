global.Promise = require('bluebird')

const UYSABoys = require('./UYSABoys')
const LetsPlay = require('./LetsPlay')
const UtahSoccer = require('./UtahSoccer')
const SportCity = require('./SportCity')

UYSABoys.scrape()
LetsPlay.scrape()
UtahSoccer.scrape()
SportCity.scrape()
