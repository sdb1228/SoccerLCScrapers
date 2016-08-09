const pg = require('pg')

const config = {
  user: 'SoccerLC',
  database: 'SoccerLC',
  password: 'R1ghtd28@88!',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 3000,
};

const pool = new pg.Pool(config);

pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack)
})

var insertOrUpdateTeam = function insertTeam (teamId, teamName, division = '') {
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query('INSERT INTO teams (team_id, name, division) VALUES ($1, $2, $3);', [teamId, teamName, division], function(err, result) {
      done();

      if(err) {
        return console.error('error running query', err);
      }
      else{
        return console.log('Inserted team ' + teamName)
      }
    });
  });
}

module.exports.insertOrUpdateTeam = insertOrUpdateTeam
