const UtahSoccer = require('./UtahSoccer')
const log = require('custom-logger').config({ level: 0 })
prettyPrint('Utah Soccer')
UtahSoccer()
.then (() => {
  console.log('hifelix')
})
.catch ((err) => {
  console.log(err)
})

function prettyPrint (facility) {
  log.info('####################################')
  log.info('#########  ' + facility + '  ############')
  log.info('####################################')
}
