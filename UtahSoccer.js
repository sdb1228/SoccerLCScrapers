const jsdom = require('node-jsdom')
const Database = require('./Database')
const axios = require('axios')
const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })

const main = function main () {
  return getFields()
  .catch( (err) => {
    helpers.minorErrorHeader('Error Scraping Fields in Utah Soccer ERROR: ' + err)
    helpers.slackFailure('Error Scraping Fields in Utah Soccer ERROR: ' + err)
    throw err
  })
  // return getTeams()
  // .catch( (err) => {
  //   helpers.minorErrorHeader('Error Scraping Teams in Utah Soccer ERROR: ' + err)
  //   helpers.slackFailure('Error Scraping Teams in Utah Soccer ERROR: ' + err)
  //   throw err
  // })
  // return getGames()
  // .catch( (err) => {
  //   helpers.minorErrorHeader('Error Scraping Games in Utah Soccer ERROR: ' + err)
  //   helpers.slackFailure('Error Scraping Games in Utah Soccer ERROR: ' + err)
  //   throw err
  // })
}


function getFields() {
  return new Promise ((resolve, reject) => {
    helpers.minorHeader('begin scraping of https://utahsoccer.org/uso_fields.php')
    jsdom.env(
      'https://utahsoccer.org/uso_fields.php',
      ['http://code.jquery.com/jquery.js'],
      function (errors, window) {
        if (errors) {
          helpers.minorErrorHeader('ERROR IN MAKING AJAX CALL IN GET FIELDS')
          helpers.slackFailure('Error making ajax request to https://utahsoccer.org/uso_fields.php in Utah Soccer')
          log.error(errors)
          throw errors
        }
        const $ = window.$
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
            promiseArray.push (Database.insertOrUpdateField({name: fieldName, address: arrayAddress[0].trim(), city: arrayAddress[1].trim(), state: 'Utah'}))
          }
        }
        resolve(Promise.all(promiseArray))
      }
    )
  })
}

function getTeams () {
  helpers.minorHeader('Making endpoint call to https://utahsoccer.org/public_get_my_team.php')
  return new Promise ((resolve, reject) => {
    jsdom.env(
      'https://utahsoccer.org/public_get_my_team.php',
      ['http://code.jquery.com/jquery.js'],
      function (errors, window) {
        if (errors) {
          helpers.minorErrorHeader('ERROR IN MAKING AJAX CALL IN GET TEAMS')
          helpers.slackFailure('Error making ajax request to https://utahsoccer.org/public_get_my_team.php in Utah Soccer')
          log.error(errors)
          throw errors
        }
        const $ = window.$
        if ($('option')) {
          const teams = $('option')
          log.info(teams.length + ' Teams returned from utahsoccer')
          resolve(parseTeams($, teams))
        } else {
          helpers.minorErrorHeader('NO TEAMS RETURNED FROM CALL RETURNING')
          helpers.slackFailure('There are no teams returned from Utah Soccer AJAX Call')
          throw 'There are no teams returned from Utah Soccer AJAX Call'
        }
      }
    )
  })
}

function parseTeams ($, teams) {
  return new Promise ((resolve, reject) => {
    helpers.minorHeader('Parsing Utah Soccer teams')
    let promiseArray = []
    for (let i = 0; i < teams.length; i++) {
      if (!teams[i].value || !teams[i].text) {
        helpers.minorErrorHeader('Team name or teamid doesnt exist')
        helpers.slackFailure('Encountered team without name or teamid in Utah Soccer')
        continue
      }
      promiseArray.push(Database.insertOrUpdateTeam({teamId: teams[i].value, name: teams[i].text, division: '', facilityId: 1}))
    }
    resolve(Promise.all(promiseArray))
  })
}

function getGames () {
  return new Promise ((resolve, reject) => {
    axios.get('https://www.utahsoccer.org/public_manage_schedules_process.php?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc')
      .then(function (response) {
        if (!response.data) {
          helpers.minorErrorHeader('NO GAMES RETURNED FROM CALL RETURNING')
          helpers.slackFailure('There are no games returned from Utah Soccer AJAX Call')
          throw 'There are no games returned from Utah Soccer AJAX Call'
        }
        log.info(response.data.rows.length + ' Games returned from utahsoccer')
        resolve(parseGames(response.data.rows))
      })
    })
}

function parseGames (games) {
  helpers.minorHeader('Parsing Utah Soccer games')
  return new Promise ((resolve, reject) => {
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
  })
}
module.exports = main
