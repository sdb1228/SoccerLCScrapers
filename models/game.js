'use strict';
module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define('Game', {
    batchId: DataTypes.INTEGER,
    awayTeamId: {type: DataTypes.INTEGER,
                 unqiue: 'gameCombo'},
    facilityGameId: DataTypes.STRING,
    facilityId: DataTypes.INTEGER,
    homeTeamId: {type: DataTypes.INTEGER,
                 unique: 'gameCombo'},
    awayTeamScore: DataTypes.INTEGER,
    homeTeamScore: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE,
    gameDateTime: {type: DataTypes.DATE,
                   unqiue: 'gameCombo'},
    fieldId: DataTypes.INTEGER,
    tournament: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Game.belongsTo(models.Batch, {foreignKey: 'batchId'})
        Game.belongsTo(models.Facility, {foreignKey: 'facilityId'})
        Game.belongsTo(models.Field, {foreignKey: 'fieldId'})
        Game.belongsTo(models.Team, {as: 'AwayTeam', foreignKey: 'awayTeamId'})
        Game.belongsTo(models.Team, {as: 'HomeTeam', foreignKey: 'homeTeamId'})
      }
    }
  });
  return Game;
};
