module.exports = function(sequelize, DataTypes) {
  var FavoriteTeam = sequelize.define('FavoriteTeam', {
    teamId: {type: DataTypes.INTEGER,
             allowNull: false,
             unique: 'favoriteTeamInstallation'},
    installationId: {type: DataTypes.STRING,
                     allowNull: false,
                     unique: 'favoriteTeamInstallation'}

  }, {
    classMethods: {
      associate: function(models) {
        FavoriteTeam.belongsTo(models.Team, {as: 'team', foreignKey: 'teamId'})
        FavoriteTeam.belongsTo(models.Installation, {as: 'installation', foreignKey: 'installationId', targetKey: 'installationId'})
      }
    }
  })
  return FavoriteTeam
}
