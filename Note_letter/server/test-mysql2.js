
require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('--- ENV CHECK ---');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('-----------------');

async function test() {
    try {
        console.log('Connecting with mysql2 (TCP)...');
        const connection = await mysql.createConnection({
            socketPath: '\\\\.\\pipe\\mysql',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'note_letter_db2',
            port: 3306,
            connectTimeout: 5000
        });
        console.log('Connected successfully!');
        await connection.end();
    } catch (err) {
        console.error('MySQL2 Error:', err.code, err.message);
    }
}

test();
