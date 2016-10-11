const Url = require('url')
const db = require('./models')
const async = require('asyncawait/async')
const await = require('asyncawait/await')

let Scraper = require('./Scraper')
let s = new Scraper('SportCity', {rateLimit: [2, 'second']})

const divisionPattern = 'sportcityutah.com/schedules-adult(/)'
const schedulePattern = 'soccer-city-utah.ezleagues.ezfacility.com/leagues/:leagueId(/*)'
const gamePattern = 'soccer-city-utah.ezleagues.ezfacility.com/games/:gameId(/*)'

const DIVISIONS_URL = 'http://sportcityutah.com/schedules-adult/'
const DIVISION_URL_PREFIX = 'http://soccer-city-utah.ezleagues.ezfacility.com/leagues/'
const FACILITY_ID = 3

s.domExtractor(divisionPattern, function extractDivisions(req, res) {
  const $ = req.$
  const links = $(`a[href^="${DIVISION_URL_PREFIX}"]`)
  for (let i = 0; i < links.length; i++) {
    const link = $(links[i])
    res.get(link.attr('href'))
  }
})

s.domExtractor(schedulePattern, function extractSchedule(req, res) {
  const $ = req.$
  const rows = $('div#ctl00_C_pnlSchedule tr')
  rows.each((_, row) => {
    const cols = $(row).children('td')

    // Teams
    const home = cols.eq(1);
    const away = cols.eq(3);
    [home, away].forEach((team) => {
      const teamUrl = team.children('a[href]').first().attr('href')
      if(teamUrl && (match = teamUrl.match(/\/teams\/(\d+)\//))){
        res.save({
          type: 'team',
          teamId: match[1],
          name: team.text().trim(),
          division: req.params.leagueId
        })
      }
    })

    // Game
    const gameStatus = cols.eq(4)
    const gameUrl = gameStatus.children('a[href]').first().attr('href')
    if(gameUrl && (match = gameUrl.match(/\/games\/(\d+)\//))){
      res.get(Url.resolve(req.url, gameUrl))
    }
  })
})

s.domExtractor(gamePattern, function extractGame(req, res) {
  const $ = req.$
  const date = $('#ctl00_C_lblGameDate').text()
  const time = $('#ctl00_C_lblGameTime').text()
  const fieldName = $('#ctl00_C_linkResourceName').text()

  const score = $('#ctl00_C_lblScore').text()
  var homeScore, awayScore
  if(match = score.trim().match(/(\d+)[^\d]+(\d+)/)){
    homeScore = parseInt(match[1])
    awayScore = parseInt(match[2])
  }

  let homeTeamId, awayTeamId
  const homeTeamLink = $('#ctl00_C_linkHome')
  if (homeTeamLink && (match = homeTeamLink.attr('href').match(/\/teams\/(\d+)\//))) { homeTeamId = match[1] }
  const awayTeamLink = $('#ctl00_C_linkAway')
  if (awayTeamLink && (match = awayTeamLink.attr('href').match(/\/teams\/(\d+)\//))) { awayTeamId = match[1] }

  res.save({
    type: 'game',
    homeTeamId: homeTeamId,
    awayTeamId: awayTeamId,
    homeTeamScore: homeScore,
    awayTeamScore: awayScore,
    // TODO: date handling incl time zone
    gameDateTime: new Date(`${date} ${time}`),
    field: fieldName,
    gameId: req.params.gameId
  })
})

s.loader(async (function saveTeams(scraped) {
  for (let i = 0; i < scraped.teams.length; i++) {
    const team = scraped.teams[i]
    team.facilityId = scraped.facilityId
    // todo: upsert?
    let [dbTeam] = await (db.findOrCreateTeamByTeamId(team.teamId, team))
    if (!dbTeam.facilityId) { dbTeam.facilityId = team.facilityId }
    if (!dbTeam.name) { dbTeam.name = team.name}
    await(dbTeam.save())
  }
}))

s.loader(async (function saveGames(scraped) {
  const t = await (db.sequelize.transaction())
  try {
    db.Game.destroy({where: {facilityId: scraped.facilityId}, transaction: t})
    for (let i = 0; i < scraped.games.length; i++) {
      const game = scraped.games[i]
      const [fieldId, homeTeamId, awayTeamId] = await (db.findOrCreateFieldAndTeamIds(game.field, game.homeTeamId, game.awayTeamId))
      // todo: handle reschedules
      const [dbGame] = await (db.Game.findOrCreate({
        where: {
          facilityId: scraped.facilityId,
          fieldId: fieldId,
          gameDateTime: new Date(game.gameDateTime),
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId
        }, transaction: t}))
      if (!dbGame.homeTeamScore && game.homeTeamScore) { dbGame.homeTeamScore = game.homeTeamScore }
      if (!dbGame.awayTeamScore && game.awayTeamScore) { dbGame.awayTeamScore = game.awayTeamScore }
      await (dbGame.save({transaction: t}))
    }
    t.commit()
  } catch (e) {
    t.rollback()
  }
}))

s.initialUrl = DIVISIONS_URL
s.scrapeResults.facilityId = FACILITY_ID

module.exports = {
  scrape: () => s.run()
}
