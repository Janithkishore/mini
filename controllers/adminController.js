/**
 * Admin Controller
 * Student & Mentor performance monitoring, analytics, reports
 */

const db = require('../database/db');
const bcrypt = require('bcryptjs');

// ========== DASHBOARD STATS ==========
async function getDashboardStats(req, res) {
    try {
        const [totalStudents] = await db.allAsync('SELECT COUNT(*) as cnt FROM users WHERE role = "student"');
        const [totalMentors] = await db.allAsync('SELECT COUNT(*) as cnt FROM mentors');
        const avgPerf = await db.getAsync(`
            SELECT AVG(avg_marks) as avg_performance FROM (
                SELECT student_id, AVG(marks_obtained * 100.0 / NULLIF(max_marks, 0)) as avg_marks
                FROM grades GROUP BY student_id
            )
        `);
        const avgRating = await db.getAsync(`
            SELECT AVG(CAST(response_value AS REAL)) as avg_rating
            FROM feedback_responses fr
            JOIN feedback_questions fq ON fr.question_id = fq.question_id
            WHERE fq.question_type = 'rating' AND CAST(fr.response_value AS REAL) BETWEEN 1 AND 5
        `);
        const lowAttendance = await db.allAsync(`
            SELECT u.user_id, u.name, u.register_number, a.subject_code,
                   ROUND(100.0 * a.attended_classes / NULLIF(a.total_classes, 0), 1) as pct
            FROM attendance a
            JOIN users u ON a.student_id = u.user_id
            WHERE 100.0 * a.attended_classes / NULLIF(a.total_classes, 0) < 75
        `);
        const topMentors = await db.allAsync(`
            SELECT m.mentor_id, u.name, m.department,
                   ROUND(AVG(CAST(fr.response_value AS REAL)), 2) as avg_rating,
                   COUNT(*) as feedback_count
            FROM mentors m
            JOIN users u ON m.user_id = u.user_id
            LEFT JOIN feedback_responses fr ON m.mentor_id = fr.mentor_id
            LEFT JOIN feedback_questions fq ON fr.question_id = fq.question_id AND fq.question_type = 'rating'
            WHERE CAST(fr.response_value AS REAL) BETWEEN 1 AND 5
            GROUP BY m.mentor_id
            ORDER BY avg_rating DESC
            LIMIT 5
        `);

        res.json({
            total_students: totalStudents?.cnt || 0,
            total_mentors: totalMentors?.cnt || 0,
            avg_student_performance: avgPerf?.avg_performance ? Math.round(avgPerf.avg_performance) : 0,
            avg_mentor_rating: avgRating?.avg_rating ? Math.round(avgRating.avg_rating * 10) / 10 : 0,
            low_attendance_students: lowAttendance,
            top_mentors: topMentors
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load dashboard.' });
    }
}

// ========== USERS MANAGEMENT ==========
async function getUsers(req, res) {
    try {
        const users = await db.allAsync(
            'SELECT user_id, name, email, role, department, register_number FROM users'
        );
        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load users.' });
    }
}

// ========== MENTORS ==========
async function getMentors(req, res) {
    try {
        // Get mentors based on role, and join with mentors table for additional info if available
        const mentors = await db.allAsync(`
            SELECT u.user_id, u.name, u.email, u.department, u.register_number,
                   m.mentor_id, m.experience_years, m.specialization
            FROM users u
            LEFT JOIN mentors m ON u.user_id = m.user_id
            WHERE u.role = 'mentor'
        `);
        res.json({ mentors });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load mentors.' });
    }
}

async function createMentor(req, res) {
    try {
        const { name, email, password, department, register_number, experience_years, specialization } = req.body;
        if (!name || !email || !password || !department) {
            return res.status(400).json({ error: 'Name, email, password, and department are required.' });
        }
        // Check if email or register_number already exists
        const existing = await db.getAsync('SELECT user_id FROM users WHERE email = ? OR register_number = ?', [email, register_number]);
        if (existing) {
            return res.status(400).json({ error: 'Email or register number already exists.' });
        }
        // Insert user
        const userResult = await db.runAsync(
            'INSERT INTO users (name, email, password, role, department, register_number) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, await bcrypt.hash(password, 10), 'mentor', department, register_number]
        );
        const userId = userResult.lastID;
        // Insert mentor
        await db.runAsync(
            'INSERT INTO mentors (user_id, department, experience_years, specialization) VALUES (?, ?, ?, ?)',
            [userId, department, experience_years || 0, specialization || '']
        );
        res.status(201).json({ message: 'Mentor created successfully.', mentor_id: userResult.lastID });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create mentor.' });
    }
}

async function updateMentor(req, res) {
    try {
        const { id } = req.params;
        const { name, email, department, register_number, experience_years, specialization } = req.body;
        // Get mentor
        const mentor = await db.getAsync('SELECT m.mentor_id, u.user_id FROM mentors m JOIN users u ON m.user_id = u.user_id WHERE m.mentor_id = ?', [id]);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
        // Update user
        await db.runAsync(
            'UPDATE users SET name = ?, email = ?, department = ?, register_number = ? WHERE user_id = ?',
            [name, email, department, register_number, mentor.user_id]
        );
        // Update mentor
        await db.runAsync(
            'UPDATE mentors SET department = ?, experience_years = ?, specialization = ? WHERE mentor_id = ?',
            [department, experience_years || 0, specialization || '', id]
        );
        res.json({ message: 'Mentor updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update mentor.' });
    }
}

async function deleteMentor(req, res) {
    try {
        const { id } = req.params;
        // Get mentor
        const mentor = await db.getAsync('SELECT user_id FROM mentors WHERE mentor_id = ?', [id]);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
        // Delete mentor (CASCADE will handle if needed, but since assignments reference mentor_id, they will be deleted)
        await db.runAsync('DELETE FROM mentors WHERE mentor_id = ?', [id]);
        // Update user role to null or something
        await db.runAsync('UPDATE users SET role = NULL WHERE user_id = ?', [mentor.user_id]);
        res.json({ message: 'Mentor deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete mentor.' });
    }
}

// ========== ASSIGNMENTS ==========
async function getAssignments(req, res) {
    try {
        const assignments = await db.allAsync(`
            SELECT 
                a.assignment_id,
                a.assigned_at,
                m.mentor_id,
                u_mentor.name as mentor_name,
                u_mentor.department as mentor_department,
                u_student.user_id as student_id,
                u_student.name as student_name,
                u_student.register_number
            FROM assignments a
            JOIN mentors m ON a.mentor_id = m.mentor_id
            JOIN users u_mentor ON m.user_id = u_mentor.user_id
            JOIN users u_student ON a.student_id = u_student.user_id
            ORDER BY u_mentor.name, u_student.name
        `);
        res.json({ assignments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load assignments.' });
    }
}

// ========== QUESTIONS ==========
async function getQuestions(req, res) {
    try {
        const questions = await db.allAsync('SELECT * FROM feedback_questions');
        res.json({ questions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load questions.' });
    }
}

async function createQuestion(req, res) {
    try {
        const { question_text, question_type } = req.body;
        if (!question_text || !question_type) {
            return res.status(400).json({ error: 'Question text and type required.' });
        }
        const r = await db.runAsync(
            'INSERT INTO feedback_questions (question_text, question_type) VALUES (?, ?)',
            [question_text, question_type]
        );
        res.status(201).json({ message: 'Question created.', id: r.lastID });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create question.' });
    }
}

// ========== STUDENT PERFORMANCE ==========
async function searchStudents(req, res) {
    try {
        const { q } = req.query;
        let sql = 'SELECT user_id, name, email, register_number, department FROM users WHERE role = "student"';
        const params = [];
        if (q) {
            sql += ' AND (name LIKE ? OR register_number LIKE ? OR email LIKE ?)';
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        const students = await db.allAsync(sql, params);
        res.json({ students });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed.' });
    }
}

async function getStudentProfile(req, res) {
    try {
        const { id } = req.params;
        const student = await db.getAsync(
            'SELECT user_id, name, email, register_number, department FROM users WHERE user_id = ? AND role = "student"',
            [id]
        );
        if (!student) return res.status(404).json({ error: 'Student not found.' });

        const attendance = await db.allAsync(
            'SELECT subject_code, total_classes, attended_classes, ROUND(100.0*attended_classes/NULLIF(total_classes,0),1) as pct FROM attendance WHERE student_id = ?',
            [id]
        );
        const grades = await db.allAsync(
            'SELECT subject_code, subject_name, marks_obtained, max_marks, grade, semester FROM grades WHERE student_id = ?',
            [id]
        );
        const projects = await db.allAsync(
            'SELECT project_title, project_description, marks_obtained, max_marks, status, semester FROM projects WHERE student_id = ?',
            [id]
        );

        let overallAvg = 0;
        let cgpa = 0;
        if (grades.length) {
            const validGrades = grades.filter(g => g.max_marks > 0);
            overallAvg = validGrades.length
                ? validGrades.reduce((s, g) => s + (g.marks_obtained / g.max_marks) * 100, 0) / validGrades.length
                : 0;
            cgpa = overallAvg / 10; // simplified CGPA
        }

        const avgAttendance = attendance.length
            ? attendance.reduce((s, a) => s + (a.pct || 0), 0) / attendance.length
            : null;

        const attendanceAlert = avgAttendance !== null && avgAttendance < 75;

        res.json({
            student,
            attendance,
            grades,
            projects,
            overall_performance: Math.round(overallAvg * 10) / 10,
            cgpa: Math.round(cgpa * 100) / 100,
            avg_attendance: avgAttendance ? Math.round(avgAttendance * 10) / 10 : null,
            attendance_alert: attendanceAlert
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load profile.' });
    }
}

// ========== MENTOR PERFORMANCE ==========
async function getMentorProfile(req, res) {
    try {
        const { id } = req.params;
        const mentor = await db.getAsync(`
            SELECT m.mentor_id, m.user_id, u.name, u.email, m.department, m.experience_years, m.specialization
            FROM mentors m JOIN users u ON m.user_id = u.user_id WHERE m.mentor_id = ?
        `, [id]);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });

        const [studentCount] = await db.allAsync(
            'SELECT COUNT(*) as cnt FROM assignments WHERE mentor_id = ?',
            [id]
        );
        const avgRating = await db.getAsync(`
            SELECT ROUND(AVG(CAST(fr.response_value AS REAL)), 2) as avg_rating
            FROM feedback_responses fr
            JOIN feedback_questions fq ON fr.question_id = fq.question_id
            WHERE fr.mentor_id = ? AND fq.question_type = 'rating' AND CAST(fr.response_value AS REAL) BETWEEN 1 AND 5
        `, [id]);
        const trends = await db.allAsync(`
            SELECT DATE(submitted_at) as date, ROUND(AVG(CAST(response_value AS REAL)), 2) as avg_rating
            FROM feedback_responses fr
            JOIN feedback_questions fq ON fr.question_id = fq.question_id
            WHERE fr.mentor_id = ? AND fq.question_type = 'rating'
            GROUP BY DATE(submitted_at)
            ORDER BY date
        `, [id]);
        const deptPerformance = await db.allAsync(`
            SELECT m.department, ROUND(AVG(CAST(fr.response_value AS REAL)), 2) as avg_rating
            FROM feedback_responses fr
            JOIN mentors m ON fr.mentor_id = m.mentor_id
            JOIN feedback_questions fq ON fr.question_id = fq.question_id
            WHERE fq.question_type = 'rating'
            GROUP BY m.department
        `);

        res.json({
            mentor,
            total_students_assigned: studentCount?.cnt || 0,
            average_rating: avgRating?.avg_rating || null,
            feedback_trends: trends,
            department_performance: deptPerformance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load mentor profile.' });
    }
}

async function getMentorComparison(req, res) {
    try {
        const rows = await db.allAsync(`
            SELECT m.mentor_id, u.name, m.department,
                   ROUND(AVG(CAST(fr.response_value AS REAL)), 2) as avg_rating,
                   COUNT(*) as response_count
            FROM mentors m
            JOIN users u ON m.user_id = u.user_id
            LEFT JOIN feedback_responses fr ON m.mentor_id = fr.mentor_id
            LEFT JOIN feedback_questions fq ON fr.question_id = fq.question_id AND fq.question_type = 'rating'
            WHERE CAST(fr.response_value AS REAL) BETWEEN 1 AND 5 OR fr.response_id IS NULL
            GROUP BY m.mentor_id
        `);
        res.json({ mentors: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load comparison.' });
    }
}

// ========== REPORTS ==========
async function getReports(req, res) {
    try {
        const reports = await db.allAsync(`
            SELECT fr.response_id, fr.submitted_at, u_s.user_id as student_id, u_s.name as student_name, 
                   m.mentor_id, u_m.name as mentor_name, m.department as mentor_department,
                   fq.question_type, fq.question_text, fr.response_value, fr.comment
            FROM feedback_responses fr
            JOIN users u_s ON fr.student_id = u_s.user_id
            JOIN mentors m ON fr.mentor_id = m.mentor_id
            JOIN users u_m ON m.user_id = u_m.user_id
            JOIN feedback_questions fq ON fr.question_id = fq.question_id
            ORDER BY fr.submitted_at DESC
        `);
        res.json({ reports });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load reports.' });
    }
}

module.exports = {
    getDashboardStats,
    getUsers,
    getMentors,
    createMentor,
    updateMentor,
    deleteMentor,
    getAssignments,
    getQuestions,
    createQuestion,
    searchStudents,
    getStudentProfile,
    getMentorProfile,
    getMentorComparison,
    getReports
};
