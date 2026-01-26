import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State Management
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrolled');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    hoursLearned: 0,
    certificatesEarned: 0,
    averageProgress: 0,
    streak: 0
  });

  // Fetch Data
  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-icon')) setShowNotifications(false);
      if (!e.target.closest('.user-profile')) setShowUserMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled courses
      const { data: enrolledData } = await api.get('/enrollments/my-enrollments');
      const enrolled = enrolledData?.data || [];
      setEnrolledCourses(enrolled);

      // Fetch all available courses
      const { data: allData } = await api.get('/courses');
      const all = allData?.data || [];
      setAllCourses(all);

      // Calculate stats
      const coursesEnrolled = enrolled.length;
      const coursesCompleted = enrolled.filter(e => e.progress === 100).length;
      const totalProgress = enrolled.reduce((sum, e) => sum + (e.progress || 0), 0);
      const averageProgress = enrolled.length > 0 ? (totalProgress / enrolled.length).toFixed(0) : 0;
      
      // Calculate hours learned (estimate: 5 min per completed lesson)
      const hoursLearned = enrolled.reduce((sum, e) => {
        const completedLessons = e.completedLessons?.length || 0;
        return sum + (completedLessons * 5 / 60);
      }, 0).toFixed(1);

      setStats({
        coursesEnrolled,
        coursesCompleted,
        hoursLearned,
        certificatesEarned: coursesCompleted,
        averageProgress,
        streak: 7 // Mock data
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId) => {
    try {
      await api.post(`/enrollments/enroll/${courseId}`);
      toast.success('🎉 Successfully enrolled in course!');
      await fetchStudentData();
      setActiveTab('enrolled');
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    }
  };

  const handleContinueLearning = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
      toast.success('👋 Logged out successfully');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Filter courses
  const getFilteredCourses = () => {
    const courses = activeTab === 'enrolled' ? enrolledCourses : allCourses;
    let filtered = [...courses];

    if (searchQuery) {
      filtered = filtered.filter(c => {
        const course = c.course || c;
        return course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => {
        const course = c.course || c;
        return course.category === categoryFilter;
      });
    }

    return filtered;
  };

  const filteredCourses = getFilteredCourses();
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // Chart data
  const progressData = [
    { name: 'Completed', value: stats.coursesCompleted, color: '#10B981' },
    { name: 'In Progress', value: stats.coursesEnrolled - stats.coursesCompleted, color: '#3B82F6' }
  ];

  const weeklyActivity = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3.0 },
    { day: 'Wed', hours: 1.5 },
    { day: 'Thu', hours: 4.0 },
    { day: 'Fri', hours: 2.0 },
    { day: 'Sat', hours: 3.5 },
    { day: 'Sun', hours: 2.5 }
  ];

  const categories = ['all', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science'];

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">E</div>
          <div className="logo-text">EduVillage</div>
          <div className="logo-subtitle">Online Learning Platform</div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Dashboard - You are here!'); }} className="nav-item active">
            <span className="nav-icon">📊</span>Dashboard
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('enrolled'); }} className="nav-item">
            <span className="nav-icon">📚</span>My Courses
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('browse'); }} className="nav-item">
            <span className="nav-icon">🔍</span>Browse Courses
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Certificates - Coming soon!'); }} className="nav-item">
            <span className="nav-icon">🏆</span>Certificates
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Messages - Coming soon!'); }} className="nav-item">
            <span className="nav-icon">💬</span>Messages
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Calendar - Coming soon!'); }} className="nav-item">
            <span className="nav-icon">📅</span>Calendar
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Settings - Coming soon!'); }} className="nav-item">
            <span className="nav-icon">⚙️</span>Settings
          </a>
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          padding: '0.5rem',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          fontSize: '1.5rem',
          cursor: 'pointer'
        }}
      >
        ☰
      </button>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Top Header */}
          <div className="top-header">
            <div className="page-title">
              Welcome back, <span className="user-name">{user?.name || 'Student'}</span>! 👋
              <p className="page-subtitle">Continue your learning journey</p>
            </div>
            <div className="header-right">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="notification-icon" onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}>
                🔔
                <span className="notification-badge">2</span>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>Notifications</h4>
                    <div className="notification-item">• New course available: Advanced React</div>
                    <div className="notification-item">• Assignment due tomorrow</div>
                  </div>
                )}
              </div>
              <div className="user-profile" onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}>
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <span className="user-name-text">{user?.name || 'Student'}</span>
                <span className="dropdown-icon">▼</span>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Profile - Coming soon!'); setShowUserMenu(false); }}>👤 My Profile</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Settings - Coming soon!'); setShowUserMenu(false); }}>⚙️ Settings</a>
                    <hr />
                    <button onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card blue">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-value">{stats.coursesEnrolled}</div>
                <div className="stat-label">Enrolled Courses</div>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.coursesCompleted}</div>
                <div className="stat-label">Completed Courses</div>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-value">{stats.hoursLearned}h</div>
                <div className="stat-label">Hours Learned</div>
              </div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-value">{stats.certificatesEarned}</div>
                <div className="stat-label">Certificates</div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Left Column - Charts */}
            <div className="left-column">
              {/* Progress Overview */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Learning Progress</h3>
                </div>
                <div className="progress-overview">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="progress-legend">
                    <div className="legend-item">
                      <span className="legend-dot green"></span>
                      <span>Completed: {stats.coursesCompleted}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot blue"></span>
                      <span>In Progress: {stats.coursesEnrolled - stats.coursesCompleted}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Weekly Activity</h3>
                  <p>Hours spent learning</p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="day" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                    <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="hours" fill="#4FD1C5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Achievement Card */}
              <div className="achievement-card">
                <div className="achievement-icon">🔥</div>
                <div className="achievement-content">
                  <h3>{stats.streak} Day Streak!</h3>
                  <p>Keep up the great work! You're on fire!</p>
                </div>
              </div>
            </div>

            {/* Right Column - Courses */}
            <div className="right-column">
              <div className="courses-section">
                <div className="section-header">
                  <div className="tabs">
                    <button 
                      className={`tab-btn ${activeTab === 'enrolled' ? 'active' : ''}`}
                      onClick={() => { setActiveTab('enrolled'); setCurrentPage(1); }}
                    >
                      My Courses ({enrolledCourses.length})
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
                      onClick={() => { setActiveTab('browse'); setCurrentPage(1); }}
                    >
                      Browse All
                    </button>
                  </div>
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="category-filter"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="courses-grid">
                  {currentCourses.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        {activeTab === 'enrolled' ? '📚' : '🔍'}
                      </div>
                      <h3>
                        {activeTab === 'enrolled' 
                          ? 'No Enrolled Courses' 
                          : 'No Courses Found'}
                      </h3>
                      <p>
                        {activeTab === 'enrolled'
                          ? 'Start your learning journey by browsing available courses'
                          : 'Try adjusting your search or filter'}
                      </p>
                      {activeTab === 'enrolled' && (
                        <button 
                          className="browse-btn"
                          onClick={() => setActiveTab('browse')}
                        >
                          Browse Courses
                        </button>
                      )}
                    </div>
                  ) : (
                    currentCourses.map((item, index) => {
                      const course = item.course || item;
                      const enrollment = item.course ? item : null;
                      const progress = enrollment?.progress || 0;
                      const isEnrolled = activeTab === 'enrolled';

                      return (
                        <div key={course._id || index} className="course-card">
                          <div className="course-image">
                            <img 
                              src={course.thumbnail || `https://source.unsplash.com/400x250/?${course.category},education`}
                              alt={course.title}
                            />
                            {isEnrolled && (
                              <div className="progress-badge">
                                {progress}%
                              </div>
                            )}
                            {!isEnrolled && (
                              <div className="price-badge">
                                {course.isPaid ? `₹${course.price}` : 'FREE'}
                              </div>
                            )}
                          </div>
                          <div className="course-body">
                            <div className="course-meta">
                              <span className="category-tag">{course.category}</span>
                              <span className="level-tag">{course.level}</span>
                            </div>
                            <h3 className="course-title">{course.title}</h3>
                            <p className="course-desc">
                              {course.description?.substring(0, 80)}...
                            </p>
                            {isEnrolled && (
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            )}
                            <div className="course-footer">
                              {isEnrolled ? (
                                <button 
                                  className="continue-btn"
                                  onClick={() => handleContinueLearning(course._id)}
                                >
                                  {progress === 100 ? '🏆 Review' : '▶️ Continue Learning'}
                                </button>
                              ) : (
                                <button 
                                  className="enroll-btn"
                                  onClick={() => handleEnrollCourse(course._id)}
                                >
                                  Enroll Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="page-btn arrow" 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </button>
                    {[...Array(Math.min(totalPages, 4))].map((_, i) => (
                      <button
                        key={i + 1}
                        className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {totalPages > 4 && <span className="page-dots">...</span>}
                    <button 
                      className="page-btn arrow"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;