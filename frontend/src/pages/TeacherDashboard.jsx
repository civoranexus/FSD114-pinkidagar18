import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    activeStudents: 0,
    averageRating: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    completionRate: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'Beginner',
    price: 0,
    isPaid: false,
    thumbnail: '',
    modules: [{
      title: 'Introduction',
      description: 'Get started with the course',
      order: 1,
      lessons: [{
        title: 'Welcome to the course',
        description: 'Introduction video',
        contentType: 'video',
        contentUrl: '',
        duration: 10,
        order: 1
      }]
    }]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/courses/teacher/my-courses');
      const coursesData = data?.data || [];
      setCourses(coursesData);

      // Calculate comprehensive stats
      const totalCourses = coursesData.length;
      const published = coursesData.filter(c => c.status === 'published').length;
      const totalStudents = coursesData.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
      const avgRating = coursesData.reduce((sum, c) => sum + (c.rating?.average || 0), 0) / totalCourses || 0;
      const totalRevenue = coursesData.reduce((sum, c) => sum + (c.price * (c.enrolledStudents?.length || 0)), 0);

      setStats({
        totalCourses,
        publishedCourses: published,
        draftCourses: totalCourses - published,
        totalStudents,
        activeStudents: Math.floor(totalStudents * 0.75),
        averageRating: avgRating.toFixed(1),
        totalRevenue,
        monthlyRevenue: Math.floor(totalRevenue * 0.3),
        completionRate: 68
      });

      // Mock recent activity
      setRecentActivity([
        { id: 1, type: 'enrollment', user: 'Sarah Chen', course: 'React Masterclass', time: '5 min ago', avatar: '👩' },
        { id: 2, type: 'review', user: 'Mike Johnson', course: 'Node.js Advanced', rating: 5, time: '2 hours ago', avatar: '👨' },
        { id: 3, type: 'completion', user: 'Emma Wilson', course: 'JavaScript Basics', time: '5 hours ago', avatar: '👧' },
        { id: 4, type: 'question', user: 'Alex Kumar', course: 'MongoDB Guide', time: '1 day ago', avatar: '🧑' },
      ]);

      setNotifications([
        { id: 1, type: 'milestone', text: 'You reached 100 students! 🎉', time: '1 hour ago', unread: true },
        { id: 2, type: 'revenue', text: 'New revenue milestone: ₹50,000', time: '2 hours ago', unread: true },
        { id: 3, type: 'update', text: 'Course "React Mastery" needs update', time: '1 day ago', unread: false },
      ]);

    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.description) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await api.post('/courses', { ...newCourse, status: 'published' });
      toast.success('🎉 Course created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course? This cannot be undone!')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Course deleted');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete course');
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
      modules: [{
        title: 'Introduction',
        description: 'Get started with the course',
        order: 1,
        lessons: [{
          title: 'Welcome to the course',
          description: 'Introduction video',
          contentType: 'video',
          contentUrl: '',
          duration: 10,
          order: 1
        }]
      }]
    });
  };

  const addModule = () => {
    setNewCourse({
      ...newCourse,
      modules: [...newCourse.modules, {
        title: '',
        description: '',
        order: newCourse.modules.length + 1,
        lessons: []
      }]
    });
  };

  const updateModule = (index, field, value) => {
    const updated = [...newCourse.modules];
    updated[index][field] = value;
    setNewCourse({ ...newCourse, modules: updated });
  };

  const removeModule = (index) => {
    setNewCourse({ 
      ...newCourse, 
      modules: newCourse.modules.filter((_, i) => i !== index) 
    });
  };

  const addLesson = (moduleIndex) => {
    const updated = [...newCourse.modules];
    updated[moduleIndex].lessons.push({
      title: '',
      description: '',
      contentType: 'video',
      contentUrl: '',
      duration: 10,
      order: updated[moduleIndex].lessons.length + 1
    });
    setNewCourse({ ...newCourse, modules: updated });
  };

  const updateLesson = (moduleIndex, lessonIndex, field, value) => {
    const updated = [...newCourse.modules];
    updated[moduleIndex].lessons[lessonIndex][field] = value;
    setNewCourse({ ...newCourse, modules: updated });
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    const updated = [...newCourse.modules];
    updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setNewCourse({ ...newCourse, modules: updated });
  };

  if (loading) {
    return (
      <div className="premium-loading">
        <div className="loading-rings">
          <div className="ring"></div>
          <div className="ring"></div>
          <div className="ring"></div>
        </div>
        <p className="loading-text">Loading your premium dashboard...</p>
      </div>
    );
  }

  // Chart Data
  const enrollmentData = [
    { month: 'Jan', students: 45, revenue: 125000 },
    { month: 'Feb', students: 78, revenue: 218000 },
    { month: 'Mar', students: 95, revenue: 285000 },
    { month: 'Apr', students: 120, revenue: 356000 },
    { month: 'May', students: 140, revenue: 412000 },
    { month: 'Jun', students: 165, revenue: 489000 }
  ];

  const categoryData = [
    { name: 'Programming', value: 45, color: '#667eea' },
    { name: 'Design', value: 25, color: '#f093fb' },
    { name: 'Business', value: 20, color: '#4facfe' },
    { name: 'Marketing', value: 10, color: '#43e97b' }
  ];

  const performanceData = [
    { subject: 'Engagement', A: 85 },
    { subject: 'Content Quality', A: 92 },
    { subject: 'Student Satisfaction', A: 88 },
    { subject: 'Course Completion', A: 75 },
    { subject: 'Revenue Growth', A: 90 }
  ];

  return (
    <div className="premium-teacher-dashboard">
      {/* Floating Background Elements */}
      <div className="bg-elements">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="premium-navbar">
        <div className="nav-content">
          <div className="nav-left">
            <h2 className="nav-brand">
              <span className="brand-icon">🎓</span>
              <span className="brand-text">EduVillage</span>
              <span className="brand-badge">Teacher Pro</span>
            </h2>
          </div>
          
          <div className="nav-right">
            <div className="search-container">
              <input type="text" placeholder="Search courses, students..." className="search-input" />
              <span className="search-icon">🔍</span>
            </div>

            <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
              🔔
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="notification-badge">{notifications.filter(n => n.unread).length}</span>
              )}
            </button>

            <div className="user-profile">
              <div className="user-avatar">{user?.name?.charAt(0)}</div>
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">Instructor</div>
              </div>
            </div>
          </div>
        </div>

        {showNotifications && (
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <h4>Notifications</h4>
              <button onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}>
                Mark all read
              </button>
            </div>
            {notifications.map(notif => (
              <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                <div className="notif-content">
                  <p>{notif.text}</p>
                  <span className="notif-time">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="dashboard-container">
        {/* Welcome Header with Action Button */}
        <header className="welcome-header">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, <span className="highlight-name">{user?.name}</span>! 
              <span className="wave-hand">👋</span>
            </h1>
            <p className="welcome-subtitle">Here's what's happening with your courses today</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-create-premium">
            <span className="btn-icon-premium">✨</span>
            <span>Create New Course</span>
            <span className="btn-arrow">→</span>
          </button>
        </header>

        {/* Premium Stats Grid */}
        <section className="stats-grid-premium">
          <div className="stat-card-premium stat-gradient-blue">
            <div className="stat-bg-pattern"></div>
            <div className="stat-header">
              <div className="stat-icon-circle">📚</div>
              <div className="stat-trend">
                <span className="trend-icon">📈</span>
                <span className="trend-value">+12%</span>
              </div>
            </div>
            <div className="stat-body">
              <h3 className="stat-number-premium">{stats.totalCourses}</h3>
              <p className="stat-label-premium">Total Courses</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '75%' }}></div>
              </div>
              <p className="stat-detail">{stats.publishedCourses} published • {stats.draftCourses} draft</p>
            </div>
          </div>

          <div className="stat-card-premium stat-gradient-green">
            <div className="stat-bg-pattern"></div>
            <div className="stat-header">
              <div className="stat-icon-circle">👥</div>
              <div className="stat-trend">
                <span className="trend-icon">📈</span>
                <span className="trend-value">+25%</span>
              </div>
            </div>
            <div className="stat-body">
              <h3 className="stat-number-premium">{stats.totalStudents}</h3>
              <p className="stat-label-premium">Total Students</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '85%' }}></div>
              </div>
              <p className="stat-detail">{stats.activeStudents} active this month</p>
            </div>
          </div>

          <div className="stat-card-premium stat-gradient-purple">
            <div className="stat-bg-pattern"></div>
            <div className="stat-header">
              <div className="stat-icon-circle">💰</div>
              <div className="stat-trend">
                <span className="trend-icon">📈</span>
                <span className="trend-value">+18%</span>
              </div>
            </div>
            <div className="stat-body">
              <h3 className="stat-number-premium">₹{(stats.totalRevenue / 1000).toFixed(0)}K</h3>
              <p className="stat-label-premium">Total Revenue</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '92%' }}></div>
              </div>
              <p className="stat-detail">₹{(stats.monthlyRevenue / 1000).toFixed(0)}K this month</p>
            </div>
          </div>

          <div className="stat-card-premium stat-gradient-orange">
            <div className="stat-bg-pattern"></div>
            <div className="stat-header">
              <div className="stat-icon-circle">⭐</div>
              <div className="stat-trend">
                <span className="trend-icon">📈</span>
                <span className="trend-value">+0.3</span>
              </div>
            </div>
            <div className="stat-body">
              <h3 className="stat-number-premium">{stats.averageRating}</h3>
              <p className="stat-label-premium">Average Rating</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: `${(stats.averageRating / 5) * 100}%` }}></div>
              </div>
              <p className="stat-detail">Based on {stats.totalStudents * 0.6} reviews</p>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="premium-tabs">
          {['overview', 'courses', 'analytics', 'students'].map(tab => (
            <button
              key={tab}
              className={`premium-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="tab-icon-premium">
                {tab === 'overview' && '📊'}
                {tab === 'courses' && '📚'}
                {tab === 'analytics' && '📈'}
                {tab === 'students' && '👥'}
              </span>
              <span className="tab-text">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="tab-content-premium">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-grid">
              {/* Charts Section */}
              <div className="charts-row">
                <div className="chart-card-premium">
                  <div className="chart-header">
                    <h3>Student Enrollment Trend</h3>
                    <select className="chart-filter">
                      <option>Last 6 months</option>
                      <option>Last year</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={enrollmentData}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="students" 
                        stroke="#667eea" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorStudents)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card-premium">
                  <div className="chart-header">
                    <h3>Revenue Overview</h3>
                    <select className="chart-filter">
                      <option>Monthly</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="bottom-row">
                <div className="activity-card-premium">
                  <h3 className="card-title-premium">Recent Activity</h3>
                  <div className="activity-list">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item-premium">
                        <div className="activity-avatar">{activity.avatar}</div>
                        <div className="activity-content">
                          <p className="activity-text">
                            <strong>{activity.user}</strong>
                            {activity.type === 'enrollment' && ' enrolled in '}
                            {activity.type === 'review' && ' gave 5★ review on '}
                            {activity.type === 'completion' && ' completed '}
                            {activity.type === 'question' && ' asked a question in '}
                            <span className="activity-course">{activity.course}</span>
                          </p>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="performance-card-premium">
                  <h3 className="card-title-premium">Performance Metrics</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" />
                      <PolarRadiusAxis stroke="#64748b" />
                      <Radar 
                        name="Performance" 
                        dataKey="A" 
                        stroke="#667eea" 
                        fill="#667eea" 
                        fillOpacity={0.5} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="category-card-premium">
                  <h3 className="card-title-premium">Course Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="category-legend">
                    {categoryData.map(cat => (
                      <div key={cat.name} className="legend-item">
                        <div className="legend-color" style={{ background: cat.color }}></div>
                        <span>{cat.name}</span>
                        <strong>{cat.value}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="courses-content">
              {courses.length === 0 ? (
                <div className="empty-state-premium">
                  <div className="empty-icon-large">📚</div>
                  <h3>No Courses Yet</h3>
                  <p>Start creating amazing courses and inspire students worldwide</p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-create-premium">
                    <span className="btn-icon-premium">✨</span>
                    <span>Create Your First Course</span>
                  </button>
                </div>
              ) : (
                <div className="courses-grid-premium">
                  {courses.map(course => (
                    <div key={course._id} className="course-card-premium">
                      <div className="course-image-premium">
                        <img 
                          src={course.thumbnail || `https://source.unsplash.com/600x400/?${course.category},education`} 
                          alt={course.title}
                        />
                        <div className="course-overlay">
                          <button onClick={() => { setSelectedCourse(course); setShowCourseDetail(true); }} className="btn-view-course">
                            View Details
                          </button>
                        </div>
                        <div className="course-badge-premium">
                          {course.isPaid ? `₹${course.price}` : 'FREE'}
                        </div>
                      </div>
                      
                      <div className="course-content-premium">
                        <div className="course-tags">
                          <span className="tag-category">{course.category}</span>
                          <span className="tag-level">{course.level}</span>
                        </div>
                        
                        <h3 className="course-title-premium">{course.title}</h3>
                        <p className="course-desc-premium">
                          {course.description?.substring(0, 120)}...
                        </p>
                        
                        <div className="course-stats-premium">
                          <div className="stat-item-course">
                            <span className="stat-icon-course">👥</span>
                            <span className="stat-value-course">{course.enrolledStudents?.length || 0}</span>
                          </div>
                          <div className="stat-item-course">
                            <span className="stat-icon-course">⭐</span>
                            <span className="stat-value-course">{course.rating?.average || 4.5}</span>
                          </div>
                          <div className="stat-item-course">
                            <span className="stat-icon-course">📊</span>
                            <span className="stat-value-course">{stats.completionRate}%</span>
                          </div>
                        </div>
                        
                        <div className="course-actions-premium">
                          <Link to={`/courses/${course._id}`} className="btn-action-course btn-view">
                            <span>View</span>
                            <span>→</span>
                          </Link>
                          <button className="btn-action-course btn-edit">
                            <span>✏️</span>
                          </button>
                          <button onClick={() => handleDeleteCourse(course._id)} className="btn-action-course btn-delete-course">
                            <span>🗑️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-content">
              <div className="analytics-grid">
                <div className="metric-card-premium">
                  <div className="metric-icon">💵</div>
                  <div className="metric-info">
                    <h4>Total Earnings</h4>
                    <p className="metric-value">₹{(stats.totalRevenue / 1000).toFixed(1)}K</p>
                    <span className="metric-change positive">+15% from last month</span>
                  </div>
                </div>

                <div className="metric-card-premium">
                  <div className="metric-icon">🎯</div>
                  <div className="metric-info">
                    <h4>Completion Rate</h4>
                    <p className="metric-value">{stats.completionRate}%</p>
                    <span className="metric-change positive">+5% from last month</span>
                  </div>
                </div>

                <div className="metric-card-premium">
                  <div className="metric-icon">💬</div>
                  <div className="metric-info">
                    <h4>Student Engagement</h4>
                    <p className="metric-value">85%</p>
                    <span className="metric-change positive">+8% from last month</span>
                  </div>
                </div>

                <div className="metric-card-premium">
                  <div className="metric-icon">🏆</div>
                  <div className="metric-info">
                    <h4>Course Performance</h4>
                    <p className="metric-value">92/100</p>
                    <span className="metric-change positive">+3 points</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="students-content">
              <div className="students-header">
                <h3>Top Performing Students</h3>
                <button className="btn-export">Export Data</button>
              </div>
              <div className="students-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="student-card-premium">
                    <div className="student-avatar-large">👤</div>
                    <h4>Student {i}</h4>
                    <p className="student-email">student{i}@example.com</p>
                    <div className="student-progress">
                      <span>Progress: {85 + i}%</span>
                      <div className="progress-bar-student">
                        <div className="progress-fill-student" style={{ width: `${85 + i}%` }}></div>
                      </div>
                    </div>
                    <div className="student-stats-row">
                      <div>📚 {i + 2} courses</div>
                      <div>⭐ 4.{8 - i}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="modal-overlay-premium" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content-premium large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div>
                <h2>Create New Course</h2>
                <p className="modal-subtitle">Fill in the details to create an amazing course</p>
              </div>
              <button className="modal-close-premium" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateCourse} className="course-form-premium">
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                
                <div className="form-grid-2">
                  <div className="form-group-premium">
                    <label>Course Title *</label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      placeholder="e.g., Complete Web Development Bootcamp"
                      required
                    />
                  </div>

                  <div className="form-group-premium">
                    <label>Thumbnail URL</label>
                    <input
                      type="url"
                      value={newCourse.thumbnail}
                      onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="form-group-premium">
                  <label>Description *</label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Describe what students will learn..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-grid-3">
                  <div className="form-group-premium">
                    <label>Category</label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    >
                      <option value="Programming">Programming</option>
                      <option value="Design">Design</option>
                      <option value="Business">Business</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>

                  <div className="form-group-premium">
                    <label>Level</label>
                    <select
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="form-group-premium">
                    <label>
                      <input
                        type="checkbox"
                        checked={newCourse.isPaid}
                        onChange={(e) => setNewCourse({ ...newCourse, isPaid: e.target.checked })}
                        style={{ marginRight: '8px' }}
                      />
                      Paid Course
                    </label>
                    {newCourse.isPaid && (
                      <input
                        type="number"
                        value={newCourse.price}
                        onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                        placeholder="Price (₹)"
                        min="0"
                        style={{ marginTop: '8px' }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header-flex">
                  <h3 className="section-title">Course Content</h3>
                  <button type="button" onClick={addModule} className="btn-add-module">
                    + Add Module
                  </button>
                </div>

                {newCourse.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="module-builder">
                    <div className="module-header-builder">
                      <span className="module-number">Module {moduleIndex + 1}</span>
                      <input
                        type="text"
                        placeholder="Module Title"
                        value={module.title}
                        onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                        className="module-title-input-premium"
                      />
                      {newCourse.modules.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeModule(moduleIndex)}
                          className="btn-remove-module"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => addLesson(moduleIndex)}
                      className="btn-add-lesson-premium"
                    >
                      + Add Lesson
                    </button>

                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="lesson-builder">
                        <div className="lesson-number">{lessonIndex + 1}</div>
                        <input
                          type="text"
                          placeholder="Lesson Title"
                          value={lesson.title}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                        />
                        <input
                          type="url"
                          placeholder="Video URL (YouTube or direct link)"
                          value={lesson.contentUrl}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'contentUrl', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Duration (min)"
                          value={lesson.duration}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'duration', Number(e.target.value))}
                          className="duration-input"
                        />
                        <button 
                          type="button" 
                          onClick={() => removeLesson(moduleIndex, lessonIndex)}
                          className="btn-remove-lesson-premium"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="modal-actions-premium">
                <button type="submit" className="btn-submit-premium">
                  <span>✨ Create Course</span>
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel-premium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;