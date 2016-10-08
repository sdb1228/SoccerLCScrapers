const db = require('./models')
const moment = require('moment')
const {slackSuccess, slackFailure} = require('./Helpers.js')

let Scraper = require('./Scraper')
let s = new Scraper()

const fieldUrl = 'https://utahsoccer.org/uso_fields.php'
const teamUrl = 'https://utahsoccer.org/public_get_my_team.php'
const gameUrl = 'https://www.utahsoccer.org/public_manage_schedules_process.php?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc'

function fetchTeams(startData) {
  s.scrape(startData, teamUrl, ($) => {
    const teams = $('option')
    for (let i = 0; i < teams.length; i++) {
      let team = $(teams[i])
      s.sendEvent({
        type: 'team',
        batchId: startData.batchId,
        teamId: team.attr('value'),
        name: team.text(),
        division: null,
        facilityId: 1
      })
    }
  })
}

function fetchFields(startData) {
  s.scrape(startData, fieldUrl, ($) => {
    let fieldRegex = /([^•]*)•([^•]*)•([^•,]*),[^•]*MAP DOC FORECAST/g
    let text = $('.maincontent .bigldisplaydiv').text()
    let match
    while ((match = fieldRegex.exec(text)) !== null) {
      let [_, name, address, city] = match
      s.sendEvent({
        type: 'field',
        batchId: startData.batchId,
        name: name.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        state: 'Utah'
      })
    }
  })
}

function fetchGames(startData) {
  s.rawScrape(startData, gameUrl, (response) => {
    let json = JSON.parse(response.text)
    let games = json.rows
    for (let i = 0; i < games.length; i++) {
      if (games[i].game_type !== 'tournament' || games[i].game_type !== 'final') {
        const division = games[i].league_abbreviation + ' ' + games[i].division_abrev
        let away_team_id = null
        let home_team_id = null
        if (games[i].home_team_set === 'yes' && parseInt(games[i].home_team_id) > 0) {
          home_team_id = games[i].home_team_id
          s.sendEvent({
            type: 'gameTeam',
            batchId: startData.batchId,
            gameId: games[i].game_id,
            teamId: games[i].home_team_id,
            name: games[i].home_team_name,
            division: division,
            facilityId: 1
          })
        }
        if (games[i].away_team_set === 'yes' && parseInt(games[i].away_team_id) > 0) {
          away_team_id = games[i].away_team_id
          s.sendEvent({
            type: 'gameTeam',
            batchId: startData.batchId,
            gameId: games[i].game_id,
            teamId: games[i].away_team_id,
            name: games[i].away_team_name,
            division: division,
            facilityId: 1
          })
        }
        let field_name = games[i].field_name
        if (field_name === '-Bye-') field_name = null
        s.sendEvent({
          type: 'game',
          batchId: startData.batchId,
          gameId: games[i].game_id,
          field: field_name,
          gameDateTime: new Date(games[i].day_of_week + ' ' + games[i].game_date + ' ' + games[i].time_ampm),
          homeTeamId: home_team_id,
          awayTeamId: away_team_id,
          facilityId: 1
        })
      }
    }
  })
}

// todo: move these to a shared file
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

function saveTeam(teamData) {
  db.Team.upsert({
    name: teamData.name,
    batchId: teamData.batchId,
    teamId: teamData.teamId,
    facilityId: teamData.facilityId,
    division: teamData.division
  }).then(() => {
    if (teamData.gameId) {
      s.sendEvent({
        type: 'gameTeamSaved',
        batchId: teamData.batchId,
        gameId: teamData.gameId,
        teamId: teamData.teamId
      })
    } else {
      s.sendEvent({
        type: 'teamSaved',
        batchId: teamData.batchId,
        teamId: teamData.teamId
      })
    }
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

const teamTask = s.newTask('batch/:batchId/team/:teamId')
const teamsTask = s.newTask('batch/:batchId/team')
const batchTask = s.newTask('batch/:batchId')
const fieldTask = s.newTask('batch/:batchId/field/:name')
const fieldsTask = s.newTask('batch/:batchId/field')
const gameTask = s.newTask('batch/:batchId/game/:gameId')
const gamesTask = s.newTask('batch/:batchId/game')
const gameTeamTask = s.newTask('batch/:batchId/game/:gameId/team/:teamId')

const handlers = {
  start: [
    batchTask.start(),
    fetchFields
  ],
  field: [fieldTask.start(), saveField],
  fieldSaved: [fieldTask.succeed()],
  [fieldsTask.succeeded]: [fetchTeams],
  [teamsTask.succeeded]: [fetchGames],
  game: [gameTask.start(), saveGame],
  gameSaved: [gameTask.succeed()],
  [gamesTask.succeeded]: [batchTask.succeed()],
  team: [teamTask.start(), saveTeam],
  teamSaved: [teamTask.succeed()],
  gameTeam: [gameTeamTask.start(), saveTeam],
  gameTeamSaved: [gameTeamTask.succeed()],
  error: [s.log('error'), maybeFailTask(fieldTask), maybeFailTask(gameTask)],
  [batchTask.succeeded]: [markBatchDone, s.log('batch')],
  [batchTask.failed]: [markBatchFailed, s.log('batch')],
  default: [s.log('unhandled result')]
}

module.exports = {
  scrape: () => createBatchAndRun(handlers)
}
