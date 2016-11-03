const db = require('./models')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const moment = require('moment-timezone')
moment.tz.setDefault('America/Denver')

const saveFields = async (function saveFields(scraped, res) {
  for (let i = 0; i < scraped.fields.length; i++) {
    const field = scraped.fields[i]
    await (db.upsertFieldByName(field.name, field))
  }
  res.log(`Saved ${scraped.fields.length} fields`)
})

const saveTeams = async (function saveTeams(scraped, res) {
  if (!scraped.teams) {
    // if there are no teams because of an error, the extractor should raise the error
    res.log('No teams saved')
    return
  }

  for (let i = 0; i < scraped.teams.length; i++) {
    const team = scraped.teams[i]
    team.facilityId = scraped.facilityId
    await(db.upsertTeamByTeamId(team.teamId, team))
  }
  res.log(`Saved ${scraped.teams.length} teams`)
})

function isValidGame(game) {
  return (game.field && !game.field.startsWith('-') &&
          game.gameDateTime &&
          game.homeTeamId && parseInt(game.homeTeamId) > 0 &&
          game.awayTeamId && parseInt(game.awayTeamId) > 0 &&
          ((parseInt(game.homeTeamScore) >= 0 && parseInt(game.awayTeamScore) >= 0) ||
           (!game.homeTeamScore && !game.awayTeamScore && game.homeTeamScore !== 0 && game.awayTeamScore !== 0)))
}

const saveGames = async (function saveGames(scraped, res) {
  // the _only_ data we care about/trust from the site are games with two valid teams, a valid field, and a valid time. both scores have to be set or not set together.
  if (!scraped.games) {
    // if there are no games because of an error, the extractor should raise the error
    res.log('No games saved')
    return
  }

  for (let i = 0; i < scraped.games.length; i++) {
    const game = scraped.games[i]
    // todo: detect stupid field and team names that LetsPlay uses for status (forfeits, byes) and update games
    if (!isValidGame(game)) {
      console.log(JSON.stringify({invalidGame: game}, null, 2))
      continue
    }
    const dbGame = await(db.upsertGame({
      facilityId: scraped.facilityId,
      field: game.field, // field name
      // external team ids
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      gameDateTime: moment.utc(game.gameDateTime),
      homeTeamScore: game.homeTeamScore,
      awayTeamScore: game.awayTeamScore,
      tournament: game.tournament,
      batchAt: scraped.batchAt
    }))
  }
  res.log(`Saved ${scraped.games.length} games`)

  const untouchedGames = await(db.Game.findAll({where: {facilityId: scraped.facilityId, lastBatchAt: {$lt: scraped.batchAt}}}))
  for (let i = 0; i < untouchedGames.length; i++) {
    const game = untouchedGames[i]
    console.log(JSON.stringify({untouchedGame: game}, null, 2))
  }
  res.log(`${untouchedGames.length} stale games`)
})

module.exports = {
  saveFields: saveFields,
  saveTeams: saveTeams,
  saveGames: saveGames,
  isValidGame: isValidGame
}
