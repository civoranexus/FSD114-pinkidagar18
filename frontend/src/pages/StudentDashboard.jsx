import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State Management
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const coursesPerPage = 6;

  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    hoursLearned: 0,
    certificatesEarned: 0,
    averageProgress: 0,
    streak: 0,
    attendanceRate: 0,
    assignmentsCompleted: 0,
    assignmentsPending: 0,
    averageGrade: 0
  });

  // Fetch Data
  useEffect(() => {
    fetchStudentData();
    fetchAssignments();
    fetchAttendance();
    fetchUpcomingClasses();
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

      // Fetch certificates
      const { data: certsData } = await api.get('/certificates/my-certificates');
      setCertificates(certsData?.data || []);

      // Calculate stats
      const coursesEnrolled = enrolled.length;
      const coursesCompleted = enrolled.filter(e => e.progress === 100).length;
      const totalProgress = enrolled.reduce((sum, e) => sum + (e.progress || 0), 0);
      const averageProgress = enrolled.length > 0 ? (totalProgress / enrolled.length).toFixed(0) : 0;
      
      const hoursLearned = enrolled.reduce((sum, e) => {
        const completedLessons = e.completedLessons?.length || 0;
        return sum + (completedLessons * 5 / 60);
      }, 0).toFixed(1);

      setStats(prev => ({
        ...prev,
        coursesEnrolled,
        coursesCompleted,
        hoursLearned,
        certificatesEarned: coursesCompleted,
        averageProgress,
        streak: 7
      }));

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments/student/my-assignments');
      const assignmentsData = data?.data || [];
      setAssignments(assignmentsData);
      
      const completed = assignmentsData.filter(a => a.status === 'submitted').length;
      const pending = assignmentsData.filter(a => a.status === 'pending').length;
      
      setStats(prev => ({
        ...prev,
        assignmentsCompleted: completed,
        assignmentsPending: pending
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/attendance/my-attendance');
      const records = data?.data || [];
      setAttendanceRecords(records);
      
      const totalClasses = records.length;
      const presentClasses = records.filter(r => r.status === 'present').length;
      const attendanceRate = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : 0;
      
      setStats(prev => ({
        ...prev,
        attendanceRate
      }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      const { data } = await api.get('/classes/upcoming');
      setUpcomingClasses(data?.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
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

  // Face Recognition Attendance
  const startFaceCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        toast.success('📸 Camera started! Position your face');
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopFaceCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
      toast.info('Camera stopped');
    }
  };

  const captureAttendance = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');

    try {
      // Mock face recognition - in production, send to backend
      await api.post('/attendance/mark-face', { 
        image: imageData,
        courseId: enrolledCourses[0]?.course?._id 
      });
      
      toast.success('✅ Attendance marked successfully!');
      stopFaceCamera();
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  // QR Code Attendance
  const handleQRScan = async (qrData) => {
    try {
      await api.post('/attendance/mark-qr', { qrCode: qrData });
      toast.success('✅ Attendance marked via QR!');
      setShowQRScanner(false);
      fetchAttendance();
    } catch (error) {
      toast.error('Invalid QR code or failed to mark attendance');
    }
  };

  // Assignment Submission
  const handleSubmitAssignment = async (assignmentId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      toast.success('📝 Assignment submitted successfully!');
      fetchAssignments();
      setShowAssignmentModal(false);
    } catch (error) {
      toast.error('Failed to submit assignment');
    }
  };

  // Download Certificate
  const downloadCertificate = async (certificateId) => {
    try {
      const { data } = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('📜 Certificate downloaded!');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
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
        return course.title?.toLowerCase().includes(searchQuery.toLowerCase());
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
  const currentCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );
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

  const performanceData = [
    { subject: 'Attendance', value: parseInt(stats.attendanceRate) },
    { subject: 'Assignments', value: stats.assignmentsCompleted * 10 },
    { subject: 'Progress', value: parseInt(stats.averageProgress) },
    { subject: 'Engagement', value: 85 },
    { subject: 'Grades', value: stats.averageGrade || 75 }
  ];

  const categories = ['all', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science'];

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">E</div>
          <div className="logo-text">EduVillage</div>
          <div className="logo-subtitle">Student Portal</div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }} className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>Overview
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('enrolled'); }} className={`nav-item ${activeTab === 'enrolled' ? 'active' : ''}`}>
            <span className="nav-icon">📚</span>My Courses
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('browse'); }} className={`nav-item ${activeTab === 'browse' ? 'active' : ''}`}>
            <span className="nav-icon">🔍</span>Browse Courses
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('attendance'); }} className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}>
            <span className="nav-icon">📅</span>Attendance
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('assignments'); }} className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}>
            <span className="nav-icon">📝</span>Assignments
            {stats.assignmentsPending > 0 && (
              <span className="nav-badge">{stats.assignmentsPending}</span>
            )}
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('certificates'); }} className={`nav-item ${activeTab === 'certificates' ? 'active' : ''}`}>
            <span className="nav-icon">🏆</span>Certificates
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('schedule'); }} className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}>
            <span className="nav-icon">🗓️</span>Schedule
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('resources'); }} className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}>
            <span className="nav-icon">📖</span>Resources
          </a>
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
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
                <span className="notification-badge">{stats.assignmentsPending}</span>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>Notifications</h4>
                    <div className="notification-item">• {stats.assignmentsPending} pending assignments</div>
                    <div className="notification-item">• New course available: Advanced React</div>
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
                    <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Profile - Coming soon!'); }}>👤 My Profile</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Settings - Coming soon!'); }}>⚙️ Settings</a>
                    <hr />
                    <button onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
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
                    <div className="stat-label">Completed</div>
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
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.averageProgress}%</div>
                    <div className="stat-label">Avg Progress</div>
                  </div>
                </div>
                <div className="stat-card pink">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.attendanceRate}%</div>
                    <div className="stat-label">Attendance</div>
                  </div>
                </div>
                <div className="stat-card cyan">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.assignmentsCompleted}</div>
                    <div className="stat-label">Assignments Done</div>
                  </div>
                </div>
              </div>

              {/* Dashboard Grid */}
              <div className="dashboard-grid">
                {/* Left Column */}
                <div className="left-column">
                  {/* Progress Chart */}
                  <div className="chart-card">
                    <div className="chart-header">
                      <h3>Learning Progress</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={progressData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {progressData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Weekly Activity */}
                  <div className="chart-card">
                    <div className="chart-header">
                      <h3>Weekly Activity</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={weeklyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="day" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip />
                        <Bar dataKey="hours" fill="#4FD1C5" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Performance Radar */}
                  <div className="chart-card">
                    <div className="chart-header">
                      <h3>Performance Overview</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={performanceData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
                        <PolarRadiusAxis stroke="#9CA3AF" />
                        <Radar name="Performance" dataKey="value" stroke="#1E3A8A" fill="#3B82F6" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right Column */}
                <div className="right-column">
                  {/* Achievement Card */}
                  <div className="achievement-card">
                    <div className="achievement-icon">🔥</div>
                    <div className="achievement-content">
                      <h3>{stats.streak} Day Streak!</h3>
                      <p>Keep learning every day!</p>
                    </div>
                  </div>

                  {/* Upcoming Classes */}
                  <div className="upcoming-card">
                    <div className="card-header">
                      <h3>📅 Upcoming Classes</h3>
                    </div>
                    <div className="classes-list">
                      {upcomingClasses.length === 0 ? (
                        <p className="empty-text">No upcoming classes</p>
                      ) : (
                        upcomingClasses.slice(0, 5).map((cls, idx) => (
                          <div key={idx} className="class-item">
                            <div className="class-time">{new Date(cls.startTime).toLocaleTimeString()}</div>
                            <div className="class-info">
                              <div className="class-title">{cls.title}</div>
                              <div className="class-teacher">by {cls.teacher?.name}</div>
                            </div>
                            <button className="join-btn">Join</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Assignments */}
                  <div className="assignments-card">
                    <div className="card-header">
                      <h3>📝 Pending Assignments</h3>
                    </div>
                    <div className="assignments-list">
                      {assignments.filter(a => a.status === 'pending').slice(0, 4).map((assignment, idx) => (
                        <div key={idx} className="assignment-item">
                          <div className="assignment-info">
                            <div className="assignment-title">{assignment.title}</div>
                            <div className="assignment-course">{assignment.course?.title}</div>
                          </div>
                          <div className="assignment-due">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {assignments.filter(a => a.status === 'pending').length === 0 && (
                        <p className="empty-text">No pending assignments</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="attendance-section">
              <h2 className="section-title">📅 Attendance Management</h2>
              
              <div className="attendance-grid">
                {/* Face Recognition */}
                <div className="attendance-card">
                  <div className="card-header">
                    <h3>📸 Face Recognition Attendance</h3>
                  </div>
                  <div className="camera-container">
                    {isCameraActive ? (
                      <div className="video-wrapper">
                        <video ref={videoRef} autoPlay className="video-feed"></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        <div className="camera-controls">
                          <button onClick={captureAttendance} className="capture-btn">
                            📸 Mark Attendance
                          </button>
                          <button onClick={stopFaceCamera} className="stop-btn">
                            ⏹️ Stop Camera
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="camera-placeholder">
                        <div className="placeholder-icon">📷</div>
                        <p>Click below to start camera</p>
                        <button onClick={startFaceCamera} className="start-btn">
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Scanner */}
                <div className="attendance-card">
                  <div className="card-header">
                    <h3>📱 QR Code Attendance</h3>
                  </div>
                  <div className="qr-container">
                    {showQRScanner ? (
                      <div className="qr-scanner">
                        <div className="qr-placeholder">
                          <p>📱 Scan QR Code</p>
                          <p className="qr-instruction">Align QR code within frame</p>
                          <button onClick={() => handleQRScan('DEMO_QR_123')} className="scan-demo-btn">
                            Simulate Scan (Demo)
                          </button>
                          <button onClick={() => setShowQRScanner(false)} className="cancel-btn">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="qr-placeholder">
                        <div className="placeholder-icon">📱</div>
                        <p>Scan QR code to mark attendance</p>
                        <button onClick={() => setShowQRScanner(true)} className="start-btn">
                          Open Scanner
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance History */}
              <div className="attendance-history-card">
                <div className="card-header">
                  <h3>📊 Attendance History</h3>
                </div>
                <div className="table-wrapper">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Time</th>
                        <th>Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record, idx) => (
                        <tr key={idx}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.course?.title || 'N/A'}</td>
                          <td>{new Date(record.date).toLocaleTimeString()}</td>
                          <td>{record.method || 'Manual'}</td>
                          <td>
                            <span className={`badge badge-${record.status}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {attendanceRecords.length === 0 && (
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
            </div>
          )}

          {/* ASSIGNMENTS TAB */}
          {activeTab === 'assignments' && (
            <div className="assignments-section">
              <h2 className="section-title">📝 My Assignments</h2>
              
              <div className="assignments-grid">
                {assignments.map((assignment, idx) => (
                  <div key={idx} className="assignment-card-full">
                    <div className="assignment-header-full">
                      <div>
                        <h3>{assignment.title}</h3>
                        <p className="assignment-course-name">{assignment.course?.title}</p>
                      </div>
                      <span className={`badge badge-${assignment.status}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <p className="assignment-description">{assignment.description}</p>
                    <div className="assignment-meta-full">
                      <div>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                      <div>📊 Grade: {assignment.grade || 'Not graded'}</div>
                    </div>
                    {assignment.status === 'pending' && (
                      <button 
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowAssignmentModal(true);
                        }}
                        className="submit-assignment-btn"
                      >
                        Submit Assignment
                      </button>
                    )}
                  </div>
                ))}
                {assignments.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No Assignments Yet</h3>
                    <p>Your assignments will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CERTIFICATES TAB */}
          {activeTab === 'certificates' && (
            <div className="certificates-section">
              <h2 className="section-title">🏆 My Certificates</h2>
              
              <div className="certificates-grid">
                {certificates.map((cert, idx) => (
                  <div key={idx} className="certificate-card">
                    <div className="certificate-icon">🏆</div>
                    <h3>{cert.course?.title}</h3>
                    <p>Completed: {new Date(cert.issuedDate).toLocaleDateString()}</p>
                    <p className="certificate-id">ID: {cert.certificateId}</p>
                    <button 
                      onClick={() => downloadCertificate(cert._id)}
                      className="download-cert-btn"
                    >
                      📥 Download Certificate
                    </button>
                  </div>
                ))}
                {certificates.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <h3>No Certificates Yet</h3>
                    <p>Complete courses to earn certificates</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="schedule-section">
              <h2 className="section-title">🗓️ Class Schedule</h2>
              
              <div className="schedule-grid">
                {upcomingClasses.map((cls, idx) => (
                  <div key={idx} className="schedule-card">
                    <div className="schedule-time">
                      <div className="time-large">
                        {new Date(cls.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="date-small">
                        {new Date(cls.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="schedule-info">
                      <h3>{cls.title}</h3>
                      <p>📚 {cls.course?.title}</p>
                      <p>👨‍🏫 {cls.teacher?.name}</p>
                    </div>
                    <button className="join-class-btn">Join Class</button>
                  </div>
                ))}
                {upcomingClasses.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🗓️</div>
                    <h3>No Upcoming Classes</h3>
                    <p>Your schedule is clear</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
            <div className="resources-section">
              <h2 className="section-title">📖 Study Resources</h2>
              
              <div className="resources-grid">
                {enrolledCourses.map((enrollment, idx) => {
                  const course = enrollment.course;
                  return (
                    <div key={idx} className="resource-card">
                      <div className="resource-header">
                        <h3>📚 {course?.title}</h3>
                      </div>
                      <div className="resource-list">
                        {course?.modules?.map((module, mIdx) => (
                          <div key={mIdx} className="resource-module">
                            <h4>📂 {module.title}</h4>
                            {module.lessons?.map((lesson, lIdx) => (
                              <div key={lIdx} className="resource-item">
                                <span>📄 {lesson.title}</span>
                                <button className="download-resource-btn">Download</button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {enrolledCourses.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📖</div>
                    <h3>No Resources Available</h3>
                    <p>Enroll in courses to access resources</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COURSES TABS (Enrolled & Browse) */}
          {(activeTab === 'enrolled' || activeTab === 'browse') && (
            <div className="courses-section">
              <div className="section-header">
                <div className="tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'enrolled' ? 'active' : ''}`}
                    onClick={() => setActiveTab('enrolled')}
                  >
                    My Courses ({enrolledCourses.length})
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
                    onClick={() => setActiveTab('browse')}
                  >
                    Browse All
                  </button>
                </div>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
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
                    <div className="empty-icon">{activeTab === 'enrolled' ? '📚' : '🔍'}</div>
                    <h3>{activeTab === 'enrolled' ? 'No Enrolled Courses' : 'No Courses Found'}</h3>
                    <p>{activeTab === 'enrolled' ? 'Start learning by browsing courses' : 'Try different filters'}</p>
                    {activeTab === 'enrolled' && (
                      <button onClick={() => setActiveTab('browse')} className="browse-btn">
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
                            <div className="progress-badge">{progress}%</div>
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
                          <p className="course-desc">{course.description?.substring(0, 80)}...</p>
                          {isEnrolled && (
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                          )}
                          <div className="course-footer">
                            {isEnrolled ? (
                              <button onClick={() => handleContinueLearning(course._id)} className="continue-btn">
                                {progress === 100 ? '🏆 Review' : '▶️ Continue'}
                              </button>
                            ) : (
                              <button onClick={() => handleEnrollCourse(course._id)} className="enroll-btn">
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
          )}
        </div>
      </div>

      {/* Assignment Submit Modal */}
      {showAssignmentModal && selectedAssignment && (
        <div className="modal-backdrop" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Assignment</h2>
              <button className="close-btn" onClick={() => setShowAssignmentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>{selectedAssignment.title}</h3>
              <p>{selectedAssignment.description}</p>
              <div className="file-upload-area">
                <input 
                  type="file" 
                  id="assignmentFile"
                  onChange={(e) => handleSubmitAssignment(selectedAssignment._id, e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <label htmlFor="assignmentFile" className="file-upload-btn">
                  📎 Choose File
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;