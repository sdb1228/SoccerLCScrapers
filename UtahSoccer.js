const db = require('./models')

let Scraper = require('./Scraper')
let s = new Scraper()

const fieldUrl = 'https://utahsoccer.org/uso_fields.php'
const teamUrl = 'https://utahsoccer.org/public_get_my_team.php'
const gameUrl = 'https://www.utahsoccer.org/public_manage_schedules_process.php?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc'

function exceptionResult(e, data={}) {
  return {
    type: 'error',
    exception: {message: e.message, stack: e.stack},
    data: data
  }
}

function fetchTeams(startData) {
  s.scrape(teamUrl, (window, $) => {
    const teams = $('option')
    for (let i = 0; i < teams.length; i++) {
      s.sendEvent({
        type: 'team',
        batchId: startData.batchId,
        teamId: teams[i].value,
        name: teams[i].text,
        division: '',
        facilityId: 1
      })
    }
  })
}

function fetchFields(startData) {
  s.scrape(fieldUrl, (window, $) => {
    let fieldName = ""
    let fieldAddress = ""
    let extraElement = false
    let promiseArray = []
    for (let i = 0; i < $('div.bigldisplaydiv')[2].children[0].children.length; i++) {
      if ($('div.bigldisplaydiv')[2].children[0].children[i].title === '') {
        continue
      } else {
        if (extraElement) {
          extraElement = false
          continue
        }
        if (i+1 > $('div.bigldisplaydiv')[2].children[0].children.length ) {
          break
        }
        fieldAddress = $('div.bigldisplaydiv')[2].children[0].children[i].title
        fieldName = $('div.bigldisplaydiv')[2].children[0].children[i+1].title
        if (fieldAddress === fieldName) {
          extraElement = true
          continue
        }
        let arrayAddress = fieldAddress.split(',')
        s.sendEvent({
          type: 'field',
          batchId: startData.batchId,
          name: fieldName,
          address: arrayAddress[0].trim(),
          city: arrayAddress[1].trim(),
          state: 'Utah'
        })
      }
    }
  })
}

function fetchGames(startData) {
  s.rawScrape(gameUrl, (response) => {
    let json = JSON.parse(response.text)
    let games = json.rows
    for (let i = 0; i < games.length; i++) {
      if (games[i].game_type !== 'tournament' || games[i].game_type !== 'final') {
        const division = games[i].league_abbreviation + ' ' + games[i].division_abrev
        s.sendEvent({
          type: 'team',
          batchId: startData.batchId,
          teamId: games[i].home_team_id,
          name: games[i].home_team_name,
          division: division,
          facilityId: 1
        })
        s.sendEvent({
          type: 'team',
          batchId: startData.batchId,
          teamId: games[i].away_team_id,
          name: games[i].away_team_name,
          division: division,
          facilityId: 1
        })
        s.sendEvent({
          type: 'game',
          batchId: startData.batchId,
          gameId: games[i].game_id,
          field: games[i].field_name,
          gameDateTime: new Date(games[i].day_of_week + ' ' + games[i].game_date + ' ' + games[i].time_ampm),
          homeTeamId: games[i].home_team_id,
          awayTeamId: games[i].away_team_id,
          facilityId: 1
        })
      }
    }
  })
}

function createBatchAndRun(handlers) {
  db.Batch.create({status: 'pending'}).then((batch) => {
    s.runScraper(handlers, {batchId: batch.id})
  })
}

const teamTask = s.newTask('batch/:batchId/team/:teamId')
const batchTask = s.newTask('batch/:batchId')

handlers = {
  start: [
    fetchFields,
    fetchTeams,
    fetchGames,
  ],
  game: [s.log('game')],
  team: [s.log('team')],
  error: [s.log('error')],
  default: [s.log('unhandled result')]
}

module.exports = {
  scrape: () => createBatchAndRun(handlers)
}
