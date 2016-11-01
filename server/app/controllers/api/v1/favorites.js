const Cursor = require('../../../Cursor')
const Sequelize = require('sequelize')
const SqlString = require('sequelize/lib/sql-string');
const moment = require('moment')

function whereInstallationFavorited(installationId) {
  return ['"Team"."id" IN (SELECT "teamId" FROM "FavoriteTeams" WHERE "FavoriteTeams"."installationId" = ?)', [installationId]]
}

module.exports = () => ({
  'teams': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Team, ['name', 'teamId'], {
        where: whereInstallationFavorited(req.query.installationId)
      })
      cursor.sendPage().catch(next)
    },

    post: (req, res, next) => {
      Models.Team.findOne({where: {id: req.body.teamId}}).then(team => Models.FavoriteTeam.findOrCreate({where: {teamId: team.id, installationId: req.body.installationId}})).then(fav => res.ok(fav)).catch(next)
    }
  },

  'teams/:team': {
    delete: (req, res, next) => {
      Models.FavoriteTeam.findOne({where: {teamId: req.params.team, installationId: req.query.installationId}}).then(fav => fav.destroy()).then(r => res.ok(r)).catch(next)
    }
  },

  'games': {
    get: (req, res, next) => {
      const cursor = new Cursor(req, res, Models.Game, ['gameDateTime', 'fieldId'], {
        where: {
          gameDateTime: {$gt: moment().startOf('day')},
          $or: [
            Sequelize.literal(`"homeTeamId" IN (SELECT "teamId" FROM "FavoriteTeams" WHERE "FavoriteTeams"."installationId" = ${SqlString.escape(req.query.installationId)})`),
            Sequelize.literal(`"awayTeamId" IN (SELECT "teamId" FROM "FavoriteTeams" WHERE "FavoriteTeams"."installationId" = ${SqlString.escape(req.query.installationId)})`)
          ]
        },
        include: [{ model: Models.Team,
                    as: 'awayTeam' },
                  { model: Models.Team,
                    as: 'homeTeam' },
                  { model: Models.Field,
                    as: 'field' }]
      })
      cursor.sendPage().catch(next)
    }
  }
})
