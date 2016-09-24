'use strict';
module.exports = function(sequelize, DataTypes) {
  var Facility = sequelize.define('facility', {
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    zip: DataTypes.INTEGER,
    state: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Facility.hasMany(models.Game)
        Facility.hasMany(models.Team)
      }
    }
  });
  return Facility;
};
