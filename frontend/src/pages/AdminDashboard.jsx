import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State Management
  const [activeSection, setActiveSection] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [formData, setFormData] = useState({});

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    avgAttendance: 0,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-profile')) setShowUserMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchCourses(),
        fetchSubjects(),
        fetchAttendance(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data?.data || []);
      setStats(prev => ({ ...prev, totalStudents: data?.data?.length || 0 }));
    } catch (error) {
      setStudents([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/admin/teachers');
      setTeachers(data?.data || []);
      setStats(prev => ({ ...prev, totalTeachers: data?.data?.length || 0 }));
    } catch (error) {
      setTeachers([]);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data?.data || []);
      setStats(prev => ({ ...prev, totalCourses: data?.data?.length || 0 }));
    } catch (error) {
      setCourses([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/admin/subjects');
      setSubjects(data?.data || []);
    } catch (error) {
      setSubjects([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/admin/attendance');
      const records = data?.data || [];
      setAttendance(records);
      
      if (records.length > 0) {
        const totalRecords = records.length;
        const presentRecords = records.filter(r => r.status === 'present').length;
        const avgAttendance = ((presentRecords / totalRecords) * 100).toFixed(1);
        setStats(prev => ({ ...prev, avgAttendance: parseFloat(avgAttendance) }));
      }
    } catch (error) {
      setAttendance([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      setNotifications(data?.data || []);
    } catch (error) {
      setNotifications([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
    setFormData({});
  };

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Delete ${name}? This action cannot be undone!`)) return;

    try {
      await api.delete(`/admin/${type}/${id}`);
      toast.success(`✅ ${type} deleted successfully`);
      fetchAllData();
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const getChartData = () => {
    return [
      { day: 'Mon', students: 45, teachers: 8 },
      { day: 'Tue', students: 52, teachers: 9 },
      { day: 'Wed', students: 48, teachers: 7 },
      { day: 'Thu', students: 55, teachers: 10 },
      { day: 'Fri', students: 50, teachers: 8 },
      { day: 'Sat', students: 30, teachers: 5 },
      { day: 'Sun', students: 20, teachers: 3 }
    ];
  };

  const COLORS = ['#1E3A8A', '#3B82F6', '#10B981', '#F59E0B'];

  if (loading && students.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">EduVillage</div>
          <div className="logo-subtitle">Admin Portal</div>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Students</span>
            {stats.totalStudents > 0 && (
              <span className="nav-badge">{stats.totalStudents}</span>
            )}
          </div>
          <div 
            className={`nav-item ${activeSection === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveSection('teachers')}
          >
            <span className="nav-icon">🎓</span>
            <span className="nav-text">Teachers</span>
            {stats.totalTeachers > 0 && (
              <span className="nav-badge">{stats.totalTeachers}</span>
            )}
          </div>
          <div 
            className={`nav-item ${activeSection === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveSection('courses')}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Courses</span>
            {stats.totalCourses > 0 && (
              <span className="nav-badge">{stats.totalCourses}</span>
            )}
          </div>
          <div 
            className={`nav-item ${activeSection === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveSection('subjects')}
          >
            <span className="nav-icon">📖</span>
            <span className="nav-text">Subjects</span>
          </div>
          <div 
            className={`nav-item ${activeSection === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveSection('attendance')}
          >
            <span className="nav-icon">✅</span>
            <span className="nav-text">Attendance</span>
          </div>
          <div 
            className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-text">Notifications</span>
          </div>
          <div 
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Reports</span>
          </div>
          <div 
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </div>
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
                  Admin Control Center
                </h1>
                <p className="page-subtitle">Manage your institution efficiently</p>
              </div>
            </div>

            <div className="header-right">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="user-name-text">{user?.name || 'Admin'}</span>
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
                    👥
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.totalStudents}</h3>
                    <p className="stat-label">Total Students</p>
                    <div className="stat-trend positive">
                      <span>↗</span>
                      <span>+125 new this month</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4FD1C5, #38B2AC)' }}>
                    👨‍🏫
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.totalTeachers}</h3>
                    <p className="stat-label">Total Teachers</p>
                    <div className="stat-trend positive">
                      <span>↗</span>
                      <span>+8 new this month</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    📚
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.totalCourses}</h3>
                    <p className="stat-label">Active Courses</p>
                    <div className="stat-trend positive">
                      <span>↗</span>
                      <span>+3 new this semester</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                    ✅
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.avgAttendance}%</h3>
                    <p className="stat-label">Avg Attendance</p>
                    <div className="stat-trend negative">
                      <span>↘</span>
                      <span>-2% from last week</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="dashboard-grid">
                <div className="chart-card">
                  <h2 className="section-title">📊 Weekly Overview</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="students" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="teachers" fill="#10B981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h2 className="section-title">📈 Attendance Trends</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="students" stroke="#1E3A8A" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <h2 className="section-title">⚡ Quick Actions</h2>
                <div className="quick-actions-grid">
                  <button className="action-card" onClick={() => openModal('student')}>
                    <span className="action-icon">➕</span>
                    <span>Add Student</span>
                  </button>
                  <button className="action-card" onClick={() => openModal('teacher')}>
                    <span className="action-icon">➕</span>
                    <span>Add Teacher</span>
                  </button>
                  <button className="action-card" onClick={() => openModal('course')}>
                    <span className="action-icon">➕</span>
                    <span>Add Course</span>
                  </button>
                  <button className="action-card" onClick={() => openModal('subject')}>
                    <span className="action-icon">➕</span>
                    <span>Add Subject</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Students View */}
          {activeSection === 'students' && (
            <div className="data-section">
              <div className="section-header-with-action">
                <h2 className="section-title">👥 Students Management</h2>
                <button className="add-btn" onClick={() => openModal('student')}>
                  ➕ Add Student
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Enrolled Courses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student._id}>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                          <td>{student.enrolledCourses?.length || 0}</td>
                          <td>
                            <span className="status-badge active">Active</span>
                          </td>
                          <td>
                            <button className="table-btn edit" onClick={() => openModal('student', student)}>
                              ✏️
                            </button>
                            <button className="table-btn delete" onClick={() => handleDelete('students', student._id, student.name)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teachers View */}
          {activeSection === 'teachers' && (
            <div className="data-section">
              <div className="section-header-with-action">
                <h2 className="section-title">🎓 Teachers Management</h2>
                <button className="add-btn" onClick={() => openModal('teacher')}>
                  ➕ Add Teacher
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Courses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.length > 0 ? (
                      teachers.map((teacher) => (
                        <tr key={teacher._id}>
                          <td>{teacher.name}</td>
                          <td>{teacher.email}</td>
                          <td>{teacher.courses?.length || 0}</td>
                          <td>
                            <span className="status-badge active">Active</span>
                          </td>
                          <td>
                            <button className="table-btn edit" onClick={() => openModal('teacher', teacher)}>
                              ✏️
                            </button>
                            <button className="table-btn delete" onClick={() => handleDelete('teachers', teacher._id, teacher.name)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                          No teachers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Courses View */}
          {activeSection === 'courses' && (
            <div className="data-section">
              <div className="section-header-with-action">
                <h2 className="section-title">📚 Courses Management</h2>
                <button className="add-btn" onClick={() => openModal('course')}>
                  ➕ Add Course
                </button>
              </div>

              <div className="courses-grid">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <div key={course._id} className="course-card">
                      <div className="course-image">
                        <img 
                          src={course.thumbnail || `https://source.unsplash.com/400x250/?${course.category},education`}
                          alt={course.title}
                        />
                      </div>
                      <div className="course-body">
                        <h3 className="course-title">{course.title}</h3>
                        <p className="course-desc">{course.description?.substring(0, 80)}...</p>
                        <div className="course-footer">
                          <button className="edit-btn" onClick={() => openModal('course', course)}>
                            ✏️ Edit
                          </button>
                          <button className="delete-btn" onClick={() => handleDelete('courses', course._id, course.title)}>
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
                    <p>Add courses to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subjects View */}
          {activeSection === 'subjects' && (
            <div className="data-section">
              <div className="section-header-with-action">
                <h2 className="section-title">📖 Subjects Management</h2>
                <button className="add-btn" onClick={() => openModal('subject')}>
                  ➕ Add Subject
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Code</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length > 0 ? (
                      subjects.map((subject) => (
                        <tr key={subject._id}>
                          <td>{subject.name}</td>
                          <td>{subject.code || 'N/A'}</td>
                          <td>{subject.department || 'General'}</td>
                          <td>
                            <span className="status-badge active">Active</span>
                          </td>
                          <td>
                            <button className="table-btn edit" onClick={() => openModal('subject', subject)}>
                              ✏️
                            </button>
                            <button className="table-btn delete" onClick={() => handleDelete('subjects', subject._id, subject.name)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                          No subjects found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance View */}
          {activeSection === 'attendance' && (
            <div className="data-section">
              <h2 className="section-title">✅ Attendance Management</h2>
              
              <div className="stats-row" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    ✅
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{attendance.filter(a => a.status === 'present').length}</h3>
                    <p className="stat-label">Present Today</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                    ❌
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{attendance.filter(a => a.status === 'absent').length}</h3>
                    <p className="stat-label">Absent Today</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                    📊
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.avgAttendance}%</h3>
                    <p className="stat-label">Average Rate</p>
                  </div>
                </div>
              </div>

              <div className="data-table-container" style={{ marginTop: '2rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length > 0 ? (
                      attendance.slice(0, 20).map((record, idx) => (
                        <tr key={idx}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.studentName || 'Student'}</td>
                          <td>{record.courseName || 'Course'}</td>
                          <td>
                            <span className={`status-badge ${record.status === 'present' ? 'active' : 'inactive'}`}>
                              {record.status}
                            </span>
                          </td>
                          <td>{record.markedBy || 'System'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                          No attendance records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications View */}
          {activeSection === 'notifications' && (
            <div className="data-section">
              <div className="section-header-with-action">
                <h2 className="section-title">🔔 Notifications</h2>
                <button className="add-btn" onClick={() => openModal('notification')}>
                  ➕ Send Notification
                </button>
              </div>

              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map((notification, idx) => (
                    <div key={idx} className="notification-card">
                      <div className="notification-icon">🔔</div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <button className="table-btn delete" onClick={() => handleDelete('notifications', notification._id, notification.title)}>
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🔔</div>
                    <h3>No Notifications</h3>
                    <p>Send notifications to keep everyone informed</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reports View */}
          {activeSection === 'reports' && (
            <div className="data-section">
              <h2 className="section-title">📈 Reports & Analytics</h2>
              
              <div className="reports-grid">
                <div className="report-card">
                  <div className="report-icon">👥</div>
                  <h3>Student Report</h3>
                  <p>Detailed student performance and enrollment data</p>
                  <button className="report-btn">Generate Report</button>
                </div>

                <div className="report-card">
                  <div className="report-icon">🎓</div>
                  <h3>Teacher Report</h3>
                  <p>Teacher activity and course statistics</p>
                  <button className="report-btn">Generate Report</button>
                </div>

                <div className="report-card">
                  <div className="report-icon">📚</div>
                  <h3>Course Report</h3>
                  <p>Course enrollment and completion rates</p>
                  <button className="report-btn">Generate Report</button>
                </div>

                <div className="report-card">
                  <div className="report-icon">✅</div>
                  <h3>Attendance Report</h3>
                  <p>Comprehensive attendance tracking data</p>
                  <button className="report-btn">Generate Report</button>
                </div>

                <div className="report-card">
                  <div className="report-icon">💰</div>
                  <h3>Financial Report</h3>
                  <p>Revenue and payment analytics</p>
                  <button className="report-btn">Generate Report</button>
                </div>

                <div className="report-card">
                  <div className="report-icon">📊</div>
                  <h3>Custom Report</h3>
                  <p>Build your own custom reports</p>
                  <button className="report-btn">Create Report</button>
                </div>
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeSection === 'settings' && (
            <div className="data-section">
              <h2 className="section-title">⚙️ System Settings</h2>
              
              <div className="settings-sections">
                <div className="settings-card">
                  <h3>🏫 Institution Settings</h3>
                  <div className="settings-group">
                    <label>Institution Name</label>
                    <input type="text" className="settings-input" placeholder="EduVillage Learning Center" />
                  </div>
                  <div className="settings-group">
                    <label>Email</label>
                    <input type="email" className="settings-input" placeholder="admin@eduvillage.com" />
                  </div>
                  <div className="settings-group">
                    <label>Phone</label>
                    <input type="tel" className="settings-input" placeholder="+91 1234567890" />
                  </div>
                  <button className="save-settings-btn">Save Changes</button>
                </div>

                <div className="settings-card">
                  <h3>🔐 Security Settings</h3>
                  <div className="settings-group">
                    <label>Two-Factor Authentication</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="2fa" />
                      <label htmlFor="2fa"></label>
                    </div>
                  </div>
                  <div className="settings-group">
                    <label>Session Timeout (minutes)</label>
                    <input type="number" className="settings-input" placeholder="30" />
                  </div>
                  <button className="save-settings-btn">Save Changes</button>
                </div>

                <div className="settings-card">
                  <h3>📧 Email Settings</h3>
                  <div className="settings-group">
                    <label>Enable Email Notifications</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="email-notif" defaultChecked />
                      <label htmlFor="email-notif"></label>
                    </div>
                  </div>
                  <div className="settings-group">
                    <label>SMTP Server</label>
                    <input type="text" className="settings-input" placeholder="smtp.gmail.com" />
                  </div>
                  <button className="save-settings-btn">Save Changes</button>
                </div>

                <div className="settings-card">
                  <h3>🎨 Appearance Settings</h3>
                  <div className="settings-group">
                    <label>Theme</label>
                    <select className="settings-input">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>Auto</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label>Primary Color</label>
                    <input type="color" className="settings-input" value="#1E3A8A" />
                  </div>
                  <button className="save-settings-btn">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedItem ? 'Edit' : 'Add'} {modalType}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Form implementation for {modalType} management</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;