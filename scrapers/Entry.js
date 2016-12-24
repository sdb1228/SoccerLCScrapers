global.Promise = require('bluebird')

const UYSABoys = require('./UYSABoys')
const UYSAGirls = require('./UYSAGirls')
const LetsPlay = require('./LetsPlay')
const UtahSoccer = require('./UtahSoccer')
const SportCity = require('./SportCity')

UYSABoys.scrape()
UYSAGirls.scrape()
LetsPlay.scrape()
UtahSoccer.scrape()
SportCity.scrape()
