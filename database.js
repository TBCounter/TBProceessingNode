const Sequelize = require("sequelize");
const path = require('path');

const dbPath = path.resolve(__dirname, 'data', 'database.db');

const sequelize = new Sequelize({
    dialect: 'postgres',
    database: 'tbcounter-node',
    username: 'admin',
    password: 'admin',
    host: 'db',
    port: 5432,
    ssl: true,
    clientMinMessages: 'notice',
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