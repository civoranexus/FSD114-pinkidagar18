import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [chartPeriod, setChartPeriod] = useState('week');
  const [editingCourse, setEditingCourse] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEarning: 0,
    completionRate: 85.5,
    activeStudents: 0,
    newEnrollments: 0
  });

  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
    courseId: ''
  });
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    courseId: '',
    type: 'announcement',
    priority: 'normal'
  });

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'Beginner',
    price: 0,
    isPaid: false,
    thumbnail: '',
    modules: []
  });

  // Fetch Data
  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-profile')) setShowUserMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      const [coursesRes, statsRes, assignmentsRes] = await Promise.all([
        api.get('/courses/my-courses'),
        api.get('/teacher/stats'),
        api.get('/teacher/assignments')
      ]);

      setCourses(coursesRes.data?.data || []);
      setStats(statsRes.data?.data || {
        totalCourses: 0,
        totalStudents: 0,
        totalEarning: 0,
        completionRate: 0,
        newEnrollments: 0
      });
      setAssignments(assignmentsRes.data?.data || []);

      // Process students list from courses
      const teacherCourses = coursesRes.data?.data || [];
      const allStudents = [];
      const studentIds = new Set();

      teacherCourses.forEach(course => {
        course.enrolledStudents?.forEach(student => {
          if (!studentIds.has(student._id)) {
            studentIds.add(student._id);
            allStudents.push({
              ...student,
              courseTitle: course.title
            });
          }
        });
      });
      setStudents(allStudents);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/courses', newCourse);
      toast.success('✅ Course created successfully!');
      setShowModal(false);
      resetForm();
      await fetchTeacherData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/courses/${editingCourse._id}`, editingCourse);
      toast.success('✅ Course updated successfully!');
      setShowEditModal(false);
      setEditingCourse(null);
      await fetchTeacherData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`Delete "${courseName}"? This action cannot be undone!`)) return;

    try {
      setLoading(true);
      await api.delete(`/courses/${courseId}`);
      toast.success('🗑️ Course deleted successfully');
      await fetchTeacherData();
    } catch (error) {
      toast.error('Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (course) => {
    setEditingCourse({ ...course });
    setShowEditModal(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedAssignment) {
        await api.put(`/assignments/${selectedAssignment._id}`, assignmentFormData);
        toast.success('Assignment updated!');
      } else {
        await api.post('/assignments', assignmentFormData);
        toast.success('Assignment created!');
      }
      setShowAssignmentModal(false);
      setSelectedAssignment(null);
      await fetchTeacherData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      await fetchTeacherData();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/teacher/announcements', announcementData);
      toast.success('📣 Announcement sent successfully!');
      setAnnouncementData({
        title: '',
        message: '',
        courseId: '',
        type: 'announcement',
        priority: 'normal'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewCourse({
      title: '',
      description: '',
      category: 'Programming',
      level: 'Beginner',
      price: 0,
      isPaid: false,
      thumbnail: '',
      modules: []
    });
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleViewSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(data?.data || []);
      const assignment = assignments.find(a => a._id === assignmentId);
      setSelectedAssignment(assignment);
      setShowSubmissionsModal(true);
    } catch (error) {
      console.error('Submissions error:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (studentId, marks, feedback) => {
    try {
      await api.post(`/assignments/${selectedAssignment._id}/grade`, {
        studentId,
        marks,
        feedback
      });
      toast.success('Graded successfully!');
      handleViewSubmissions(selectedAssignment._id);
    } catch (error) {
      toast.error('Failed to grade submission');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getChartData = () => {
    const periods = {
      week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      year: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };

    return periods[chartPeriod].map((label, i) => ({
      name: label,
      students: Math.floor(Math.random() * 100) + 20,
      revenue: Math.floor(Math.random() * 5000) + 1000
    }));
  };

  const recentActivities = [
    { icon: '👤', text: 'New student enrolled in React Course', time: '5 min ago', type: 'success' },
    { icon: '📝', text: 'Assignment submitted by Sarah', time: '12 min ago', type: 'info' },
    { icon: '⭐', text: 'New 5-star review received', time: '1 hour ago', type: 'success' },
    { icon: '💬', text: 'New question in Python course', time: '2 hours ago', type: 'warning' }
  ];

  if (loading && courses.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">EduVillage</div>
          <div className="logo-subtitle">Teacher Portal</div>
        </Link>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div
            className={`nav-item ${activeSection === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveSection('courses')}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">My Courses</span>
            {stats.totalCourses > 0 && (
              <span className="nav-badge">{stats.totalCourses}</span>
            )}
          </div>
          <div
            className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Students</span>
          </div>
          <div
            className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </div>
          <div
            className={`nav-item ${activeSection === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveSection('assignments')}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Assignments</span>
          </div>
          <div
            className={`nav-item ${activeSection === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveSection('grades')}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Grades</span>
          </div>
          <div
            className={`nav-item ${activeSection === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveSection('announcements')}
          >
            <span className="nav-icon">📢</span>
            <span className="nav-text">Announcements</span>
          </div>
          <div
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </div>
          <hr className="sidebar-divider" />
          <Link to="/student/dashboard" className="nav-item">
            <span className="nav-icon">👁️</span>
            <span className="nav-text">Student View</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Top Header */}
          <div className="top-header">
            <div className="header-left">
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                ☰
              </button>
              <div>
                <h1 className="page-title">
                  Welcome back, <span className="user-name">{user?.name || 'Teacher'}!</span>
                </h1>
                <p className="page-subtitle">Manage your courses and students</p>
              </div>
            </div>

            <div className="header-right">
              <button className="create-course-btn" onClick={() => setShowModal(true)}>
                <span>➕</span>
                <span>Create Course</span>
              </button>

              <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'T'}
                </div>
                <span className="user-name-text">{user?.name || 'Teacher'}</span>
                <span className="dropdown-icon">▼</span>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <a href="/profile">Profile Settings</a>
                    <hr />
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard View */}
          {activeSection === 'dashboard' && (
            <>
              {/* Stats Row */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    📚
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.totalCourses}</h3>
                    <p className="stat-label">Total Courses</p>
                    <div className="stat-trend positive">
                      <span>↗</span>
                      <span>+12% from last month</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4FD1C5, #38B2AC)' }}>
                    👥
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.totalStudents}</h3>
                    <p className="stat-label">Total Students</p>
                    <div className="stat-trend positive">
                      <span>↗</span>
                      <span>+{stats.newEnrollments} this week</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    💰
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">₹{(stats.totalEarning / 1000).toFixed(1)}k</h3>
                    <p className="stat-label">Total Revenue</p>
                    <div className="stat-trend positive">
                      <span>↗</span>
                      <span>+8.3% this month</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                    📊
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.completionRate}%</h3>
                    <p className="stat-label">Completion Rate</p>
                    <div className="stat-trend positive">
                      <span>↗</span>
                      <span>Above average</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="dashboard-grid">
                <div className="chart-card">
                  <div className="chart-header">
                    <div>
                      <h2 className="section-title">Student Enrollment Trends</h2>
                      <p className="chart-subtitle">Last 7 days activity</p>
                    </div>
                    <select
                      className="chart-period-selector"
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                    >
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getChartData()}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="students" stroke="#1E3A8A" fillOpacity={1} fill="url(#colorStudents)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-header">
                    <div>
                      <h2 className="section-title">Revenue Overview</h2>
                      <p className="chart-subtitle">Track your earnings</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="activity-section">
                <h2 className="section-title">📋 Recent Activity</h2>
                <div className="activity-list">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className={`activity-item ${activity.type}`}>
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-content">
                        <p className="activity-text">{activity.text}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Courses View */}
          {activeSection === 'courses' && (
            <div className="courses-section">
              <h2 className="section-title">📚 My Courses</h2>

              <div className="courses-grid">
                {courses.length > 0 ? (
                  courses.map((course, index) => (
                    <div key={course._id} className="course-card">
                      <div className="course-image">
                        <img
                          src={course.thumbnail || `https://source.unsplash.com/400x250/?${course.category},education`}
                          alt={course.title}
                        />
                        <div className="students-badge">
                          👥 {course.enrolledStudents?.length || 0} students
                        </div>
                      </div>
                      <div className="course-body">
                        <div className="course-meta">
                          <span className="category-tag">{course.category}</span>
                          <span className="level-tag">{course.level}</span>
                        </div>
                        <h3 className="course-title">{course.title}</h3>
                        <p className="course-desc">{course.description?.substring(0, 80)}...</p>
                        <div className="course-footer">
                          <button onClick={() => handleViewCourse(course._id)} className="view-btn">
                            👁️ View
                          </button>
                          <button onClick={() => openEditModal(course)} className="edit-btn">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDeleteCourse(course._id, course.title)} className="delete-btn">
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No Courses Yet</h3>
                    <p>Create your first course to get started</p>
                    <button onClick={() => setShowModal(true)} className="create-course-btn">
                      Create Course
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students View */}
          {activeSection === 'students' && (
            <div className="students-section">
              <div className="section-header">
                <h2>Enrolled Students</h2>
                <div className="search-bar">
                  <input type="text" placeholder="Search students..." />
                </div>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Primary Course</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student._id}>
                        <td>
                          <div className="student-info">
                            <img src={student.profilePicture || 'default-avatar.png'} alt="" />
                            <span>{student.name}</span>
                          </div>
                        </td>
                        <td>{student.email}</td>
                        <td>{student.courseTitle}</td>
                        <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn-sm">Message</button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="5" className="empty-table-row">No students enrolled yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics View */}
          {activeSection === 'analytics' && (
            <div className="analytics-section">
              <div className="section-header">
                <h2>Teaching Analytics</h2>
                <div className="stats-grid-mini">
                  <div className="stat-pill">
                    <span className="pill-label">Completion Rate:</span>
                    <span className="pill-value">{stats.completionRate}%</span>
                  </div>
                  <div className="stat-pill">
                    <span className="pill-label">Total Earnings:</span>
                    <span className="pill-value">₹{stats.totalEarning?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="analytics-charts">
                <div className="chart-card large">
                  <h3>Engagement Overview</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="students" stroke="#1E3A8A" fill="#1E3A8A33" />
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B98133" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Assignments View */}
          {activeSection === 'assignments' && (
            <div className="assignments-section">
              <div className="section-header">
                <h2>Assignments Management</h2>
                <button
                  className="create-btn"
                  onClick={() => {
                    setSelectedAssignment(null);
                    setAssignmentFormData({ title: '', description: '', dueDate: '', maxMarks: 100, courseId: courses[0]?._id });
                    setShowAssignmentModal(true);
                  }}
                >
                  Create New Assignment
                </button>
              </div>
              <div className="assignment-grid">
                {assignments.map(assignment => (
                  <div key={assignment._id} className="assignment-card">
                    <div className="card-header">
                      <h3>{assignment.title}</h3>
                      <span className={`status-badge ${new Date(assignment.dueDate) < new Date() ? 'expired' : 'active'}`}>
                        {new Date(assignment.dueDate) < new Date() ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    <div className="card-course-tag">
                      <span>📚 {assignment.course?.title}</span>
                    </div>
                    <p>{assignment.description.substring(0, 100)}...</p>
                    <div className="card-meta">
                      <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span>🎯 Max: {assignment.maxMarks}</span>
                    </div>
                    <div className="card-actions">
                      <button className="view-btn" onClick={() => handleViewSubmissions(assignment._id)}>View Submissions</button>
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setAssignmentFormData({
                            title: assignment.title,
                            description: assignment.description,
                            dueDate: assignment.dueDate.split('T')[0],
                            maxMarks: assignment.maxMarks,
                            courseId: assignment.course?._id || assignment.course
                          });
                          setShowAssignmentModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteAssignment(assignment._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grades View */}
          {activeSection === 'grades' && (
            <div className="placeholder-section">
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h2>Grades & Evaluation</h2>
                <p>Grade assignments and track student performance</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  This section is under development
                </p>
              </div>
            </div>
          )}

          {/* Announcements View */}
          {activeSection === 'announcements' && (
            <div className="announcements-section">
              <div className="announcement-composer">
                <h2>Compose Announcement</h2>
                <p className="composer-subtitle">Send notifications to your students</p>
                <form onSubmit={handleSendAnnouncement} className="composer-form">
                  <div className="form-group">
                    <label>Target Course</label>
                    <select
                      value={announcementData.courseId}
                      onChange={e => setAnnouncementData({ ...announcementData, courseId: e.target.value })}
                    >
                      <option value="">All My Students</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Important Update Regarding Exam"
                      value={announcementData.title}
                      onChange={e => setAnnouncementData({ ...announcementData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      placeholder="Write your announcement here..."
                      rows={6}
                      value={announcementData.message}
                      onChange={e => setAnnouncementData({ ...announcementData, message: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={announcementData.type}
                        onChange={e => setAnnouncementData({ ...announcementData, type: e.target.value })}
                      >
                        <option value="announcement">Announcement</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={announcementData.priority}
                        onChange={e => setAnnouncementData({ ...announcementData, priority: e.target.value })}
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="send-btn" disabled={loading}>
                    {loading ? 'Sending...' : '📢 Send Announcement'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeSection === 'settings' && (
            <div className="placeholder-section">
              <div className="empty-state">
                <div className="empty-icon">⚙️</div>
                <h2>Settings</h2>
                <p>Manage your account and preferences</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  This section is under development
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="modal-backdrop" onClick={() => setShowSubmissionsModal(false)}>
          <div className="modal-content submissions-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submissions: {selectedAssignment?.title}</h2>
              <button className="close-btn" onClick={() => setShowSubmissionsModal(false)}>&times;</button>
            </div>
            <div className="submissions-list">
              {submissions.length === 0 && <p className="empty-msg">No submissions yet.</p>}
              {submissions.map(submission => (
                <div key={submission._id} className="submission-row">
                  <div className="student-info">
                    <img src={submission.student.profilePicture || 'default-avatar.png'} alt="" />
                    <div>
                      <p className="student-name">{submission.student.name}</p>
                      <p className="submission-date">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="submission-content">
                    <a href={submission.content} target="_blank" rel="noreferrer" className="view-file-btn">View Content</a>
                  </div>
                  <div className="grade-section">
                    {submission.status === 'graded' ? (
                      <div className="graded-info">
                        <span className="grade-badge">Grade: {submission.grade.marks}/{selectedAssignment.maxMarks}</span>
                      </div>
                    ) : (
                      <div className="grade-input-group">
                        <input type="number" placeholder="Marks" id={`marks-${submission._id}`} />
                        <button
                          className="grade-btn"
                          onClick={() => {
                            const marks = document.getElementById(`marks-${submission._id}`).value;
                            handleGradeSubmission(submission.student._id, marks, 'Well done!');
                          }}
                        >
                          Grade
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Course Modal */}
      {(showModal || showEditModal) && (
        <div className="modal-backdrop" onClick={() => {
          setShowModal(false);
          setShowEditModal(false);
          setEditingCourse(null);
          resetForm();
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Course' : 'Create New Course'}</h2>
              <button className="close-btn" onClick={() => {
                setShowModal(false);
                setShowEditModal(false);
                setEditingCourse(null);
                resetForm();
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={showEditModal ? handleEditCourse : handleCreateCourse}>
                <div className="form-group">
                  <label>Course Title</label>
                  <input
                    type="text"
                    value={showEditModal ? editingCourse?.title : newCourse.title}
                    onChange={(e) => showEditModal ?
                      setEditingCourse({ ...editingCourse, title: e.target.value }) :
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    placeholder="Enter course title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={showEditModal ? editingCourse?.description : newCourse.description}
                    onChange={(e) => showEditModal ?
                      setEditingCourse({ ...editingCourse, description: e.target.value }) :
                      setNewCourse({ ...newCourse, description: e.target.value })
                    }
                    placeholder="Enter course description"
                    rows={4}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={showEditModal ? editingCourse?.category : newCourse.category}
                      onChange={(e) => showEditModal ?
                        setEditingCourse({ ...editingCourse, category: e.target.value }) :
                        setNewCourse({ ...newCourse, category: e.target.value })
                      }
                    >
                      <option>Programming</option>
                      <option>Design</option>
                      <option>Business</option>
                      <option>Marketing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Level</label>
                    <select
                      value={showEditModal ? editingCourse?.level : newCourse.level}
                      onChange={(e) => showEditModal ?
                        setEditingCourse({ ...editingCourse, level: e.target.value }) :
                        setNewCourse({ ...newCourse, level: e.target.value })
                      }
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={showEditModal ? editingCourse?.price : newCourse.price}
                    onChange={(e) => showEditModal ?
                      setEditingCourse({ ...editingCourse, price: parseFloat(e.target.value) }) :
                      setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })
                    }
                    min="0"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowModal(false);
                    setShowEditModal(false);
                    setEditingCourse(null);
                    resetForm();
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : (showEditModal ? 'Update Course' : 'Create Course')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-backdrop" onClick={() => {
          setShowAssignmentModal(false);
          setSelectedAssignment(null);
        }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAssignment ? 'Edit Assignment' : 'Create New Assignment'}</h2>
              <button className="close-btn" onClick={() => {
                setShowAssignmentModal(false);
                setSelectedAssignment(null);
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAssignmentSubmit}>
                <div className="form-group">
                  <label>Assign to Course</label>
                  <select
                    value={assignmentFormData.courseId}
                    onChange={e => setAssignmentFormData({ ...assignmentFormData, courseId: e.target.value })}
                    required
                    disabled={!!selectedAssignment}
                  >
                    <option value="">Select a course</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignment Title</label>
                  <input
                    type="text"
                    value={assignmentFormData.title}
                    onChange={e => setAssignmentFormData({ ...assignmentFormData, title: e.target.value })}
                    placeholder="e.g., Final Project Proposal"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={assignmentFormData.description}
                    onChange={e => setAssignmentFormData({ ...assignmentFormData, description: e.target.value })}
                    placeholder="Provide detailed instructions..."
                    rows={4}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={assignmentFormData.dueDate}
                      onChange={e => setAssignmentFormData({ ...assignmentFormData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Marks</label>
                    <input
                      type="number"
                      value={assignmentFormData.maxMarks}
                      onChange={e => setAssignmentFormData({ ...assignmentFormData, maxMarks: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowAssignmentModal(false);
                    setSelectedAssignment(null);
                  }}>Cancel</button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : (selectedAssignment ? 'Update Assignment' : 'Create Assignment')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;