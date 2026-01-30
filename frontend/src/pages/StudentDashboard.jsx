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
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  // AI Tutor State (ADDED)
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
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

      const { data: enrolledData } = await api.get('/enrollments/my-enrollments');
      const enrolled = enrolledData?.data || [];
      setEnrolledCourses(enrolled);

      const { data: allData } = await api.get('/courses');
      const all = allData?.data || [];
      setAllCourses(all);

      const { data: certsData } = await api.get('/certificates/my-certificates');
      setCertificates(certsData?.data || []);

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

  const handleJoinClass = async (classId) => {
    try {
      const { data } = await api.post(`/classes/${classId}/join`);
      toast.success(`🚀 ${data.message}`);
      if (data.data?.meetingLink) {
        window.open(data.data.meetingLink, '_blank');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join class');
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
    }
  };

  const captureFaceAttendance = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'face-capture.jpg');

      try {
        const formData = new FormData();
        formData.append('image', blob, 'face-capture.jpg');
        formData.append('courseId', selectedClass?.course?._id);
        formData.append('classId', selectedClass?._id);

        await api.post('/attendance/mark-face', formData);
        toast.success('✅ Attendance marked successfully!');
        stopFaceCamera();
        fetchAttendance();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Face recognition failed');
      }
    }, 'image/jpeg');
  };

  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowQRScanner(true);
        toast.info('📷 Point camera at QR code');

        // SIMULATION: Automatically mark attendance after 3 seconds
        setTimeout(async () => {
          try {
            await api.post('/attendance/mark-qr', {
              qrCode: 'mock-qr-123',
              courseId: selectedClass?.course?._id,
              classId: selectedClass?._id
            });
            toast.success('✅ QR Code detected! Attendance marked.');
            stopQRScanner();
            fetchAttendance();
          } catch (error) {
            console.error('QR Mark error:', error);
          }
        }, 3000);
      }
    } catch (error) {
      toast.error('Failed to access camera');
    }
  };

  const stopQRScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setShowQRScanner(false);
    }
  };

  const handleSubmitAssignment = async (assignmentId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      toast.success('✅ Assignment submitted successfully!');
      setShowAssignmentModal(false);
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to submit assignment');
    }
  };

  const handleDownloadResource = (url, fileName) => {
    if (!url) {
      toast.info('📁 This resource is being prepared for download.');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'resource';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📥 Download started!');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Chart Data
  const progressData = enrolledCourses.map(e => ({
    name: e.course?.title?.substring(0, 15) || 'Course',
    progress: e.progress || 0
  }));

  const attendanceData = [
    { name: 'Present', value: attendanceRecords.filter(r => r.status === 'present').length },
    { name: 'Absent', value: attendanceRecords.filter(r => r.status === 'absent').length }
  ];

  const COLORS = ['#10B981', '#EF4444'];

  // Filtering & Pagination
  const categories = ['all', ...new Set(allCourses.map(c => c.category))];

  const filteredCourses = (activeTab === 'enrolled' ? enrolledCourses : allCourses).filter(item => {
    const course = item.course || item;
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const currentCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

  // AI Tutor Chat Handler (ADDED)
  const handleAiChat = async () => {
    if (!aiChatInput.trim() || aiLoading) return;

    const userMessage = { role: 'user', content: aiChatInput };
    setAiChatMessages(prev => [...prev, userMessage]);
    setAiChatInput('');
    setAiLoading(true);

    try {
      const { data } = await api.post('/ai/tutor', {
        messages: [...aiChatMessages, userMessage]
      });

      const assistantMessage = {
        role: 'assistant',
        content: data.data.text
      };

      setAiChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      toast.error('Failed to get response from AI Tutor');
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setAiChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">EduVillage</div>
          <div className="logo-subtitle">Student Portal</div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'enrolled' ? 'active' : ''}`}
            onClick={() => setActiveTab('enrolled')}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">My Courses</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-text">Browse Courses</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Assignments</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Attendance</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-text">Certificates</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <span className="nav-icon">📖</span>
            <span className="nav-text">Resources</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'ai-tutor' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-tutor')}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-text">AI Tutor</span>
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
                  Welcome back, <span className="user-name">{user?.name || 'Student'}!</span>
                </h1>
                <p className="page-subtitle">Continue your learning journey</p>
              </div>
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

              <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
                <span>🔔</span>
                {upcomingClasses.length > 0 && <span className="notification-badge">{upcomingClasses.length}</span>}
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>Notifications</h4>
                    {upcomingClasses.slice(0, 3).map((cls, idx) => (
                      <div key={idx} className="notification-item">
                        📅 Upcoming: {cls.title}
                      </div>
                    ))}
                    {upcomingClasses.length === 0 && (
                      <div className="notification-item">No new notifications</div>
                    )}
                  </div>
                )}
              </div>

              <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <span className="user-name-text">{user?.name || 'Student'}</span>
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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Row */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    📚
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.coursesEnrolled}</h3>
                    <p className="stat-label">Enrolled Courses</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4FD1C5, #38B2AC)' }}>
                    ✅
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.coursesCompleted}</h3>
                    <p className="stat-label">Completed</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                    ⏱️
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.hoursLearned}h</h3>
                    <p className="stat-label">Hours Learned</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    📋
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats.attendanceRate}%</h3>
                    <p className="stat-label">Attendance</p>
                  </div>
                </div>
              </div>

              {/* Dashboard Grid */}
              <div className="dashboard-grid">
                {/* Progress Chart */}
                <div className="chart-card">
                  <h2 className="section-title">📊 Course Progress</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="progress" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Attendance Pie */}
                <div className="chart-card">
                  <h2 className="section-title">📋 Attendance Overview</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Upcoming Classes */}
              <div className="upcoming-section">
                <h2 className="section-title">📅 Upcoming Classes</h2>
                <div className="classes-grid">
                  {upcomingClasses.length > 0 ? (
                    upcomingClasses.map((cls, idx) => (
                      <div key={idx} className="class-card">
                        <div className="class-time">
                          <span className="time-icon">🕐</span>
                          {new Date(cls.date).toLocaleDateString()}
                        </div>
                        <h3 className="class-title">{cls.title}</h3>
                        <p className="class-instructor">👨‍🏫 {cls.instructor?.name || cls.instructor}</p>
                        <div className="class-actions-row">
                          <button
                            className="join-btn"
                            onClick={() => handleJoinClass(cls._id)}
                          >
                            🔗 Join Now
                          </button>
                        </div>
                        <div className="class-actions-grid">
                          <button
                            className="attendance-btn face"
                            onClick={() => {
                              setSelectedClass(cls);
                              startFaceCamera();
                            }}
                          >
                            📸 Face Mark
                          </button>
                          <button
                            className="attendance-btn qr"
                            onClick={() => {
                              setSelectedClass(cls);
                              startQRScanner();
                            }}
                          >
                            📷 QR Scan
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <h3>No Upcoming Classes</h3>
                      <p>Your schedule is clear!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="assignments-section">
              <h2 className="section-title">📝 My Assignments</h2>

              <div className="assignments-stats">
                <div className="assignment-stat">
                  <span className="stat-number">{stats.assignmentsPending}</span>
                  <span className="stat-text">Pending</span>
                </div>
                <div className="assignment-stat completed">
                  <span className="stat-number">{stats.assignmentsCompleted}</span>
                  <span className="stat-text">Completed</span>
                </div>
              </div>

              <div className="assignments-grid">
                {assignments.length > 0 ? (
                  assignments.map((assignment, idx) => (
                    <div key={idx} className="assignment-card">
                      <div className="assignment-header">
                        <h3>{assignment.title}</h3>
                        <span className={`status-badge ${assignment.status}`}>
                          {assignment.status}
                        </span>
                      </div>
                      <p className="assignment-desc">{assignment.description}</p>
                      <div className="assignment-footer">
                        <span className="due-date">📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        {assignment.status === 'pending' && (
                          <button
                            className="submit-btn"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowAssignmentModal(true);
                            }}
                          >
                            Submit
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No Assignments</h3>
                    <p>You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="attendance-section">
              <h2 className="section-title">📋 My Attendance</h2>

              <div className="attendance-actions">
                <button className="action-btn primary" onClick={startFaceCamera}>
                  📸 Mark via Face Recognition
                </button>
                <button className="action-btn secondary" onClick={startQRScanner}>
                  📷 Scan QR Code
                </button>
              </div>

              {isCameraActive && (
                <div className="camera-modal">
                  <div className="camera-container">
                    <video ref={videoRef} autoPlay className="camera-video"></video>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    <div className="camera-controls">
                      <button className="capture-btn" onClick={captureFaceAttendance}>
                        Capture & Mark
                      </button>
                      <button className="cancel-btn" onClick={stopFaceCamera}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showQRScanner && (
                <div className="camera-modal">
                  <div className="camera-container">
                    <video ref={videoRef} autoPlay className="camera-video"></video>
                    <button className="cancel-btn" onClick={stopQRScanner}>
                      Close Scanner
                    </button>
                  </div>
                </div>
              )}

              <div className="attendance-list">
                <h3>Attendance History</h3>
                {attendanceRecords.length > 0 ? (
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record, idx) => (
                        <tr key={idx}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.course}</td>
                          <td>
                            <span className={`status-badge ${record.status}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Attendance Records</h3>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <h2 className="section-title">📈 Learning Analytics</h2>

              <div className="analytics-grid">
                <div className="chart-card">
                  <h3>Course Progress Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="progress" stroke="#1E3A8A" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Performance Radar</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { subject: 'Attendance', value: stats.attendanceRate },
                      { subject: 'Assignments', value: (stats.assignmentsCompleted / (stats.assignmentsCompleted + stats.assignmentsPending) * 100) || 0 },
                      { subject: 'Course Progress', value: stats.averageProgress },
                      { subject: 'Engagement', value: 85 },
                      { subject: 'Participation', value: 78 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis />
                      <Radar name="Performance" dataKey="value" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="achievement-card">
                <div className="achievement-icon">🏆</div>
                <div className="achievement-content">
                  <h3>🎉 {stats.streak} Day Streak!</h3>
                  <p>You're on fire! Keep up the great work.</p>
                </div>
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="certificates-section">
              <h2 className="section-title">🏆 My Certificates</h2>
              <div className="certificates-grid">
                {certificates.length > 0 ? (
                  certificates.map((cert, idx) => (
                    <div key={idx} className="certificate-card">
                      <div className="certificate-icon">🏆</div>
                      <h3>{cert.courseName}</h3>
                      <p>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</p>
                      <button
                        className="download-btn"
                        onClick={() => handleDownloadResource(cert.url, `${cert.courseName}_Certificate.pdf`)}
                      >
                        Download Certificate
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <h3>No Certificates Yet</h3>
                    <p>Complete courses to earn certificates</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources Tab */}
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
                                <button
                                  className="download-resource-btn"
                                  onClick={() => handleDownloadResource(lesson.videoUrl || lesson.content, lesson.title)}
                                >
                                  Download
                                </button>
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

          {/* AI Tutor Tab (ADDED) */}
          {activeTab === 'ai-tutor' && (
            <div className="ai-tutor-section">
              <div className="ai-tutor-header">
                <h2 className="section-title">🤖 AI Tutor - Your Personal Learning Assistant</h2>
                <p className="section-subtitle">Ask me anything about your courses, assignments, or study topics!</p>
              </div>

              <div className="ai-chat-container">
                <div className="ai-chat-messages">
                  {aiChatMessages.length === 0 ? (
                    <div className="ai-welcome">
                      <div className="ai-welcome-icon">🤖</div>
                      <h3>Welcome to AI Tutor!</h3>
                      <p>I'm here to help you with:</p>
                      <div className="ai-features">
                        <div className="ai-feature-card">
                          <span className="feature-icon">💡</span>
                          <span>Explain concepts</span>
                        </div>
                        <div className="ai-feature-card">
                          <span className="feature-icon">📝</span>
                          <span>Help with assignments</span>
                        </div>
                        <div className="ai-feature-card">
                          <span className="feature-icon">🎯</span>
                          <span>Study tips & strategies</span>
                        </div>
                        <div className="ai-feature-card">
                          <span className="feature-icon">❓</span>
                          <span>Answer your questions</span>
                        </div>
                      </div>
                      <p className="ai-prompt-text">Start by asking me a question below!</p>
                    </div>
                  ) : (
                    <div className="ai-messages-list">
                      {aiChatMessages.map((message, index) => (
                        <div key={index} className={`ai-message ${message.role}`}>
                          <div className="message-avatar">
                            {message.role === 'user' ? (
                              user?.name?.charAt(0).toUpperCase() || 'S'
                            ) : (
                              '🤖'
                            )}
                          </div>
                          <div className="message-content">
                            <div className="message-sender">
                              {message.role === 'user' ? 'You' : 'AI Tutor'}
                            </div>
                            <div className="message-text">{message.content}</div>
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="ai-message assistant">
                          <div className="message-avatar">🤖</div>
                          <div className="message-content">
                            <div className="message-sender">AI Tutor</div>
                            <div className="message-text typing-indicator">
                              <span></span><span></span><span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="ai-chat-input-container">
                  <div className="ai-chat-input-wrapper">
                    <input
                      type="text"
                      className="ai-chat-input"
                      placeholder="Ask me anything..."
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAiChat()}
                      disabled={aiLoading}
                    />
                    <button
                      className="ai-send-btn"
                      onClick={handleAiChat}
                      disabled={!aiChatInput.trim() || aiLoading}
                    >
                      {aiLoading ? '⏳' : '📤'}
                    </button>
                  </div>
                  <div className="ai-suggestions">
                    <button
                      className="suggestion-chip"
                      onClick={() => setAiChatInput('Explain the concept of variables in programming')}
                    >
                      Explain variables
                    </button>
                    <button
                      className="suggestion-chip"
                      onClick={() => setAiChatInput('Help me understand loops in programming')}
                    >
                      Help with loops
                    </button>
                    <button
                      className="suggestion-chip"
                      onClick={() => setAiChatInput('What are good study techniques for online learning?')}
                    >
                      Study techniques
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Courses Tabs (Enrolled & Browse) */}
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