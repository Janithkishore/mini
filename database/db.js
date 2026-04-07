/**
 * Database Connection Module
 */

const mysql = require('mysql2/promise');

// Update these values with your MySQL server credentials
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'janith@1234',
    database: process.env.DB_NAME || 'mentorship',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Async query wrappers
const db = {
    query: async (sql, params = []) => {
        const [rows] = await pool.query(sql, params);
        return rows;
    },
    getAsync: async (sql, params = []) => {
        const [rows] = await pool.query(sql, params);
        return rows[0] || null;
    },
    allAsync: async (sql, params = []) => {
        const [rows] = await pool.query(sql, params);
        return rows;
    },
    runAsync: async (sql, params = []) => {
        const [result] = await pool.query(sql, params);
        return result;
    },
    pool
};

module.exports = db;
