const UtahSoccer = require('./UtahSoccer')
const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })
prettyPrint('Utah Soccer')
//TODO: For Batches assume failure unless told success
UtahSoccer()
.then (() => {
  //TODO: Utah soccer batch successful
  helpers.slackSuccess('Utah Soccer Scraper ran successfully')
  helpers.headerBreak('Utah Soccer Scraper ran successfully')
})
.catch ((err) => {
  helpers.minorErrorHeader('Utah Soccer Scraper has failed with ERROR: ' + err)
  helpers.slackFailure('Utah Soccer Scraper has failed with ERROR: ' + err)
})

function prettyPrint (facility) {
  log.info('####################################')
  log.info('#########  ' + facility + '  ############')
  log.info('####################################')
}
