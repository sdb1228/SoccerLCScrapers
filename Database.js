const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })
var models = require("./models");
var Teams = models.Teams;

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
  // TODO: WE NEED to insert the game and do fancy stuff
   //pool.connect(function (err, client, done) {
     //if (err) {
       //return helpers.slackFailure('Error fetching client from pool ' + err)
     //}
     //client.query('SELECT id FROM Teams WHERE team_id=$1;', [teamId], function (err, result) {
       //log.info('***** Team Record Recieved *****')
       //helpers.printTeamRow(teamId, teamName, division)
       //if (err) {
         //helpers.minorErrorHeader('Error running select query on Teams')
         //return helpers.slackFailure('Error running select team query ' + err)
       //}
       //if (result.rows.length) {
         //log.info('Row found ID: ' + result.rows[0].id)
         //updateTeam(client, done, teamId, teamName, division, result.rows[0].id)
       //} else {
         //log.info('No row found inserting team')
         //insertTeam(client, done, teamId, teamName, division)
       //}
     //})
   //})
}

module.exports = {
  insertOrUpdateTeam,
  insertOrUpdateGame,
}
