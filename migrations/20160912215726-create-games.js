'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('Games', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      batchId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Batches',
          key: 'id'
        }
      },
      awayTeamId: {
        type: Sequelize.INTEGER,
        unique: 'gameCombo'
      },
      facilityId: {
        type: Sequelize.INTEGER
      },
      facilityGameId: {
        type: Sequelize.STRING,
      },
      homeTeamId: {
        type: Sequelize.INTEGER,
        unique: 'gameCombo'
      },
      awayTeamScore: {
        type: Sequelize.INTEGER
      },
      homeTeamScore: {
        type: Sequelize.INTEGER
      },
      deletedAt: {
        type: Sequelize.DATE
      },
      gameDateTime: {
        type: Sequelize.DATE,
        unique: 'gameCombo'
      },
      fieldId: {
        type: Sequelize.INTEGER
      },
      tournament: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Games');
  }
};
