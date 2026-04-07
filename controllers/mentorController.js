/**
 * Mentor Controller
 */

const db = require('../database/db');

// Helper to reliably get the current mentor_id for the logged-in user,
// even if the mentors row was created after login (e.g. via HOD assignment).
async function getCurrentMentorId(req) {
    if (req.session && req.session.user) {
        if (req.session.user.mentor_id) {
            return req.session.user.mentor_id;
        }
        const userId = req.session.user.id;
        if (!userId) return null;
        const mentor = await db.getAsync('SELECT mentor_id FROM mentors WHERE user_id = ?', [userId]);
        if (mentor && mentor.mentor_id) {
            req.session.user.mentor_id = mentor.mentor_id;
            return mentor.mentor_id;
        }
    }
    return null;
}

async function getAssignedStudents(req, res) {
    try {
        const mentorId = await getCurrentMentorId(req);
        if (!mentorId) return res.json({ students: [] });

        const students = await db.allAsync(`
            SELECT u.user_id, u.name, u.email, u.register_number, u.department,
                   ROUND(AVG(100.0 * att.attended_classes / NULLIF(att.total_classes,0)),1) as avg_attendance
            FROM assignments a
            JOIN users u ON a.student_id = u.user_id
            LEFT JOIN attendance att ON att.student_id = u.user_id
            WHERE a.mentor_id = ?
            GROUP BY u.user_id
        `, [mentorId]);
        res.json({ students });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load students.' });
    }
}

async function getMyFeedback(req, res) {
    try {
        const mentorId = await getCurrentMentorId(req);
        if (!mentorId) return res.json({ feedback: [] });

        const feedback = await db.allAsync(`
            SELECT fr.response_id, fr.student_id, u.name as student_name, fq.question_text, fr.response_value, fr.comment, fr.submitted_at
            FROM feedback_responses fr
            JOIN users u ON fr.student_id = u.user_id
            JOIN feedback_questions fq ON fr.question_id = fq.question_id
            WHERE fr.mentor_id = ?
            ORDER BY fr.submitted_at DESC
        `, [mentorId]);
        res.json({ feedback });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load feedback.' });
    }
}

// ========== ATTENDANCE, GRADES, PROJECTS (Mentor CRUD) ==========
async function checkAssignment(mentorId, studentId) {
    const assignment = await db.getAsync('SELECT * FROM assignments WHERE mentor_id = ? AND student_id = ?', [mentorId, studentId]);
    return !!assignment;
}

async function addAttendance(req, res) {
    try {
        const mentorId = await getCurrentMentorId(req);
        if (!mentorId) {
            return res.status(403).json({ error: 'Mentor context not found for this user.' });
        }
        const { student_id, subject_code, total_classes, attended_classes, semester, academic_year } = req.body;
        console.log('[addAttendance] mentorId:', mentorId, 'body:', req.body);
        if (!student_id || !subject_code || total_classes == null || attended_classes == null) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        const assigned = await checkAssignment(mentorId, student_id);
        console.log('[addAttendance] assignment check:', assigned);
        if (!assigned) return res.status(403).json({ error: 'Student not assigned to you.' });

        await db.runAsync(
            `INSERT INTO attendance (student_id, subject_code, total_classes, attended_classes, semester, academic_year)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE total_classes = VALUES(total_classes), attended_classes = VALUES(attended_classes), semester = VALUES(semester), academic_year = VALUES(academic_year)`,
            [student_id, subject_code, total_classes, attended_classes, semester || null, academic_year || null]
        );
        res.status(201).json({ message: 'Attendance recorded.' });
    } catch (err) {
        console.error('[addAttendance] error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to add attendance.' });
    }
}

async function addGrade(req, res) {
    try {
        const mentorId = await getCurrentMentorId(req);
        if (!mentorId) {
            return res.status(403).json({ error: 'Mentor context not found for this user.' });
        }
        const { student_id, subject_code, subject_name, marks_obtained, max_marks, grade, semester, academic_year } = req.body;
        console.log('[addGrade] mentorId:', mentorId, 'body:', req.body);
        if (!student_id || !subject_code || marks_obtained == null) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        const mo = parseFloat(marks_obtained);
        if (mo < 0 || mo > 100) {
            return res.status(400).json({ error: 'Marks obtained must be between 0 and 100.' });
        }
        const assigned = await checkAssignment(mentorId, student_id);
        console.log('[addGrade] assignment check:', assigned);
        if (!assigned) return res.status(403).json({ error: 'Student not assigned to you.' });

        await db.runAsync(`
            INSERT INTO grades (student_id, subject_code, subject_name, marks_obtained, max_marks, grade, semester, academic_year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [student_id, subject_code, subject_name || null, mo, max_marks || 100, grade || null, semester || null, academic_year || null]);
        res.status(201).json({ message: 'Grade added.' });
    } catch (err) {
        console.error('[addGrade] error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to add grade.' });
    }
}

async function addProject(req, res) {
    try {
        const mentorId = await getCurrentMentorId(req);
        if (!mentorId) {
            return res.status(403).json({ error: 'Mentor context not found for this user.' });
        }
        const { student_id, project_title, project_description, marks_obtained, max_marks, semester, status } = req.body;
        console.log('[addProject] mentorId:', mentorId, 'body:', req.body);
        if (!student_id || !project_title) {
            return res.status(400).json({ error: 'Student ID and project title required.' });
        }
        const assigned = await checkAssignment(mentorId, student_id);
        console.log('[addProject] assignment check:', assigned);
        if (!assigned) return res.status(403).json({ error: 'Student not assigned to you.' });

        const safeStatus = (status === 'completed') ? 'completed' : 'ongoing';
        await db.runAsync(`
            INSERT INTO projects (student_id, project_title, project_description, marks_obtained, max_marks, semester, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [student_id, project_title, project_description || null, marks_obtained || null, max_marks || 100, semester || null, safeStatus]);
        res.status(201).json({ message: 'Project added.' });
    } catch (err) {
        console.error('[addProject] error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to add project.' });
    }
}

module.exports = { getAssignedStudents, getMyFeedback, addAttendance, addGrade, addProject };
