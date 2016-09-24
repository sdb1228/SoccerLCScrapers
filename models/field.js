'use strict';
module.exports = function(sequelize, DataTypes) {
  var Field = sequelize.define('field', {
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zip: DataTypes.INTEGER,
    latlong: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Field.hasMany(models.Game)
      }
    }
  });
  return Field;
};
