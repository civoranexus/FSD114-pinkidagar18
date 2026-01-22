import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalRevenue: 0,
    activeUsers: 0,
    platformGrowth: 0,
    avgCourseRating: 0
  });
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [systemHealth, setSystemHealth] = useState({
    server: 'Healthy',
    database: 'Healthy',
    api: 'Healthy',
    storage: '78%'
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchDashboardData();
    initializeActivities();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [coursesRes] = await Promise.all([
        api.get('/courses')
      ]);

      const coursesData = coursesRes.data?.data || [];
      setCourses(coursesData);

      // Calculate stats
      const totalCourses = coursesData.length;
      const totalStudents = coursesData.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
      const totalRevenue = coursesData.reduce((sum, c) => sum + (c.price * (c.enrolledStudents?.length || 0)), 0);
      const avgRating = coursesData.reduce((sum, c) => sum + (c.rating?.average || 0), 0) / totalCourses || 0;

      setStats({
        totalUsers: 1247,
        totalCourses,
        totalStudents,
        totalTeachers: 156,
        totalRevenue,
        activeUsers: 892,
        platformGrowth: 24,
        avgCourseRating: avgRating.toFixed(1)
      });

      // Mock users data
      setUsers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', joinDate: '2024-01-15', courses: 5 },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'teacher', status: 'active', joinDate: '2024-01-10', courses: 12 },
        { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'student', status: 'active', joinDate: '2024-02-01', courses: 3 },
        { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'teacher', status: 'active', joinDate: '2023-12-20', courses: 8 },
        { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'student', status: 'inactive', joinDate: '2024-01-25', courses: 2 },
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const initializeActivities = () => {
    setRecentActivities([
      { id: 1, type: 'user', message: 'New user registered: john@example.com', time: '5 min ago', icon: '👤', color: '#3B82F6' },
      { id: 2, type: 'course', message: 'New course published: Advanced React', time: '1 hour ago', icon: '📚', color: '#10B981' },
      { id: 3, type: 'payment', message: 'Payment received: ₹12,000', time: '2 hours ago', icon: '💰', color: '#F59E0B' },
      { id: 4, type: 'review', message: 'New 5-star review on Web Development', time: '3 hours ago', icon: '⭐', color: '#EF4444' },
      { id: 5, type: 'system', message: 'Database backup completed', time: '5 hours ago', icon: '⚙️', color: '#8B5CF6' },
      { id: 6, type: 'alert', message: 'Server CPU usage: 78%', time: '1 day ago', icon: '⚠️', color: '#F97316' },
    ]);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme');
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this user? This action cannot be undone!')) return;
    toast.success('User deleted successfully');
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleUserStatusToggle = (userId) => {
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
    toast.success('User status updated');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  // Chart Data
  const userGrowthData = [
    { month: 'Jan', users: 450, active: 380 },
    { month: 'Feb', users: 680, active: 590 },
    { month: 'Mar', users: 820, active: 720 },
    { month: 'Apr', users: 1050, active: 892 },
    { month: 'May', users: 1247, active: 1089 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 12000 },
    { month: 'Feb', revenue: 68000, expenses: 15000 },
    { month: 'Mar', revenue: 92000, expenses: 18000 },
    { month: 'Apr', revenue: 125000, expenses: 22000 },
    { month: 'May', revenue: 156000, expenses: 25000 },
  ];

  const userDistribution = [
    { name: 'Students', value: 78, color: '#3B82F6' },
    { name: 'Teachers', value: 13, color: '#10B981' },
    { name: 'Admins', value: 2, color: '#F59E0B' },
    { name: 'Inactive', value: 7, color: '#EF4444' },
  ];

  const categoryPerformance = [
    { category: 'Programming', courses: 45, students: 890, revenue: 125000 },
    { category: 'Design', courses: 28, students: 560, revenue: 78000 },
    { category: 'Business', courses: 32, students: 640, revenue: 89000 },
    { category: 'Marketing', courses: 18, students: 320, revenue: 45000 },
  ];

  const platformMetrics = [
    { metric: 'Performance', score: 95 },
    { metric: 'Reliability', score: 98 },
    { metric: 'Security', score: 92 },
    { metric: 'Scalability', score: 88 },
    { metric: 'User Satisfaction', score: 94 },
  ];

  const courseStatusData = [
    { status: 'Published', count: 89, color: '#10B981' },
    { status: 'Draft', count: 23, color: '#F59E0B' },
    { status: 'Archived', count: 12, color: '#6B7280' },
  ];

  return (
    <div className={`admin-dashboard ${theme}`}>
      {/* Animated Background */}
      <div className="particles-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="container">
        {/* FEATURE 1: Enhanced Header with System Status */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>
                <span className="admin-badge">👑</span>
                Admin Control Center
              </h1>
              <p className="header-subtitle">
                🌐 Managing {stats.totalUsers?.toLocaleString() || 0} users across the platform
              </p>
            </div>
            <div className="header-actions">
              {/* System Health Indicator */}
              <div className="system-health">
                <div className="health-dot pulse"></div>
                <span>All Systems Operational</span>
              </div>

              {/* Theme Toggle */}
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* Quick Actions */}
              <button className="action-btn" title="System Settings">
                ⚙️
              </button>
              <button className="action-btn alert-btn" title="Alerts">
                🔔
                <span className="notification-badge">3</span>
              </button>
            </div>
          </div>
        </div>

        {/* FEATURE 2: Advanced Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon floating">👥</div>
            <div className="stat-info">
              <h3 className="counter">{stats.totalUsers.toLocaleString()}</h3>
              <p>Total Users</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ {stats.platformGrowth}% Growth</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-green slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon floating">📚</div>
            <div className="stat-info">
              <h3 className="counter">{stats.totalCourses}</h3>
              <p>Total Courses</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ 15 New This Month</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-orange slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon floating">💰</div>
            <div className="stat-info">
              <h3 className="counter">₹{(stats.totalRevenue / 1000).toFixed(0)}K</h3>
              <p>Total Revenue</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ ₹45K This Month</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-purple slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="stat-icon floating">🔥</div>
            <div className="stat-info">
              <h3 className="counter">{stats.activeUsers}</h3>
              <p>Active Users</p>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-pink slide-in" style={{ animationDelay: '0.5s' }}>
            <div className="stat-icon floating">🎓</div>
            <div className="stat-info">
              <h3 className="counter">{stats.totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div className="stat-card stat-card-cyan slide-in" style={{ animationDelay: '0.6s' }}>
            <div className="stat-icon floating">👨‍🏫</div>
            <div className="stat-info">
              <h3 className="counter">{stats.totalTeachers}</h3>
              <p>Total Teachers</p>
            </div>
          </div>

          <div className="stat-card stat-card-indigo slide-in" style={{ animationDelay: '0.7s' }}>
            <div className="stat-icon floating">⭐</div>
            <div className="stat-info">
              <h3 className="counter">{stats.avgCourseRating}</h3>
              <p>Avg Course Rating</p>
            </div>
          </div>

          <div className="stat-card stat-card-teal slide-in" style={{ animationDelay: '0.8s' }}>
            <div className="stat-icon floating">📊</div>
            <div className="stat-info">
              <h3 className="counter">98%</h3>
              <p>Platform Uptime</p>
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
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Management
          </button>
          <button
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 Course Management
          </button>
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          <button
            className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            💰 Revenue
          </button>
          <button
            className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            ⚙️ System Health
          </button>
        </div>

        {/* FEATURE 4-10: Advanced Charts & Analytics */}
        {activeTab === 'overview' && (
          <>
            <div className="charts-section">
              {/* User Growth Chart */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>📈 User Growth</h3>
                  <p>Total and active users over time</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" fillOpacity={1} fill="url(#colorUsers)" name="Total Users" />
                    <Area type="monotone" dataKey="active" stroke="#10B981" fillOpacity={1} fill="url(#colorActive)" name="Active Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* User Distribution */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>🥧 User Distribution</h3>
                  <p>Users by role and status</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                    >
                      {userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Performance */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>🎯 Category Performance</h3>
                  <p>Courses and revenue by category</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="courses" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Courses" />
                    <Bar dataKey="students" fill="#10B981" radius={[8, 8, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FEATURE 11: Real-time Activity Feed */}
            <div className="activity-section">
              <h3>📋 Recent Platform Activity</h3>
              <div className="activity-feed">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="activity-item" style={{ borderLeftColor: activity.color }}>
                    <div className="activity-icon" style={{ background: activity.color }}>
                      {activity.icon}
                    </div>
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

        {/* FEATURE 12: User Management */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>👥 User Management</h2>
              <div className="user-controls">
                <input
                  type="text"
                  placeholder="🔍 Search users..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="filter-select"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Admins</option>
                </select>
                <button className="btn btn-primary">
                  ➕ Add User
                </button>
              </div>
            </div>

            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Courses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="table-row-hover">
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">{user.name.charAt(0)}</div>
                          <div>
                            <strong>{user.name}</strong>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${user.status}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                      <td>{user.courses}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelectedUser(user)}
                          >
                            👁️ View
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleUserStatusToggle(user.id)}
                          >
                            {user.status === 'active' ? '🔒 Suspend' : '✅ Activate'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteUser(user.id)}
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
          </div>
        )}

        {/* FEATURE 13: Course Management */}
        {activeTab === 'courses' && (
          <div className="courses-section">
            <div className="section-header">
              <h2>📚 Course Management</h2>
              <div className="course-stats-mini">
                <div className="mini-stat">
                  <strong>{courses.length}</strong>
                  <span>Total</span>
                </div>
                <div className="mini-stat">
                  <strong>{courses.filter(c => c.status === 'published').length}</strong>
                  <span>Published</span>
                </div>
                <div className="mini-stat">
                  <strong>{courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0)}</strong>
                  <span>Enrollments</span>
                </div>
              </div>
            </div>

            <div className="courses-grid-admin">
              {courses.map((course) => (
                <div key={course._id} className="admin-course-card">
                  <div className="course-thumbnail-admin">
                    <img
                      src={course.thumbnail || 'https://via.placeholder.com/400x250?text=Course'}
                      alt={course.title}
                    />
                    <span className={`status-badge-overlay status-${course.status}`}>
                      {course.status}
                    </span>
                  </div>
                  <div className="course-content-admin">
                    <h4>{course.title}</h4>
                    <div className="course-meta-admin">
                      <span>👨‍🏫 {course.instructor?.name}</span>
                      <span>👥 {course.enrolledStudents?.length || 0} students</span>
                      <span>⭐ {course.rating?.average?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="course-actions-admin">
                      <button className="btn btn-sm btn-secondary">Edit</button>
                      <button className="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEATURE 14: Revenue Analytics */}
        {activeTab === 'revenue' && (
          <div className="revenue-section">
            <div className="section-header">
              <h2>💰 Revenue Analytics</h2>
              <div className="time-range-selector">
                <button className={selectedTimeRange === 'week' ? 'active' : ''} onClick={() => setSelectedTimeRange('week')}>Week</button>
                <button className={selectedTimeRange === 'month' ? 'active' : ''} onClick={() => setSelectedTimeRange('month')}>Month</button>
                <button className={selectedTimeRange === 'year' ? 'active' : ''} onClick={() => setSelectedTimeRange('year')}>Year</button>
              </div>
            </div>

            <div className="revenue-stats-grid">
              <div className="revenue-card-large">
                <h4>💵 Total Revenue</h4>
                <p className="revenue-amount-large">₹{stats.totalRevenue.toLocaleString()}</p>
                <span className="revenue-change positive">+28% from last period</span>
              </div>
              <div className="revenue-card-large">
                <h4>📊 Net Profit</h4>
                <p className="revenue-amount-large">₹{Math.round(stats.totalRevenue * 0.72).toLocaleString()}</p>
                <span className="revenue-change positive">+18% margin</span>
              </div>
              <div className="revenue-card-large">
                <h4>💳 Avg Transaction</h4>
                <p className="revenue-amount-large">₹{Math.round(stats.totalRevenue / stats.totalStudents).toLocaleString()}</p>
                <span className="revenue-change">Per student</span>
              </div>
            </div>

            <div className="chart-card zoom-in" style={{ marginTop: '2rem' }}>
              <div className="chart-header">
                <h3>📊 Revenue vs Expenses</h3>
                <p>Financial overview</p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 6 }} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 6 }} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* FEATURE 15: System Health Monitor */}
        {activeTab === 'system' && (
          <div className="system-section">
            <div className="section-header">
              <h2>⚙️ System Health & Performance</h2>
            </div>

            <div className="system-health-grid">
              <div className="health-card">
                <div className="health-icon">🖥️</div>
                <h4>Server Status</h4>
                <p className="health-status healthy">{systemHealth.server}</p>
                <div className="health-metric">
                  <span>CPU: 45%</span>
                  <span>Memory: 62%</span>
                </div>
              </div>

              <div className="health-card">
                <div className="health-icon">🗄️</div>
                <h4>Database</h4>
                <p className="health-status healthy">{systemHealth.database}</p>
                <div className="health-metric">
                  <span>Queries/sec: 234</span>
                  <span>Response: 12ms</span>
                </div>
              </div>

              <div className="health-card">
                <div className="health-icon">🌐</div>
                <h4>API Status</h4>
                <p className="health-status healthy">{systemHealth.api}</p>
                <div className="health-metric">
                  <span>Uptime: 99.8%</span>
                  <span>Requests: 12.4K/hr</span>
                </div>
              </div>

              <div className="health-card">
                <div className="health-icon">💾</div>
                <h4>Storage</h4>
                <p className="health-status warning">{systemHealth.storage} Used</p>
                <div className="health-metric">
                  <span>Total: 500GB</span>
                  <span>Free: 110GB</span>
                </div>
              </div>
            </div>

            <div className="chart-card zoom-in" style={{ marginTop: '2rem' }}>
              <div className="chart-header">
                <h3>📊 Platform Performance Metrics</h3>
                <p>Overall system performance scores</p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={platformMetrics}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" stroke="#6B7280" />
                  <PolarRadiusAxis stroke="#6B7280" />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-deep-section">
            <div className="section-header">
              <h2>📈 Deep Analytics</h2>
            </div>

            <div className="analytics-grid-large">
              <div className="analytics-card-large">
                <h4>📊 User Engagement</h4>
                <p className="analytics-value">87%</p>
                <span className="analytics-change positive">+12% increase</span>
              </div>
              <div className="analytics-card-large">
                <h4>⏱️ Avg Session Time</h4>
                <p className="analytics-value">24 min</p>
                <span className="analytics-change positive">+8 min longer</span>
              </div>
              <div className="analytics-card-large">
                <h4>🎯 Course Completion</h4>
                <p className="analytics-value">72%</p>
                <span className="analytics-change positive">Industry leading</span>
              </div>
              <div className="analytics-card-large">
                <h4>🌟 User Satisfaction</h4>
                <p className="analytics-value">4.8/5</p>
                <span className="analytics-change positive">Excellent</span>
              </div>
            </div>

            <div className="chart-card zoom-in" style={{ marginTop: '2rem' }}>
              <div className="chart-header">
                <h3>📊 Course Status Distribution</h3>
                <p>Breakdown of course statuses</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    dataKey="count"
                  >
                    {courseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;