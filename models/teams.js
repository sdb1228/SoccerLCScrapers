'use strict';
module.exports = function(sequelize, DataTypes) {
  var Teams = sequelize.define('Teams', {
    name: DataTypes.STRING,
    teamId: DataTypes.STRING,
    division: DataTypes.STRING,
    deletedAt: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Teams;
};
