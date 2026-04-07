const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin, requireHOD } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', requireAdmin, adminController.getDashboardStats);

// Users & Mentors
router.get('/users', requireAdmin, adminController.getUsers);
router.get('/mentors', requireAdmin, adminController.getMentors);
router.post('/mentors', requireAdmin, adminController.createMentor);
router.put('/mentors/:id', requireAdmin, adminController.updateMentor);
router.delete('/mentors/:id', requireAdmin, adminController.deleteMentor);

// Assignments
router.get('/assignments', requireAdmin, adminController.getAssignments);

// Questions
router.get('/questions', requireAdmin, adminController.getQuestions);
router.post('/questions', requireAdmin, adminController.createQuestion);

// Student performance
router.get('/students/search', requireAdmin, adminController.searchStudents);
router.get('/students/:id', requireAdmin, adminController.getStudentProfile);

// Mentor performance
router.get('/mentors/:id/profile', requireAdmin, adminController.getMentorProfile);
router.get('/mentors/comparison', requireAdmin, adminController.getMentorComparison);

// Attendance, Grades, Projects are now handled by Mentors

// Reports
router.get('/reports', requireAdmin, adminController.getReports);

module.exports = router;
