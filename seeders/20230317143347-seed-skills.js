'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
    */
    await queryInterface.bulkInsert('Skills', [
      {
        playerId: 1,
        skill: 'defense',
        value: 95,
        createdAt: new Date().toDateString(),
        updatedAt: new Date().toDateString(),
      },
      {
        playerId: 2,
        skill: 'attack',
        value: 80,
        createdAt: new Date().toDateString(),
        updatedAt: new Date().toDateString(),
      },
      {
        playerId: 2,
        skill: 'stamina',
        value: 40,
        createdAt: new Date().toDateString(),
        updatedAt: new Date().toDateString(),
      },
      
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     */
    await queryInterface.bulkDelete('Players', null, {});
  }
};
