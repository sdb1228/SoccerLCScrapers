const jsdom = require('node-jsdom')
const {RateLimiter} = require('limiter')
const axios = require('axios')

const requestLimiter = new RateLimiter(1, 'second')
log = (message) => function log(r, _) {console.log(JSON.stringify({message: message, data: r}))}
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

function scrape(url, map, func) {
  requestLimiter.removeTokens(1, () => {
    log('fetching')({url: url})
    try {
    jsdom.env(
      url,
      ['http://code.jquery.com/jquery.js'],
      (err, window) => {
        try {
          if (err) throw err
          func(window, window.$)
        } catch (e) {
          map(exceptionResult(e, {url: url, html: window.$('html').html()}))
        }
      }
    )} catch(e) {
      map(exceptionResult(e, {url: url}))
    }
  })
}

function apiScrape(url, map, func) {
  requestLimiter.removeTokens(1, () => {
    log('fetching')({url: url})
    try {
      axios.get(url)
        .then(function (response) {
          func(response)
        })
        .catch(err => {
          map(exceptionResult(e, {url: url}))
        })
      } catch(e) {
      map(exceptionResult(e, {url: url}))
    }
  })
}

function fetchTeams(_, map) {
  scrape(teamUrl, map, (window, $) => {
    const teams = $('option')
    for (let i = 0; i < teams.length; i++) {
      map({
        type: 'team',
        teamId: teams[i].value,
        name: teams[i].text,
        division: '',
        facilityId: 1
      })
    }
  })
}

function fetchFields(_, map) {
  scrape(fieldUrl, map, (window, $) => {
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
        map({
          type: 'field',
          name: fieldName,
          address: arrayAddress[0].trim(),
          city: arrayAddress[1].trim(),
          state: 'Utah'
        })
      }
    }
  })
}

function fetchGames(_, map) {
  const dateOffset = 1
  apiScrape(gameUrl, map, (response) => {
    let games = response.data.rows
    for (let i = 0; i < games.length; i++) {
      if (games[i].game_type !== 'tournament' || games[i].game_type !== 'final') {
        const division = games[i].league_abbreviation + ' ' + games[i].division_abrev
        map({
          type: 'team',
          teamId: games[i].home_team_id,
          name: games[i].home_team_name,
          division: division,
          facilityId: 1
        })
        map({
          type: 'team',
          teamId: games[i].away_team_id,
          name: games[i].away_team_name,
          division: division,
          facilityId: 1
        })
        map({
          type: 'game',
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

handlers = {
  start: [fetchFields, fetchTeams, fetchGames],
  game: [log('game')],
  team: [log('team')],
  error: [log('error')],
  default: [log('unhandled result')]
}

function map(result) {
  funcs = handlers[result.type] || handlers.default
  funcs.forEach((func) => {
    try {
      console.log(JSON.stringify({functionCall: func.name}))
      func(result, map)
    } catch (e) {
      map(exceptionResult(e))
    }
  })
}

function go(){
  map({type: 'start'})
}

go()
