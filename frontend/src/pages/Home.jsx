import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);

  // Particle background - lighter and subtle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const particles = [];
    const particleCount = 50;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speedX = Math.random() * 0.3 - 0.15;
        this.speedY = Math.random() * 0.3 - 0.15;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        ctx.fillStyle = 'rgba(30, 58, 138, 0.15)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(30, 58, 138, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Counter animation
  useEffect(() => {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          const target = parseInt(entry.target.getAttribute('data-target'));
          const suffix = entry.target.getAttribute('data-suffix') || '';
          let count = 0;
          const increment = target / 100;
          const updateCount = () => {
            count += increment;
            if (count < target) {
              entry.target.textContent = Math.ceil(count) + suffix;
              requestAnimationFrame(updateCount);
            } else {
              entry.target.textContent = target + suffix;
            }
          };
          updateCount();
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
    return () => observer.disconnect();
  }, []);

  // Auto-rotate demo tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home">
      <canvas className="canvas-bg" ref={canvasRef}></canvas>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🚀</span>
            <span>Next Generation Learning Platform</span>
          </div>
          <h1 className="hero-title">
            Transform Your Future with
            <span className="highlight"> EduVillage</span>
          </h1>
          <p className="hero-text">
            Master new skills with expert-led courses powered by AI. Join thousands of learners 
            achieving their goals through personalized education.
          </p>
          {!isAuthenticated ? (
            <div className="hero-buttons">
              <Link to="/register" className="hero-btn btn-primary">
                <span>Get Started Free</span>
                <span className="btn-arrow">→</span>
              </Link>
              <Link to="/courses" className="hero-btn btn-secondary">
                <span>Browse Courses</span>
                <span className="btn-icon">📚</span>
              </Link>
            </div>
          ) : (
            <div className="hero-buttons">
              <Link 
                to={user?.role === 'student' ? '/student/dashboard' : user?.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'} 
                className="hero-btn btn-primary"
              >
                <span>Go to Dashboard</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>
          )}
        </div>
        <div className="hero-image">
          <div className="hero-illustration">
            <div className="floating-card card-1">📚</div>
            <div className="floating-card card-2">🎓</div>
            <div className="floating-card card-3">💡</div>
            <div className="floating-card card-4">🚀</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number" data-target="10" data-suffix="K+">0</div>
            <div className="stat-label">Active Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-number" data-target="500" data-suffix="+">0</div>
            <div className="stat-label">Quality Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-number" data-target="100" data-suffix="+">0</div>
            <div className="stat-label">Expert Instructors</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-number" data-target="95" data-suffix="%">0</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="section-header">
          <div className="section-badge">
            <span>✨</span>
            <span>Why Choose Us</span>
          </div>
          <h2 className="section-title">Experience Excellence in Education</h2>
          <p className="section-subtitle">
            Discover the features that make EduVillage the perfect platform for your learning journey
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Expert Instructors</h3>
            <p>Learn from industry professionals with real-world experience and proven teaching methodologies</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Learning</h3>
            <p>Personalized learning paths powered by advanced AI to match your pace and style</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Learn Anywhere</h3>
            <p>Access courses on any device, anytime, anywhere with seamless synchronization</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Get Certified</h3>
            <p>Earn industry-recognized certificates to showcase your achievements and skills</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Real-time analytics and insights to monitor your learning journey and improvements</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lifetime Access</h3>
            <p>Learn at your own pace with unlimited course access and regular content updates</p>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="demo-section" id="demo">
        <div className="demo-container">
          <div className="demo-content">
            <div className="section-badge">
              <span>💫</span>
              <span>See It In Action</span>
            </div>
            <h2>Experience Interactive Learning</h2>
            <p>Discover how EduVillage transforms traditional education into an engaging, intelligent experience</p>
            <div className="demo-features">
              <div className="demo-feature-item">
                <div className="demo-icon">✨</div>
                <div>
                  <h4>Smart Dashboard</h4>
                  <p>Intuitive interface for seamless learning</p>
                </div>
              </div>
              <div className="demo-feature-item">
                <div className="demo-icon">🎯</div>
                <div>
                  <h4>Personalized Content</h4>
                  <p>AI-curated courses just for you</p>
                </div>
              </div>
              <div className="demo-feature-item">
                <div className="demo-icon">🚀</div>
                <div>
                  <h4>Quick Progress</h4>
                  <p>Accelerated learning with smart tools</p>
                </div>
              </div>
            </div>
            <Link 
              to={!isAuthenticated ? "/register" : "/courses"} 
              className="hero-btn btn-primary demo-cta-btn"
            >
              <span>Start Your Journey</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
          <div className="demo-image">
            <div className="demo-mockup">
              <div className="demo-window">
                <div className="demo-window-header">
                  <div className="demo-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="demo-title">EduVillage Dashboard</div>
                  <div></div>
                </div>
                <div className="demo-window-body">
                  <div className="demo-tabs">
                    <div 
                      className={`demo-tab ${activeTab === 0 ? 'active' : ''}`} 
                      onClick={() => setActiveTab(0)}
                    >
                      📚 My Courses
                    </div>
                    <div 
                      className={`demo-tab ${activeTab === 1 ? 'active' : ''}`} 
                      onClick={() => setActiveTab(1)}
                    >
                      🤖 AI Tutor
                    </div>
                    <div 
                      className={`demo-tab ${activeTab === 2 ? 'active' : ''}`} 
                      onClick={() => setActiveTab(2)}
                    >
                      📊 Progress
                    </div>
                  </div>
                  <div className="demo-tab-content">
                    {activeTab === 0 && (
                      <div className="demo-pane">
                        <div className="demo-courses">
                          <div className="course-item">
                            <div className="course-progress">
                              <div className="progress-bar" style={{width: '75%'}}></div>
                            </div>
                            <div className="course-info">
                              <h4>React Masterclass</h4>
                              <p>75% Complete</p>
                            </div>
                          </div>
                          <div className="course-item">
                            <div className="course-progress">
                              <div className="progress-bar" style={{width: '45%'}}></div>
                            </div>
                            <div className="course-info">
                              <h4>Python for Data Science</h4>
                              <p>45% Complete</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 1 && (
                      <div className="demo-pane">
                        <div className="demo-chat">
                          <div className="chat-message user">
                            <div className="message-bubble">How do I master React hooks?</div>
                          </div>
                          <div className="chat-message ai">
                            <div className="message-bubble">
                              <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 2 && (
                      <div className="demo-pane">
                        <div className="demo-chart">
                          <div className="chart-bars">
                            <div className="chart-bar" style={{height: '70%'}}></div>
                            <div className="chart-bar" style={{height: '85%'}}></div>
                            <div className="chart-bar" style={{height: '60%'}}></div>
                            <div className="chart-bar" style={{height: '90%'}}></div>
                            <div className="chart-bar" style={{height: '75%'}}></div>
                          </div>
                          <div className="chart-label">📈 Weekly Learning Hours</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to Start Learning?</h2>
          <p>Join thousands of students transforming their careers with EduVillage</p>
          {!isAuthenticated && (
            <div className="hero-buttons">
              <Link to="/register" className="hero-btn btn-primary">
                <span>Get Started Now</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" id="about">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🎓</span>
              <span>EduVillage</span>
            </div>
            <p>Empowering learners worldwide with cutting-edge education technology and expert-led courses</p>
            <div className="social-links">
              <a href="#" aria-label="Twitter">📱</a>
              <a href="#" aria-label="Facebook">👍</a>
              <a href="#" aria-label="LinkedIn">💼</a>
              <a href="#" aria-label="Instagram">📷</a>
            </div>
          </div>
          <div className="footer-links">
            <h4>Product</h4>
            <Link to="/courses">Features</Link>
            <Link to="/courses">Courses</Link>
            <a href="#pricing">Pricing</a>
            <a href="#demo">Demo</a>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
            <a href="#careers">Careers</a>
            <a href="#blog">Blog</a>
          </div>
          <div className="footer-links">
            <h4>Resources</h4>
            <a href="#docs">Documentation</a>
            <a href="#support">Support</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 EduVillage by Civora Nexus. All rights reserved. Made with ❤️ for Education</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;