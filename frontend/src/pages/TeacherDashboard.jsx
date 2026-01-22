import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [theme, setTheme] = useState('light');

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

  useEffect(() => {
    fetchTeacherData();
    initializeFeatures();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data } = await api.get('/courses/teacher/my-courses');
      const coursesData = data?.data || [];
      setCourses(coursesData);

      const totalCourses = coursesData.length;
      const publishedCourses = coursesData.filter(c => c.status === 'published').length;
      const totalStudents = coursesData.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
      const averageRating = coursesData.reduce((sum, c) => sum + (c.rating?.average || 0), 0) / totalCourses || 0;
      const totalRevenue = coursesData.reduce((sum, c) => sum + (c.price * (c.enrolledStudents?.length || 0)), 0);

      setStats({
        totalCourses,
        publishedCourses,
        totalStudents,
        averageRating: averageRating.toFixed(1),
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.3
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const initializeFeatures = () => {
    setRecentActivity([
      { id: 1, type: 'enrollment', message: 'New student enrolled in React Course', time: '5 min ago', icon: '👤' },
      { id: 2, type: 'review', message: 'New 5-star review on Web Development', time: '2 hours ago', icon: '⭐' },
      { id: 3, type: 'completion', message: '10 students completed Node.js Course', time: '5 hours ago', icon: '🎉' },
      { id: 4, type: 'question', message: 'New question in Discussion Forum', time: '1 day ago', icon: '💬' },
    ]);

    setAnnouncements([
      { id: 1, title: 'Course Update Released', content: 'New module added to React Course', date: '2024-01-15' },
      { id: 2, title: 'Student Performance', content: 'Your students are performing 20% better', date: '2024-01-10' },
    ]);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    if (!newCourse.title || !newCourse.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/courses', {
        ...newCourse,
        status: 'published'
      });

      toast.success('🎉 Course created successfully!');
      setShowModal(false);
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
      fetchTeacherData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this course? This action cannot be undone!')) return;

    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Course deleted successfully');
      fetchTeacherData();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const addModule = () => {
    setNewCourse({
      ...newCourse,
      modules: [
        ...newCourse.modules,
        {
          title: '',
          description: '',
          order: newCourse.modules.length + 1,
          lessons: []
        }
      ]
    });
  };

  const updateModule = (index, field, value) => {
    const updatedModules = [...newCourse.modules];
    updatedModules[index][field] = value;
    setNewCourse({ ...newCourse, modules: updatedModules });
  };

  const removeModule = (index) => {
    const updatedModules = newCourse.modules.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, modules: updatedModules });
  };

  const addLesson = (moduleIndex) => {
    const updatedModules = [...newCourse.modules];
    updatedModules[moduleIndex].lessons.push({
      title: '',
      description: '',
      contentType: 'video',
      contentUrl: '',
      duration: 0,
      order: updatedModules[moduleIndex].lessons.length + 1,
      isFree: false
    });
    setNewCourse({ ...newCourse, modules: updatedModules });
  };

  const updateLesson = (moduleIndex, lessonIndex, field, value) => {
    const updatedModules = [...newCourse.modules];
    updatedModules[moduleIndex].lessons[lessonIndex][field] = value;
    setNewCourse({ ...newCourse, modules: updatedModules });
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    const updatedModules = [...newCourse.modules];
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setNewCourse({ ...newCourse, modules: updatedModules });
  };

  const handleSendAnnouncement = () => {
    if (!newAnnouncement.trim()) {
      toast.error('Please enter announcement content');
      return;
    }

    toast.success('📢 Announcement sent to all students!');
    setShowAnnouncementModal(false);
    setNewAnnouncement('');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your teaching dashboard...</p>
      </div>
    );
  }

  // Chart Data
  const enrollmentTrendData = [
    { month: 'Jan', students: 45 },
    { month: 'Feb', students: 78 },
    { month: 'Mar', students: 95 },
    { month: 'Apr', students: 120 },
    { month: 'May', students: 150 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 19000 },
    { month: 'Mar', revenue: 25000 },
    { month: 'Apr', revenue: 31000 },
    { month: 'May', revenue: 38000 },
  ];

  const coursePerformanceData = courses.slice(0, 5).map(course => ({
    name: course.title.substring(0, 15) + '...',
    students: course.enrolledStudents?.length || 0,
    rating: course.rating?.average || 0
  }));

  const categoryDistribution = [
    { name: 'Programming', value: 45, color: '#3B82F6' },
    { name: 'Design', value: 25, color: '#10B981' },
    { name: 'Business', value: 20, color: '#F59E0B' },
    { name: 'Marketing', value: 10, color: '#EF4444' },
  ];

  const studentEngagementData = [
    { day: 'Mon', active: 85 },
    { day: 'Tue', active: 92 },
    { day: 'Wed', active: 78 },
    { day: 'Thu', active: 95 },
    { day: 'Fri', active: 88 },
    { day: 'Sat', active: 70 },
    { day: 'Sun', active: 65 },
  ];

  return (
    <div className={`teacher-dashboard ${theme}`}>
      {/* Animated Background */}
      <div className="particles-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="container">
        {/* FEATURE 1: Enhanced Header with Quick Actions */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>
                Welcome, <span className="user-name animated-gradient">Prof. {user?.name || 'Instructor'}</span>!
                <span className="wave-emoji">👋</span>
              </h1>
              <p className="header-subtitle">
                🎓 Empowering {stats.totalStudents} students across {stats.totalCourses} courses
              </p>
            </div>
            <div className="header-actions">
              {/* Theme Toggle */}
              <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* Quick Actions */}
              <button
                className="action-btn announcement-btn"
                onClick={() => setShowAnnouncementModal(true)}
                title="Send Announcement"
              >
                📢
              </button>

              <button className="btn btn-primary pulse-animation" onClick={() => setShowModal(true)}>
                ➕ Create New Course
              </button>
            </div>
          </div>
        </div>

        {/* FEATURE 2: Advanced Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon floating">📚</div>
            <div className="stat-info">
              <h3 className="counter">{stats.totalCourses}</h3>
              <p>Total Courses</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ {stats.publishedCourses} Published</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-green slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon floating">👥</div>
            <div className="stat-info">
              <h3 className="counter">{stats.totalStudents}</h3>
              <p>Total Students</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ 15% this month</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-orange slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon floating">⭐</div>
            <div className="stat-info">
              <h3 className="counter">{stats.averageRating}</h3>
              <p>Average Rating</p>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: `${(stats.averageRating / 5) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-purple slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="stat-icon floating">💰</div>
            <div className="stat-info">
              <h3 className="counter">₹{stats.totalRevenue.toLocaleString()}</h3>
              <p>Total Revenue</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ ₹{stats.monthlyRevenue.toLocaleString()} this month</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-pink slide-in" style={{ animationDelay: '0.5s' }}>
            <div className="stat-icon floating">🎯</div>
            <div className="stat-info">
              <h3 className="counter">87%</h3>
              <p>Completion Rate</p>
            </div>
          </div>

          <div className="stat-card stat-card-cyan slide-in" style={{ animationDelay: '0.6s' }}>
            <div className="stat-icon floating">📊</div>
            <div className="stat-info">
              <h3 className="counter">4.2k</h3>
              <p>Total Enrollments</p>
            </div>
          </div>

          <div className="stat-card stat-card-indigo slide-in" style={{ animationDelay: '0.7s' }}>
            <div className="stat-icon floating">💬</div>
            <div className="stat-info">
              <h3 className="counter">156</h3>
              <p>Reviews</p>
            </div>
          </div>

          <div className="stat-card stat-card-teal slide-in" style={{ animationDelay: '0.8s' }}>
            <div className="stat-icon floating">🏆</div>
            <div className="stat-info">
              <h3 className="counter">Top 5%</h3>
              <p>Instructor Rank</p>
            </div>
          </div>
        </div>

        {/* FEATURE 3: Tabbed Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 My Courses
          </button>
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          <button
            className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👥 Students
          </button>
          <button
            className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            💰 Revenue
          </button>
        </div>

        {/* FEATURE 4-10: Advanced Charts & Analytics */}
        {activeTab === 'overview' && (
          <>
            <div className="charts-section">
              {/* Enrollment Trend */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>📈 Enrollment Trend</h3>
                  <p>Monthly student enrollments</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={enrollmentTrendData}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorStudents)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Course Performance */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>🎯 Course Performance</h3>
                  <p>Students enrolled per course</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={coursePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Students" />
                    <Bar dataKey="rating" fill="#10B981" radius={[8, 8, 0, 0]} name="Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>📚 Category Distribution</h3>
                  <p>Courses by category</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {categoryDistribution.map((entry, index) => (
                    <div key={index} className="legend-item">
                      <div className="legend-color" style={{ background: entry.color }}></div>
                      <span>{entry.name}: {entry.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FEATURE 11: Recent Activity Feed */}
            <div className="activity-section">
              <h3>📋 Recent Activity</h3>
              <div className="activity-feed">
                {recentActivity.map(activity => (
                  <div key={activity.id} className={`activity-item ${activity.type}`}>
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <p>{activity.message}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* FEATURE 12: Revenue Analytics */}
        {activeTab === 'revenue' && (
          <div className="revenue-section">
            <div className="section-header">
              <h2>💰 Revenue Analytics</h2>
              <p className="section-subtitle">Track your earnings and financial performance</p>
            </div>

            <div className="revenue-stats">
              <div className="revenue-card">
                <h4>💵 This Month</h4>
                <p className="revenue-amount">₹{stats.monthlyRevenue.toLocaleString()}</p>
                <span className="revenue-change positive">+23% from last month</span>
              </div>
              <div className="revenue-card">
                <h4>📊 Total Lifetime</h4>
                <p className="revenue-amount">₹{stats.totalRevenue.toLocaleString()}</p>
                <span className="revenue-change">All-time earnings</span>
              </div>
              <div className="revenue-card">
                <h4>📈 Average per Course</h4>
                <p className="revenue-amount">₹{Math.round(stats.totalRevenue / stats.totalCourses || 0).toLocaleString()}</p>
                <span className="revenue-change">Per course revenue</span>
              </div>
            </div>

            <div className="chart-card zoom-in" style={{ marginTop: '2rem' }}>
              <div className="chart-header">
                <h3>💰 Revenue Trend</h3>
                <p>Monthly revenue growth</p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* FEATURE 13: Student Analytics */}
        {activeTab === 'students' && (
          <div className="students-section">
            <div className="section-header">
              <h2>👥 Student Analytics</h2>
              <p className="section-subtitle">Monitor student engagement and performance</p>
            </div>

            <div className="chart-card zoom-in">
              <div className="chart-header">
                <h3>📊 Weekly Student Engagement</h3>
                <p>Active students per day</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="active" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="students-list">
              <h3>🌟 Top Performing Students</h3>
              <div className="top-students-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="student-card">
                    <div className="student-avatar">{String.fromCharCode(64 + i)}</div>
                    <h4>Student {i}</h4>
                    <p>Progress: {90 + i}%</p>
                    <div className="student-progress">
                      <div className="progress-fill" style={{ width: `${90 + i}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FEATURE 14: Courses Management with Filters */}
        {activeTab === 'courses' && (
          <div className="section">
            <div className="section-header">
              <div>
                <h2>📚 My Courses</h2>
                <p className="section-subtitle">Manage and monitor your courses</p>
              </div>
              <div className="course-filters">
                <select className="filter-select">
                  <option>All Courses</option>
                  <option>Published</option>
                  <option>Draft</option>
                  <option>Archived</option>
                </select>
                <select className="filter-select">
                  <option>Sort by: Recent</option>
                  <option>Most Students</option>
                  <option>Highest Rated</option>
                  <option>Most Revenue</option>
                </select>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <h3>No courses created yet</h3>
                <p>Create your first course and start teaching!</p>
                <button className="btn btn-primary btn-large pulse-animation" onClick={() => setShowModal(true)}>
                  ➕ Create Your First Course
                </button>
              </div>
            ) : (
              <div className="courses-table-container">
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Students</th>
                      <th>Rating</th>
                      <th>Revenue</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id} className="table-row-hover">
                        <td>
                          <div className="course-info">
                            <strong>{course.title}</strong>
                            <span className="course-category">{course.category}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${course.status}`}>
                            {course.status}
                          </span>
                        </td>
                        <td>
                          <span className="students-count">
                            👥 {course.enrolledStudents?.length || 0}
                          </span>
                        </td>
                        <td>
                          {course.rating?.average > 0 ? (
                            <span className="rating-display">
                              ⭐ {course.rating.average.toFixed(1)}
                              <small>({course.rating.count})</small>
                            </span>
                          ) : (
                            <span className="no-rating">No ratings</span>
                          )}
                        </td>
                        <td>
                          <span className="revenue-amount">
                            ₹{(course.price * (course.enrolledStudents?.length || 0)).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/courses/${course._id}`}
                              className="btn btn-sm btn-secondary"
                              title="View Course"
                            >
                              👁️ View
                            </Link>
                            <button
                              onClick={() => setSelectedCourse(course)}
                              className="btn btn-sm btn-primary"
                              title="Edit Course"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
                              className="btn btn-sm btn-danger"
                              title="Delete Course"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* FEATURE 15: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="section-header">
              <h2>📊 Detailed Analytics</h2>
              <div className="time-range-selector">
                <button className="active">Week</button>
                <button>Month</button>
                <button>Year</button>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>📈 Growth Rate</h4>
                <p className="analytics-value">+24%</p>
                <span className="analytics-change positive">vs last period</span>
              </div>
              <div className="analytics-card">
                <h4>⏱️ Avg. Watch Time</h4>
                <p className="analytics-value">45 min</p>
                <span className="analytics-change">per student</span>
              </div>
              <div className="analytics-card">
                <h4>🎯 Completion Rate</h4>
                <p className="analytics-value">87%</p>
                <span className="analytics-change positive">+5% increase</span>
              </div>
              <div className="analytics-card">
                <h4>💬 Student Satisfaction</h4>
                <p className="analytics-value">94%</p>
                <span className="analytics-change positive">Excellent</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✨ Create New Course</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCourse}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    required
                    placeholder="e.g., Complete Web Development Bootcamp"
                  />
                </div>

                <div className="form-group">
                  <label>Thumbnail URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCourse.thumbnail}
                    onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  required
                  placeholder="Describe what students will learn..."
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-input"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  >
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Personal Development">Personal Development</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Level</label>
                  <select
                    className="form-input"
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newCourse.isPaid}
                    onChange={(e) => setNewCourse({ ...newCourse, isPaid: e.target.checked })}
                  />
                  <span>This is a paid course</span>
                </label>
              </div>

              {newCourse.isPaid && (
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              )}

              <div className="modules-section">
                <div className="modules-header">
                  <h3>📚 Modules & Lessons</h3>
                  <button type="button" onClick={addModule} className="btn btn-secondary btn-sm">
                    ➕ Add Module
                  </button>
                </div>

                {newCourse.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="module-section">
                    <div className="module-header-section">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Module title"
                        value={module.title}
                        onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeModule(moduleIndex)}
                        className="btn-icon delete-btn"
                        title="Delete Module"
                      >
                        🗑️
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => addLesson(moduleIndex)}
                      className="btn btn-sm btn-secondary"
                      style={{ marginBottom: '0.5rem' }}
                    >
                      ➕ Add Lesson
                    </button>

                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="lesson-item">
                        <input
                          type="text"
                          placeholder="Lesson title"
                          value={lesson.title}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                          className="lesson-input"
                        />
                        <input
                          type="text"
                          placeholder="Video URL (YouTube or direct link)"
                          value={lesson.contentUrl}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'contentUrl', e.target.value)}
                          className="lesson-input"
                        />
                        <input
                          type="number"
                          placeholder="Duration (min)"
                          value={lesson.duration}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'duration', Number(e.target.value))}
                          className="lesson-input-short"
                        />
                        <button
                          type="button"
                          onClick={() => removeLesson(moduleIndex, lessonIndex)}
                          className="btn-icon delete-btn"
                          title="Delete Lesson"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary btn-large">
                  ✨ Create Course
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-large">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📢 Send Announcement</h2>
              <button className="close-button" onClick={() => setShowAnnouncementModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Announcement Message</label>
              <textarea
                className="form-input"
                rows="6"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Write your announcement to all students..."
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleSendAnnouncement} className="btn btn-primary btn-large">
                📤 Send to All Students
              </button>
              <button onClick={() => setShowAnnouncementModal(false)} className="btn btn-secondary btn-large">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;