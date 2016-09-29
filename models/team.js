'use strict';
module.exports = function(sequelize, DataTypes) {
  var Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    batchId: DataTypes.INTEGER,
    teamId: DataTypes.STRING,
    facilityId: DataTypes.INTEGER,
    division: DataTypes.STRING,
    deletedAt: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        Team.belongsTo(models.Batch, {foreignKey: 'batchId'})
        Team.belongsTo(models.Facility, {foreignKey: 'facilityId'})
        Team.hasMany(models.Game, {as: 'HomeGames', foreignKey: 'homeTeamId'})
        Team.hasMany(models.Game, {as: 'AwayGames', foreignKey: 'awayTeamId'})
      }
    }
  });
  return Team;
};
