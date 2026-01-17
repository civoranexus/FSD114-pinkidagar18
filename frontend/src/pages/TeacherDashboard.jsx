import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data } = await api.get('/courses/teacher/my-courses');
      setCourses(data.data);

      // Calculate stats
      const totalCourses = data.data.length;
      const publishedCourses = data.data.filter(c => c.status === 'published').length;
      const totalStudents = data.data.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
      const averageRating = data.data.reduce((sum, c) => sum + (c.rating?.average || 0), 0) / totalCourses || 0;

      setStats({
        totalCourses,
        publishedCourses,
        totalStudents,
        averageRating: averageRating.toFixed(1)
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Course deleted successfully');
      fetchTeacherData();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="teacher-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Teacher Dashboard</h1>
            <p>Welcome, {user.name}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/teacher/create-course')}>
            + Create New Course
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>{stats.totalCourses}</h3>
              <p>Total Courses</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.publishedCourses}</h3>
              <p>Published</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <h3>{stats.averageRating}</h3>
              <p>Avg Rating</p>
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div className="section">
          <h2>My Courses</h2>

          {courses.length === 0 ? (
            <div className="empty-state">
              <p>You haven't created any courses yet.</p>
              <button className="btn btn-primary" onClick={() => navigate('/teacher/create-course')}>
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="courses-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id}>
                      <td>
                        <div className="course-info">
                          <strong>{course.title}</strong>
                          <span className="course-category">{course.category}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${course.status}`}>
                          {course.status}
                        </span>
                      </td>
                      <td>{course.enrolledStudents?.length || 0}</td>
                      <td>
                        {course.rating?.average > 0 
                          ? `⭐ ${course.rating.average.toFixed(1)}` 
                          : 'No ratings'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link 
                            to={`/courses/${course._id}`}
                            className="btn btn-sm btn-secondary"
                          >
                            View
                          </Link>
                          <Link
                            to={`/teacher/course/${course._id}/edit`}
                            className="btn btn-sm btn-primary"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteCourse(course._id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;