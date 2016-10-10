const Url = require('url')
const db = require('./models')

const teamUrlRegex = /.*\/facilities\/(\d+)\/teams\/(\d+)$/
const seasonDivisionRegex = /^\s*Season:\s+(.*?)\s+Division:\s+(.*?)\s*$/
const rootUrl = 'http://letsplaysoccer.com/facilities/12' // todo: multi-facility

const Scraper = require('./Scraper')
const s = new Scraper('LetsPlay')

const moment = require('moment')
const {slackSuccess, slackFailure} = require('./Helpers.js')

const rootPattern = '(http(s)\\://)(www.)letsplaysoccer.com'
const facilityPattern = rootPattern + '/facilities/:facilityId'

const async = require('asyncawait/async')
const await = require('asyncawait/await')

s.domExtractor(facilityPattern + '/teams', function extractTeamUrls(req, res) {
  const $ = req.$
  const anchors = $("a")
  for (let i = 0; i < anchors.length; i++) {
    const a = $(anchors[i])
    const href = a.attr('href')
    if (href && (match = href.match(teamUrlRegex))) {
      const [url, facilityId, id] = match
      res.get(Url.resolve(rootUrl, url))
    }
  }
})

s.domExtractor(facilityPattern + '/teams/:teamId', function extractTeam(req, res) {
  const $ = req.$
  const mainRight = $('#mainright')
  const name = mainRight.find('h1').first().text()
  const [seasonDivision, season, division] = mainRight.find('h3').first().text().match(seasonDivisionRegex)
  res.save({
    type: 'team',
    name: name,
    teamId: req.params.teamId,
    division: division,
    season: season
  })
  const gameTable = mainRight.find('table').first()
  if (gameTable.find('th').text() !== 'Game TimeFieldHome TeamVisitor TeamScore') {
    // we've got the wrong table. maybe no scheduled games?
    // todo: emit warning
    return
  }
  const rows = gameTable.find('tr')
  function resultFromTeamTD(td) {
    let a = $(td).find('a')
    return {
      name: a.text(),
      id: a.attr('href').match(teamUrlRegex)[2]
    }
  }
  for (let i = 0; i < rows.length; i++) {
    let row = $(rows[i])
    const tds = row.find('td').toArray()
    if (tds.length === 0) { continue } // th
    let [date, field, homeTeam, awayTeam, result] = tds
    let [homeTeamScore, awayTeamScore] = $(result).text().split('-')
    res.save({
      type: 'game',
      gameDateTime: new Date($(date).text()),
      field: $(field).text(),
      division: division,
      homeTeamId: resultFromTeamTD(homeTeam).id,
      awayTeamId: resultFromTeamTD(awayTeam).id,
      homeTeamScore: parseInt(homeTeamScore) || null,
      awayTeamScore: parseInt(awayTeamScore) || null
    })
  }
})

// we don't fetch fields currently
/* s.loader(async (function saveFields(scraped) {
  // fields
  for (let i = 0; i < scraped.fields.length; i++) {
    const field = scraped.fields[i]
    await (db.findOrCreateFieldByName(field.name, field))
  }
})) */

s.loader(async (function saveTeams(scraped) {
  // teams
  for (let i = 0; i < scraped.teams.length; i++) {
    const team = scraped.teams[i]
    await (db.findOrCreateTeamByTeamId(team.teamId, team))
  }
}))

s.loader(async (function saveGames(scraped) {
  // games
  for (let i = 0; i < scraped.games.length; i++) {
    // todo: reschedule detection, dedupe
    const game = scraped.games[i]
    const [field] = await (db.findOrCreateFieldByName(game.field))
    const [homeTeam] = await (db.findOrCreateTeamByTeamId(game.homeTeamId))
    const [awayTeam] = await (db.findOrCreateTeamByTeamId(game.awayTeamId))
    // todo: handle reschedules
    await (db.upsertGame({
      facilityId: scraped.facilityId,
      fieldId: field.id,
      gameDateTime: new Date(game.gameDateTime),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeTeamScore: game.homeTeamScore,
      awayTeamScore: game.awayTeamScore
    }))
  }
}))

s.initialUrl = rootUrl + '/teams'
s.scrapeResults.facilityId = 2

module.exports = {
  scrape: () => s.run()
}
