const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

router.get('/students', requireRole('mentor'), mentorController.getAssignedStudents);
router.get('/students/:id', requireRole('mentor'), adminController.getStudentProfile);
router.get('/feedback', requireRole('mentor'), mentorController.getMyFeedback);

router.post('/attendance', requireRole('mentor'), mentorController.addAttendance);
router.post('/grades', requireRole('mentor'), mentorController.addGrade);
router.post('/projects', requireRole('mentor'), mentorController.addProject);

module.exports = router;
