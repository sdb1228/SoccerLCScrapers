const log = require('custom-logger').config({ level: 0 })
const Slack = require('node-slack')
const slack = new Slack('https://hooks.slack.com/services/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')
const Table = require('cli-table')

const headerBreak = function headerBreak (text) {
  console.log('\n')
  log.info('---------  ' + text + '  ------------')
  console.log('\n')
}
const lineBreaks = function lineBreaks (count) {
  for (let i = 0; i < count; i++) {
    console.log('\n')
  }
}
const minorHeader = function minorHeader (text) {
  console.log('\n')
  log.info('****  ' + text + '  ****')
  console.log('\n')
}
const minorErrorHeader = function minorErrorHeader (text) {
  console.log('\n')
  log.error('****  ' + text + '  ****')
  console.log('\n')
}

const slackSuccess = function slackSuccess (text) {
  slack.send({
    text: text,
    channel: '#scrapers',
    username: 'Scraper Bot',
  })
}

const slackFailure = function slackFailure (text) {
  slack.send({
    text: '<!channel> ' + text,
    channel: '#scrapers',
    username: 'Scraper Bot',
  })
}

const printTeamRow = function printTeamRow (teamId, teamName, division = '') {
  let teamsTable = new Table({
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
  })
  teamsTable.push(
      ['Team Id', 'Team Name', 'Division'],
      [teamId, teamName, division]
  )
  console.log(teamsTable.toString())
}

module.exports = {
  printTeamRow,
  slackFailure,
  slackSuccess,
  minorErrorHeader,
  minorHeader,
  headerBreak,
  lineBreaks,
}
