const Url = require('url')
const db = require('./models')

const teamUrlRegex = /.*\/facilities\/(\d+)\/teams\/(\d+)$/
const seasonDivisionRegex = /^\s*Season:\s+(.*?)\s+Division:\s+(.*?)\s*$/
const rootUrl = 'http://letsplaysoccer.com/facilities/12/' // todo: multi-facility

let Scraper = require('./Scraper')
let s = new Scraper()

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
    const gameTable = mainRight.find('table:first')

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
      let event = {
        type: 'game',
        batchId: teamUrlData.batchId,
        facilityId: teamUrlData.facilityId,
        gameDateTime: new Date($(date).text()),
        fieldId: $(field).text(),
        division: division,
        homeTeamId: resultFromTeamTD(homeTeam).id,
        awayTeamId: resultFromTeamTD(awayTeam).id,
        result: $(result).text()
      }
      event.gameId = `${Math.floor(event.gameDateTime / 1000)}-${event.homeTeamId}-${event.awayTeamId}`
      s.sendEvent(event)
    }
  })
}

function saveTeam(teamData) {
  db.Team.create({
    name: teamData.name,
    batchId: teamData.batchId,
    teamId: teamData.teamId,
    facilityId: teamData.facilityId,
    division: teamData.division
  }).then((team) => {
    s.sendEvent({
      type: 'teamSaved',
      id: team.id,
      batchId: teamData.batchId,
      teamId: teamData.teamId
    })
  }).catch((e) => s.sendEvent(s.exceptionResult(e))) // todo: error handling
}

function saveGame(gameData) {
  db.Game.create({
    batchId: gameData.batchId,
    facilityId: gameData.facilityId,
    // facilityGameId: gameData.facilityGameId,
    // fieldId: gameData.fieldId, // todo: need fields in the db or make this a fieldName
    //tournament: gameData.tournament, // todo: should be tournamentId?
    gameDateTime: gameData.gameDateTime,
    homeTeamId: gameData.homeTeamId,
    // homeTeamScore: gameData.homeTeamScore, // todo: score from result
    awayTeamId: gameData.awayTeamId
    // awayTeamScore: gameData.awayTeamScore // todo: score from result
  }).then((game) => {
    s.sendEvent({
      type: 'gameSaved',
      id: game.id,
      batchId: gameData.batchId,
      gameId: gameData.gameId
    })
  }).catch((e) => s.sendEvent(s.exceptionResult(e))) // todo: error handling
}

function markBatchDone(batchSuccessData) {
  db.Batch.update({status: 'complete'}, {where: {id: batchSuccessData.batchId}})
}

function createBatchAndRun(handlers) {
  db.Batch.create({status: 'pending'}).then((batch) => {
    s.runScraper(handlers, {batchId: batch.id})
  })
}

const gameTask = s.newTask('batch/:batchId/game/:gameId')
const teamTask = s.newTask('batch/:batchId/team/:teamId')
const batchTask = s.newTask('batch/:batchId')

const handlers = {
  start: [
    fetchTeamUrls
  ],
  teamUrl: [
    teamTask.start(),
    fetchTeam
  ],
  team: [s.log('team'), saveTeam],
  teamSaved: [teamTask.succeed()],
  game: [gameTask.start(), s.log('game'), saveGame],
  gameSaved: [gameTask.succeed()],
  error: [s.log('error')],
  [batchTask.succeeded]: [markBatchDone, s.log('batch')],
  default: [s.log('unhandled result')]
}

module.exports = {
  scrape: () => createBatchAndRun(handlers)
}
