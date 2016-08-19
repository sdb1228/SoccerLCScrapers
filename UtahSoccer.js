const jsdom = require('node-jsdom')
const Database = require('./Database')
const axios = require('axios')
const helpers = require('./Helpers')
const Table = require('cli-table')
const log = require('custom-logger').config({ level: 0 })

var main = function main () {
  helpers.headerBreak('Parsing Teams Utah Soccer')
  getTeams()
  //getGames()
}

function getTeams () {
  helpers.minorHeader('Making endpoint call to https://utahsoccer.org/public_get_my_team.php')
  jsdom.env(
    'https://utahsoccer.org/public_get_my_team.php',
    ['http://code.jquery.com/jquery.js'],
    function (errors, window) {
      if (errors) {
        helpers.minorErrorHeader('ERROR IN MAKING AJAX CALL IN GET TEAMS')
        //TODO make call to slack channel
        log.error(errors)
        helpers.minorErrorHeader('RETURNING')
        return
      }
      var $ = window.$
      if ($('option')) {
        const teams =  $('option')
        log.info( teams.length + " Teams returned from utahsoccer")
        parseTeams($, teams)
      } else {
        helpers.minorErrorHeader('NO TEAMS RETURNED FROM CALL RETURNING')
      }
    }
  );
}

function parseTeams ($, teams) {
  for (var i = 0; i < teams.length; i++) {
    //Database.insertOrUpdateTeam(teams[i].value, teams[i].text)
  }
}

function getGames () {
  axios.get('https://www.utahsoccer.org/public_manage_schedules_process.php?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc')
    .then(function (response) {
      console.log(response.data.rows.length);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function parseGames () {

}
module.exports = main
