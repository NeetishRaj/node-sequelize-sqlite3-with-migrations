'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
    */
    await queryInterface.bulkInsert('Players', [
      {
        name: 'John Doe',
        position: 'midfielder',
        createdAt: new Date().toDateString(),
        updatedAt: new Date().toDateString(),
      },
      {
        name: 'Arun Raj',
        position: 'defender',
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
