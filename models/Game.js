'use strict';
module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define('Game', {
    awayTeamId: {type: DataTypes.INTEGER,
                 unique: 'gameCombo'},
    facilityGameId: DataTypes.STRING,
    facilityId: {type: DataTypes.INTEGER,
                 unique: 'gameCombo'},
    homeTeamId: {type: DataTypes.INTEGER,
                 unique: 'gameCombo'},
    awayTeamScore: DataTypes.INTEGER,
    homeTeamScore: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE,
    gameDateTime: {type: DataTypes.DATE,
                   unique: 'gameCombo'},
    fieldId: {type: DataTypes.INTEGER,
              unique: 'gameCombo'},
    tournament: DataTypes.INTEGER,
    lastBatchAt: DataTypes.DATE, // the start time of the scraper run that last touched this game
    staleAt: DataTypes.DATE // non-null when the game is stale. set to the batch start time when the game was first not found.
  }, {
    classMethods: {
      associate: function(models) {
        Game.belongsTo(models.Facility, {as: 'facility', foreignKey: 'facilityId'})
        Game.belongsTo(models.Field, {as: 'field', foreignKey: 'fieldId'})
        Game.belongsTo(models.Team, {as: 'awayTeam', foreignKey: 'awayTeamId'})
        Game.belongsTo(models.Team, {as: 'homeTeam', foreignKey: 'homeTeamId'})
      }
    }
  });
  return Game;
};
