module.exports = function(sequelize, DataTypes) {
  var Installation = sequelize.define('Installation', {
    installationId: {type: DataTypes.STRING,
                     allowNull: false,
                     unique: true},
    deviceToken: DataTypes.STRING,
    lastNotifiedAt: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        Installation.hasMany(models.FavoriteTeam, {as: 'favoriteTeams', foreignKey: 'installationId', targetKey: 'installationId'})
      }
    }
  });
  return Installation;
};
