'use strict';
module.exports = function(sequelize, DataTypes) {
  var Teams = sequelize.define('Teams', {
    name: DataTypes.STRING,
    teamid: DataTypes.STRING,
    division: DataTypes.STRING,
    deleted_at: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Teams;
};