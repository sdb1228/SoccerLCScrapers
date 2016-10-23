const Cursor = require('../../../Cursor')
const sequelize = Models.Game.sequelize
const moment = require('moment')
const gameIncludes = [{model: Models.Field, as: 'field'}, {model: Models.Team, as: 'homeTeam'}, {model: Models.Team, as: 'awayTeam'}]
const R = require('ramda')

module.exports = () => ({
  '/': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Facility, ['name'])
      cursor.sendPage().catch(next)
    },
  },

  ':environment': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Facility, ['name'], {where: {environment: req.params.environment}})
      cursor.sendPage().catch(next)
    }
  },

  ':facility/teams': {
    get: (req, res, next) => {
      let opts = {
        where: {facilityId: req.params.facility}
      }
      if (req.query.installationId) {
        opts.include = {model: Models.FavoriteTeam, as: 'favorites', required: false, separate: true, where: {installationId: req.query.installationId}}
      }
      const cursor = new Cursor(req, res, Models.Team, ['name', 'teamId'], opts)
      cursor.getPage().then(teams => res.ok(R.map(team => ({
        id: team.id,
        name: team.name,
        division: team.division,
        favorite: (team.favorites || []).length > 0
      }), teams))).catch(next)
    }
  },

  ':facility/divisions': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Team, ['division'], {
        where: {facilityId: req.params.facility},
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('division')), 'division']]
      })
      cursor.getPage().then(teams => res.ok(R.map(team => ({name: team.division}), teams))).catch(next)
    }
  },

  ':facility/divisions/:division/teams': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Team, ['name', 'teamId'], {where: {facilityId: req.params.facility, division: req.params.division}})
      cursor.sendPage().catch(next)
    }
  },

  ':facility/teams/:team/games': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Game, ['gameDateTime', 'fieldId'], {
        where: {
          facilityId: req.params.facility,
          $or: {
            homeTeamId: req.params.team,
            awayTeamId: req.params.team
          }
        },
        include: gameIncludes
      })
      cursor.sendPage().catch(next)
    }
  },

  ':facility/divisions/:division/games': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Game, ['gameDateTime', 'fieldId'], {
        where: {
          facilityId: req.params.facility,
          $and: [['"homeTeam"."division"=?', [req.params.division]],
                 ['"awayTeam"."division"=?', [req.params.division]]]
        },
        include: gameIncludes
      })
      cursor.sendPage().catch(next)
    }
  },

  ':facility/divisions/:division/standings': {
    get: (req, res, next) => {
      sequelize.query(` \
with "standingGames" as ( \
  select * from "Games" where \
    "tournament" is null AND \
    "awayTeamScore" is not null AND \
    "homeTeamScore" is not null AND \
    "deletedAt" is null AND \
    "facilityId" = :facilityId \
), "teamScores" as ( \
  select "homeTeamId"    as "teamId", \
         "homeTeamScore" as "goalsFor", \
         "awayTeamScore" as "goalsAgainst" \
    from "standingGames" \
  union all \
  select "awayTeamId"    as "teamId", \
         "awayTeamScore" as "goalsFor", \
         "homeTeamScore" as "goalsAgainst" \
    from "standingGames" \
), "teamStats" as ( \
  select "teamScores"."teamId", \
         sum("goalsFor") as "goalsFor", \
         sum("goalsAgainst") as "goalsAgainst", \
         count(*) as "gamesPlayed", \
         count(nullif("goalsFor">"goalsAgainst", false)) as "wins", \
         count(nullif("goalsFor"<"goalsAgainst", false)) as "losses", \
         count(nullif("goalsFor"="goalsAgainst", false)) as "ties", \
         count(nullif("goalsFor">"goalsAgainst", false)) * 3 + count(nullif("goalsFor"="goalsAgainst", false)) as "points" \
    from "teamScores" group by "teamScores"."teamId") \
select "name", "teamStats"."teamId", "goalsFor", "goalsAgainst", "gamesPlayed", "wins", "losses", "ties", "points" \
  from "teamStats" \
  inner join "Teams" on "Teams"."id" = "teamStats"."teamId" \
  where "division" = :division \
  order by "points" desc, "name"`, { replacements: {facilityId: parseInt(req.params.facility), division: req.params.division}, type: sequelize.QueryTypes.SELECT}).then(standings => res.ok(standings)).catch(next)
    }
  },

  ':facility/games/today': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Game, ['gameDateTime', 'fieldId'], {
        where: {
          facilityId: req.params.facility,
          gameDateTime: {
            $gte: moment().startOf('day'),
            $lt: moment().endOf('day')
          }
        },
        include: gameIncludes
      })
      cursor.sendPage().catch(next)
    }
  },

  ':facility/games/tomorrow': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Game, ['gameDateTime', 'fieldId'], {
        where: {
          facilityId: req.params.facility,
          gameDateTime: {
            $gte: moment().startOf('day').add(1, 'days'),
            $lt: moment().endOf('day').add(1, 'days')
          }
        },
        include: gameIncludes
      })
      cursor.sendPage().catch(next)
    }
  },
})
