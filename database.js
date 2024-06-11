const Sequelize = require("sequelize");
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'postgres',
    database: 'tbcounter-node',
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.DB_HOST,
    port: 7432,
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