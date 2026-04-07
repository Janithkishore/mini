const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database', 'mentorship.db'));

db.all('SELECT user_id, name, email, role, department FROM users', (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Users in database:');
        console.table(rows);
    }
    db.close();
});