const jsdom = require('node-jsdom')
const Database = require('./Database')
const axios = require('axios')
const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })

const main = function main () {
  helpers.headerBreak('Parsing Teams Utah Soccer')
  getTeams()
  helpers.slackSuccess('Utah Soccer teams were updated successfully')
  helpers.headerBreak('Utah Soccer teams were updated successfully')
  // getGames()
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
      console.log(response.data.rows.length)
    })
    .catch(function (error) {
      console.log(error)
    })
}

function parseGames () {

}
module.exports = main
