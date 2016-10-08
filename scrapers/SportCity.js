const Url = require('url')
const db = require('./models')

let Scraper = require('./Scraper')
let s = new Scraper()

const DIVISIONS_URL = 'http://sportcityutah.com/schedules-adult/'
const DIVISION_URL_PREFIX = 'http://soccer-city-utah.ezleagues.ezfacility.com/leagues/'
const FACILITY_ID = 3

function fetchDivisions(startData) {
  s.scrape(startData, DIVISIONS_URL, ($) => {
    const links = $(`a[href^="${DIVISION_URL_PREFIX}"]`)
    links.each((_, link) => {
      link = $(link)
      s.sendEvent({
        type: 'division',
        batchId: startData.batchId,
        name: link.text().trim(),
        url: link.attr('href'),
        facilityId: FACILITY_ID,
      })
    })
  })
}

function fetchSchedule(divisionData) {
  s.scrape(divisionData, divisionData.url, ($) => {
    const rows = $('div#ctl00_C_pnlSchedule tr')
    rows.each((_, row) => {
      const cols = $(row).children('td')

      // Teams
      const home = cols.eq(1);
      const away = cols.eq(3);
      teams = [home, away].map((team) => {
        const teamUrl = team.children('a[href]').first().attr('href')
        var teamData = {}
        if(teamUrl && (match = teamUrl.match(/\/teams\/(\d+)\//))){
          teamId = match[1]
          teamData = {
            type: 'team',
            batchId: divisionData.batchId,
            teamId: teamId,
            name: team.text().trim(),
            facilityId: FACILITY_ID,
            // TODO: ezfacility does have useful division id
            division: divisionData.name,
          }

          s.sendEvent(teamData)
        }
        return teamData
      })

      // Field
      const field = cols.eq(5)
      const fieldName = field.text().trim()
      s.sendEvent({
        type: 'field',
        batchId: divisionData.batchId,
        name: fieldName
      })

      // Game
      const score = cols.eq(2)
      var homeScore, awayScore
      if(match = score.text().trim().match(/(\d+).*(\d+)/)){
        homeScore = parseInt(match[1])
        awayScore = parseInt(match[2])
      }

      const gameStatus = cols.eq(4)
      const gameUrl = gameStatus.children('a[href]').first().attr('href')
      if(gameUrl && (match = gameUrl.match(/\/games\/(\d+)\//))){
        gameId = match[1]

        // TODO: I do not understand why this action is so slow
        s.scrape(divisionData, Url.resolve(divisionData.url, gameUrl), ($) => {
          const date = $('#ctl00_C_lblGameDate').text()
          const time = $('#ctl00_C_lblGameTime').text()

          s.sendEvent({
            type: 'game',
            batchId: divisionData.batchId,
            homeTeamId: teams[0].teamId,
            awayTeamId: teams[1].teamId,
            homeTeamScore: homeScore,
            awayTeamScore: awayScore,
            // TODO: date handling incl time zone
            gameDateTime: new Date(`${date} ${time}`),
            field: fieldName,
            gameId: gameId,
            facilityId: FACILITY_ID,
          })
        })
      }
    })
  })
}

// ***
// copypasta from UtahSoccer.js
// ***

function createBatchAndRun(handlers) {
  db.Batch.create({status: 'pending'}).then((batch) => {
    s.runScraper(handlers, {batchId: batch.id})
  })
}

function markBatchFailed(batchData) {
  db.Batch.update({status: 'failed'}, {where: {id: batchData.batchId, status: {ne: 'failed'}}}).then((a) => {
    if (a[0] > 0) {
      db.Batch.findOne({where: {id: batchData.batchId}}).then((b) => {
        slackFailure(`UtahSoccer Batch ${batchData.batchId} FAILED in ${moment.duration(b.updatedAt - b.createdAt).humanize()}`)
      })
    }
  })
}

function markBatchDone(batchData) {
  db.Batch.update({status: 'complete'}, {where: {id: batchData.batchId}}).then(() => {
    db.Batch.findOne({where: {id: batchData.batchId}}).then((b) => {
      slackSuccess(`UtahSoccer Batch ${batchData.batchId} COMPLETED in ${moment.duration(b.updatedAt - b.createdAt).humanize()}`)
    })
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
  }).catch((e) => s.sendEvent(s.exceptionResult(e, teamData))) // todo: error handling
}

function saveField(fieldData) {
  db.Field.create({
    name: fieldData.name,
    address: fieldData.address,
    city: fieldData.city,
    state: fieldData.state
  }).then((field) => {
    s.sendEvent({
      type: 'fieldSaved',
      id: field.id,
      batchId: fieldData.batchId,
      name: fieldData.name
    })
  }).catch((e) => s.sendEvent(s.exceptionResult(e, fieldData))) // todo: error handling
}

function saveGame(gameData) {
  db.Field
    .findOrCreate({where: {name: gameData.field}})
    .then(function(field, created) {
      db.Game.create({
        batchId: gameData.batchId,
        facilityId: gameData.facilityId,
        facilityGameId: gameData.gameId,
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

const teamTask = s.newTask('batch/:batchId/team/:teamId')
const batchTask = s.newTask('batch/:batchId')
const fieldTask = s.newTask('batch/:batchId/field/:name')
const gameTask = s.newTask('batch/:batchId/game/:gameId')
// const gamesTask = s.newTask('batch/:batchId/game')

const handlers = {
  start: [
    batchTask.start(),
    fetchDivisions,
  ],
  division: [fetchSchedule],
  team: [teamTask.start(), s.log('team'), saveTeam],
  teamSaved: [teamTask.succeed()],
  field: [fieldTask.start(), s.log('field'), saveField],
  fieldSaved: [fieldTask.succeed()],
  game: [gameTask.start(), s.log('game'), saveGame],
  gameSaved: [gameTask.succeed()],
  // TODO: need these batchtasks
  // [gamesTask.succeeded]: [batchTask.succeed()],
  error: [s.log('error'), maybeFailTask(fieldTask), maybeFailTask(gameTask)],
  // [batchTask.succeeded]: [markBatchDone, s.log('batch')],
  // [batchTask.failed]: [markBatchFailed, s.log('batch')],
  default: [s.log('unhandled result')],
}

module.exports = {
  scrape: () => createBatchAndRun(handlers)
}
