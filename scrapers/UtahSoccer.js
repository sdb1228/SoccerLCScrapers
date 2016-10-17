const Scraper = require('./Scraper')
const s = new Scraper('UtahSoccer')

const rootPattern = 'utahsoccer.org'
const rootUrl = 'https://utahsoccer.org'
const fieldPath = '/uso_fields.php'
const teamPath = '/public_get_my_team.php'
const gamePath = '/public_manage_schedules_process.php'
const gameParams = '?s=2015&l=&t=%20(All)&grid_id=list1&_search=false&nd=1460209489069&rows=5125&jqgrid_page=1&sidx=game_date%2C+game_number&sord=asc'

s.domExtractor(rootPattern + teamPath, function extractTeams(req, res) {
  const $ = req.$
  const teams = $('option').toArray()
  for (let i = 0; i < teams.length; i++) {
    let team = $(teams[i])
    res.save({
      type: 'team',
      teamId: team.attr('value'),
      name: team.text()
    })
  }
})

s.domExtractor(rootPattern + fieldPath, function extractFields(req, res) {
  const $ = req.$
  const fieldRegex = /([^•]*)•([^•]*)•([^•,]*),[^•]*MAP DOC FORECAST/g
  const text = $('.maincontent .bigldisplaydiv').text()
  let match
  while ((match = fieldRegex.exec(text)) !== null) {
    let [_, name, address, city] = match
    res.save({
      type: 'field',
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim() || null,
      state: 'Utah'
    })
  }
})

s.jsonExtractor(rootPattern + gamePath, function extractGames(req, res) {
  let json = req.body
  let games = json.rows
  for (let i = 0; i < games.length; i++) {
    const game = games[i]
    if (game.game_type !== 'tournament' || game.game_type !== 'final') {
      const division = game.league_abbreviation + ' ' + game.division_abrev
      let away_team_id = null
      let home_team_id = null
      if (game.home_team_set === 'yes' && parseInt(game.home_team_id) > 0) {
        home_team_id = game.home_team_id
        res.save({
          type: 'team',
          teamId: game.home_team_id,
          name: game.home_team_name,
          division: division
        })
      }
      if (game.away_team_set === 'yes' && parseInt(game.away_team_id) > 0) {
        away_team_id = game.away_team_id
        res.save({
          type: 'team',
          teamId: game.away_team_id,
          name: game.away_team_name,
          division: division
        })
      }
      res.save({
        type: 'game',
        gameId: game.game_id,
        field: game.field_name,
        gameDateTime: new Date(game.day_of_week + ' ' + game.game_date + ' ' + game.time_ampm),
        homeTeamId: game.home_team_id,
        awayTeamId: game.away_team_id
      })
    }
  }
})

s.loader(Scraper.Common.saveFields)
s.loader(Scraper.Common.saveTeams)
s.loader(Scraper.Common.saveGames)

s.initialUrls = [rootUrl + gamePath + gameParams, rootUrl + teamPath, rootUrl + fieldPath]
s.scrapeResults.facilityId = 1

module.exports = {
  scrape: () => s.run()
}
