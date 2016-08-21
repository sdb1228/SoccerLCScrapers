const log = require('custom-logger').config({ level: 0 })
const Slack = require('node-slack');
const slack = new Slack("https://hooks.slack.com/services/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");

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
  slack.send({
      text: text,
      channel: '#scrapers',
      username: 'Scraper Bot'
  });
}

const slackFailure = function slackFailure (text) {
  slack.send({
      text: "<!channel> " + text,
      channel: '#scrapers',
      username: 'Scraper Bot'
  });
}
module.exports.slackSuccess = slackSuccess
module.exports.minorErrorHeader = minorErrorHeader
module.exports.minorHeader = minorHeader
module.exports.headerBreak = headerBreak
module.exports.lineBreaks = lineBreaks
