'use strict';
module.exports = function(sequelize, DataTypes) {
  var Facility = sequelize.define('Facility', {
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    zip: DataTypes.INTEGER,
    state: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Facility.hasMany(models.Game, {foreignKey: 'facilityId'})
        Facility.hasMany(models.Team, {foreignKey: 'teamId'})
      }
    }
  });
  return Facility;
};
