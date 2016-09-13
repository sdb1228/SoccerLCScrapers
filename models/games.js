'use strict';
module.exports = function(sequelize, DataTypes) {
  var Games = sequelize.define('Games', {
    awayTeam: DataTypes.STRING,
    facilityGameId: DataTypes.STRING,
    facility: DataTypes.INTEGER,
    homeTeam: DataTypes.STRING,
    awayTeamScore: DataTypes.INTEGER,
    homeTeamScore: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE,
    gameDateTime: DataTypes.DATE,
    field: DataTypes.INTEGER,
    tournament: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Games;
};
