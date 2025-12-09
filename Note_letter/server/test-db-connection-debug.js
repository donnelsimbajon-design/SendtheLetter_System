
require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME || 'note_letter_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

console.log('--- DB CONFIG ---');
console.log(`Host: ${dbHost}`);
console.log(`User: ${dbUser}`);
console.log(`Port: ${dbPort}`);
console.log(`DB Name: ${dbName}`);
console.log('-----------------');

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
});

async function testConnection() {
    try {
        console.log('Testing authentication...');
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:');
        console.error(error);
        if (error.original) {
            console.error('Original Error Code:', error.original.code);
            console.error('Original Error Syscall:', error.original.syscall);
            console.error('Original Error Address:', error.original.address);
            console.error('Original Error Port:', error.original.port);
        }
        process.exit(1);
    }
}

testConnection();
