const log = require('custom-logger').config({ level: 0 })
const SlackBot = require('slackbots')

const bot = new SlackBot({
    token: 'xoxb-70910249632-c6oZqXnJLw91VEPnUyKRsdLp',
    name: 'Scraper Bot'
});

const headerBreak = function headerBreak (text) {
  console.log("\n")
  log.info('---------  ' + text + '  ------------')
  console.log("\n")
}
const lineBreaks = function lineBreaks (count) {
  for ( var i = 0; i < count; i++) {
    console.log("\n")
  }
}
const minorHeader = function minorHeader (text) {
  console.log("\n")
  log.info('****  ' + text + '  ****')
  console.log("\n")
}
const minorErrorHeader = function minorErrorHeader (text) {
  console.log("\n")
  log.error('****  ' + text + '  ****')
  console.log("\n")
}

const slackSuccess = function slackSuccess (text) {
bot.on('start', function() {
  bot.postMessageToChannel('scrapers', 'meow!')
  bot.postMessageToChannel('general', 'meow!')
})

}
module.exports.slackSuccess = slackSuccess
module.exports.minorErrorHeader = minorErrorHeader
module.exports.minorHeader = minorHeader
module.exports.headerBreak = headerBreak
module.exports.lineBreaks = lineBreaks
