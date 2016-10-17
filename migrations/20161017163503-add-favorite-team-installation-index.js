'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addIndex('FavoriteTeams', ['installationId', 'teamId'], {indexName: 'favoriteTeamInstallation', indicesType: 'UNIQUE'})
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeIndex('FavoriteTeams', 'favoriteTeamInstallation');
  }
};
