import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [studyStreak, setStudyStreak] = useState(7);
  const [notifications, setNotifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [learningGoals, setLearningGoals] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState('light');
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

  useEffect(() => {
    fetchStudentData();
    initializeFeatures();
  }, []);

  const fetchStudentData = async () => {
    try {
      const [coursesRes, progressRes] = await Promise.all([
        api.get('/courses/student/enrolled'),
        api.get('/progress/my-progress')
      ]);

      setEnrolledCourses(coursesRes.data.data);
      setProgress(progressRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const initializeFeatures = () => {
    // Initialize notifications
    setNotifications([
      { id: 1, type: 'success', message: 'New course available: Advanced React', time: '2 hours ago', read: false },
      { id: 2, type: 'info', message: 'Your certificate is ready for Web Development', time: '1 day ago', read: false },
      { id: 3, type: 'warning', message: 'Assignment due in 2 days', time: '3 hours ago', read: false },
    ]);

    // Initialize achievements
    setAchievements([
      { id: 1, name: 'First Course', icon: '🎓', earned: true, description: 'Complete your first course' },
      { id: 2, name: 'Fast Learner', icon: '⚡', earned: true, description: 'Complete 3 courses in a month' },
      { id: 3, name: 'Dedicated Student', icon: '🔥', earned: true, description: '7 day study streak' },
      { id: 4, name: 'Top Performer', icon: '🏆', earned: false, description: 'Score 95% or above in 5 courses' },
      { id: 5, name: 'Course Master', icon: '👑', earned: false, description: 'Complete 10 courses' },
    ]);

    // Initialize learning goals
    setLearningGoals([
      { id: 1, goal: 'Complete React Course', progress: 75, target: 100 },
      { id: 2, goal: 'Study 2 hours daily', progress: 60, target: 100 },
      { id: 3, goal: 'Finish 5 courses this month', progress: 40, target: 100 },
    ]);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your personalized dashboard...</p>
      </div>
    );
  }

  // Calculate stats
  const totalCourses = enrolledCourses.length;
  const completedCourses = progress.filter(p => p.progressPercentage === 100).length;
  const inProgressCourses = totalCourses - completedCourses;
  const avgProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.progressPercentage, 0) / progress.length)
    : 0;
  const certificates = progress.filter(p => p.certificateIssued).length;
  const totalLessonsCompleted = progress.reduce((sum, p) => sum + (p.completedLessons?.length || 0), 0);

  // Chart data
  const progressChartData = enrolledCourses.slice(0, 5).map(course => {
    const courseProgress = progress.find(p => p.course?._id === course._id);
    return {
      name: course.title.substring(0, 15) + '...',
      progress: courseProgress?.progressPercentage || 0,
      completed: courseProgress?.completedLessons?.length || 0
    };
  });

  const completionData = [
    { name: 'Completed', value: completedCourses, color: '#10B981' },
    { name: 'In Progress', value: inProgressCourses, color: '#F59E0B' },
  ];

  const weeklyActivityData = [
    { day: 'Mon', hours: 2.5, lessons: 4 },
    { day: 'Tue', hours: 3, lessons: 5 },
    { day: 'Wed', hours: 1.5, lessons: 2 },
    { day: 'Thu', hours: 4, lessons: 6 },
    { day: 'Fri', hours: 2.5, lessons: 4 },
    { day: 'Sat', hours: 5, lessons: 8 },
    { day: 'Sun', hours: 3, lessons: 5 },
  ];

  const categoryData = [
    { category: 'Programming', value: 45 },
    { category: 'Design', value: 25 },
    { category: 'Business', value: 20 },
    { category: 'Marketing', value: 10 },
  ];

  const skillsRadarData = [
    { skill: 'React', level: 85 },
    { skill: 'Node.js', level: 70 },
    { skill: 'Design', level: 60 },
    { skill: 'Database', level: 75 },
    { skill: 'DevOps', level: 50 },
  ];

  const monthlyProgressData = [
    { month: 'Jan', courses: 2, hours: 45 },
    { month: 'Feb', courses: 3, hours: 58 },
    { month: 'Mar', courses: 1, hours: 32 },
    { month: 'Apr', courses: 4, hours: 72 },
    { month: 'May', courses: 2, hours: 48 },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme');
  };

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <div className={`student-dashboard ${theme}`}>
      {/* Floating Particles Background */}
      <div className="particles-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="container">
        {/* FEATURE 1: Enhanced Header with Theme Switcher */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>
                Welcome back, <span className="user-name animated-gradient">{user.name}</span>!
                <span className="wave-emoji">👋</span>
              </h1>
              <p className="header-subtitle">
                🔥 {studyStreak} day study streak! Keep it up!
              </p>
            </div>
            <div className="header-actions">
              {/* Theme Switcher */}
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* FEATURE 2: Notification Bell */}
              <div className="notifications-wrapper">
                <button
                  className="notification-bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  🔔
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="notification-badge">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <h3>Notifications</h3>
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`notification-item ${notif.type} ${notif.read ? 'read' : ''}`}
                        onClick={() => markNotificationRead(notif.id)}
                      >
                        <p>{notif.message}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/courses" className="btn btn-primary pulse-animation">
                🚀 Explore Courses
              </Link>
            </div>
          </div>
        </div>

        {/* FEATURE 3: Quick Stats Cards with Animations */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon floating">📚</div>
            <div className="stat-info">
              <h3 className="counter">{totalCourses}</h3>
              <p>Enrolled Courses</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ 12%</span>
                <span>from last month</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-green slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon floating">✅</div>
            <div className="stat-info">
              <h3 className="counter">{completedCourses}</h3>
              <p>Completed</p>
              <div className="stat-trend">
                <span className="trend-indicator up">↑ {completedCourses}</span>
                <span>courses finished</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-orange slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon floating">📊</div>
            <div className="stat-info">
              <h3 className="counter">{avgProgress}%</h3>
              <p>Average Progress</p>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill animated-fill" style={{ width: `${avgProgress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-purple slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="stat-icon floating">🏆</div>
            <div className="stat-info">
              <h3 className="counter">{certificates}</h3>
              <p>Certificates</p>
              <div className="stat-trend">
                <span className="trend-indicator">🎓 Earned</span>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="stat-card stat-card-pink slide-in" style={{ animationDelay: '0.5s' }}>
            <div className="stat-icon floating">📖</div>
            <div className="stat-info">
              <h3 className="counter">{totalLessonsCompleted}</h3>
              <p>Lessons Completed</p>
            </div>
          </div>

          <div className="stat-card stat-card-cyan slide-in" style={{ animationDelay: '0.6s' }}>
            <div className="stat-icon floating">⏱️</div>
            <div className="stat-info">
              <h3 className="counter">24h</h3>
              <p>Study Time This Week</p>
            </div>
          </div>

          <div className="stat-card stat-card-indigo slide-in" style={{ animationDelay: '0.7s' }}>
            <div className="stat-icon floating">🔥</div>
            <div className="stat-info">
              <h3 className="counter">{studyStreak}</h3>
              <p>Day Streak</p>
            </div>
          </div>

          <div className="stat-card stat-card-teal slide-in" style={{ animationDelay: '0.8s' }}>
            <div className="stat-icon floating">⭐</div>
            <div className="stat-info">
              <h3 className="counter">4.8</h3>
              <p>Average Rating</p>
            </div>
          </div>
        </div>

        {/* FEATURE 4: Tabbed Navigation */}
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
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🏆 Achievements
          </button>
          <button
            className={`tab-button ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            🎯 Goals
          </button>
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </div>

        {/* FEATURE 5-10: Advanced Charts Section */}
        {activeTab === 'overview' && (
          <>
            <div className="charts-section">
              {/* Progress Bar Chart */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>📊 Course Progress</h3>
                  <p>Your progress across enrolled courses</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="progress" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Progress %" />
                    <Bar dataKey="completed" fill="#10B981" radius={[8, 8, 0, 0]} name="Lessons Done" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Completion Pie Chart */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>🥧 Completion Status</h3>
                  <p>Overview of your learning status</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {completionData.map((entry, index) => (
                    <div key={index} className="legend-item">
                      <div className="legend-color" style={{ background: entry.color }}></div>
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Activity Line Chart */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>📈 Weekly Activity</h3>
                  <p>Hours spent learning this week</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyActivityData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#8B5CF6"
                      fillOpacity={1}
                      fill="url(#colorHours)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Additional Charts Row */}
            <div className="charts-section">
              {/* Skills Radar Chart */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>🎯 Skills Assessment</h3>
                  <p>Your skill levels across different areas</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillsRadarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="skill" stroke="#6B7280" />
                    <PolarRadiusAxis stroke="#6B7280" />
                    <Radar
                      name="Skill Level"
                      dataKey="level"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>📚 Learning Categories</h3>
                  <p>Distribution by category</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.category}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Progress */}
              <div className="chart-card zoom-in">
                <div className="chart-header">
                  <h3>📅 Monthly Progress</h3>
                  <p>Courses completed per month</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="courses"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 6 }}
                      activeDot={{ r: 8 }}
                      name="Courses"
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', r: 6 }}
                      name="Study Hours"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* FEATURE 11: Achievement System */}
        {activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="section-header">
              <h2>🏆 Your Achievements</h2>
              <p className="section-subtitle">Unlock badges as you learn!</p>
            </div>
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                  {achievement.earned && <div className="earned-badge">✓ Unlocked!</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEATURE 12: Learning Goals Tracker */}
        {activeTab === 'goals' && (
          <div className="goals-section">
            <div className="section-header">
              <h2>🎯 Learning Goals</h2>
              <p className="section-subtitle">Track your progress towards your goals</p>
            </div>
            <div className="goals-list">
              {learningGoals.map(goal => (
                <div key={goal.id} className="goal-card">
                  <div className="goal-info">
                    <h3>{goal.goal}</h3>
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{ width: `${goal.progress}%` }}
                      >
                        <span className="goal-percentage">{goal.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="goal-status">
                    {goal.progress === 100 ? '✅' : '🎯'}
                  </div>
                </div>
              ))}
              <button className="btn btn-primary add-goal-btn">
                ➕ Add New Goal
              </button>
            </div>
          </div>
        )}

        {/* FEATURE 13: Advanced Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="section-header">
              <h2>📊 Detailed Analytics</h2>
              <div className="time-range-selector">
                <button
                  className={selectedTimeRange === 'week' ? 'active' : ''}
                  onClick={() => setSelectedTimeRange('week')}
                >
                  Week
                </button>
                <button
                  className={selectedTimeRange === 'month' ? 'active' : ''}
                  onClick={() => setSelectedTimeRange('month')}
                >
                  Month
                </button>
                <button
                  className={selectedTimeRange === 'year' ? 'active' : ''}
                  onClick={() => setSelectedTimeRange('year')}
                >
                  Year
                </button>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>⏱️ Total Study Time</h4>
                <p className="analytics-value">127 hours</p>
                <span className="analytics-change positive">+15% this month</span>
              </div>
              <div className="analytics-card">
                <h4>📚 Completion Rate</h4>
                <p className="analytics-value">87%</p>
                <span className="analytics-change positive">+5% improvement</span>
              </div>
              <div className="analytics-card">
                <h4>🎯 Average Score</h4>
                <p className="analytics-value">92%</p>
                <span className="analytics-change positive">Above average</span>
              </div>
              <div className="analytics-card">
                <h4>🏅 Ranking</h4>
                <p className="analytics-value">Top 10%</p>
                <span className="analytics-change positive">In your cohort</span>
              </div>
            </div>
          </div>
        )}

        {/* FEATURE 14: My Courses with Advanced Filters */}
        {activeTab === 'courses' && (
          <div className="section">
            <div className="section-header">
              <div>
                <h2>📚 My Courses</h2>
                <p className="section-subtitle">Continue where you left off</p>
              </div>
              <div className="course-filters">
                <select className="filter-select">
                  <option>All Courses</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Not Started</option>
                </select>
                <select className="filter-select">
                  <option>All Categories</option>
                  <option>Programming</option>
                  <option>Design</option>
                  <option>Business</option>
                </select>
              </div>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <h3>No courses enrolled yet</h3>
                <p>Start your learning journey by enrolling in your first course</p>
                <Link to="/courses" className="btn btn-primary btn-large pulse-animation">
                  🚀 Explore Courses
                </Link>
              </div>
            ) : (
              <div className="courses-grid">
                {enrolledCourses.map((course) => {
                  const courseProgress = progress.find(p => p.course?._id === course._id);
                  const progressPercent = courseProgress?.progressPercentage || 0;

                  return (
                    <div key={course._id} className="course-card hover-lift">
                      <div className="course-thumbnail">
                        <img
                          src={course.thumbnail || 'https://via.placeholder.com/400x250?text=Course'}
                          alt={course.title}
                        />
                        <div className="course-badge">{course.category}</div>
                        {progressPercent === 100 && (
                          <div className="completion-badge pulse-animation">
                            <span>✓ Completed</span>
                          </div>
                        )}
                        <div className="course-overlay">
                          <Link
                            to={`/student/course/${course._id}`}
                            className="btn btn-primary"
                          >
                            {progressPercent > 0 ? '📖 Continue' : '🚀 Start'}
                          </Link>
                        </div>
                      </div>
                      <div className="course-content">
                        <h3>{course.title}</h3>
                        <p className="course-instructor">
                          <span className="instructor-icon">👨‍🏫</span>
                          {course.instructor?.name}
                        </p>

                        <div className="progress-section">
                          <div className="progress-header">
                            <span className="progress-label">Progress</span>
                            <span className="progress-percent">{progressPercent}%</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill animated-fill"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="progress-details">
                            <span>{courseProgress?.completedLessons?.length || 0} lessons completed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FEATURE 15: Quick Actions Panel */}
        <div className="quick-actions-panel">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="quick-action-btn">
              <span className="action-icon">📥</span>
              <span>Download Certificates</span>
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">📊</span>
              <span>Export Progress</span>
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">💬</span>
              <span>Contact Support</span>
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;