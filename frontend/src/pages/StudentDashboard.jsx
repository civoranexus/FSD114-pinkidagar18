import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
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

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="student-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Welcome back, {user.name}!</h1>
          <p>Continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>{enrolledCourses.length}</h3>
              <p>Enrolled Courses</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{progress.filter(p => p.progressPercentage === 100).length}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>
                {progress.length > 0
                  ? Math.round(progress.reduce((sum, p) => sum + p.progressPercentage, 0) / progress.length)
                  : 0}%
              </h3>
              <p>Average Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h3>{progress.filter(p => p.certificateIssued).length}</h3>
              <p>Certificates</p>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="section">
          <div className="section-header">
            <h2>My Courses</h2>
            <Link to="/courses" className="btn btn-secondary">
              Browse More
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="empty-state">
              <p>You haven't enrolled in any courses yet.</p>
              <Link to="/courses" className="btn btn-primary">
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="courses-grid">
              {enrolledCourses.map((course) => {
                const courseProgress = progress.find(p => p.course?._id === course._id);
                return (
                  <div key={course._id} className="course-card">
                    <div className="course-thumbnail">
                      <img
                        src={course.thumbnail || 'https://via.placeholder.com/400x250'}
                        alt={course.title}
                      />
                    </div>
                    <div className="course-content">
                      <h3>{course.title}</h3>
                      <p className="course-instructor">By {course.instructor?.name}</p>
                      
                      {/* Progress Bar */}
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Progress</span>
                          <span>{courseProgress?.progressPercentage || 0}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${courseProgress?.progressPercentage || 0}%` }}
                          />
                        </div>
                      </div>

                      <Link 
                        to={`/student/course/${course._id}`}
                        className="btn btn-primary btn-block"
                      >
                        {courseProgress?.progressPercentage > 0 ? 'Continue Learning' : 'Start Course'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;