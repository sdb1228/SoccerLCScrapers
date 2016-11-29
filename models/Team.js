'use strict';
module.exports = function(sequelize, DataTypes) {
  var Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    teamId: {type: DataTypes.STRING,
             unique: true},
    facilityId: DataTypes.INTEGER,
    division: DataTypes.STRING,
    deletedAt: DataTypes.DATE,
    lastGameAt: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        Team.belongsTo(models.Facility, {as: 'facility', foreignKey: 'facilityId'})
        Team.hasMany(models.Game, {as: 'homeGames', foreignKey: 'homeTeamId'})
        Team.hasMany(models.Game, {as: 'awayGames', foreignKey: 'awayTeamId'})
        Team.hasMany(models.FavoriteTeam, {as: 'favorites', foreignKey: 'teamId'})
      }
    }
  });
  return Team;
};
