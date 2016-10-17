const Cursor = require('../../../Cursor')
const Sequelize = require('sequelize')
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
      const cursor = new Cursor(req, res, Models.Team, ['name', 'teamId'], {where: {facilityId: req.params.facility}})
      cursor.sendPage().catch(next)
    }
  },

  ':facility/divisions': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Team, ['division'], {
        where: {facilityId: req.params.facility},
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('division')), 'division']]
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
