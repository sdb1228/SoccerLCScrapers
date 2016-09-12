const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })
var models = require("./models")
var Teams = models.Teams
var Games = models.Games

const insertOrUpdateTeam = function insertOrUpdateTeam (teamId, teamName, division = '') {
  Teams.upsert({
    teamId: teamId,
    name: teamName,
    division: division
  })
  .then(function(inserted) {
    if (inserted) {
      log.info('***** Inserted row *****')
    } else {
      log.info('***** Updated row *****')
    }
    helpers.printTeamRow(teamId, teamName, division)
  })
  .catch(function(err) {
    helpers.minorErrorHeader('Error running update or insert on team ' + err)
    return helpers.slackFailure('Error running update or insert on team ' + err)
  })
}

const insertOrUpdateGame = function insertOrUpdateGame (gameId, division, field, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore) {
  Games.upsert({
    awayTeam: awayTeam,
    homeTeam: homeTeam,
    homeTeamScore: homeTeamScore,
    awayTeamScore: awayTeamScore
  })
  .then(function(inserted) {
    if (inserted) {
      log.info('***** Inserted row *****')
    } else {
      log.info('***** Updated row *****')
    }
    helpers.printTeamRow(teamId, teamName, division)
  })
  .catch(function(err) {
    helpers.minorErrorHeader('Error running update or insert on team ' + err)
    return helpers.slackFailure('Error running update or insert on team ' + err)
  })
}

module.exports = {
  insertOrUpdateTeam,
  insertOrUpdateGame,
}
