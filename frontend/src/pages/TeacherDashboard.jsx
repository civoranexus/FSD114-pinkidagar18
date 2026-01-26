import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('week');
  const [editingCourse, setEditingCourse] = useState(null);
  const coursesPerPage = 6;

  const [stats, setStats] = useState({
    totalCourses: 0,
    totalVideos: 0,
    totalEarning: 0,
    engagementRate: 0,
    newEnrollments: 0
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

  // Fetch Data on Mount
  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-icon')) setShowNotifications(false);
      if (!e.target.closest('.user-profile')) setShowUserMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/courses/teacher/my-courses');
      const coursesData = data?.data || [];
      setCourses(coursesData);

      // Calculate comprehensive stats
      const totalCourses = coursesData.length;
      const totalVideos = coursesData.reduce((sum, c) => {
        const lessonCount = c.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
        return sum + lessonCount;
      }, 0);
      const totalEarning = coursesData.reduce((sum, c) => 
        sum + (c.price * (c.enrolledStudents?.length || 0)), 0
      );
      const totalStudents = coursesData.reduce((sum, c) => 
        sum + (c.enrolledStudents?.length || 0), 0
      );
      const engagementRate = totalStudents > 0 ? ((totalStudents / (totalCourses * 100)) * 100).toFixed(1) : 85.2;
      const newEnrollments = Math.floor(totalStudents * 0.2);

      setStats({
        totalCourses,
        totalVideos,
        totalEarning,
        engagementRate,
        newEnrollments
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Create Course Handler
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/courses', { ...newCourse, status: 'published' });
      toast.success('🎉 Course created successfully!');
      setShowModal(false);
      resetForm();
      await fetchTeacherData();
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  // Edit Course Handler
  const handleEditCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse.title || !editingCourse.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/courses/${editingCourse._id}`, editingCourse);
      toast.success('✅ Course updated successfully!');
      setShowEditModal(false);
      setEditingCourse(null);
      await fetchTeacherData();
    } catch (error) {
      console.error('Edit error:', error);
      toast.error(error.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  // Delete Course Handler
  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`Delete "${courseName}"? This action cannot be undone!`)) return;

    try {
      setLoading(true);
      await api.delete(`/courses/${courseId}`);
      toast.success('🗑️ Course deleted successfully');
      await fetchTeacherData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (course) => {
    setEditingCourse({ ...course });
    setShowEditModal(true);
  };

  // Form Reset
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

  // Module Management
  const addModule = (isEdit = false) => {
    const targetCourse = isEdit ? editingCourse : newCourse;
    const setter = isEdit ? setEditingCourse : setNewCourse;
    
    setter({
      ...targetCourse,
      modules: [...targetCourse.modules, {
        title: '',
        description: '',
        order: targetCourse.modules.length + 1,
        lessons: []
      }]
    });
  };

  const updateModule = (index, field, value, isEdit = false) => {
    const targetCourse = isEdit ? editingCourse : newCourse;
    const setter = isEdit ? setEditingCourse : setNewCourse;
    
    const updated = [...targetCourse.modules];
    updated[index][field] = value;
    setter({ ...targetCourse, modules: updated });
  };

  const removeModule = (index, isEdit = false) => {
    const targetCourse = isEdit ? editingCourse : newCourse;
    const setter = isEdit ? setEditingCourse : setNewCourse;
    
    setter({
      ...targetCourse,
      modules: targetCourse.modules.filter((_, i) => i !== index)
    });
  };

  // Lesson Management
  const addLesson = (moduleIndex, isEdit = false) => {
    const targetCourse = isEdit ? editingCourse : newCourse;
    const setter = isEdit ? setEditingCourse : setNewCourse;
    
    const updated = [...targetCourse.modules];
    updated[moduleIndex].lessons.push({
      title: '',
      description: '',
      contentType: 'video',
      contentUrl: '',
      duration: 10,
      order: updated[moduleIndex].lessons.length + 1
    });
    setter({ ...targetCourse, modules: updated });
  };

  const updateLesson = (moduleIndex, lessonIndex, field, value, isEdit = false) => {
    const targetCourse = isEdit ? editingCourse : newCourse;
    const setter = isEdit ? setEditingCourse : setNewCourse;
    
    const updated = [...targetCourse.modules];
    updated[moduleIndex].lessons[lessonIndex][field] = value;
    setter({ ...targetCourse, modules: updated });
  };

  const removeLesson = (moduleIndex, lessonIndex, isEdit = false) => {
    const targetCourse = isEdit ? editingCourse : newCourse;
    const setter = isEdit ? setEditingCourse : setNewCourse;
    
    const updated = [...targetCourse.modules];
    updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setter({ ...targetCourse, modules: updated });
  };

  // Sorting Handler
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page
  };

  // Refresh Handler
  const handleRefresh = async () => {
    await fetchTeacherData();
    toast.success('🔄 Dashboard refreshed!');
  };

  // Logout Handler
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
      toast.success('👋 Logged out successfully');
    }
  };

  // View Details Handler
  const handleViewDetails = () => {
    const message = stats.newEnrollments > 0 
      ? `🎉 ${stats.newEnrollments} new students enrolled today!` 
      : 'No new enrollments today';
    toast.info(message);
  };

  // Navigate to course detail
  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // Loading State
  if (loading && courses.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Chart Data Generator
  const getChartData = () => {
    if (chartPeriod === 'week') {
      return [
        { day: 'Sat', value: 20 }, { day: 'Sun', value: 35 }, { day: 'Mon', value: 25 },
        { day: 'Tue', value: 45 }, { day: 'Wed', value: 30 }, { day: 'Thu', value: 40 }, { day: 'Fri', value: 35 }
      ];
    } else if (chartPeriod === 'month') {
      return [
        { day: 'Week 1', value: 120 }, { day: 'Week 2', value: 150 },
        { day: 'Week 3', value: 140 }, { day: 'Week 4', value: 180 }
      ];
    } else {
      return [
        { day: 'Jan', value: 450 }, { day: 'Feb', value: 520 }, { day: 'Mar', value: 480 },
        { day: 'Apr', value: 600 }, { day: 'May', value: 550 }, { day: 'Jun', value: 650 }
      ];
    }
  };

  // Filter and Sort Courses
  const getFilteredCourses = () => {
    let filtered = [...courses];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'video':
          aVal = a.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
          bVal = b.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'sales':
          aVal = a.enrolledStudents?.length || 0;
          bVal = b.enrolledStudents?.length || 0;
          break;
        case 'earning':
          aVal = a.price * (a.enrolledStudents?.length || 0);
          bVal = b.price * (b.enrolledStudents?.length || 0);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredCourses = getFilteredCourses();

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const courseIcons = ['📱', '🎨', '💡', '🎮', '⭐', '📚', '🚀', '💻', '🎯', '🔥'];
  const courseColors = ['blue', 'purple', 'green', 'orange', 'pink', 'blue', 'purple', 'green', 'orange', 'pink'];
  const categories = ['all', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science'];

  // Modal Component for Course Form
  const CourseFormModal = ({ isEdit, course, onSubmit, onClose }) => {
    const targetCourse = isEdit ? editingCourse : newCourse;
    const setter = isEdit ? setEditingCourse : setNewCourse;

    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{isEdit ? 'Edit Course' : 'Create New Course'}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={targetCourse.title}
                  onChange={(e) => setter({ ...targetCourse, title: e.target.value })}
                  placeholder="e.g., Complete Web Development"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-textarea"
                  value={targetCourse.description}
                  onChange={(e) => setter({ ...targetCourse, description: e.target.value })}
                  placeholder="What will students learn?"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={targetCourse.category}
                    onChange={(e) => setter({ ...targetCourse, category: e.target.value })}
                  >
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select
                    className="form-select"
                    value={targetCourse.level}
                    onChange={(e) => setter({ ...targetCourse, level: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={targetCourse.isPaid}
                    onChange={(e) => setter({ ...targetCourse, isPaid: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  This is a paid course
                </label>
              </div>

              {targetCourse.isPaid && (
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={targetCourse.price}
                    onChange={(e) => setter({ ...targetCourse, price: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Thumbnail URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={targetCourse.thumbnail}
                  onChange={(e) => setter({ ...targetCourse, thumbnail: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Modules Section */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Course Content</h3>
                  <button type="button" onClick={() => addModule(isEdit)} className="btn-secondary">
                    + Add Module
                  </button>
                </div>

                {targetCourse.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Module Title"
                        value={module.title}
                        onChange={(e) => updateModule(moduleIndex, 'title', e.target.value, isEdit)}
                        style={{ flex: 1, fontWeight: '600' }}
                      />
                      {targetCourse.modules.length > 1 && (
                        <button type="button" onClick={() => removeModule(moduleIndex, isEdit)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>
                          🗑️
                        </button>
                      )}
                    </div>

                    <button type="button" onClick={() => addLesson(moduleIndex, isEdit)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px dashed #CBD5E1', background: 'transparent', color: '#6B7280', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                      + Add Lesson
                    </button>

                    {module.lessons?.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Lesson Title"
                          value={lesson.title}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value, isEdit)}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="url"
                          className="form-input"
                          placeholder="Video URL"
                          value={lesson.contentUrl}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'contentUrl', e.target.value, isEdit)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" onClick={() => removeLesson(moduleIndex, lessonIndex, isEdit)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (isEdit ? 'Update Course' : 'Create Course')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="teacher-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">E</div>
          <div className="logo-text">EduVillage</div>
          <div className="logo-subtitle">Online Learning Platform</div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Dashboard page - You are already here!'); }} className="nav-item"><span className="nav-icon">📊</span>Dashboard</a>
          <a href="#" onClick={(e) => { e.preventDefault(); }} className="nav-item active"><span className="nav-icon">📚</span>Course</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/student/dashboard'); }} className="nav-item"><span className="nav-icon">👥</span>Student View</a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Transactions page - Coming soon!'); }} className="nav-item"><span className="nav-icon">💳</span>Transactions</a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Chat page - Coming soon!'); }} className="nav-item"><span className="nav-icon">💬</span>Chat</a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Schedule page - Coming soon!'); }} className="nav-item"><span className="nav-icon">📅</span>Schedule</a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Live Class page - Coming soon!'); }} className="nav-item"><span className="nav-icon">🎥</span>Live Class</a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Settings page - Coming soon!'); }} className="nav-item"><span className="nav-icon">⚙️</span>Setting</a>
        </nav>
      </div>

      {/* Mobile Sidebar Toggle */}
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
              My Courses
              <button className="refresh-btn" onClick={handleRefresh} title="Refresh Dashboard" disabled={loading}>
                {loading ? '⏳' : '🔄'}
              </button>
            </div>
            <div className="header-right">
              <div className="filter-btn">
                <span>🔍</span>Sort by: 
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={{ border: 'none', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', marginLeft: '4px' }}>
                  {categories.map(cat => (<option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>))}
                </select>
              </div>
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
              </div>
              <button className="add-course-btn" onClick={() => setShowModal(true)}><span>+</span>Add New course</button>
              <div className="notification-icon" onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }} style={{ cursor: 'pointer', position: 'relative' }}>
                🔔<span className="notification-badge">3</span>
                {showNotifications && (
                  <div style={{ position: 'absolute', top: '50px', right: '0', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '300px', padding: '1rem', zIndex: 1000 }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Notifications</h4>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>• New student enrolled in React Course</div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>• Course reached 100 students!</div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>• You have a new 5-star review</div>
                  </div>
                )}
              </div>
              <div className="user-profile" onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '1rem' }}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="dropdown-icon">▼</span>
                {showUserMenu && (
                  <div style={{ position: 'absolute', top: '50px', right: '0', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '200px', padding: '0.5rem 0', zIndex: 1000 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Profile page - Coming soon!'); setShowUserMenu(false); }} style={{ display: 'block', padding: '0.75rem 1rem', color: '#1F2937', textDecoration: 'none', fontSize: '0.9375rem' }}>👤 My Profile</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Settings page - Coming soon!'); setShowUserMenu(false); }} style={{ display: 'block', padding: '0.75rem 1rem', color: '#1F2937', textDecoration: 'none', fontSize: '0.9375rem' }}>⚙️ Settings</a>
                    <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'none', color: '#EF4444', fontSize: '0.9375rem', cursor: 'pointer' }}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Notification Card */}
              <div className="notification-card">
                <div className="notification-icon-large">🏆</div>
                <div className="notification-text">
                  Today your {stats.newEnrollments || 2} course have been sold by new learner!
                </div>
                <button className="view-details-btn" onClick={handleViewDetails}>View Details</button>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">📚</div>
                  <div className="stat-value">{stats.totalCourses}</div>
                  <div className="stat-label">Total Courses</div>
                </div>
                <div className="stat-card purple">
                  <div className="stat-icon">🎥</div>
                  <div className="stat-value">{stats.totalVideos}</div>
                  <div className="stat-label">Total Video</div>
                </div>
                <div className="stat-card orange">
                  <div className="stat-icon">💰</div>
                  <div className="stat-value">₹{(stats.totalEarning / 1000).toFixed(0)}k</div>
                  <div className="stat-label">Total Earning</div>
                </div>
                <div className="stat-card pink">
                  <div className="stat-icon">💖</div>
                  <div className="stat-value">{stats.engagementRate}%</div>
                  <div className="stat-label">Engagement Rate</div>
                </div>
              </div>

              {/* Chart Card */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">Selling Activity</div>
                  <select className="chart-filter" value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)}>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={getChartData()}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4FD1C5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4FD1C5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="day" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#4FD1C5" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Column - Table */}
            <div className="table-card">
              <div className="table-wrapper">
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort('name')}>Course Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                      <th className="sortable" onClick={() => handleSort('video')}>Video {sortBy === 'video' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                      <th className="sortable" onClick={() => handleSort('price')}>Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                      <th className="sortable" onClick={() => handleSort('sales')}>Sales {sortBy === 'sales' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                      <th className="sortable" onClick={() => handleSort('earning')}>Earning {sortBy === 'earning' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCourses.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                          {searchQuery || categoryFilter !== 'all' ? 'No courses found matching your filters.' : 'No courses yet. Create your first course!'}
                        </td>
                      </tr>
                    ) : (
                      currentCourses.map((course, index) => (
                        <tr key={course._id}>
                          <td>
                            <div className="course-name-cell">
                              <div className={`course-icon ${courseColors[index % courseColors.length]}`}>
                                {courseIcons[index % courseIcons.length]}
                              </div>
                              <span className="course-name">{course.title}</span>
                            </div>
                          </td>
                          <td>{course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0}</td>
                          <td className="price-cell">₹{course.price}</td>
                          <td>{course.enrolledStudents?.length || 0}</td>
                          <td className="earning-cell">₹{course.price * (course.enrolledStudents?.length || 0)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleViewCourse(course._id)}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid #3B82F6',
                                  background: '#EFF6FF',
                                  color: '#3B82F6',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                                title="View Course"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => openEditModal(course)}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid #10B981',
                                  background: '#ECFDF5',
                                  color: '#10B981',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                                title="Edit Course"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course._id, course.title)}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid #EF4444',
                                  background: '#FEF2F2',
                                  color: '#EF4444',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                                title="Delete Course"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn arrow" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>‹</button>
                  {[...Array(Math.min(totalPages, 4))].map((_, i) => (
                    <button key={i + 1} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  ))}
                  {totalPages > 4 && <span className="page-dots">...</span>}
                  <button className="page-btn arrow" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>›</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <CourseFormModal
          isEdit={false}
          course={newCourse}
          onSubmit={handleCreateCourse}
          onClose={() => { setShowModal(false); resetForm(); }}
        />
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <CourseFormModal
          isEdit={true}
          course={editingCourse}
          onSubmit={handleEditCourse}
          onClose={() => { setShowEditModal(false); setEditingCourse(null); }}
        />
      )}

      {/* Loading Overlay */}
      {loading && courses.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="loading-spinner"></div>
            <p>Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;