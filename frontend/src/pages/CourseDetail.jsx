import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModule, setExpandedModule] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
    if (isAuthenticated) {
      checkEnrollment();
    }
  }, [id, isAuthenticated]);

  const fetchCourseDetails = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data.data);
    } catch (error) {
      toast.error('Failed to load course details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data } = await api.get('/progress/my-courses');
      const isEnrolled = data.data?.some(progress => progress.course._id === id);
      setEnrolled(isEnrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to enroll');
      navigate('/login');
      return;
    }

    try { 
      await api.post(`/courses/${id}/enroll`);
      toast.success('Successfully enrolled! 🎉');
      setEnrolled(true);
      setTimeout(() => {
        navigate(`/student/course/${id}`);
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enrollment failed');
    }
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loader-detail"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="detail-error">
        <h2>Course not found</h2>
        <Link to="/courses" className="back-btn">← Back to Courses</Link>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0) || 0;
  const totalDuration = course.modules?.reduce((sum, mod) => 
    sum + (mod.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0), 0
  ) || 0;

  return (
    <div className="course-detail-page">
      {/* Hero Section */}
      <section className="detail-hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        
        <div className="detail-container">
          <div className="hero-content-detail">
            <div className="breadcrumb">
              <Link to="/courses">Courses</Link>
              <span className="separator">›</span>
              <span>{course.category}</span>
            </div>

            <h1 className="detail-title">{course.title}</h1>
            
            <p className="detail-description">{course.description}</p>

            <div className="detail-meta-row">
              <div className="meta-item-detail">
                <span className="meta-icon-detail">⭐</span>
                <span className="meta-text-detail">
                  <strong>{course.rating || 4.5}</strong> ({course.reviewCount || 0} reviews)
                </span>
              </div>
              <div className="meta-item-detail">
                <span className="meta-icon-detail">👥</span>
                <span className="meta-text-detail">
                  <strong>{course.enrolledCount || 0}</strong> students enrolled
                </span>
              </div>
              <div className="meta-item-detail">
                <span className="meta-icon-detail">📚</span>
                <span className="meta-text-detail">
                  <strong>{totalLessons}</strong> lessons
                </span>
              </div>
              <div className="meta-item-detail">
                <span className="meta-icon-detail">🕐</span>
                <span className="meta-text-detail">
                  <strong>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</strong> total
                </span>
              </div>
            </div>

            <div className="instructor-info-hero">
              <div className="instructor-avatar-hero">
                {course.instructor?.name?.[0] || 'T'}
              </div>
              <div>
                <p className="instructor-label">Instructor</p>
                <p className="instructor-name-hero">{course.instructor?.name || 'Expert Instructor'}</p>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <div className="card-image-preview">
              <img 
                src={course.thumbnail || 'https://source.unsplash.com/600x400/?education'} 
                alt={course.title}
              />
            </div>
            
            <div className="card-pricing">
              {course.isPaid ? (
                <>
                  <div className="price-main">₹{course.price}</div>
                  <div className="price-original">₹{course.price * 2}</div>
                  <div className="price-discount">50% OFF</div>
                </>
              ) : (
                <div className="price-free">Free Course</div>
              )}
            </div>

            {enrolled ? (
              <Link to={`/student/course/${id}`} className="enroll-btn enrolled-btn">
                Continue Learning →
              </Link>
            ) : (
              <button onClick={handleEnroll} className="enroll-btn">
                Enroll Now
              </button>
            )}

            <div className="card-includes">
              <h4>This course includes:</h4>
              <ul>
                <li>📹 {totalLessons} video lessons</li>
                <li>📱 Mobile and desktop access</li>
                <li>🏆 Certificate of completion</li>
                <li>♾️ Lifetime access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="detail-tabs-section">
        <div className="detail-container">
          <div className="tabs-header">
            <button 
              className={`tab-btn-detail ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-btn-detail ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum
            </button>
            <button 
              className={`tab-btn-detail ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          <div className="tabs-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="tab-content-detail">
                <div className="overview-section">
                  <h2>What you'll learn</h2>
                  <div className="learn-grid">
                    <div className="learn-item">✓ Master the fundamentals</div>
                    <div className="learn-item">✓ Build real-world projects</div>
                    <div className="learn-item">✓ Industry best practices</div>
                    <div className="learn-item">✓ Advanced techniques</div>
                    <div className="learn-item">✓ Problem-solving skills</div>
                    <div className="learn-item">✓ Career advancement</div>
                  </div>
                </div>

                <div className="overview-section">
                  <h2>Requirements</h2>
                  <ul className="requirements-list">
                    <li>Basic computer skills</li>
                    <li>Passion to learn</li>
                    <li>Internet connection</li>
                    <li>No prior experience needed</li>
                  </ul>
                </div>

                <div className="overview-section">
                  <h2>Course Description</h2>
                  <p className="course-long-desc">
                    {course.description || 'This comprehensive course will take you from beginner to advanced level. Learn at your own pace with hands-on projects and real-world examples.'}
                  </p>
                </div>
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div className="tab-content-detail">
                <div className="curriculum-header">
                  <h2>Course Curriculum</h2>
                  <p>{course.modules?.length || 0} modules • {totalLessons} lessons • {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total length</p>
                </div>

                <div className="modules-list">
                  {course.modules?.map((module, index) => (
                    <div key={module._id || index} className="module-item">
                      <div 
                        className="module-header"
                        onClick={() => setExpandedModule(expandedModule === index ? null : index)}
                      >
                        <div className="module-title-section">
                          <span className="module-number">Module {index + 1}</span>
                          <h3>{module.title}</h3>
                        </div>
                        <div className="module-meta">
                          <span className="lesson-count">{module.lessons?.length || 0} lessons</span>
                          <span className={`expand-icon ${expandedModule === index ? 'expanded' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>

                      {expandedModule === index && (
                        <div className="lessons-list">
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <div key={lesson._id || lessonIndex} className="lesson-item">
                              <div className="lesson-info">
                                <span className="lesson-icon">▶</span>
                                <span className="lesson-title">{lesson.title}</span>
                              </div>
                              <span className="lesson-duration">{lesson.duration || 0} min</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="tab-content-detail">
                <div className="reviews-overview">
                  <div className="rating-summary">
                    <div className="rating-number-large">{course.rating || 4.5}</div>
                    <div className="stars-large">⭐⭐⭐⭐⭐</div>
                    <p className="rating-text">{course.reviewCount || 0} reviews</p>
                  </div>
                </div>

                <div className="reviews-list">
                  {/* Sample review */}
                  <div className="review-item">
                    <div className="review-header">
                      <div className="reviewer-avatar">A</div>
                      <div>
                        <h4>Anonymous Student</h4>
                        <div className="review-stars">⭐⭐⭐⭐⭐</div>
                      </div>
                    </div>
                    <p className="review-text">Great course! Learned so much. Highly recommended!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;