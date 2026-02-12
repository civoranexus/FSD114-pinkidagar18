import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  
  // AI Tutor State
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Quiz State (NEW)
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [quizTimer, setQuizTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Certificate State (ENHANCED)
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  
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
    averageGrade: 0,
    quizzesTaken: 0, // NEW
    averageQuizScore: 0 // NEW
  });

  // Fetch Data
  useEffect(() => {
    fetchStudentData();
    fetchAssignments();
    fetchAttendance();
    fetchUpcomingClasses();
    fetchQuizzes(); // NEW
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-icon')) setShowNotifications(false);
      if (!e.target.closest('.user-profile')) setShowUserMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Quiz Timer Effect
  useEffect(() => {
    if (activeQuiz && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeQuiz, timeRemaining]);

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

  // NEW: Fetch Quizzes
  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get('/quizzes/my-quizzes');
      const quizzesData = data?.data || [];
      setQuizzes(quizzesData);

      const taken = quizzesData.filter(q => q.completed).length;
      const totalScore = quizzesData
        .filter(q => q.completed)
        .reduce((sum, q) => sum + (q.score || 0), 0);
      const avgScore = taken > 0 ? (totalScore / taken).toFixed(1) : 0;

      setStats(prev => ({
        ...prev,
        quizzesTaken: taken,
        averageQuizScore: avgScore
      }));
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  // NEW: Start Quiz
  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResults(null);
    setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
  };

  // NEW: Answer Selection
  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // NEW: Next Question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // NEW: Previous Question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // NEW: Submit Quiz
  const handleQuizSubmit = async () => {
    try {
      const { data } = await api.post(`/quizzes/${activeQuiz._id}/submit`, {
        answers: selectedAnswers
      });
      
      setQuizResults(data.data);
      toast.success(`🎉 Quiz completed! Score: ${data.data.score}%`);
      await fetchQuizzes(); // Refresh quiz data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    }
  };

  // NEW: Close Quiz
  const handleCloseQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResults(null);
    setTimeRemaining(0);
  };

  // ENHANCED: View Certificate
  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateModal(true);
  };

  // ENHANCED: Download Certificate
  const handleDownloadCertificate = async (certificateId) => {
    try {
      const { data } = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('📄 Certificate downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  // ENHANCED: Share Certificate
  const handleShareCertificate = (certificate) => {
    if (navigator.share) {
      navigator.share({
        title: `${certificate.courseName} Certificate`,
        text: `I just completed ${certificate.courseName}!`,
        url: certificate.shareUrl || window.location.href
      }).catch(err => console.log('Error sharing', err));
    } else {
      // Fallback: Copy link to clipboard
      navigator.clipboard.writeText(certificate.shareUrl || window.location.href);
      toast.success('🔗 Certificate link copied to clipboard!');
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
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureFace = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('face', blob, 'face.jpg');

      try {
        await api.post('/attendance/mark-face', formData);
        toast.success('✅ Attendance marked successfully!');
        stopCamera();
        await fetchAttendance();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Face recognition failed');
      }
    });
  };

  const handleSubmitAssignment = async (assignmentId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      toast.success('✅ Assignment submitted successfully!');
      setShowAssignmentModal(false);
      await fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    }
  };

  const handleAiChat = async () => {
    if (!aiChatInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: aiChatInput
    };

    setAiChatMessages(prev => [...prev, userMessage]);
    setAiChatInput('');
    setAiLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: aiChatInput,
        context: 'student_learning'
      });

      const aiMessage = {
        role: 'assistant',
        content: data.data.response
      };

      setAiChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('AI Tutor is currently unavailable');
      setAiChatMessages(prev => prev.slice(0, -1));
    } finally {
      setAiLoading(false);
    }
  };

  // Filtering and Pagination Logic
  const categories = ['all', ...new Set(allCourses.map(c => c.category))];
  
  const displayCourses = activeTab === 'enrolled' ? enrolledCourses : allCourses;
  const filteredCourses = displayCourses.filter(item => {
    const course = item.course || item;
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  // Chart Data
  const performanceData = [
    { subject: 'Assignments', value: stats.assignmentsCompleted },
    { subject: 'Attendance', value: parseInt(stats.attendanceRate) },
    { subject: 'Courses', value: stats.averageProgress },
    { subject: 'Quizzes', value: parseInt(stats.averageQuizScore) }
  ];

  const progressData = enrolledCourses.slice(0, 5).map(e => ({
    name: e.course?.title?.substring(0, 15) + '...' || 'Course',
    progress: e.progress || 0
  }));

  const activityData = [
    { name: 'Mon', hours: 2 },
    { name: 'Tue', hours: 3.5 },
    { name: 'Wed', hours: 2.8 },
    { name: 'Thu', hours: 4.2 },
    { name: 'Fri', hours: 3.1 },
    { name: 'Sat', hours: 5 },
    { name: 'Sun', hours: 4.5 }
  ];

  const COLORS = ['#1E3A8A', '#3B82F6', '#10B981', '#F59E0B'];

  // Format time remaining for quiz timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">EduVillage</div>
          <div className="logo-subtitle">Student Portal</div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Overview</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'enrolled' ? 'active' : ''}`}
            onClick={() => { setActiveTab('enrolled'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">My Courses</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => { setActiveTab('browse'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-text">Browse Courses</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('assignments'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Assignments</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('quizzes'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">❓</span>
            <span className="nav-text">Quizzes</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => { setActiveTab('certificates'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-text">Certificates</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('attendance'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">Attendance</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'ai-tutor' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai-tutor'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-text">AI Tutor</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={logout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Top Header */}
          <div className="top-header">
            <div className="header-left">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
              </button>
              <div>
                <h1 className="page-title">
                  Welcome back, <span className="user-name">{user?.name || 'Student'}</span>! 👋
                </h1>
                <p className="page-subtitle">Ready to continue your learning journey?</p>
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

              <div className="notification-icon" onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
              }}>
                🔔
                {(stats.assignmentsPending + upcomingClasses.length) > 0 && (
                  <span className="notification-badge">
                    {stats.assignmentsPending + upcomingClasses.length}
                  </span>
                )}
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>Notifications</h4>
                    <div className="notification-list">
                      {stats.assignmentsPending > 0 && (
                        <div className="notification-item">
                          <span className="notif-icon">📝</span>
                          <div className="notif-content">
                            <p className="notif-title">Pending Assignments</p>
                            <p className="notif-text">{stats.assignmentsPending} assignments due soon</p>
                          </div>
                        </div>
                      )}
                      {upcomingClasses.slice(0, 3).map(cls => (
                        <div key={cls._id} className="notification-item">
                          <span className="notif-icon">🎓</span>
                          <div className="notif-content">
                            <p className="notif-title">{cls.title}</p>
                            <p className="notif-text">{new Date(cls.startTime).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="user-profile" onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}>
                <div className="user-avatar">{user?.name?.charAt(0) || 'S'}</div>
                {showUserMenu && (
                  <div className="user-menu">
                    <div className="menu-header">
                      <div className="menu-avatar">{user?.name?.charAt(0) || 'S'}</div>
                      <div>
                        <p className="menu-name">{user?.name}</p>
                        <p className="menu-email">{user?.email}</p>
                      </div>
                    </div>
                    <div className="menu-items">
                      <Link to="/profile" className="menu-item">👤 My Profile</Link>
                      <Link to="/settings" className="menu-item">⚙️ Settings</Link>
                      <button onClick={logout} className="menu-item">🚪 Logout</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">📚</div>
                  <div className="stat-details">
                    <h3>{stats.coursesEnrolled}</h3>
                    <p>Enrolled Courses</p>
                  </div>
                  <div className="stat-trend positive">+12%</div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">✅</div>
                  <div className="stat-details">
                    <h3>{stats.coursesCompleted}</h3>
                    <p>Completed</p>
                  </div>
                  <div className="stat-trend positive">+8%</div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-details">
                    <h3>{stats.hoursLearned}h</h3>
                    <p>Learning Hours</p>
                  </div>
                  <div className="stat-trend positive">+15%</div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-details">
                    <h3>{stats.certificatesEarned}</h3>
                    <p>Certificates</p>
                  </div>
                  <div className="stat-trend positive">+5%</div>
                </div>

                <div className="stat-card pink">
                  <div className="stat-icon">📊</div>
                  <div className="stat-details">
                    <h3>{stats.averageProgress}%</h3>
                    <p>Avg Progress</p>
                  </div>
                  <div className="stat-trend">{stats.averageProgress >= 50 ? '+' : '-'}3%</div>
                </div>

                <div className="stat-card teal">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-details">
                    <h3>{stats.streak}</h3>
                    <p>Day Streak</p>
                  </div>
                  <div className="stat-trend positive">+2</div>
                </div>

                <div className="stat-card indigo">
                  <div className="stat-icon">📝</div>
                  <div className="stat-details">
                    <h3>{stats.assignmentsCompleted}</h3>
                    <p>Assignments Done</p>
                  </div>
                  <div className="stat-trend positive">+6</div>
                </div>

                <div className="stat-card red">
                  <div className="stat-icon">❓</div>
                  <div className="stat-details">
                    <h3>{stats.quizzesTaken}</h3>
                    <p>Quizzes Taken</p>
                  </div>
                  <div className="stat-trend positive">+{stats.averageQuizScore}%</div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">📈 Learning Activity</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip />
                      <Area type="monotone" dataKey="hours" stroke="#3B82F6" fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">🎯 Performance Overview</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
                      <PolarRadiusAxis stroke="#6B7280" />
                      <Radar name="Performance" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">📊 Course Progress</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip />
                      <Bar dataKey="progress" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Upcoming Classes */}
              {upcomingClasses.length > 0 && (
                <div className="upcoming-classes">
                  <h2 className="section-title">📅 Upcoming Classes</h2>
                  <div className="classes-grid">
                    {upcomingClasses.slice(0, 3).map(cls => (
                      <div key={cls._id} className="class-card">
                        <div className="class-header">
                          <h3>{cls.title}</h3>
                          <span className="class-badge">{cls.type || 'Live'}</span>
                        </div>
                        <p className="class-instructor">👨‍🏫 {cls.instructor?.name}</p>
                        <div className="class-time">
                          <span>🕐 {new Date(cls.startTime).toLocaleString()}</span>
                          <span>⏱️ {cls.duration} min</span>
                        </div>
                        <button
                          className="join-class-btn"
                          onClick={() => handleJoinClass(cls._id)}
                        >
                          🎥 Join Class
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="assignments-section">
              <h2 className="section-title">📝 My Assignments</h2>
              <div className="assignments-grid">
                {assignments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No Assignments</h3>
                    <p>You don't have any assignments yet</p>
                  </div>
                ) : (
                  assignments.map(assignment => (
                    <div key={assignment._id} className="assignment-card">
                      <div className="assignment-header">
                        <h3>{assignment.title}</h3>
                        <span className={`status-badge ${assignment.status}`}>
                          {assignment.status === 'submitted' ? '✅' : '⏰'} {assignment.status}
                        </span>
                      </div>
                      <p className="assignment-course">📚 {assignment.course?.title}</p>
                      <p className="assignment-desc">{assignment.description}</p>
                      <div className="assignment-footer">
                        <span className="due-date">
                          📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        {assignment.status !== 'submitted' && (
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
                        {assignment.grade && (
                          <span className="grade-badge">Grade: {assignment.grade}/100</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* NEW: Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className="quizzes-section">
              {!activeQuiz ? (
                <>
                  <div className="section-header">
                    <h2 className="section-title">❓ Available Quizzes</h2>
                    <div className="quiz-stats">
                      <div className="quiz-stat-item">
                        <span className="quiz-stat-icon">📊</span>
                        <div>
                          <p className="quiz-stat-value">{stats.quizzesTaken}</p>
                          <p className="quiz-stat-label">Completed</p>
                        </div>
                      </div>
                      <div className="quiz-stat-item">
                        <span className="quiz-stat-icon">🎯</span>
                        <div>
                          <p className="quiz-stat-value">{stats.averageQuizScore}%</p>
                          <p className="quiz-stat-label">Average Score</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="quizzes-grid">
                    {quizzes.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">❓</div>
                        <h3>No Quizzes Available</h3>
                        <p>Check back later for new quizzes</p>
                      </div>
                    ) : (
                      quizzes.map(quiz => (
                        <div key={quiz._id} className="quiz-card">
                          <div className="quiz-card-header">
                            <h3>{quiz.title}</h3>
                            {quiz.completed && (
                              <span className="quiz-completed-badge">✅ Completed</span>
                            )}
                          </div>
                          <p className="quiz-course">📚 {quiz.course?.title}</p>
                          <p className="quiz-description">{quiz.description}</p>
                          
                          <div className="quiz-meta">
                            <div className="quiz-meta-item">
                              <span className="quiz-meta-icon">❓</span>
                              <span>{quiz.questions?.length || 0} Questions</span>
                            </div>
                            <div className="quiz-meta-item">
                              <span className="quiz-meta-icon">⏱️</span>
                              <span>{quiz.timeLimit} min</span>
                            </div>
                            <div className="quiz-meta-item">
                              <span className="quiz-meta-icon">🎯</span>
                              <span>{quiz.passingScore}% to pass</span>
                            </div>
                          </div>

                          {quiz.completed && quiz.score !== undefined && (
                            <div className={`quiz-score ${quiz.score >= quiz.passingScore ? 'passed' : 'failed'}`}>
                              <span className="score-label">Your Score:</span>
                              <span className="score-value">{quiz.score}%</span>
                            </div>
                          )}

                          <button
                            className={`quiz-start-btn ${quiz.completed ? 'retake' : ''}`}
                            onClick={() => handleStartQuiz(quiz)}
                            disabled={quiz.attempts >= quiz.maxAttempts && quiz.maxAttempts > 0}
                          >
                            {quiz.completed ? '🔄 Retake Quiz' : '▶️ Start Quiz'}
                          </button>

                          {quiz.maxAttempts > 0 && (
                            <p className="quiz-attempts">
                              Attempts: {quiz.attempts || 0}/{quiz.maxAttempts}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : quizResults ? (
                // Quiz Results View
                <div className="quiz-results">
                  <div className="results-header">
                    <h2>🎉 Quiz Completed!</h2>
                    <button className="close-quiz-btn" onClick={handleCloseQuiz}>✕</button>
                  </div>

                  <div className="results-score-card">
                    <div className={`score-circle ${quizResults.score >= activeQuiz.passingScore ? 'passed' : 'failed'}`}>
                      <div className="score-percentage">{quizResults.score}%</div>
                      <div className="score-label">
                        {quizResults.score >= activeQuiz.passingScore ? '✅ Passed' : '❌ Failed'}
                      </div>
                    </div>

                    <div className="results-stats">
                      <div className="result-stat">
                        <span className="stat-icon">✅</span>
                        <div>
                          <p className="stat-value">{quizResults.correctAnswers}</p>
                          <p className="stat-label">Correct</p>
                        </div>
                      </div>
                      <div className="result-stat">
                        <span className="stat-icon">❌</span>
                        <div>
                          <p className="stat-value">{quizResults.incorrectAnswers}</p>
                          <p className="stat-label">Incorrect</p>
                        </div>
                      </div>
                      <div className="result-stat">
                        <span className="stat-icon">⏱️</span>
                        <div>
                          <p className="stat-value">{quizResults.timeTaken || 'N/A'}</p>
                          <p className="stat-label">Time Taken</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="results-actions">
                    <button className="review-btn" onClick={() => setQuizResults(null)}>
                      📝 Review Answers
                    </button>
                    <button className="retake-btn" onClick={() => {
                      setQuizResults(null);
                      handleStartQuiz(activeQuiz);
                    }}>
                      🔄 Retake Quiz
                    </button>
                    <button className="done-btn" onClick={handleCloseQuiz}>
                      ✓ Done
                    </button>
                  </div>

                  {quizResults.feedback && (
                    <div className="results-feedback">
                      <h3>📝 Feedback</h3>
                      <p>{quizResults.feedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Active Quiz View
                <div className="active-quiz">
                  <div className="quiz-header">
                    <div className="quiz-info">
                      <h2>{activeQuiz.title}</h2>
                      <p>Question {currentQuestionIndex + 1} of {activeQuiz.questions?.length || 0}</p>
                    </div>
                    <div className="quiz-timer">
                      <span className="timer-icon">⏱️</span>
                      <span className={`timer-value ${timeRemaining < 60 ? 'warning' : ''}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  </div>

                  <div className="quiz-progress-bar">
                    <div 
                      className="quiz-progress-fill" 
                      style={{ 
                        width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` 
                      }}
                    />
                  </div>

                  {activeQuiz.questions && activeQuiz.questions[currentQuestionIndex] && (
                    <div className="question-container">
                      <div className="question-header">
                        <h3 className="question-text">
                          {activeQuiz.questions[currentQuestionIndex].questionText}
                        </h3>
                        {activeQuiz.questions[currentQuestionIndex].points && (
                          <span className="question-points">
                            {activeQuiz.questions[currentQuestionIndex].points} points
                          </span>
                        )}
                      </div>

                      <div className="answers-list">
                        {activeQuiz.questions[currentQuestionIndex].type === 'multiple-choice' && 
                          activeQuiz.questions[currentQuestionIndex].options?.map((option, idx) => (
                            <div
                              key={idx}
                              className={`answer-option ${
                                selectedAnswers[activeQuiz.questions[currentQuestionIndex]._id] === option
                                  ? 'selected'
                                  : ''
                              }`}
                              onClick={() => 
                                handleAnswerSelect(activeQuiz.questions[currentQuestionIndex]._id, option)
                              }
                            >
                              <div className="option-radio">
                                {selectedAnswers[activeQuiz.questions[currentQuestionIndex]._id] === option && (
                                  <div className="radio-fill" />
                                )}
                              </div>
                              <span className="option-text">{option}</span>
                            </div>
                          ))
                        }

                        {activeQuiz.questions[currentQuestionIndex].type === 'true-false' && (
                          <>
                            <div
                              className={`answer-option ${
                                selectedAnswers[activeQuiz.questions[currentQuestionIndex]._id] === 'True'
                                  ? 'selected'
                                  : ''
                              }`}
                              onClick={() => 
                                handleAnswerSelect(activeQuiz.questions[currentQuestionIndex]._id, 'True')
                              }
                            >
                              <div className="option-radio">
                                {selectedAnswers[activeQuiz.questions[currentQuestionIndex]._id] === 'True' && (
                                  <div className="radio-fill" />
                                )}
                              </div>
                              <span className="option-text">✓ True</span>
                            </div>
                            <div
                              className={`answer-option ${
                                selectedAnswers[activeQuiz.questions[currentQuestionIndex]._id] === 'False'
                                  ? 'selected'
                                  : ''
                              }`}
                              onClick={() => 
                                handleAnswerSelect(activeQuiz.questions[currentQuestionIndex]._id, 'False')
                              }
                            >
                              <div className="option-radio">
                                {selectedAnswers[activeQuiz.questions[currentQuestionIndex]._id] === 'False' && (
                                  <div className="radio-fill" />
                                )}
                              </div>
                              <span className="option-text">✗ False</span>
                            </div>
                          </>
                        )}

                        {activeQuiz.questions[currentQuestionIndex].type === 'short-answer' && (
                          <textarea
                            className="short-answer-input"
                            placeholder="Type your answer here..."
                            value={selectedAnswers[activeQuiz.questions[currentQuestionIndex]._id] || ''}
                            onChange={(e) => 
                              handleAnswerSelect(activeQuiz.questions[currentQuestionIndex]._id, e.target.value)
                            }
                            rows={4}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="quiz-navigation">
                    <button
                      className="quiz-nav-btn prev"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      ← Previous
                    </button>

                    <div className="question-indicators">
                      {activeQuiz.questions?.map((_, idx) => (
                        <div
                          key={idx}
                          className={`question-indicator ${
                            idx === currentQuestionIndex ? 'active' : ''
                          } ${
                            selectedAnswers[activeQuiz.questions[idx]._id] ? 'answered' : ''
                          }`}
                          onClick={() => setCurrentQuestionIndex(idx)}
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>

                    {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                      <button
                        className="quiz-nav-btn next"
                        onClick={handleNextQuestion}
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        className="quiz-nav-btn submit"
                        onClick={handleQuizSubmit}
                      >
                        Submit Quiz
                      </button>
                    )}
                  </div>

                  <button className="exit-quiz-btn" onClick={handleCloseQuiz}>
                    Exit Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ENHANCED: Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="certificates-section">
              <div className="section-header">
                <h2 className="section-title">🏆 My Certificates</h2>
                <div className="certificate-stats">
                  <div className="cert-stat">
                    <span className="cert-stat-icon">📜</span>
                    <div>
                      <p className="cert-stat-value">{certificates.length}</p>
                      <p className="cert-stat-label">Total Certificates</p>
                    </div>
                  </div>
                  <div className="cert-stat">
                    <span className="cert-stat-icon">🎓</span>
                    <div>
                      <p className="cert-stat-value">{stats.coursesCompleted}</p>
                      <p className="cert-stat-label">Courses Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="certificates-grid">
                {certificates.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <h3>No Certificates Yet</h3>
                    <p>Complete courses to earn certificates</p>
                    <button onClick={() => setActiveTab('browse')} className="browse-btn">
                      Browse Courses
                    </button>
                  </div>
                ) : (
                  certificates.map(cert => (
                    <div key={cert._id} className="certificate-card">
                      <div className="certificate-badge">
                        <div className="badge-icon">🏆</div>
                        <div className="badge-ribbon"></div>
                      </div>
                      
                      <div className="certificate-content">
                        <h3 className="certificate-course">{cert.courseName || cert.course?.title}</h3>
                        <p className="certificate-subtitle">Certificate of Completion</p>
                        
                        <div className="certificate-details">
                          <div className="cert-detail">
                            <span className="detail-icon">📅</span>
                            <span className="detail-text">
                              Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="cert-detail">
                            <span className="detail-icon">🔢</span>
                            <span className="detail-text">ID: {cert.certificateId || cert._id.slice(-8)}</span>
                          </div>
                          {cert.grade && (
                            <div className="cert-detail">
                              <span className="detail-icon">📊</span>
                              <span className="detail-text">Grade: {cert.grade}%</span>
                            </div>
                          )}
                        </div>

                        {cert.skills && cert.skills.length > 0 && (
                          <div className="certificate-skills">
                            <p className="skills-label">Skills Acquired:</p>
                            <div className="skills-tags">
                              {cert.skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="skill-tag">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="certificate-actions">
                        <button
                          className="cert-action-btn view"
                          onClick={() => handleViewCertificate(cert)}
                        >
                          <span className="btn-icon">👁️</span>
                          <span>View</span>
                        </button>
                        <button
                          className="cert-action-btn download"
                          onClick={() => handleDownloadCertificate(cert._id)}
                        >
                          <span className="btn-icon">📥</span>
                          <span>Download</span>
                        </button>
                        <button
                          className="cert-action-btn share"
                          onClick={() => handleShareCertificate(cert)}
                        >
                          <span className="btn-icon">🔗</span>
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="attendance-section">
              <h2 className="section-title">📅 My Attendance</h2>
              
              <div className="attendance-stats">
                <div className="attendance-stat-card">
                  <div className="stat-icon large">📊</div>
                  <div className="stat-info">
                    <h3>{stats.attendanceRate}%</h3>
                    <p>Attendance Rate</p>
                  </div>
                </div>
                <div className="attendance-stat-card">
                  <div className="stat-icon large">✅</div>
                  <div className="stat-info">
                    <h3>{attendanceRecords.filter(r => r.status === 'present').length}</h3>
                    <p>Classes Attended</p>
                  </div>
                </div>
                <div className="attendance-stat-card">
                  <div className="stat-icon large">❌</div>
                  <div className="stat-info">
                    <h3>{attendanceRecords.filter(r => r.status === 'absent').length}</h3>
                    <p>Classes Missed</p>
                  </div>
                </div>
              </div>

              <div className="face-recognition-card">
                <h3>🤳 Mark Attendance with Face Recognition</h3>
                <p>Use your camera to mark attendance automatically</p>
                
                {!isCameraActive ? (
                  <button className="start-camera-btn" onClick={startFaceCamera}>
                    📸 Start Camera
                  </button>
                ) : (
                  <div className="camera-container">
                    <video ref={videoRef} autoPlay className="face-video"></video>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    <div className="camera-actions">
                      <button className="capture-btn" onClick={captureFace}>
                        ✅ Capture & Mark
                      </button>
                      <button className="stop-camera-btn" onClick={stopCamera}>
                        ❌ Stop Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="attendance-records">
                <h3>📝 Attendance History</h3>
                <div className="records-table">
                  {attendanceRecords.length === 0 ? (
                    <div className="empty-state">
                      <p>No attendance records yet</p>
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Class</th>
                          <th>Status</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map(record => (
                          <tr key={record._id}>
                            <td>{new Date(record.date).toLocaleDateString()}</td>
                            <td>{record.class?.title || 'N/A'}</td>
                            <td>
                              <span className={`status-badge ${record.status}`}>
                                {record.status === 'present' ? '✅' : '❌'} {record.status}
                              </span>
                            </td>
                            <td>{new Date(record.markedAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Tutor Tab */}
          {activeTab === 'ai-tutor' && (
            <div className="ai-tutor-section">
              <div className="ai-tutor-header">
                <h2 className="section-title">🤖 AI Learning Assistant</h2>
                <p className="section-subtitle">Get instant help with your studies</p>
              </div>

              <div className="ai-container">
                <div className="ai-chat-container">
                  <div className="ai-chat-messages">
                    {aiChatMessages.length === 0 ? (
                      <div className="ai-welcome">
                        <div className="ai-welcome-icon">🤖</div>
                        <h3>Hi! I'm your AI Learning Assistant</h3>
                        <p>Ask me anything about your courses, homework, or learning topics!</p>
                        
                        <div className="ai-features">
                          <div className="ai-feature-card">
                            <span className="feature-icon">💡</span>
                            <span>Concept Explanations</span>
                          </div>
                          <div className="ai-feature-card">
                            <span className="feature-icon">📚</span>
                            <span>Study Tips</span>
                          </div>
                          <div className="ai-feature-card">
                            <span className="feature-icon">🎯</span>
                            <span>Problem Solving</span>
                          </div>
                          <div className="ai-feature-card">
                            <span className="feature-icon">✍️</span>
                            <span>Writing Help</span>
                          </div>
                        </div>

                        <p className="ai-prompt-text">✨ Try asking me something to get started!</p>
                      </div>
                    ) : (
                      <div className="ai-messages-list">
                        {aiChatMessages.map((msg, idx) => (
                          <div key={idx} className={`ai-message ${msg.role}`}>
                            <div className="message-avatar">
                              {msg.role === 'user' ? user?.name?.charAt(0) || 'S' : '🤖'}
                            </div>
                            <div className="message-content">
                              <p className="message-sender">
                                {msg.role === 'user' ? 'You' : 'AI Tutor'}
                              </p>
                              <div className="message-text">{msg.content}</div>
                            </div>
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="ai-message assistant">
                            <div className="message-avatar">🤖</div>
                            <div className="message-content">
                              <p className="message-sender">AI Tutor</p>
                              <div className="message-text typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
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

      {/* ENHANCED: Certificate View Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="modal-backdrop certificate-modal-backdrop" onClick={() => setShowCertificateModal(false)}>
          <div className="modal certificate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Certificate Preview</h2>
              <button className="close-btn" onClick={() => setShowCertificateModal(false)}>×</button>
            </div>
            <div className="modal-body certificate-preview">
              <div className="certificate-display">
                <div className="cert-border">
                  <div className="cert-inner">
                    <div className="cert-header-section">
                      <h1 className="cert-title">Certificate of Achievement</h1>
                      <div className="cert-seal">🏆</div>
                    </div>
                    
                    <div className="cert-body-section">
                      <p className="cert-presented">This is to certify that</p>
                      <h2 className="cert-recipient-name">{user?.name}</h2>
                      <p className="cert-completion">has successfully completed</p>
                      <h3 className="cert-course-name">{selectedCertificate.courseName || selectedCertificate.course?.title}</h3>
                      
                      {selectedCertificate.grade && (
                        <p className="cert-grade">with a score of {selectedCertificate.grade}%</p>
                      )}
                      
                      <div className="cert-date-section">
                        <p className="cert-date-label">Issued on</p>
                        <p className="cert-date-value">
                          {new Date(selectedCertificate.issuedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      <div className="cert-footer-section">
                        <div className="cert-signature">
                          <div className="signature-line"></div>
                          <p className="signature-label">Authorized Signature</p>
                        </div>
                        <div className="cert-id">
                          <p className="cert-id-label">Certificate ID</p>
                          <p className="cert-id-value">{selectedCertificate.certificateId || selectedCertificate._id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="certificate-modal-actions">
                <button
                  className="cert-modal-btn download"
                  onClick={() => handleDownloadCertificate(selectedCertificate._id)}
                >
                  <span className="btn-icon">📥</span>
                  <span>Download PDF</span>
                </button>
                <button
                  className="cert-modal-btn share"
                  onClick={() => handleShareCertificate(selectedCertificate)}
                >
                  <span className="btn-icon">🔗</span>
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;