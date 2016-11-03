let Scraper = require('./Scraper')
let s = new Scraper('SportCity', {rateLimit: [10, 'second']})

const Url = require('url')
const moment = require('moment-timezone')
moment.tz.setDefault('America/Denver')

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
  let title = $('span.PageTitle').text()
  title = title.replace(/(\r\n|\n|\r)/gm,"")
  title = title.substring(11)
  const division = title.match(/(.*\s{2})/gm)[0].trim()
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
          division: division
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
    // TODO: date handling incl time zone (currently MST only)
    gameDateTime: moment.tz(`${date} ${time}`, 'dddd, MMMM MM, YYYY h:mm A', 'America/Denver'),
    field: fieldName,
    gameId: req.params.gameId
  })
})

s.loader(Scraper.Common.saveTeams)
s.loader(Scraper.Common.saveGames)

s.initialUrl = DIVISIONS_URL
s.scrapeResults.facilityId = FACILITY_ID

module.exports = {
  scrape: () => s.run()
}
