'use strict';
module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define('Game', {
    awayTeamId: DataTypes.INTEGER,
    facilityGameId: DataTypes.STRING,
    facilityId: DataTypes.INTEGER,
    homeTeamId: DataTypes.INTEGER,
    awayTeamScore: DataTypes.INTEGER,
    homeTeamScore: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE,
    gameDateTime: DataTypes.DATE,
    fieldId: DataTypes.INTEGER,
    tournament: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Game.belongsTo(models.Facility)
        Game.belongsTo(models.Field)
        Game.belongsTo(models.Team, {as: 'AwayTeam', foreignKey: 'awayTeamId'})
        Game.belongsTo(models.Team, {as: 'HomeTeam', foreignKey: 'homeTeamId'})
      }
    }
  });
  return Game;
};
