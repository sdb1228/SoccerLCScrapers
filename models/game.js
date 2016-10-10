'use strict';
module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define('Game', {
    awayTeamId: {type: DataTypes.INTEGER,
                 unique: 'gameCombo'},
    facilityGameId: DataTypes.STRING,
    facilityId: DataTypes.INTEGER,
    homeTeamId: {type: DataTypes.INTEGER,
                 unique: 'gameCombo'},
    awayTeamScore: DataTypes.INTEGER,
    homeTeamScore: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE,
    gameDateTime: {type: DataTypes.DATE,
                   unique: 'gameCombo'},
    fieldId: DataTypes.INTEGER,
    tournament: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Game.belongsTo(models.Facility, {foreignKey: 'facilityId'})
        Game.belongsTo(models.Field, {foreignKey: 'fieldId'})
        Game.belongsTo(models.Team, {as: 'AwayTeam', foreignKey: 'awayTeamId'})
        Game.belongsTo(models.Team, {as: 'HomeTeam', foreignKey: 'homeTeamId'})
      }
    }
  });
  return Game;
};
