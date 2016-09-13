'use strict';
module.exports = function(sequelize, DataTypes) {
  var Facilitys = sequelize.define('Facilitys', {
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    zip: DataTypes.INTEGER,
    state: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Facilitys;
};