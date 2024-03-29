const log = require('custom-logger').config({ level: 0 })
const Slack = require('node-slack')
const slack = new Slack('https://hooks.slack.com/services/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')
const Table = require('cli-table')
const PrettyError = require('pretty-error')
const prettyError = new PrettyError()
if (process.env.NODE_ENV === 'production') {
  prettyError.withoutColors()
}
const channel = '#scrapers_noisy'
const botUsername = 'Scraper Bot'

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

const logToSlack = function logToSlack (text, options) {
  switch(options.status) {
      case "Success":
        this.slackSuccess(text)
        break;
      case "Status":
        this.slackStatus(text)
        break;
      case "Error":
        this.slackFailure(text, options.error)
      default:
        this.slackStatus("Made call without status")
  }
}

const slackStatus = function slackStatus (text) {
  if (process.env.NODE_ENV === 'production') {
    slack.send({
      text: text,
      channel: channel,
      username: botUsername,
    })
  } else {
    console.log(text)
  }
}

const slackSuccess = function slackSuccess (text) {
  if (process.env.NODE_ENV === 'production') {
    slack.send({
      text: text,
      channel: channel,
      username: botUsername,
    })
  } else {
    console.log(text)
  }
}

const slackFailure = function slackFailure (text, e) {
  if (process.env.NODE_ENV === 'production') {
    slack.send({
      text: '<!channel>',
      channel: channel,
      attachments: [
        {
            "title": text,
            "title_link": "https://groove.hq/path/to/ticket/1943",
            "text": "``` " +  prettyError.render(e) + " ```",
            "color": "#ff0000",
            "mrkdwn_in": ['text']
        }
      ],
      username: botUsername,
    })
  } else {
    console.log(text + "\n" + prettyError.render(e))
  }
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

const printFieldRow = function printFieldRow (fieldName = '', fieldAddress = '', fieldCity = '', fieldState = '', fieldZip = '') {
  let fieldsTable = new Table({
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
  })
  fieldsTable.push(
      ['Field Name', 'Field Address', 'Field City', 'Field State', 'Field Zip'],
      [fieldName, fieldAddress, fieldCity, fieldState, fieldZip]
  )
  console.log(fieldsTable.toString())
}

const wait = function wait (ms) {
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

const printGameRow = function printGameRow (gameId='', field='', dateTime='', homeTeam='', awayTeam='', homeTeamScore='', awayTeamScore='') {
  let gamesTable = new Table({
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
  })
  gamesTable.push(
      ['Game ID', 'Field', 'Date Time', 'Home Team', 'Away Team', 'Home Team Score', 'Away Team Score'],
      [gameId, field, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore]
  )
  console.log(gamesTable.toString())
}

module.exports = {
  printGameRow,
  printTeamRow,
  slackFailure,
  slackSuccess,
  slackStatus,
  minorErrorHeader,
  minorHeader,
  headerBreak,
  lineBreaks,
  wait,
  printFieldRow,
  logToSlack,
}
