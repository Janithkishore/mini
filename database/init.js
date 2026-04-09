/**
 * Database Initialization Script
 * Creates all tables and inserts default admin + sample data
 */

const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const schemaPath = path.join(__dirname, 'schema.sql');

// Update these values with your MySQL server credentials
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'janith@1234',
    database: process.env.DB_NAME || 'mentorship',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
};

async function runSQLFile(connection, filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    await connection.query(sql);
}

async function seed(connection) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user if not exists
    await connection.query(
        `INSERT IGNORE INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)`,
        ['Admin', 'admin@college.edu', hashedPassword, 'admin', 'Administration']
    );

    // Insert feedback questions if not exists
    const feedbackQuestions = [
        ['How would you rate the mentorship session?', 'rating'],
        ['Was the mentor available when needed?', 'yes-no'],
        ['Additional comments (optional)', 'text']
    ];
    for (const [text, type] of feedbackQuestions) {
        await connection.query(
            `INSERT IGNORE INTO feedback_questions (question_text, question_type) VALUES (?, ?)`,
            [text, type]
        );
    }

    console.log('Seed data inserted.');
}

async function main() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database.');
        await runSQLFile(connection, schemaPath);
        console.log('Schema applied.');
        await seed(connection);
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Initialization failed:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

main();
