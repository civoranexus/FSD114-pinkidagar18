import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({});

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    systemHealth: 100,
    avgAttendance: 0
  });

  useEffect(() => {
    fetchAllData();
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
        fetchNotifications(),
        fetchSystemStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data?.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/admin/teachers');
      setTeachers(data?.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data?.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/admin/subjects');
      setSubjects(data?.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/admin/attendance');
      setAttendance(data?.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      setNotifications(data?.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data?.data || stats);
    } catch (error) {
      // Use mock data if API fails
      setStats({
        totalStudents: students.length || 1250,
        totalTeachers: teachers.length || 85,
        totalCourses: courses.length || 42,
        totalRevenue: 2850000,
        activeUsers: 1180,
        pendingApprovals: 15,
        systemHealth: 98,
        avgAttendance: 87.5
      });
    }
  };

  // CRUD Operations
  const handleAdd = (type) => {
    setModalType(type);
    setSelectedItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/admin/${type}/${id}`);
      toast.success(`${type} deleted successfully!`);
      fetchAllData();
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedItem) {
        // Update
        await api.put(`/admin/${modalType}/${selectedItem._id}`, formData);
        toast.success(`${modalType} updated successfully!`);
      } else {
        // Create
        await api.post(`/admin/${modalType}`, formData);
        toast.success(`${modalType} created successfully!`);
      }
      
      setShowModal(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to save ${modalType}`);
    }
  };

  const handleApprove = async (type, id) => {
    try {
      await api.put(`/admin/${type}/${id}/approve`);
      toast.success(`${type} approved!`);
      fetchAllData();
    } catch (error) {
      toast.error(`Failed to approve ${type}`);
    }
  };

  const handleReject = async (type, id) => {
    try {
      await api.put(`/admin/${type}/${id}/reject`);
      toast.success(`${type} rejected!`);
      fetchAllData();
    } catch (error) {
      toast.error(`Failed to reject ${type}`);
    }
  };

  const handleBroadcastNotification = async (message) => {
    try {
      await api.post('/admin/notifications/broadcast', { message });
      toast.success('Notification sent to all users!');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  // Chart Data
  const userGrowthData = [
    { month: 'Jan', students: 980, teachers: 72 },
    { month: 'Feb', students: 1050, teachers: 75 },
    { month: 'Mar', students: 1120, teachers: 78 },
    { month: 'Apr', students: 1180, teachers: 82 },
    { month: 'May', students: 1220, teachers: 84 },
    { month: 'Jun', students: 1250, teachers: 85 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 1850000 },
    { month: 'Feb', revenue: 2100000 },
    { month: 'Mar', revenue: 2350000 },
    { month: 'Apr', revenue: 2550000 },
    { month: 'May', revenue: 2700000 },
    { month: 'Jun', revenue: 2850000 }
  ];

  const courseDistribution = [
    { name: 'Programming', value: 15, color: '#3B82F6' },
    { name: 'Design', value: 10, color: '#10B981' },
    { name: 'Business', value: 8, color: '#F59E0B' },
    { name: 'Marketing', value: 6, color: '#8B5CF6' },
    { name: 'Data Science', value: 3, color: '#EC4899' }
  ];

  const recentActivities = [
    { icon: '👤', title: 'New Student Registration', desc: 'John Doe registered', time: '5 min ago' },
    { icon: '📚', title: 'Course Published', desc: 'Advanced React by Sarah', time: '15 min ago' },
    { icon: '💰', title: 'Payment Received', desc: '₹15,000 from enrollment', time: '1 hour ago' },
    { icon: '🎓', title: 'Certificate Issued', desc: 'Web Dev certificate to Mike', time: '2 hours ago' },
    { icon: '👨‍🏫', title: 'New Teacher Joined', desc: 'Prof. Kumar approved', time: '3 hours ago' }
  ];

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">E</div>
            <div className="logo-text">EduVillage</div>
          </div>
          <p className="logo-subtitle">Admin Control Center</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-title">MAIN</div>
            <ul className="nav-menu">
              <li className="nav-item">
                <a 
                  href="#" 
                  className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('dashboard'); }}
                >
                  <span className="nav-icon">📊</span>
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div className="nav-section">
            <div className="nav-title">MANAGEMENT</div>
            <ul className="nav-menu">
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'students' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('students'); }}
                >
                  <span className="nav-icon">👥</span>
                  Students
                  <span className="notification-badge">{students.length}</span>
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'teachers' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('teachers'); }}
                >
                  <span className="nav-icon">👨‍🏫</span>
                  Teachers
                  <span className="notification-badge">{teachers.length}</span>
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'courses' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('courses'); }}
                >
                  <span className="nav-icon">📚</span>
                  Courses
                  {stats.pendingApprovals > 0 && (
                    <span className="notification-badge">{stats.pendingApprovals}</span>
                  )}
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'subjects' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('subjects'); }}
                >
                  <span className="nav-icon">📖</span>
                  Subjects
                </a>
              </li>
            </ul>
          </div>

          <div className="nav-section">
            <div className="nav-title">OPERATIONS</div>
            <ul className="nav-menu">
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'timetable' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('timetable'); }}
                >
                  <span className="nav-icon">🗓️</span>
                  Timetable
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'attendance' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('attendance'); }}
                >
                  <span className="nav-icon">📅</span>
                  Attendance
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'notifications' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('notifications'); }}
                >
                  <span className="nav-icon">🔔</span>
                  Notifications
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'reports' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('reports'); }}
                >
                  <span className="nav-icon">📈</span>
                  Reports
                </a>
              </li>
            </ul>
          </div>

          <div className="nav-section">
            <div className="nav-title">SYSTEM</div>
            <ul className="nav-menu">
              <li className="nav-item">
                <a 
                  href="#"
                  className={`nav-link ${activeSection === 'settings' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveSection('settings'); }}
                >
                  <span className="nav-icon">⚙️</span>
                  Settings
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div className="user-section">
          <div className="user-card">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <h4>{user?.name || 'Admin'}</h4>
              <p>System Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Mobile Toggle */}
      <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        ☰
      </button>

      {/* Main Content */}
      <div className="main-content">
        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Dashboard</span>
                </div>
                <h1 className="page-title">System Overview</h1>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats.totalStudents.toLocaleString()}</div>
                <div className="stat-label">Total Students</div>
                <div className="stat-trend trend-up">
                  <span>↑ 12.5%</span> from last month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👨‍🏫</div>
                <div className="stat-value">{stats.totalTeachers}</div>
                <div className="stat-label">Total Teachers</div>
                <div className="stat-trend trend-up">
                  <span>↑ 8.3%</span> from last month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-value">{stats.totalCourses}</div>
                <div className="stat-label">Total Courses</div>
                <div className="stat-trend trend-up">
                  <span>↑ 15.2%</span> from last month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-value">₹{(stats.totalRevenue / 1000000).toFixed(2)}M</div>
                <div className="stat-label">Total Revenue</div>
                <div className="stat-trend trend-up">
                  <span>↑ 23.1%</span> from last month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🟢</div>
                <div className="stat-value">{stats.activeUsers.toLocaleString()}</div>
                <div className="stat-label">Active Users</div>
                <div className="stat-trend trend-up">
                  <span>↑ 5.7%</span> from last week
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{stats.pendingApprovals}</div>
                <div className="stat-label">Pending Approvals</div>
                <div className="stat-trend">
                  <span>🔔</span> Needs attention
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{stats.avgAttendance}%</div>
                <div className="stat-label">Avg Attendance</div>
                <div className="stat-trend trend-up">
                  <span>↑ 3.2%</span> from last month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💚</div>
                <div className="stat-value">{stats.systemHealth}%</div>
                <div className="stat-label">System Health</div>
                <div className="stat-trend trend-up">
                  <span>✓</span> All systems operational
                </div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
              {/* Left Column */}
              <div className="left-column">
                {/* User Growth Chart */}
                <div className="content-card">
                  <div className="card-header">
                    <h2 className="card-title">User Growth</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="students" stroke="#3B82F6" fillOpacity={1} fill="url(#colorStudents)" />
                      <Area type="monotone" dataKey="teachers" stroke="#10B981" fillOpacity={1} fill="url(#colorTeachers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Revenue Chart */}
                <div className="content-card">
                  <div className="card-header">
                    <h2 className="card-title">Revenue Analytics</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip formatter={(value) => `₹${(value / 1000000).toFixed(2)}M`} />
                      <Bar dataKey="revenue" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Course Distribution */}
                <div className="content-card">
                  <div className="card-header">
                    <h2 className="card-title">Course Distribution</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={courseDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {courseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column */}
              <div className="right-column">
                {/* Recent Activities */}
                <div className="content-card">
                  <div className="card-header">
                    <h2 className="card-title">Recent Activities</h2>
                  </div>
                  <div className="activities-list">
                    {recentActivities.map((activity, idx) => (
                      <div key={idx} className="activity-item">
                        <div className="activity-icon">{activity.icon}</div>
                        <div className="activity-content">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-desc">{activity.desc}</div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="content-card">
                  <div className="card-header">
                    <h2 className="card-title">Quick Actions</h2>
                  </div>
                  <div className="quick-action-grid">
                    <div className="quick-action-card" onClick={() => handleAdd('student')}>
                      <div className="quick-action-icon">👤</div>
                      <div className="quick-action-title">Add Student</div>
                    </div>
                    <div className="quick-action-card" onClick={() => handleAdd('teacher')}>
                      <div className="quick-action-icon">👨‍🏫</div>
                      <div className="quick-action-title">Add Teacher</div>
                    </div>
                    <div className="quick-action-card" onClick={() => handleAdd('course')}>
                      <div className="quick-action-icon">📚</div>
                      <div className="quick-action-title">Add Course</div>
                    </div>
                    <div className="quick-action-card" onClick={() => setActiveSection('notifications')}>
                      <div className="quick-action-icon">🔔</div>
                      <div className="quick-action-title">Send Notification</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENTS SECTION */}
        {activeSection === 'students' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Students</span>
                </div>
                <h1 className="page-title">Student Management</h1>
              </div>
              <button onClick={() => handleAdd('student')} className="btn btn-primary">
                <span>+</span> Add Student
              </button>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">All Students ({students.length})</h2>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Enrolled Courses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => 
                      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((student, idx) => (
                      <tr key={student._id || idx}>
                        <td>#{student._id?.slice(-6) || idx + 1}</td>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.enrolledCourses?.length || 0}</td>
                        <td>
                          <span className={`badge badge-${student.status === 'active' ? 'success' : 'warning'}`}>
                            {student.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleEdit('student', student)} className="action-btn btn-secondary">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete('students', student._id)} className="action-btn btn-danger">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TEACHERS SECTION */}
        {activeSection === 'teachers' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Teachers</span>
                </div>
                <h1 className="page-title">Teacher Management</h1>
              </div>
              <button onClick={() => handleAdd('teacher')} className="btn btn-primary">
                <span>+</span> Add Teacher
              </button>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">All Teachers ({teachers.length})</h2>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Courses Teaching</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.filter(t => 
                      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((teacher, idx) => (
                      <tr key={teacher._id || idx}>
                        <td>#{teacher._id?.slice(-6) || idx + 1}</td>
                        <td>{teacher.name}</td>
                        <td>{teacher.email}</td>
                        <td>{teacher.courses?.length || 0}</td>
                        <td>{teacher.totalStudents || 0}</td>
                        <td>
                          <span className={`badge badge-${teacher.status === 'active' ? 'success' : 'warning'}`}>
                            {teacher.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleEdit('teacher', teacher)} className="action-btn btn-secondary">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete('teachers', teacher._id)} className="action-btn btn-danger">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {teachers.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                          No teachers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* COURSES SECTION */}
        {activeSection === 'courses' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Courses</span>
                </div>
                <h1 className="page-title">Course Management</h1>
              </div>
              <button onClick={() => handleAdd('course')} className="btn btn-primary">
                <span>+</span> Add Course
              </button>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">All Courses ({courses.length})</h2>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Teacher</th>
                      <th>Category</th>
                      <th>Students</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.filter(c => 
                      c.title?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((course, idx) => (
                      <tr key={course._id || idx}>
                        <td>{course.title}</td>
                        <td>{course.teacher?.name || 'N/A'}</td>
                        <td>{course.category}</td>
                        <td>{course.enrolledStudents?.length || 0}</td>
                        <td>₹{course.price}</td>
                        <td>
                          <span className={`badge badge-${
                            course.status === 'published' ? 'success' : 
                            course.status === 'pending' ? 'warning' : 'danger'
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td>
                          {course.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove('courses', course._id)} className="action-btn btn-success">
                                ✓ Approve
                              </button>
                              <button onClick={() => handleReject('courses', course._id)} className="action-btn btn-danger">
                                ✗ Reject
                              </button>
                            </>
                          )}
                          <button onClick={() => handleEdit('course', course)} className="action-btn btn-secondary">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete('courses', course._id)} className="action-btn btn-danger">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                          No courses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBJECTS SECTION */}
        {activeSection === 'subjects' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Subjects</span>
                </div>
                <h1 className="page-title">Subject Management</h1>
              </div>
              <button onClick={() => handleAdd('subject')} className="btn btn-primary">
                <span>+</span> Add Subject
              </button>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">All Subjects ({subjects.length})</h2>
              </div>

              <div className="subjects-grid">
                {subjects.map((subject, idx) => (
                  <div key={subject._id || idx} className="subject-card">
                    <div className="subject-icon">{subject.icon || '📖'}</div>
                    <h3>{subject.name}</h3>
                    <p>{subject.description}</p>
                    <div className="subject-meta">
                      <span>{subject.courseCount || 0} Courses</span>
                      <span>{subject.students || 0} Students</span>
                    </div>
                    <div className="subject-actions">
                      <button onClick={() => handleEdit('subject', subject)} className="action-btn btn-secondary">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete('subjects', subject._id)} className="action-btn btn-danger">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                {subjects.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📖</div>
                    <h3>No Subjects</h3>
                    <p>Add subjects to organize courses</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TIMETABLE SECTION */}
        {activeSection === 'timetable' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Timetable</span>
                </div>
                <h1 className="page-title">Class Schedule</h1>
              </div>
              <button onClick={() => handleAdd('class')} className="btn btn-primary">
                <span>+</span> Add Class
              </button>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Weekly Schedule</h2>
              </div>
              <div className="timetable-grid">
                <p className="empty-text">Timetable functionality - Coming soon!</p>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE SECTION */}
        {activeSection === 'attendance' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Attendance</span>
                </div>
                <h1 className="page-title">Attendance Overview</h1>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Attendance Records</h2>
                <select className="form-select">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course</th>
                      <th>Total Students</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, idx) => (
                      <tr key={idx}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.course?.title}</td>
                        <td>{record.totalStudents}</td>
                        <td className="text-success">{record.present}</td>
                        <td className="text-danger">{record.absent}</td>
                        <td>
                          <span className={`badge badge-${
                            record.percentage >= 75 ? 'success' : 
                            record.percentage >= 50 ? 'warning' : 'danger'
                          }`}>
                            {record.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                          No attendance records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS SECTION */}
        {activeSection === 'notifications' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Notifications</span>
                </div>
                <h1 className="page-title">Notification Center</h1>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Send Broadcast</h2>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const message = e.target.message.value;
                handleBroadcastNotification(message);
                e.target.reset();
              }}>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea 
                    name="message"
                    className="form-textarea"
                    placeholder="Enter your message..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  📢 Send to All Users
                </button>
              </form>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Recent Notifications</h2>
              </div>
              <div className="notifications-list">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="notification-item">
                    <div className="notification-icon">📢</div>
                    <div className="notification-content">
                      <div className="notification-message">{notif.message}</div>
                      <div className="notification-time">
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="empty-text">No notifications sent yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeSection === 'reports' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Reports</span>
                </div>
                <h1 className="page-title">Analytics & Reports</h1>
              </div>
              <button onClick={() => toast.success('Report downloaded!')} className="btn btn-primary">
                📥 Download Report
              </button>
            </div>

            <div className="reports-grid">
              <div className="report-card">
                <h3>📊 User Analytics</h3>
                <p>Detailed user growth and engagement reports</p>
                <button className="btn btn-secondary">Generate Report</button>
              </div>
              <div className="report-card">
                <h3>💰 Revenue Report</h3>
                <p>Financial analytics and revenue tracking</p>
                <button className="btn btn-secondary">Generate Report</button>
              </div>
              <div className="report-card">
                <h3>📚 Course Performance</h3>
                <p>Course enrollment and completion rates</p>
                <button className="btn btn-secondary">Generate Report</button>
              </div>
              <div className="report-card">
                <h3>📅 Attendance Report</h3>
                <p>Student and teacher attendance summary</p>
                <button className="btn btn-secondary">Generate Report</button>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS SECTION */}
        {activeSection === 'settings' && (
          <div className="section">
            <div className="header">
              <div>
                <div className="breadcrumb">
                  <span>Admin</span> / <span className="breadcrumb-current">Settings</span>
                </div>
                <h1 className="page-title">System Settings</h1>
              </div>
            </div>

            <div className="settings-grid">
              <div className="content-card">
                <h2 className="card-title">General Settings</h2>
                <div className="form-group">
                  <label className="form-label">Site Name</label>
                  <input type="text" className="form-input" defaultValue="EduVillage" />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Email</label>
                  <input type="email" className="form-input" defaultValue="admin@eduvillage.com" />
                </div>
                <button className="btn btn-primary">Save Changes</button>
              </div>

              <div className="content-card">
                <h2 className="card-title">System Health</h2>
                <div className="health-metrics">
                  <div className="health-item">
                    <span>Database</span>
                    <span className="badge badge-success">Healthy</span>
                  </div>
                  <div className="health-item">
                    <span>API Status</span>
                    <span className="badge badge-success">Online</span>
                  </div>
                  <div className="health-item">
                    <span>Storage</span>
                    <span className="badge badge-warning">78% Used</span>
                  </div>
                  <div className="health-item">
                    <span>Backup</span>
                    <span className="badge badge-success">Up to date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedItem ? 'Edit' : 'Add'} {modalType}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {modalType === 'student' || modalType === 'teacher' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    {!selectedItem && (
                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-input"
                          value={formData.password || ''}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                    )}
                  </>
                ) : modalType === 'course' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Course Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.category || 'Programming'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Programming">Programming</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </>
                ) : modalType === 'subject' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Subject Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </>
                ) : null}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;