global.Promise = require('bluebird')
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config/config.json')[env];
const db = require('./models')
const moment = require('moment')
const FCM = require('fcm-node')
const R = require('ramda')
const PrettyError = require('pretty-error')

const prettyError = new PrettyError()
prettyError.withoutColors()
const fcm = new FCM(config.fcm.serverKey)
const sendMessage = Promise.promisify(fcm.send, {context: fcm})

function buildMessage(token, time, location) {
  return {
    to: token,
    priority: 'high',
    time_to_live: Math.floor(moment.duration(1, 'day').asSeconds()),
    notification: {
      title: 'Game today',
      body: `${time.format('LT')} at ${location}. Good luck!`
    }
  }
}

const sendTodaysNotifications = Promise.coroutine(function* sendTodaysNotifications() {
  // if it's after 8AM, notify users that have games with favorite teams scheduled today (between now and midnight) unless they've received a notification today (midnight to midnight)
  // todo: nail down edge cases like 8AM games
  // todo: user/facility timezones
  // todo: slackify logs

  // games that might need notifications
  const dayStart = moment.tz('America/Denver').startOf('day')
  const dayEnd = moment.tz('America/Denver').endOf('day')

  const games = yield db.sequelize.query(` \
select \
  "Games"."gameDateTime", \
  "Fields"."name" as "fieldName", \
  "Installations"."installationId", \
  "Installations"."deviceToken" \
from "Games" \
inner join "Teams" as "homeTeams" on "homeTeams"."id" = "Games"."homeTeamId" \
inner join "Teams" as "awayTeams" on "awayTeams"."id" = "Games"."awayTeamId" \
inner join "Fields" on "Fields"."id" = "Games"."fieldId" \
inner join "Facilities" on "Facilities"."id" = "Games"."facilityId" \
inner join "FavoriteTeams" on \
  "FavoriteTeams"."teamId" = "homeTeams".id or \
  "FavoriteTeams"."teamId" = "awayTeams".id \
inner join "Installations" on \
  "Installations"."installationId" = "FavoriteTeams"."installationId" and \
  "Installations"."deviceToken" is not null and \
  ( "Installations"."lastNotifiedAt" < :dayStart or \
    "Installations"."lastNotifiedAt" is null) \
where \
  "Games"."gameDateTime" > :dayStart and \
  "Games"."gameDateTime" <= :dayEnd \
`, {replacements: {dayStart: dayStart.format(), dayEnd: dayEnd.format()}, type: db.sequelize.QueryTypes.SELECT})

  console.log(JSON.stringify({numFavoritedGames: games.length, startTime: dayStart, endTime: dayEnd}, null, 2))
  for (let favoriteGame of games) {
    try {
      const message = buildMessage(favoriteGame.deviceToken, moment(favoriteGame.gameDateTime).tz('America/Denver'), favoriteGame.fieldName)
      console.log(JSON.stringify({message: message, installation: R.pick(['installationId', 'deviceToken']), favoriteGame: favoriteGame}, null, 2))
      yield sendMessage(message)
    } catch (e) {
      console.log(JSON.stringify({error: prettyError.render(e), installation: R.pick(['installationId', 'deviceToken'], favoriteGame), favoriteGame: favoriteGame}, null, 2))
    }
  }
})

sendTodaysNotifications()
