const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hodController');
const adminController = require('../controllers/adminController');
const { requireHOD } = require('../middleware/auth');

// Apply requireHOD to all
router.use(requireHOD);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users & Mentors
router.get('/users', adminController.getUsers);
router.get('/mentors', adminController.getMentors);

// Assignments (HOD exclusive)
router.post('/assignments', hodController.assignMentor);

// Questions
router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);

// Student performance
router.get('/students/search', adminController.searchStudents);
router.get('/students/:id', adminController.getStudentProfile);

// Mentor performance
router.get('/mentors/:id/profile', adminController.getMentorProfile);
router.get('/mentors/comparison', adminController.getMentorComparison);

// Reports
router.get('/reports', adminController.getReports);

module.exports = router;
