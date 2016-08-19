const UtahSoccer =  require('./UtahSoccer')
const log = require('custom-logger').config({ level: 0 })
prettyPrint("Utah Soccer")
UtahSoccer()

function prettyPrint (facility) {
  log.info('####################################')
  log.info('#########  ' + facility + '  ############')
  log.info('####################################')
}
