const jsdom = require('node-jsdom')
const Database = require('./Database')
const axios = require('axios')
const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })

const main = function main () {
  //helpers.headerBreak('Parsing Teams Utah Soccer')
  //getTeams()
  //helpers.slackSuccess('Utah Soccer teams were updated successfully')
  //helpers.headerBreak('Utah Soccer teams were updated successfully')
  //helpers.headerBreak('Parsing Games Unplayed Utah Soccer')
  getGames()
}

function getTeams () {
  helpers.minorHeader('Making endpoint call to https://utahsoccer.org/public_get_my_team.php')
  jsdom.env(
    'https://utahsoccer.org/public_get_my_team.php',
    ['http://code.jquery.com/jquery.js'],
    function (errors, window) {
      if (errors) {
        helpers.minorErrorHeader('ERROR IN MAKING AJAX CALL IN GET TEAMS')
        helpers.slackFailure('Error making ajax request to https://utahsoccer.org/public_get_my_team.php in Utah Soccer')
        log.error(errors)
        return
      }
      const $ = window.$
      if ($('option')) {
        const teams = $('option')
        log.info(teams.length + ' Teams returned from utahsoccer')
        parseTeams($, teams)
      } else {
        helpers.minorErrorHeader('NO TEAMS RETURNED FROM CALL RETURNING')
      }
    }
  )
}

function parseTeams ($, teams) {
  helpers.minorHeader('Parsing Utah Soccer teams')
  for (let i = 0; i < teams.length; i++) {
    if (!teams[i].value || !teams[i].text) {
      helpers.slackFailure('Error in printing out team record ID: ' + teams[i].value + ' Name: ' + teams[i].text)
      continue
    }
    Database.insertOrUpdateTeam(teams[i].value, teams[i].text)
  }
}

function getGames () {
  axios.get('https://www.utahsoccer.org/public_manage_schedules_process.php?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc')
    .then(function (response) {
      if (!response.data) {
        helpers.minorErrorHeader('NO GAMES RETURNED FROM CALL RETURNING')
        return
      }
      log.info(response.data.rows.length + ' Games returned from utahsoccer')
      parseGames(response.data.rows)
    })
    .catch(function (error) {
      helpers.minorErrorHeader('ERROR IN MAKING AJAX CALL FOR GET GAMES OF UTAH SOCCER')
      helpers.slackFailure('Error making ajax request to https://www.utahsoccer.org/public_manage_schedules_process.php?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc in Utah Soccer')
      log.error(error)
      return
    })
}

function parseGames (games) {
  helpers.minorHeader('Parsing Utah Soccer games')
  for (let i = 0; i < games.length; i++) {
    if (games[i].game_type !== 'tournament' || games[i].game_type !== 'final') {
      Database.insertOrUpdateGame(
          games[i].game_id,
          games[i].league_abbreviation + ' ' + games[i].division_abrev,
          games[i].field_name,
          new Date(games[i].day_of_week + ' ' + games[i].game_date + ' ' + games[i].time_ampm),
          games[i].home_team_id,
          games[i].away_team_id
          )
    }
  }
}
module.exports = main
