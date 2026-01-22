import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <h1>About EduVillage</h1>
          <p>Empowering learners worldwide through quality education</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="container">
          <div className="content-box">
            <h2>Our Mission</h2>
            <p>
              At EduVillage, we believe that quality education should be accessible to everyone, 
              everywhere. Our mission is to transform lives through learning by connecting students 
              with world-class instructors and cutting-edge course content.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🎯</div>
              <h3>Excellence</h3>
              <p>We strive for excellence in everything we do, from course quality to student support.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Accessibility</h3>
              <p>Education should be available to everyone, regardless of location or background.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">💡</div>
              <h3>Innovation</h3>
              <p>We continuously innovate to provide the best learning experience possible.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">🌟</div>
              <h3>Community</h3>
              <p>We foster a supportive community where learners can connect and grow together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Quality Courses</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Expert Instructors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <h2>Powered By</h2>
          <div className="company-info">
            <div className="company-logo">🏢</div>
            <h3>Civora Nexus Pvt. Ltd.</h3>
            <p className="tagline">Connecting Citizens Through Intelligent Innovation</p>
            <p className="description">
              Civora Nexus is a technology company dedicated to building innovative solutions 
              that connect people and empower communities through education and digital platforms.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;