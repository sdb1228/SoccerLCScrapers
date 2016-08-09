const jsdom = require('node-jsdom')
const Database = require('./Database')
const axios = require('axios')

var main = function main () {
  //getTeams()
  getGames()
}

function getTeams () {
  jsdom.env(
    'https://utahsoccer.org/public_get_my_team.php',
    ['http://code.jquery.com/jquery.js'],
    function (errors, window) {
      var $ = window.$
      const teams =  $('option')
      parseTeams($, teams)
    }
  );
}

function parseTeams ($, teams) {
  for (var i = 0; i < teams.length; i++) {
    Database.insertOrUpdateTeam(teams[i].value, teams[i].text)
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
