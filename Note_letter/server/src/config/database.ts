import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Supabase PostgreSQL connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Supabase publishes a per-project root CA from Database Settings.
// Configure DB_SSL_CA_PEM in the hosting secrets (PEM text, with optional escaped newlines)
// to verify the server certificate and hostname. Never commit the CA or credentials.
const caPem = process.env.DB_SSL_CA_PEM?.replace(/\\n/g, '\n').trim();
const strictRequested = process.env.DB_SSL_STRICT === 'true';
if (strictRequested && !caPem) {
    throw new Error('DB_SSL_STRICT requires DB_SSL_CA_PEM. Configure the trusted Supabase database root certificate.');
}
if (!caPem) {
    console.warn('Database TLS certificate verification is disabled until DB_SSL_CA_PEM is configured.');
}
const ssl = caPem
    ? { require: true, rejectUnauthorized: true, ca: caPem }
    : { require: true, rejectUnauthorized: false };

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl,
        connectionTimeoutMillis: 60000 // 60 seconds
    },
    logging: false,
});

export default sequelize;
