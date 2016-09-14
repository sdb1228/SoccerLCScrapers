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
      awayTeam: {
        type: Sequelize.STRING,
        unique: 'gameCombo',
        references: {
          model: 'Teams',
          key: 'teamId'
        }
      },
      facility: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Facilitys',
          key: 'id'
        }
      },
      facilityGameId: {
        type: Sequelize.STRING,
      },
      homeTeam: {
        type: Sequelize.STRING,
        unique: 'gameCombo',
        references: {
          model: 'Teams',
          key: 'teamId'
        }
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
      field: {
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
