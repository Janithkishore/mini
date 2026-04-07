const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database', 'mentorship.db'));

db.all('SELECT user_id, name, role FROM users WHERE role IN ("student", "mentor")', (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Users with student/mentor roles:');
        console.table(rows);
    }
    db.close();
});