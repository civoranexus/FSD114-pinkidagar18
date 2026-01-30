import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const canvasRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Particle system
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
    const particleCount = 80;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
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
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
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
      
      particles.forEach((particle, i) => {
        particle.update();
        particle.draw();
        
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });
      
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: '🤖', title: 'AI-Powered Learning', description: 'Personalized learning paths that adapt to your pace and goals' },
    { icon: '📊', title: 'Real-Time Analytics', description: 'Track progress with detailed insights and recommendations' },
    { icon: '🎯', title: 'Interactive Courses', description: 'Hands-on projects and coding challenges for real skills' },
    { icon: '🏆', title: 'Certifications', description: 'Industry-recognized certificates to boost your career' },
    { icon: '👥', title: 'Expert Community', description: 'Connect with mentors in a thriving global network' },
    { icon: '⚡', title: 'Learn Faster', description: 'Proven techniques to accelerate learning and retention' }
  ];

  const stats = [
    { number: '100K+', label: 'Active Learners', icon: '👨‍🎓' },
    { number: '2,000+', label: 'Expert Courses', icon: '📚' },
    { number: '4.9/5', label: 'Student Rating', icon: '⭐' },
    { number: '150+', label: 'Countries', icon: '🌍' }
  ];

  const testimonials = [
    {
      text: "EduVillage completely transformed my career! The AI tutor is like having a personal mentor available 24/7. I landed my dream job in just 4 months.",
      author: "Sarah Johnson",
      role: "Senior Developer",
      company: "Google",
      avatar: "👩‍💻"
    },
    {
      text: "The best investment I've made in myself. The courses are practical, well-structured, and the community support is incredible.",
      author: "Michael Chen",
      role: "Product Designer",
      company: "Apple",
      avatar: "👨‍🎨"
    },
    {
      text: "I've tried many platforms, but EduVillage stands out. The interactive projects helped me master React in record time.",
      author: "Emily Rodriguez",
      role: "Full Stack Engineer",
      company: "Microsoft",
      avatar: "👩‍💼"
    }
  ];

  return (
    <div className="home-modern">
      <canvas className="canvas-bg" ref={canvasRef}></canvas>
      
      {/* Mouse spotlight */}
      <div 
        className="spotlight" 
        style={{
          left: mousePos.x - 300 + 'px',
          top: mousePos.y - 300 + 'px'
        }}
      ></div>

      {/* Custom Cursor */}
      <div 
        className="cursor" 
        style={{ left: mousePos.x + 'px', top: mousePos.y + 'px' }}
      ></div>
      <div 
        className="cursor-follower" 
        style={{ left: mousePos.x - 20 + 'px', top: mousePos.y - 20 + 'px' }}
      ></div>

      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-content">
          <div className="hero-badge">
            🚀 Join 100K+ Learners Worldwide
          </div>
          
          <h1 className="hero-title">
            Next Generation<br />
            <span className="gradient-text">Learning Platform</span>
          </h1>
          
          <p className="hero-description">
            Master in-demand skills with AI-powered courses. Learn from industry experts, 
            build real projects, and transform your career with personalized education.
          </p>

          {!isAuthenticated ? (
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary">
                <span>Start Learning Free</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/courses" className="btn-secondary">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="hero-buttons">
              <Link 
                to={user?.role === 'student' ? '/student/dashboard' : user?.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'} 
                className="btn-primary"
              >
                <span>Go to Dashboard</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          )}

          <div className="trust-badges">
            <div className="trust-item">
              <span className="trust-icon">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✓</span>
              <span>7-day money-back guarantee</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✓</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" id="stats" data-animate>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`stat-card ${isVisible.stats ? 'visible' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features" data-animate>
        <div className="section-header">
          <div className="section-badge">✨ Platform Features</div>
          <h2 className="section-title">
            Everything You Need to <span className="gradient-text">Excel</span>
          </h2>
          <p className="section-description">
            Cutting-edge tools and features designed to maximize your learning potential
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${isVisible.features ? 'visible' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works" data-animate>
        <div className="section-header">
          <div className="section-badge">🎯 Simple Process</div>
          <h2 className="section-title">
            Start Learning in <span className="gradient-text">3 Simple Steps</span>
          </h2>
        </div>

        <div className="steps-container">
          {[
            { number: '01', icon: '📝', title: 'Create Account', desc: 'Sign up free and get instant access to 2000+ courses' },
            { number: '02', icon: '🎯', title: 'Choose Your Path', desc: 'Let AI recommend perfect courses based on your goals' },
            { number: '03', icon: '🚀', title: 'Start Learning', desc: 'Learn at your pace with expert guidance and support' }
          ].map((step, index) => (
            <div 
              key={index} 
              className={`step-card ${isVisible['how-it-works'] ? 'visible' : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section" id="testimonials" data-animate>
        <div className="section-header">
          <div className="section-badge">💬 Success Stories</div>
          <h2 className="section-title">
            Loved by <span className="gradient-text">100K+ Learners</span>
          </h2>
        </div>

        <div className="testimonials-container">
          <div 
            className="testimonials-track"
            style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-slide">
                <div className="testimonial-card">
                  <div className="testimonial-quote">"</div>
                  <p className="testimonial-text">{testimonial.text}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{testimonial.avatar}</div>
                    <div className="author-info">
                      <div className="author-name">{testimonial.author}</div>
                      <div className="author-role">{testimonial.role}</div>
                      <div className="author-company">{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${activeTestimonial === index ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta" data-animate>
        <div className={`cta-content ${isVisible.cta ? 'visible' : ''}`}>
          <div className="cta-badge">🎉 Limited Time Offer</div>
          <h2 className="cta-title">Ready to Transform Your Career?</h2>
          <p className="cta-description">
            Join 100,000+ students who are already learning the skills of tomorrow
          </p>
          
          {!isAuthenticated && (
            <Link to="/register" className="btn-primary btn-large">
              <span>Start Learning Free</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
          
          <div className="cta-features">
            <span>✓ No credit card required</span>
            <span>✓ 7-day money-back guarantee</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-modern">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🎓</span>
              <span className="logo-text">EduVillage</span>
            </div>
            <p className="footer-tagline">
              Empowering learners worldwide with cutting-edge AI-powered education technology.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Platform</h4>
            <Link to="/courses">Browse Courses</Link>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <a href="#about">About Us</a>
            <a href="#careers">Careers</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-links">
            <h4>Support</h4>
            <a href="#help">Help Center</a>
            <a href="#faq">FAQ</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 EduVillage by Civora Nexus. All rights reserved.</p>
          <p>Made with ❤️ for education and innovation</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;