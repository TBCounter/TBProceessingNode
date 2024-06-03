const Sequelize = require("sequelize");


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.db'
});


const Screenshot = sequelize.define("screenshot", {
    path: {
        type: Sequelize.STRING
    },
    login: {
        type: Sequelize.STRING
    },
});

const db = {};

db.screenshots = new Screenshot(sequelize, Sequelize)

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;