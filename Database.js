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

const insertOrUpdateGame = function insertOrUpdateGame (gameId, field, dateTime, homeTeam, awayTeam, homeTeamScore, awayTeamScore) {
  fieldId = null
  Fields
    .findOrCreate({where: {name: field}})
    .spread(function(field, created) {
      fieldId = field.id
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running find or create on field ' + err)
      return helpers.slackFailure('Error running find or create on field ' + err)
    })
  if (!fieldId) {
    helpers.minorErrorHeader('Missing fieldId in game record')
    //TODO: pring game row
    return helpers.slackFailure('Missing fieldId for game')
  }
  if (gameId) {
    //TODO: find/upsert by game id
  } else {
    Games.upsert({
      awayTeam: awayTeam,
      homeTeam: homeTeam,
      homeTeamScore: homeTeamScore,
      awayTeamScore: awayTeamScore,
    })
    .then(function(inserted) {
      if (inserted) {
        log.info('***** Inserted Game row *****')
      } else {
        log.info('***** Updated Game row *****')
      }
      // TODO: insert print game row
      //helpers.printTeamRow(teamId, teamName, division)
    })
    .catch(function(err) {
      helpers.minorErrorHeader('Error running update or insert on game ' + err)
      return helpers.slackFailure('Error running update or insert on game ' + err)
    })
  }
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
