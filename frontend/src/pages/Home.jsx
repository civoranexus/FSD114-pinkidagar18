import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Learn Without Limits
          </h1>
          <p className="hero-text">
            Master new skills with expert-led courses. Start learning today and transform your future.
          </p>
          {!isAuthenticated ? (
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary-large">
                Get Started Free
              </Link>
              <Link to="/courses" className="btn-secondary-large">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="hero-buttons">
              <Link 
                to={user?.role === 'student' ? '/student/dashboard' : 
                    user?.role === 'teacher' ? '/teacher/dashboard' : 
                    '/admin/dashboard'} 
                className="btn-primary-large"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
        
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Students</div>
          </div>
          <div className="stat">
            <div className="stat-number">500+</div>
            <div className="stat-label">Courses</div>
          </div>
          <div className="stat">
            <div className="stat-number">100+</div>
            <div className="stat-label">Instructors</div>
          </div>
          <div className="stat">
            <div className="stat-number">95%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Choose EduVillage</h2>
        
        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon">🎓</div>
            <h3>Expert Instructors</h3>
            <p>Learn from industry professionals with real-world experience</p>
          </div>
          
          <div className="feature-box">
            <div className="feature-icon">📱</div>
            <h3>Learn Anywhere</h3>
            <p>Access courses on any device, anytime, anywhere</p>
          </div>
          
          <div className="feature-box">
            <div className="feature-icon">🏆</div>
            <h3>Get Certified</h3>
            <p>Earn certificates to showcase your achievements</p>
          </div>
          
          <div className="feature-box">
            <div className="feature-icon">💡</div>
            <h3>Lifetime Access</h3>
            <p>Learn at your own pace with unlimited course access</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Start Learning?</h2>
        <p>Join thousands of students transforming their careers</p>
        {!isAuthenticated && (
          <Link to="/register" className="btn-cta">
            Start Learning Today
          </Link>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <h3>EduVillage</h3>
            <p>© 2026 Civora Nexus. All rights reserved.</p>
          </div>
          <div className="footer-right">
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;