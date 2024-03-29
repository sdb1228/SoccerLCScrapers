'use strict';
module.exports = function(sequelize, DataTypes) {
  var Facility = sequelize.define('Facility', {
    name: {type: DataTypes.STRING,
           unique: true},
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    zip: DataTypes.INTEGER,
    state: DataTypes.STRING,
    environment: DataTypes.STRING,
    image: DataTypes.STRING,
  }, {
    classMethods: {
      associate: function(models) {
        Facility.hasMany(models.Game, {as: 'games', foreignKey: 'facilityId'})
        Facility.hasMany(models.Team, {as: 'teams', foreignKey: 'teamId'})
      }
    }
  });
  return Facility;
};
