'use strict';
module.exports = function(sequelize, DataTypes) {
  var Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    teamId: DataTypes.STRING,
    facilityId: DataTypes.INTEGER,
    division: DataTypes.STRING,
    deletedAt: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        Team.hasOne(models.Facility)
        Team.hasMany(models.Game, {as: 'HomeGames', foreignKey: 'homeTeamId'})
        Team.hasMany(models.Game, {as: 'AwayGames', foreignKey: 'awayTeamId'})
      }
    }
  });
  return Team;
};
