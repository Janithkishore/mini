-- ============================================================
-- Mentorship Feedback & Academic Monitoring System
-- Complete SQL Schema
-- ============================================================


-- ========== USERS TABLE ========== 
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student', 'mentor', 'hod') NOT NULL,
    department VARCHAR(255),
    register_number VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========== MENTORS TABLE ========== 
CREATE TABLE IF NOT EXISTS mentors (
    mentor_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(255) NOT NULL,
    experience_years INT,
    specialization VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ========== ASSIGNMENTS (Mentor-Student mapping) ========== 
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    mentor_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mentor_id, student_id),
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ========== FEEDBACK QUESTIONS ========== 
CREATE TABLE IF NOT EXISTS feedback_questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    question_text VARCHAR(255) NOT NULL UNIQUE,
    question_type ENUM('rating', 'text', 'yes-no') NOT NULL,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== FEEDBACK RESPONSES (references mentor_id) ========== 
CREATE TABLE IF NOT EXISTS feedback_responses (
    response_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    mentor_id INT NOT NULL,
    question_id INT NOT NULL,
    response_value VARCHAR(255) NOT NULL,
    comment TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, mentor_id, question_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES feedback_questions(question_id) ON DELETE CASCADE
);


-- ========== ATTENDANCE ========== 
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_code VARCHAR(255) NOT NULL,
    total_classes INT NOT NULL,
    attended_classes INT NOT NULL,
    semester VARCHAR(255),
    academic_year VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(student_id, subject_code, semester, academic_year)
);

-- ========== GRADES / SUBJECT MARKS ========== 
CREATE TABLE IF NOT EXISTS grades (
    grade_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_code VARCHAR(255) NOT NULL,
    subject_name VARCHAR(255),
    marks_obtained FLOAT NOT NULL,
    max_marks FLOAT DEFAULT 100,
    grade VARCHAR(10),
    semester VARCHAR(255),
    academic_year VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ========== PROJECTS ========== 
CREATE TABLE IF NOT EXISTS projects (
    project_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    project_description TEXT,
    marks_obtained FLOAT,
    max_marks FLOAT DEFAULT 100,
    semester VARCHAR(255),
    status ENUM('ongoing', 'completed') DEFAULT 'ongoing',
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ========== INDEXES ========== 
CREATE INDEX idx_feedback_mentor ON feedback_responses(mentor_id);
CREATE INDEX idx_feedback_student ON feedback_responses(student_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_assignments_mentor ON assignments(mentor_id);
CREATE INDEX idx_assignments_student ON assignments(student_id);
