import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './CourseCatalog.css';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { name: 'All', icon: '🎯', color: '#667eea' },
    { name: 'Programming', icon: '💻', color: '#3B82F6' },
    { name: 'Design', icon: '🎨', color: '#EC4899' },
    { name: 'Business', icon: '💼', color: '#10B981' },
    { name: 'Marketing', icon: '📈', color: '#F59E0B' },
    { name: 'Data Science', icon: '📊', color: '#8B5CF6' },
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.data || []);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loader"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="modern-courses-page">
      {/* Hero */}
      <section className="modern-hero">
        <div className="hero-overlay"></div>
        <div className="modern-container">
          <h1 className="modern-hero-title">
            Explore Our Courses
          </h1>
          <p className="modern-hero-subtitle">
            Discover world-class courses to advance your skills
          </p>
          
          <div className="modern-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for anything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="modern-categories">
        <div className="modern-container">
          <div className="category-scroll">
            {categories.map(cat => (
              <button
                key={cat.name}
                className={`cat-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
                style={{ '--cat-color': cat.color }}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="modern-courses">
        <div className="modern-container">
          <div className="courses-header">
            <h2>
              {searchTerm ? `Search results for "${searchTerm}"` : 'All Courses'}
            </h2>
            <p className="course-count">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
            </p>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="modern-grid">
              {filteredCourses.map((course, index) => (
                <Link 
                  key={course._id} 
                  to={`/courses/${course._id}`} 
                  className="modern-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="card-image">
                    <img 
                      src={course.thumbnail || `https://source.unsplash.com/400x250/?education,${course.category}`} 
                      alt={course.title}
                    />
                    <div className="card-overlay">
                      <span className="view-btn">View Course →</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-top">
                      <span className="course-category">{course.category || 'General'}</span>
                      {course.isPaid && (
                        <span className="course-price">₹{course.price}</span>
                      )}
                      {!course.isPaid && (
                        <span className="course-free">Free</span>
                      )}
                    </div>

                    <h3 className="card-title">{course.title}</h3>
                    
                    <p className="card-description">
                      {course.description?.substring(0, 85)}
                      {course.description?.length > 85 ? '...' : ''}
                    </p>

                    <div className="card-footer">
                      <div className="instructor">
                        <div className="instructor-avatar">
                          {course.instructor?.name?.[0] || 'T'}
                        </div>
                        <span>{course.instructor?.name || 'Expert'}</span>
                      </div>
                      <div className="card-meta">
                        <span className="rating">⭐ {course.rating || 4.5}</span>
                        <span className="students">👥 {course.enrolledCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="modern-empty">
              <div className="empty-icon">🔍</div>
              <h3>No courses found</h3>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search term.`
                  : 'Try a different category or search term'
                }
              </p>
              <button 
                className="reset-button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CourseCatalog;