const Scraper = require('./Scraper')
const s = new Scraper('LetsPlay', {rateLimit: [3, 'second']})

const Url = require('url')
const moment = require('moment-timezone')

const teamUrlRegex = /.*\/facilities\/(\d+)\/teams\/(\d+)$/
const seasonDivisionRegex = /^\s*Season:\s+(.*?)\s+Division:\s+(.*?)\s*$/
const rootUrl = 'http://letsplaysoccer.com/facilities/12' // todo: multi-facility
const rootPattern = 'letsplaysoccer.com'
const facilityPattern = rootPattern + '/facilities/:facilityId'

s.domExtractor(facilityPattern + '/teams', function extractTeamUrls(req, res) {
  const $ = req.$
  const anchors = $("a")
  let gotSomething = false
  console.log(anchors.length)
  for (let i = 0; i < anchors.length; i++) {
    const a = $(anchors[i])
    const href = a.attr('href')
    if (href && (match = href.match(teamUrlRegex))) {
      gotSomething = true
      const [url, facilityId, id] = match
      res.get(Url.resolve(rootUrl, url))
    }
  }
  if (!gotSomething) {
    throw 'No team urls'
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
  console.log(`${rows.length} rows`)
  for (let i = 0; i < rows.length; i++) {
    let row = $(rows[i])
    const tds = row.find('td').toArray()
    if (tds.length === 0) { continue } // th
    let [date, field, homeTeam, awayTeam, result] = tds
    let [homeTeamScore, awayTeamScore] = $(result).text().split('-')
    res.save({
      type: 'game',
      gameDateTime: moment.tz($(date).text(), 'ddd M-D-YY h:m a', 'America/Denver'),
      field: $(field).text(),
      division: division,
      homeTeamId: resultFromTeamTD(homeTeam).id,
      awayTeamId: resultFromTeamTD(awayTeam).id,
      homeTeamScore: homeTeamScore,//parseInt(homeTeamScore) || null,
      awayTeamScore: awayTeamScore//parseInt(awayTeamScore) || null
    })
  }
})

// we don't fetch fields currently
/* s.loader(Scraper.Common.saveFields) */
s.loader(Scraper.Common.saveTeams)
s.loader(Scraper.Common.saveGames)

s.initialUrl = rootUrl + '/teams'
s.scrapeResults.facilityId = 2

module.exports = {
  scrape: () => s.run()
}
