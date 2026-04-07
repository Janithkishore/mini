/**
 * HOD Controller
 * Handles HOD-exclusive operations like assignments
 */

const db = require('../database/db');

// ========== ASSIGNMENTS ==========
async function assignMentor(req, res) {
    try {
        const { mentor_id, student_id } = req.body; // mentor_id is now user_id of mentor
        console.log('Assignment request:', { mentor_id, student_id });

        if (!mentor_id || !student_id) {
            return res.status(400).json({ error: 'Mentor ID and student ID required.' });
        }

        // Check if mentor exists in mentors table, if not, create entry
        const existingMentor = await db.getAsync('SELECT mentor_id FROM mentors WHERE user_id = ?', [mentor_id]);
        console.log('Existing mentor check:', existingMentor);

        let actualMentorId;

        if (existingMentor) {
            actualMentorId = existingMentor.mentor_id;
            console.log('Using existing mentor ID:', actualMentorId);
        } else {
            // Get mentor's department from users table
            const mentorUser = await db.getAsync('SELECT department FROM users WHERE user_id = ? AND role = ?', [mentor_id, 'mentor']);
            console.log('Mentor user lookup:', mentorUser);

            if (!mentorUser) {
                return res.status(400).json({ error: 'Invalid mentor user.' });
            }

            // Create mentor entry
            const result = await db.runAsync(
                'INSERT INTO mentors (user_id, department) VALUES (?, ?)',
                [mentor_id, mentorUser.department]
            );
            actualMentorId = result.lastID;
            console.log('Created new mentor entry with ID:', actualMentorId);
        }

        // Check if student exists and is a student
        const studentUser = await db.getAsync('SELECT role FROM users WHERE user_id = ?', [student_id]);
        console.log('Student user lookup:', studentUser);

        if (!studentUser || studentUser.role !== 'student') {
            return res.status(400).json({ error: 'Invalid student.' });
        }

        // Create assignment (MySQL upsert)
        console.log('Creating assignment:', { actualMentorId, student_id });
        await db.runAsync(
            'INSERT INTO assignments (mentor_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE mentor_id = VALUES(mentor_id), student_id = VALUES(student_id)',
            [actualMentorId, student_id]
        );
        console.log('Assignment created successfully');

        res.status(201).json({ message: 'Mentor assigned successfully.' });
    } catch (err) {
        console.error('Assignment error:', err);
        if (err.message && err.message.includes('FOREIGN KEY')) {
            return res.status(400).json({ error: 'Invalid mentor or student.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Assignment failed.' });
    }
}

module.exports = { assignMentor };
