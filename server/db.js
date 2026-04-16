import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let db;

try {
    // Database connection
    const dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };
    db = await mysql.createConnection(dbConfig);

} catch (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
}

export { db };