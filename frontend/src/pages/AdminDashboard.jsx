import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalTeachers: 0
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [coursesRes] = await Promise.all([
        api.get('/courses')
      ]);
      
      setCourses(coursesRes.data.data);
      
      setStats({
        totalUsers: 0,
        totalCourses: coursesRes.data.data.length,
        totalStudents: 0,
        totalTeachers: 0
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Platform Overview & Management</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>{stats.totalCourses}</h3>
              <p>Total Courses</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-info">
              <h3>{stats.totalStudents}</h3>
              <p>Students</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-info">
              <h3>{stats.totalTeachers}</h3>
              <p>Teachers</p>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users Management
          </button>
          <button
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Courses Management
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'users' && (
            <div className="section">
              <h2>Users Management</h2>
              <p className="section-description">
                Manage user accounts, roles, and permissions. (Admin API endpoints to be implemented)
              </p>
              <div className="placeholder-content">
                <p>User management features coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="section">
              <h2>Courses Management</h2>
              <div className="courses-table">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Instructor</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Students</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id}>
                        <td><strong>{course.title}</strong></td>
                        <td>{course.instructor?.name}</td>
                        <td>{course.category}</td>
                        <td>
                          <span className={`status-badge status-${course.status}`}>
                            {course.status}
                          </span>
                        </td>
                        <td>{course.enrolledStudents?.length || 0}</td>
                        <td>
                          <button className="btn btn-sm btn-secondary">
                            Moderate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;