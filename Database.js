const pg = require('pg')
const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })

const config = {
  user: 'SoccerLC',
  database: 'SoccerLC',
  password: 'password',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 3000,
}

const pool = new pg.Pool(config)

pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack)
})

const insertOrUpdateTeam = function insertOrUpdateTeam (teamId, teamName, division = '') {
  pool.connect(function (err, client, done) {
    if (err) {
      return helpers.slackFailure('Error fetching client from pool ' + err)
    }
    client.query('SELECT id FROM teams WHERE team_id=$1;', [teamId], function (err, result) {
      log.info('***** Team Record Recieved *****')
      helpers.printTeamRow(teamId, teamName, division)
      if (err) {
        helpers.minorErrorHeader('Error running select query on teams')
        return helpers.slackFailure('Error running select team query ' + err)
      }
      if (result.rows.length) {
        log.info('Row found ID: ' + result.rows[0].id)
        done()
      } else {
        insertTeam(client, done, teamId, teamName, division)
        log.info('No row found inserting team')
      }
    })
  })
}

function insertTeam (client, done, teamId, teamName, division) {
  client.query('INSERT INTO teams (team_id, name, division) VALUES ($1, $2, $3);', [teamId, teamName, division], function (err, result) {
    done()
    if (err) {
      helpers.minorErrorHeader('Error inserting team record into database ' + teamId + ' ' + teamName + ' ' + division)
      return helpers.slackFailure('Error running insert teams query ' + err)
    } else {
      return log.info('Inserted team ' + teamName)
    }
  })
}

function updateTeam (teamId, teamName, division, rowID) {
  console.log('update me')
}

module.exports = {insertOrUpdateTeam}
