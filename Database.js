const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })
var models = require("./models")
var Team = models.Team
var Game = models.Game
var Facility = models.Facility
var Field = models.Field

const insertOrUpdateTeam = function insertOrUpdateTeam (teamId, teamName, division = '', facility) {
  Team.upsert({
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
  Field
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
        // GAMES WITHOUT GAMEID
        console.log ('how did you get here')
      }
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running find or create on field ' + err)
      return helpers.slackFailure('Error running find or create on field ' + err)
    })
}

function insertOrUpdateWithGameId (gameId, field, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore, facility) {
  Game
    .findOrCreate({where: {facilityGameId: gameId, facilityId: facility}})
    .then(function(games, created) {
      let game = games[0]
      game.field = field
      game.awayTeam = awayTeam
      game.homeTeam = homeTeam
      game.awayTeamScore = game.awayTeamScore
      game.homeTeamScore = game.homeTeamScore
      game.gameDateTime = dateTime
      game.save().catch(function(error) {
        helpers.minorErrorHeader('Error saving gameID ' + gameId+ ' with facility ' + facility + ' ERROR: ' + err)
        return helpers.slackFailure('Error saving gameID ' + gameId+ ' with facility ' + facility + ' ERROR: ' + err)
      })
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running find or create on game with gameid ' + err)
      return helpers.slackFailure('Error running find or create on game with gameid ' + err)
    })
}

const initialFacilityInsert = function initialFacilityInsert (facilities) {
  for (let facility of facilities) {
    Facility.upsert({
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

const insertOrUpdateField = function insertOrUpdateField (name, address, city, state, zip) {
  Field
    .findOrCreate({where: {name: name}})
    .then(function(fields, created) {
      let field = fields[0]
      if (address) {
        field.address = address
      }
      if (city) {
        field.city = city
      }
      if (state) {
        field.state = field.state
      }
      if (zip) {
        field.zip = field.zip
      }
      field.save().catch(function(error) {
        helpers.minorErrorHeader('Error saving field ' + name + ' ERROR: ' + err)
        return helpers.slackFailure('Error saving field ' + ' ERROR: ' + err)
      })
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running update or insert on field ' + err)
      return helpers.slackFailure('Error running update or insert on field ' + err)
    })
}

module.exports = {
  insertOrUpdateTeam,
  insertOrUpdateGame,
  initialFacilityInsert,
  insertOrUpdateField
}
