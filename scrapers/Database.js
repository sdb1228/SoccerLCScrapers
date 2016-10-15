const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })
var models = require("./models")
var Team = models.Team
var Game = models.Game
var Facility = models.Facility
var Field = models.Field

const insertOrUpdateTeam = function insertOrUpdateTeam (data) {
  Team.upsert(data)
  .then(data => {
    log.info('***** Inserted Team row *****')
    console.log(data.dataValues)
    return data
  })
  .catch(err => {
    throw err
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
      environment: facility.environment,
      image: facility.image,
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

const insertOrUpdateField = function insertOrUpdateField (data) {
  return Field.create(data)
  .then(data => {
    log.info('***** Inserted Field row *****')
    console.log(data.dataValues)
    return data
  })
  .catch(err => {
    throw err
  })
}

module.exports = {
  insertOrUpdateTeam,
  insertOrUpdateGame,
  initialFacilityInsert,
  insertOrUpdateField
}
