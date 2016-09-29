const Url = require('url')
const db = require('./models')

const rootUrl = 'http://letsplaysoccer.com/facilities/12/' // todo: multi-facility

let Scraper = require('./Scraper')
let s = new Scraper()

const teamUrlRegex = /.*\/facilities\/(\d+)\/teams\/(\d+)$/
function fetchTeamUrls(startData) {
  s.scrape(rootUrl + 'teams', (window, $) => {
    $.each($("a"), (_, a) => {
      if (a.href && (match = a.href.match(teamUrlRegex))) {
        const [url, facilityId, id] = match
        if (id === '251815' || id === '249930') {
        s.sendEvent({
          type: 'teamUrl',
          batchId: startData.batchId,
          url: Url.resolve(rootUrl, url),
          teamId: id,
          name: a.text,
          facilityId: facilityId
        })
        }
      }
    })
  })
}

function fetchTeam(teamUrlData) {
  const seasonDivisionRegex = /^\s*Season:\s+(.*?)\s+Division:\s+(.*?)\s*$/
  s.scrape(teamUrlData.url, (window, $) => {
    const mainRight = $('#mainright')
    const name = mainRight.find('h1:first').text()
    const [seasonDivision, season, division] = mainRight.find('h3:first').text().match(seasonDivisionRegex)
    s.sendEvent({
      type: 'team',
      batchId: teamUrlData.batchId,
      name: name,
      teamId: teamUrlData.teamId,
      facilityId: teamUrlData.facilityId,
      division: division,
      season: season
    })
  })
}

function saveTeam(teamData) {
  s.sendEvent({
    type: 'teamSaved',
    teamId: teamData.teamId
  })
}

function fetchGames(_) {
  const dateOffset = 1
  s.scrape(rootUrl + `games?utf8=✓&date_offset=${dateOffset}&commit=Get+Schedule`, map, (window, $) => {
    fieldTables = $(':header').next('table')
    fieldHeaders = fieldTables.prev()
    fieldHeaders.forEach((header, i) => {
      fieldName = window.$(header).text()
      // validate th?
      rows = $(fieldTables[i]).children('tr')
      $.each(rows, (_, row) => {
        tds = $(row).find('td')
        if (tds.length === 0) return // th
        let [date, field, division, homeTeam, awayTeam, result] = tds
        function resultFromTeamTD(td) {
          let a = $(td).find('a')
          return {
            name: a.text,
            id: a.href.match(teamUrlRegex)[2]
          }
        }

        s.sendEvent({
          type: 'game',
          date: new Date(date),
          fieldId: $(field).text(),
          division: $(division).text(),
          homeTeam: resultFromTeamTD(homeTeam),
          awayTeam: resultFromTeamTD(awayTeam),
          result: $(result).text()
        })
      })
    })
  })
}

function createBatchAndRun(handlers) {
  db.Batch.create().then((batch) => {
    s.runScraper(handlers, {batchId: batch.id})
  })
}

const handlers = {
  start: [
    fetchTeamUrls
  ],
  teamUrl: [
    s.newTask((data) => `batch/teams/${data.teamId}`),
    fetchTeam
  ],
  team: [s.log('team'), saveTeam],
  teamSaved: [s.taskSucceeded((data) => `batch/teams/${data.teamId}`)],
  error: [s.taskFailed('batch'), s.log('error')],
  'batch:succeeded': [s.log('batch')],
  default: [s.log('unhandled result')]
}

module.exports = {
  scrape: () => createBatchAndRun(handlers)
}
