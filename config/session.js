/**
 * Session Configuration
 */

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// MySQL store configuration
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'janith@1234',
    database: process.env.DB_NAME || 'mentorship',
    clearExpired: true,
    checkExpirationInterval: 900000, // How frequently expired sessions will be cleared; milliseconds
    expiration: 86400000, // The maximum age of a valid session; milliseconds
    createDatabaseTable: true // Automatically create the sessions table
});

const sessionConfig = {
    name: 'mentorship.sid',
    secret: process.env.SESSION_SECRET || 'mentorship-feedback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
};

module.exports = sessionConfig;
