import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Supabase PostgreSQL connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000 // 60 seconds
    },
    logging: false,
});

export default sequelize;
