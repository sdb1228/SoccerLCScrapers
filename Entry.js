const jsdom = require('node-jsdom')
const {RateLimiter} = require('limiter')

const requestLimiter = new RateLimiter(1, 'second')
log = (message) => function log(r, _) {console.log(JSON.stringify({message: message, data: r}))}
const rootUrl = 'http://letsplaysoccer.com/facilities/12/' // todo: multi-facility

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

const teamUrlRegex = /.*\/facilities\/(\d+)\/teams\/(\d+)$/
function fetchTeamUrls(_, map) {
  scrape(rootUrl + 'teams', map, (window, $) => {
    $.each($("a"), (_, a) => {
      if (a.href && (match = a.href.match(teamUrlRegex))) {
        const [url, facilityId, id] = match
        if (id === '248804') {
        map({
          type: 'teamUrl',
          url: url,
          id: id,
          name: a.text,
          facilityId: facilityId
        })
        }
      }
    })
  })
}

function fetchTeam(teamUrl, map) {
  const seasonDivisionRegex = /^\s*Season:\s+(.*?)\s+Division:\s+(.*?)\s*$/
  scrape(teamUrl.url, map, (window, $) => {
    const mainRight = $('#mainright')
    const name = mainRight.find('h1:first').text()
    const [seasonDivision, season, division] = mainRight.find('h3:first').text().match(seasonDivisionRegex)
    map({
      type: 'team',
      name: name,
      teamId: teamUrl.id,
      facilityId: teamUrl.facilityId,
      division: division,
      season: season
    })
  })
}
function fetchGames(_, map) {
  const dateOffset = 1
  scrape(rootUrl + `games?utf8=✓&date_offset=${dateOffset}&commit=Get+Schedule`, map, (window, $) => {
    fieldTables = $(':header').next('table')
    fieldHeaders = fieldTables.prev()
    fieldHeaders.forEach((header, i) => {
      fieldName = window.$(header).text()
      // validate th?
      rows = $(fieldTables[i]).children('tr')
      $.each(rows, (_, row) => {
        tds = $(row).find('td')
        if (tds.length === 0) return // th
        let [date, field, division, homeTeam, awayTeam, result] = tds
        function resultFromTeamTD(td) {
          let a = $(td).find('a')
          return {
            name: a.text,
            id: a.href.match(teamUrlRegex)[2]
          }
        }

        map({
          type: 'game',
          date: new Date(date),
          fieldId: $(field).text(),
          division: $(division).text(),
          homeTeam: resultFromTeamTD(homeTeam),
          awayTeam: resultFromTeamTD(awayTeam),
          result: $(result).text()
        })
      })
    })
  })
}

handlers = {
  start: [fetchTeamUrls, fetchGames],
  teamUrl: [fetchTeam],
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

/*
const UtahSoccer = require('./UtahSoccer')
const helpers = require('./Helpers')
const log = require('custom-logger').config({ level: 0 })
prettyPrint('Utah Soccer')
//TODO: For Batches assume failure unless told success
UtahSoccer()
.then (() => {
  //TODO: Utah soccer batch successful
  helpers.slackSuccess('Utah Soccer Scraper ran successfully')
  helpers.headerBreak('Utah Soccer Scraper ran successfully')
})
.catch ((err) => {
  helpers.minorErrorHeader('Utah Soccer Scraper has failed with ERROR: ' + err)
  helpers.slackFailure('Utah Soccer Scraper has failed with ERROR: ' + err)
})

function prettyPrint (facility) {
  log.info('####################################')
  log.info('#########  ' + facility + '  ############')
  log.info('####################################')
}
*/
