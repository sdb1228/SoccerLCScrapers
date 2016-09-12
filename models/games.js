'use strict';
module.exports = function(sequelize, DataTypes) {
  var Games = sequelize.define('Games', {
    awayTeam: DataTypes.STRING,
    homeTeam: DataTypes.STRING,
    awayTeamScore: DataTypes.INT,
    homeTeamScore: DataTypes.INT,
    deletedAt: DataTypes.DATE,
    gameDateTime: DataTypes.DATE,
    field: DataTypes.INT,
    tournament: DataTypes.INT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Games;
};