'use strict';
module.exports = function(sequelize, DataTypes) {
  var Batch = sequelize.define('Batch', {
    createdAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        Batch.hasMany(models.Game, {foreignKey: 'batchId'})
        Batch.hasMany(models.Field, {foreignKey: 'batchId'})
      }
    }
  });
  return Batch;
};
