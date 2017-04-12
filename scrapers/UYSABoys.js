let Scraper = require('./Scraper')
let s = new Scraper('UYSABoys', {rateLimit: [10, 'second']})

const Url = require('url')
const moment = require('moment-timezone')
moment.tz.setDefault('America/Denver')

const divisionPattern = 'uysa.affinitysoccer.com/tour/public/info/accepted_list.asp(*)'
const teamPattern = 'uysa.affinitysoccer.com/tour/public/info/schedule_results2.asp(*)'
const DIVISIONS_URL = 'http://uysa.affinitysoccer.com/tour/public/info/accepted_list.asp?sessionguid=&tournamentguid=91C70238-454B-4885-AABB-12B8B1CAEABB&show=boys'
const DIVISION_URL_PREFIX = 'schedule_results2.asp?'
const FACILITY_ID = 52

s.domExtractor(divisionPattern, function extractDivisions(req, res) {
  const $ = req.$
  const links = $(`a[href^="${DIVISION_URL_PREFIX}"]`)
  for (let i = 0; i < links.length; i++) {
    const link = $(links[i])
    res.get("http://uysa.affinitysoccer.com/tour/public/info/" + link.attr('href'))
  }
})

s.domExtractor(teamPattern, function extractTeams(req, res) {
  const $ = req.$
  let teamMap = {}
  let division = $('span:contains("Team Schedules")').text()
  division = division.substring(division.indexOf("-") + 2);
  let teamRows = $($('table[xmlns\\:msxsl=urn\\:schemas-microsoft-com\\:xslt]')[0]).find('tr')
  teamRows.each((_, row) => {
    const cols = $(row).children('td')
    if (cols.eq(1).text().replace(/\s/g,'').length > 0 && cols.eq(1).text().indexOf('Group') === -1) {
      const rx = /[A-Z]\d* : /g
      const subString = rx.exec(cols.eq(1).text())
      const teamName = cols.eq(1).text().replace(subString[0], '')
      const teamIdrx = /teamcode=(.+?)&/g
      let teamId = teamIdrx.exec(cols.eq(1).children()[0].children[0].attribs.href)
      teamId = teamId[0].replace("teamcode=", '')
      teamId = teamId.replace('&', '')
      res.save({
        type: 'team',
        name: teamName,
        teamId: teamId,
        division: division,
      })
     teamMap[teamName] = teamId
    }
  })
  let gamesTables = $('table[xmlns\\:msxsl=urn\\:schemas-microsoft-com\\:xslt]')
  if(!delete gamesTables[0]) {
    // we've got bigger problems here.
    // if we can't remove the teams table
    // from the page it means we don't have a teams
    // table and means we are screwed
    // todo: error handeling
    return
  }
   for (var i = 0; i < gamesTables.length; i++) {
    let gamesRows = $(gamesTables[i]).find('tr')
    let gamesDate = $(gamesTables[i]).prev().text()
    gamesRows.each((_, row) => {
      const cols = $(row).children('td')
      if (cols.eq(1).text().replace(/\s/g,'').length > 0 && cols.eq(1).text().indexOf('Venue') === -1) {
        let gamesDateTime = gamesDate.replace(/Bracket\s-\s/g, '')
        gamesDateTime = gamesDateTime + cols.eq(2).text().replace(/\s/g,'').toLowerCase()
        res.save({
          type: 'game',
          homeTeamId: teamMap[cols.eq(5).text()],
          awayTeamId: teamMap[cols.eq(8).text()],
          homeTeamScore: cols.eq(6).text().replace(/\s/g,''),
          awayTeamScore: cols.eq(9).text().replace(/\s/g,''),
          gameDateTime: moment.tz(gamesDateTime, 'dddd,  MMMM DD, YYYY hh:mma', 'America/Denver'),
          field: cols.eq(1).text(),
          gameId: cols.eq(0).text().replace(/\s/g,'')
        })
      }
    })
   }
})


s.loader(Scraper.Common.saveTeams)
s.loader(Scraper.Common.saveGames)

s.initialUrl = DIVISIONS_URL
s.scrapeResults.facilityId = FACILITY_ID

module.exports = {
  scrape: () => s.run()
}
