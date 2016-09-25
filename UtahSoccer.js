const jsdom = require('node-jsdom')
const Database = require('./Database')
const axios = require('axios')
const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })

const main = function main (callback) {
  helpers.headerBreak('Parsing fields Utah Soccer')
  getFields()
  helpers.slackSuccess('Utah Soccer fields were updated successfully')
  helpers.headerBreak('Utah Soccer fields were updated successfully')
  helpers.headerBreak('Parsing Teams Utah Soccer')
  getTeams()
  helpers.slackSuccess('Utah Soccer teams were updated successfully')
  helpers.headerBreak('Utah Soccer teams were updated successfully')
  helpers.headerBreak('Parsing Games Unplayed Utah Soccer')
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

function getFields() {
  helpers.minorHeader('begin scraping of https://utahsoccer.org/uso_fields.php')
  jsdom.env(
    'https://utahsoccer.org/uso_fields.php',
    ['http://code.jquery.com/jquery.js'],
    function (errors, window) {
      if (errors) {
        helpers.minorErrorHeader('ERROR IN MAKING AJAX CALL IN GET FIELDS')
        helpers.slackFailure('Error making ajax request to https://utahsoccer.org/uso_fields.php in Utah Soccer')
        log.error(errors)
        return
      }
      const $ = window.$
      let fieldName = ""
      let fieldAddress = ""
      let extraElement = false
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
          Database.insertOrUpdateField(fieldName, arrayAddress[0].trim(), arrayAddress[1].trim(), "Utah")
        }
      }
    }
  )
}

function parseTeams ($, teams) {
  helpers.minorHeader('Parsing Utah Soccer teams')
  for (let i = 0; i < teams.length; i++) {
    if (!teams[i].value || !teams[i].text) {
      helpers.slackFailure('Error in saving out team record ID: ' + teams[i].value + ' Name: ' + teams[i].text)
      continue
    }
    Database.insertOrUpdateTeam(teams[i].value, teams[i].text, '', 1)
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
      helpers.minorErrorHeader('ERROR IN MAKING AJAX CALL FOR GET GAMES OF UTAH SOCCER ' + error)
      helpers.slackFailure('Error making ajax request to https://www.utahsoccer.org/public_manage_schedules_process.php?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc in Utah Soccer ' + error)
      log.error(error)
      return
    })
}

function parseGames (games) {
  helpers.minorHeader('Parsing Utah Soccer games')
  for (let i = 0; i < games.length; i++) {
    if (games[i].game_type !== 'tournament' || games[i].game_type !== 'final') {
      const division = games[i].league_abbreviation + ' ' + games[i].division_abrev
      log.info('updating Home Team ID: ' + games[i].home_team_id + ' Home Team Name: ' + games[i].home_team_name + ' Division: ' + division)
      Database.insertOrUpdateTeam(games[i].home_team_id, games[i].home_team_name, division , 1)
      log.info('updating Away Team ID: ' + games[i].home_team_id + ' Away Team Name: ' + games[i].home_team_name + ' Division: ' + division)
      Database.insertOrUpdateTeam(games[i].away_team_id, games[i].away_team_name, division, 1)
      Database.insertOrUpdateGame(
          games[i].game_id,
          games[i].field_name,
          new Date(games[i].day_of_week + ' ' + games[i].game_date + ' ' + games[i].time_ampm),
          games[i].home_team_id,
          games[i].away_team_id,
          undefined,
          undefined,
          1
          )
    }
  }
}
module.exports = main
