
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('', 'root', '', {
    host: '127.0.0.1',
    dialect: 'mysql',
    logging: false,
});

async function listDbs() {
    try {
        await sequelize.authenticate();
        console.log('Auth successful.');
        const [results] = await sequelize.query('SHOW DATABASES;');
        console.log('Databases:', results.map(r => r.Database));
        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error.message);
        process.exit(1);
    }
}

listDbs();
