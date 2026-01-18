import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to EduVillage</h1>
            <p className="hero-subtitle">
              Your Gateway to Quality Online Education
            </p>
            <p className="hero-description">
              Learn from expert instructors, track your progress, and achieve your educational goals
              with our comprehensive online learning platform.
            </p>
            
            {!isAuthenticated ? (
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started Free
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-large">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="hero-actions">
                <Link 
                  to={user?.role === 'student' ? '/student/dashboard' : 
                      user?.role === 'teacher' ? '/teacher/dashboard' : 
                      '/admin/dashboard'} 
                  className="btn btn-primary btn-large"
                >
                  Go to Dashboard
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-large">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose EduVillage?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Expert Instructors</h3>
              <p>Learn from experienced professionals in their fields</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Your Progress</h3>
              <p>Monitor your learning journey with detailed analytics</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Flexible Learning</h3>
              <p>Study at your own pace, anytime and anywhere</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Assessments & Quizzes</h3>
              <p>Test your knowledge with interactive quizzes</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Certificates</h3>
              <p>Earn certificates upon course completion</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Community Support</h3>
              <p>Connect with fellow learners and instructors</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Start Your Learning Journey Today</h2>
          <p>Join thousands of students already learning on EduVillage</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary btn-large">
              Sign Up Now
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <p>&copy; 2026 EduVillage - Civora Nexus Pvt. Ltd.</p>
          <p>Connecting Citizens Through Intelligent Innovation</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;