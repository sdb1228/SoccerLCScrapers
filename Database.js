const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })
var models = require("./models")
var Teams = models.Teams
var Games = models.Games
var Facilitys = models.Facilitys
var Fields = models.Fields

const insertOrUpdateTeam = function insertOrUpdateTeam (teamId, teamName, division = '', facility) {
  Teams.upsert({
    teamId: teamId,
    name: teamName,
    division: division,
    facility: facility,
  })
  .then(function(inserted) {
    if (inserted) {
      log.info('***** Inserted Team row *****')
    } else {
      log.info('***** Updated Team row *****')
    }
    helpers.printTeamRow(teamId, teamName, division)
  })
  .catch(function(err) {
    helpers.minorErrorHeader('Error running update or insert on team ' + err)
    return helpers.slackFailure('Error running update or insert on team ' + err)
  })
}

const insertOrUpdateGame = function insertOrUpdateGame (gameId, field, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore, facility) {
  Fields
    .findOrCreate({where: {name: field}})
    .then(function(field, created) {
      if (!field[0].id) {
        helpers.minorErrorHeader('Missing fieldId in game record')
        helpers.printGameRow(gameId, field, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore)
        return helpers.slackFailure('Missing fieldId for game')
      }
      if (gameId) {
        insertOrUpdateWithGameId (gameId, field[0].id, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore, facility)
      } else {
        console.log ('how did you get here')
      }
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running find or create on field ' + err)
      return helpers.slackFailure('Error running find or create on field ' + err)
    })
}

function insertOrUpdateWithGameId (gameId, field, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore, facility) {
  Games
    .findOrCreate({where: {facilityGameId: gameId, facility: facility}})
    .then(function(games, created) {
      let game = games[0]
      game.field = field
      game.awayTeam = awayTeam
      game.homeTeam = homeTeam
      game.awayTeamScore = game.awayTeamScore
      game.homeTeamScore = game.homeTeamScore
      game.gameDateTime = dateTime
      game.save()
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running find or create on game with gameid ' + err)
      return helpers.slackFailure('Error running find or create on game with gameid ' + err)
    })
}

const initialFacilityInsert = function initialFacilityInsert (facilities) {
  for (let facility of facilities) {
    Facilitys.upsert({
      name: facility.name,
      address: facility.address,
      city: facility.city,
      zip: facility.zip,
      state: facility.state,
    })
    .then(function(inserted) {
      if (inserted) {
        log.info('***** Inserted Facility row *****')
      } else {
        log.info('***** Updated Facility row *****')
      }
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running update or insert on facility ' + err)
      return helpers.slackFailure('Error running update or insert on facility ' + err)
    })
  }
}

module.exports = {
  insertOrUpdateTeam,
  insertOrUpdateGame,
  initialFacilityInsert,
}
