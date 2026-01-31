import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseAndProgress();
  }, [id]);

  const fetchCourseAndProgress = async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/progress/${id}`)
      ]);

      setCourse(courseRes.data.data);
      setProgress(progressRes.data.data);

      if (progressRes.data.data.lastAccessedLesson) {
        const moduleIndex = courseRes.data.data.modules.findIndex(
          m => m._id === progressRes.data.data.lastAccessedLesson.moduleId
        );
        const lessonIndex = courseRes.data.data.modules[moduleIndex]?.lessons.findIndex(
          l => l._id === progressRes.data.data.lastAccessedLesson.lessonId
        );

        if (moduleIndex >= 0 && lessonIndex >= 0) {
          setCurrentModule(moduleIndex);
          setCurrentLesson(lessonIndex);
        }
      }
    } catch (error) {
      toast.error('Failed to load course');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async () => {
    const lesson = course.modules[currentModule].lessons[currentLesson];

    try {
      const { data } = await api.post(`/progress/${id}/complete-lesson`, {
        lessonId: lesson._id,
        moduleId: course.modules[currentModule]._id
      });

      setProgress(data.data);
      toast.success('Lesson marked as complete!');
      goToNextLesson();
    } catch (error) {
      toast.error('Failed to mark lesson complete');
    }
  };

  const updateLastAccessed = async (moduleId, lessonId) => {
    try {
      await api.put(`/progress/${id}/update-position`, {
        moduleId,
        lessonId
      });
    } catch (error) {
      console.error('Failed to update position');
    }
  };

  const goToLesson = (moduleIndex, lessonIndex) => {
    setCurrentModule(moduleIndex);
    setCurrentLesson(lessonIndex);

    const module = course.modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    updateLastAccessed(module._id, lesson._id);
  };

  const goToNextLesson = () => {
    const currentModuleObj = course.modules[currentModule];

    if (currentLesson < currentModuleObj.lessons.length - 1) {
      goToLesson(currentModule, currentLesson + 1);
    } else if (currentModule < course.modules.length - 1) {
      goToLesson(currentModule + 1, 0);
    } else {
      toast.success('Congratulations! You\'ve completed the course!');
    }
  };

  const goToPrevLesson = () => {
    if (currentLesson > 0) {
      goToLesson(currentModule, currentLesson - 1);
    } else if (currentModule > 0) {
      const prevModule = course.modules[currentModule - 1];
      goToLesson(currentModule - 1, prevModule.lessons.length - 1);
    }
  };

  const isLessonCompleted = (lessonId) => {
    return progress?.completedLessons?.some(cl => cl.lessonId === lessonId);
  };

  if (loading) {
    return <div className="loading-container">Loading course...</div>;
  }

  if (!course) {
    return <div className="error-container">Course not found</div>;
  }

  const currentModuleObj = course.modules[currentModule];
  const currentLessonObj = currentModuleObj?.lessons[currentLesson];

  return (
    <div className="course-player">
      <div className="course-sidebar">
        <div className="course-info">
          <h2>{course.title}</h2>
          <div className="progress-info">
            <div className="progress-text">
              {progress?.progressPercentage || 0}% Complete
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress?.progressPercentage || 0}%` }}
              />
            </div>
          </div>
          <Link to="/student/dashboard" className="back-to-dashboard-player">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="modules-list">
          {course.modules.map((module, moduleIndex) => (
            <div key={module._id} className="module-item">
              <div className="module-header">
                <h3>Module {moduleIndex + 1}: {module.title}</h3>
                <span className="module-progress">
                  {module.lessons.filter(l => isLessonCompleted(l._id)).length}/
                  {module.lessons.length}
                </span>
              </div>

              <div className="lessons-list">
                {module.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson._id}
                    className={`lesson-item ${moduleIndex === currentModule && lessonIndex === currentLesson
                      ? 'active'
                      : ''
                      } ${isLessonCompleted(lesson._id) ? 'completed' : ''}`}
                    onClick={() => goToLesson(moduleIndex, lessonIndex)}
                  >
                    <div className="lesson-status">
                      {isLessonCompleted(lesson._id) ? '✓' : '○'}
                    </div>
                    <div className="lesson-info">
                      <div className="lesson-title">{lesson.title}</div>
                      <div className="lesson-meta">
                        <span>{lesson.contentType}</span>
                        <span>{lesson.duration} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="course-content">
        <div className="content-area">
          <div className="content-header">
            <h1>{currentLessonObj.title}</h1>
            <span className="lesson-type">{currentLessonObj.contentType}</span>
          </div>

          <div className="content-display">
            {currentLessonObj.contentType === 'video' ? (
              <div className="video-container">
                <video controls width="100%" key={currentLessonObj.contentUrl}>
                  <source src={currentLessonObj.contentUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : currentLessonObj.contentType === 'pdf' ? (
              <div className="pdf-container">
                <iframe
                  src={currentLessonObj.contentUrl}
                  width="100%"
                  height="600px"
                  title={currentLessonObj.title}
                />
              </div>
            ) : currentLessonObj.contentType === 'text' ? (
              <div className="text-content">
                <p>{currentLessonObj.contentUrl}</p>
              </div>
            ) : (
              <div className="link-content">
                <a
                  href={currentLessonObj.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Open External Resource
                </a>
              </div>
            )}
          </div>

          {currentLessonObj.description && (
            <div className="lesson-description">
              <h3>About this lesson</h3>
              <p>{currentLessonObj.description}</p>
            </div>
          )}

          <div className="lesson-controls">
            <button
              onClick={goToPrevLesson}
              disabled={currentModule === 0 && currentLesson === 0}
              className="btn btn-secondary"
            >
              ← Previous Lesson
            </button>

            {!isLessonCompleted(currentLessonObj._id) && (
              <button
                onClick={handleLessonComplete}
                className="btn btn-primary"
              >
                ✓ Mark as Complete
              </button>
            )}

            <button
              onClick={goToNextLesson}
              disabled={
                currentModule === course.modules.length - 1 &&
                currentLesson === currentModuleObj.lessons.length - 1
              }
              className="btn btn-secondary"
            >
              Next Lesson →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;