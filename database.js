const Sequelize = require("sequelize");


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;