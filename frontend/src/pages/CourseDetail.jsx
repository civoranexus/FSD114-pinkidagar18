import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data.data);
      
      if (user && data.data.enrolledStudents?.includes(user.id)) {
        setIsEnrolled(true);
      }
    } catch (error) {
      toast.error('Failed to load course details');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to enroll');
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }

    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success('Successfully enrolled in course!');
      setIsEnrolled(true);
      fetchCourseDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartCourse = () => {
    navigate(`/student/course/${id}`);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!course) {
    return <div className="error-container">Course not found</div>;
  }

  return (
    <div className="course-detail-page">
      <div className="course-hero">
        <div className="container">
          <div className="course-hero-content">
            <div className="course-info">
              <span className="course-category">{course.category}</span>
              <h1>{course.title}</h1>
              <p className="course-description">{course.description}</p>
              
              <div className="course-meta">
                <span className="meta-item">
                  <strong>Level:</strong> {course.level}
                </span>
                <span className="meta-item">
                  <strong>Duration:</strong> {course.totalDuration} minutes
                </span>
                <span className="meta-item">
                  <strong>Students:</strong> {course.enrolledStudents?.length || 0}
                </span>
              </div>

              <div className="course-instructor-info">
                <h3>Instructor</h3>
                <div className="instructor-card">
                  <div className="instructor-name">{course.instructor?.name}</div>
                  {course.instructor?.bio && (
                    <p className="instructor-bio">{course.instructor.bio}</p>
                  )}
                </div>
              </div>

              <div className="course-actions">
                {isEnrolled ? (
                  <button onClick={handleStartCourse} className="btn btn-primary btn-large">
                    Continue Learning
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="btn btn-primary btn-large"
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : course.isPaid ? `Enroll - ₹${course.price}` : 'Enroll Free'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="course-sections">
          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <div className="course-section">
              <h2>What You'll Learn</h2>
              <ul className="outcomes-list">
                {course.learningOutcomes.map((outcome, index) => (
                  <li key={index}>✓ {outcome}</li>
                ))}
              </ul>
            </div>
          )}

          {course.requirements && course.requirements.length > 0 && (
            <div className="course-section">
              <h2>Requirements</h2>
              <ul className="requirements-list">
                {course.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="course-section">
            <h2>Course Content</h2>
            <div className="modules-list">
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((module, index) => (
                  <div key={module._id || index} className="module-item">
                    <div className="module-header">
                      <h3>{module.title}</h3>
                      <span className="module-lessons">{module.lessons?.length || 0} lessons</span>
                    </div>
                    {module.description && (
                      <p className="module-description">{module.description}</p>
                    )}
                    <div className="lessons-list">
                      {module.lessons?.map((lesson, lessonIndex) => (
                        <div key={lesson._id || lessonIndex} className="lesson-item">
                          <span className="lesson-icon">
                            {lesson.contentType === 'video' ? '▶' : '📄'}
                          </span>
                          <span className="lesson-title">{lesson.title}</span>
                          <span className="lesson-duration">{lesson.duration} min</span>
                          {lesson.isFree && <span className="lesson-free">FREE</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-content">No modules available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;