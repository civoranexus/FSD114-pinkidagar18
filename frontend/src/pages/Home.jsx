import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Welcome to EduVillage</h1>
      <p>Your Gateway to Quality Online Education</p>
      
      {!isAuthenticated ? (
        <div style={{ marginTop: '2rem' }}>
          <Link to="/register" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Get Started Free
          </Link>
          <Link to="/courses" className="btn btn-secondary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <Link 
            to={user?.role === 'student' ? '/student/dashboard' : 
                user?.role === 'teacher' ? '/teacher/dashboard' : 
                '/admin/dashboard'} 
            className="btn btn-primary"
            style={{ marginRight: '1rem' }}
          >
            Go to Dashboard
          </Link>
          <Link to="/courses" className="btn btn-secondary">
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;