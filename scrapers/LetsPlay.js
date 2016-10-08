const Url = require('url')
const db = require('./models')

const teamUrlRegex = /.*\/facilities\/(\d+)\/teams\/(\d+)$/
const seasonDivisionRegex = /^\s*Season:\s+(.*?)\s+Division:\s+(.*?)\s*$/
const rootUrl = 'http://letsplaysoccer.com/facilities/12/' // todo: multi-facility

const Scraper = require('./Scraper')
const s = new Scraper()

const moment = require('moment')
const {slackSuccess, slackFailure} = require('./Helpers.js')

function fetchTeamUrls(startData) {
  s.scrape(startData, rootUrl + 'teams', ($) => {
    let anchors = $("a")
    for (let i = 0; i < anchors.length; i++) {
      let a = $(anchors[i])
      let href = a.attr('href')
      if (href && (match = href.match(teamUrlRegex))) {
        const [url, facilityId, id] = match
        s.sendEvent({
          type: 'teamUrl',
          batchId: startData.batchId,
          url: Url.resolve(rootUrl, url),
          teamId: id,
          name: a.text(),
          facilityId: 2
        })
      }
    }
  })
}

function fetchTeam(teamUrlData) {
  s.scrape(teamUrlData, teamUrlData.url, ($) => {
    const mainRight = $('#mainright')
    const name = mainRight.find('h1').first().text()
    const [seasonDivision, season, division] = mainRight.find('h3').first().text().match(seasonDivisionRegex)
    s.sendEvent({
      type: 'team',
      batchId: teamUrlData.batchId,
      name: name,
      teamId: teamUrlData.teamId,
      facilityId: 2,
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
      let event = {
        type: 'game',
        batchId: teamUrlData.batchId,
        facilityId: 2,
        gameDateTime: new Date($(date).text()),
        field: $(field).text(),
        division: division,
        homeTeamId: resultFromTeamTD(homeTeam).id,
        awayTeamId: resultFromTeamTD(awayTeam).id,
        homeTeamScore: parseInt(homeTeamScore) || null,
        awayTeamScore: parseInt(awayTeamScore) || null
      }
      event.gameId = `${Math.floor(event.gameDateTime / 1000)}-${event.homeTeamId}-${event.awayTeamId}`
      s.sendEvent(event)
    }
  })
}

// todo: move these to a shared file
function saveTeam(teamData) {
  db.Team.upsert({
    name: teamData.name,
    batchId: teamData.batchId,
    teamId: teamData.teamId,
    facilityId: teamData.facilityId,
    division: teamData.division
  }).then(() => {
    s.sendEvent({
      type: 'teamSaved',
      batchId: teamData.batchId,
      teamId: teamData.teamId
    })
  }).catch((e) => s.sendEvent(s.exceptionResult(e, teamData))) // todo: error handling
}

function saveGame(gameData) {
  db.Field
    .findOrCreate({where: {name: gameData.field}})
    .then(function(field, created) {
      db.Game.create({
        batchId: gameData.batchId,
        facilityId: gameData.facilityId,
        facilityGameId: gameData.facilityGameId,
        fieldId: field[0].id,
        tournament: gameData.tournament,
        gameDateTime: gameData.gameDateTime,
        homeTeamId: gameData.homeTeamId,
        homeTeamScore: gameData.homeTeamScore,
        awayTeamId: gameData.awayTeamId,
        awayTeamScore: gameData.awayTeamScore
      }).then((game) => {
        s.sendEvent({
          type: 'gameSaved',
          id: game.id,
          batchId: gameData.batchId,
          gameId: gameData.gameId
        })
      })
    }).catch((e) => s.sendEvent(s.exceptionResult(e, gameData))) // todo: error handling
}

function markBatchFailed(batchData) {
  db.Batch.update({status: 'failed'}, {where: {id: batchData.batchId, status: {ne: 'failed'}}}).then((a) => {
    if (a[0] > 0) {
      db.Batch.findOne({where: {id: batchData.batchId}}).then((b) => {
        slackFailure(`LetsPlay Batch ${batchData.batchId} FAILED in ${moment.duration(b.updatedAt - b.createdAt).humanize()}`)
      })
    }
  })
}

function markBatchDone(batchData) {
  db.Batch.update({status: 'complete'}, {where: {id: batchData.batchId}}).then(() => {
    db.Batch.findOne({where: {id: batchData.batchId}}).then((b) => {
      slackSuccess(`LetsPlay Batch ${batchData.batchId} COMPLETED in ${moment.duration(b.updatedAt - b.createdAt).humanize()}`)
    })
  })
}

function createBatchAndRun(handlers) {
  db.Batch.create({status: 'pending'}).then((batch) => {
    s.runScraper(handlers, {batchId: batch.id})
  })
}

function maybeFailTask(task) {
  let fail = task.fail()
  return function maybeFailTask(eventData) {
    try {
      fail(eventData.event)
    } catch(e) {
      // don't care
    }
  }
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
  error: [s.log('error'), maybeFailTask(gameTask), maybeFailTask(teamTask), maybeFailTask(batchTask)],
  [batchTask.succeeded]: [markBatchDone, s.log('batch')],
  [batchTask.failed]: [markBatchFailed, s.log('batch')],
  default: [s.log('unhandled result')]
}

module.exports = {
  scrape: () => createBatchAndRun(handlers)
}
