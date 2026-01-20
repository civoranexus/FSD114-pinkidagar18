import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './CourseCatalog.css';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    search: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.level) params.level = filters.level;
      if (filters.search) params.search = filters.search;

      const { data } = await api.get('/courses', { params });
      setCourses(data.data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      level: '',
      search: ''
    });
  };

  return (
    <div className="course-catalog-page">
      <div className="container">
        <div className="catalog-header">
          <h1>Explore Our Courses</h1>
          <p>Discover quality courses from expert instructors</p>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              name="search"
              placeholder="Search courses..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
              <option value="Data Science">Data Science</option>
              <option value="Personal Development">Personal Development</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {(filters.category || filters.level || filters.search) && (
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <p>No courses found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CourseCard = ({ course }) => {
  return (
    <Link to={`/courses/${course._id}`} className="course-card">
      <div className="course-thumbnail">
        <img
          src={course.thumbnail || 'https://via.placeholder.com/400x250?text=Course'}
          alt={course.title}
        />
        <span className={`course-level level-${course.level?.toLowerCase()}`}>
          {course.level}
        </span>
      </div>

      <div className="course-content">
        <div className="course-category">{course.category}</div>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-description">
          {course.shortDescription || course.description?.substring(0, 100) + '...'}
        </p>

        <div className="course-footer">
          <div className="course-instructor">
            <span>By {course.instructor?.name}</span>
          </div>
          <div className="course-stats">
            <span>⏱ {course.totalDuration || 0} min</span>
            <span>👥 {course.enrolledStudents?.length || 0} students</span>
          </div>
        </div>

        {course.isPaid ? (
          <div className="course-price">₹{course.price}</div>
        ) : (
          <div className="course-free">FREE</div>
        )}
      </div>
    </Link>
  );
};

export default CourseCatalog;