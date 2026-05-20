const {Sequelize} = require('sequelize')
const dotenv = require('dotenv')
dotenv.config()
const sequelize = new Sequelize(
process.env.DB_NAME,
process.env.DB_USER,
process.env.DB_PASS,
{
host: process.env.DB_HOST,
port: process.env.DB_PORT,
dialect: 'postgres',
logging: false
}
);
const connectDB = async () => {
try {
await sequelize.authenticate();
console.log('PostgreSQL Connected...');
} catch (error) {
console.error('Unable to connect to the database:', error);
}
}
module.exports = { sequelize, connectDB }
