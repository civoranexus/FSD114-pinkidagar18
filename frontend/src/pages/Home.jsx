import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const canvasRef = useRef(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const words = ['Web Development', 'Data Science', 'AI & ML', 'Design', 'Business'];
  
  // Typing animation
  useEffect(() => {
    let currentText = '';
    let isDeleting = false;
    let charIndex = 0;
    
    const type = () => {
      const currentWord = words[currentWordIndex];
      
      if (!isDeleting && charIndex < currentWord.length) {
        currentText += currentWord[charIndex];
        charIndex++;
      } else if (isDeleting && charIndex > 0) {
        currentText = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else if (!isDeleting && charIndex === currentWord.length) {
        setTimeout(() => { isDeleting = true; }, 2000);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
      
      setTypedText(currentText);
    };
    
    const timer = setInterval(type, isDeleting ? 50 : 150);
    return () => clearInterval(timer);
  }, [currentWordIndex]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
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

  // Advanced particle system
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
    const particleCount = 100;
    const connections = [];

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
        this.baseOpacity = Math.random() * 0.5 + 0.3;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }
      
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.baseOpacity = Math.random() * 0.5 + 0.3;
      }
      
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.pulsePhase += this.pulseSpeed;
        
        if (this.y > canvas.height) this.reset();
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
      }
      
      draw() {
        const pulse = Math.sin(this.pulsePhase) * 0.3;
        const opacity = this.baseOpacity + pulse;
        
        // Main particle
        ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 3
        );
        gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${opacity * 0.4})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = gradient;
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
        
        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
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

  // Auto-rotate features and testimonials
  useEffect(() => {
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 4000);
    
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 6);
    }, 5000);
    
    return () => {
      clearInterval(featureInterval);
      clearInterval(testimonialInterval);
    };
  }, []);

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Learning',
      description: 'Personalized learning paths with advanced AI that adapts to your pace and goals',
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
    },
    {
      icon: '📊',
      title: 'Real-Time Analytics',
      description: 'Track progress with detailed insights and data-driven recommendations',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    {
      icon: '🎯',
      title: 'Interactive Courses',
      description: 'Hands-on projects and coding challenges to master real-world skills',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    },
    {
      icon: '🏆',
      title: 'Certifications',
      description: 'Industry-recognized certificates to boost your career prospects',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    {
      icon: '👥',
      title: 'Expert Community',
      description: 'Connect with mentors and peers in a thriving global network',
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
    },
    {
      icon: '⚡',
      title: 'Learn Faster',
      description: 'Proven techniques to accelerate learning and retain knowledge better',
      color: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)'
    }
  ];

  const stats = [
    { icon: '👨‍🎓', number: '100K+', label: 'Active Learners', color: '#3B82F6', trend: '+24%' },
    { icon: '📚', number: '2000+', label: 'Expert Courses', color: '#10B981', trend: '+15%' },
    { icon: '⭐', number: '4.9/5', label: 'Student Rating', color: '#F59E0B', trend: 'Top Rated' },
    { icon: '🌍', number: '150+', label: 'Countries', color: '#8B5CF6', trend: 'Global' }
  ];

  const testimonials = [
    {
      text: "EduVillage completely transformed my career! The AI tutor is like having a personal mentor available 24/7. I landed my dream job in just 4 months.",
      author: "Sarah Johnson",
      role: "Senior Developer at Google",
      avatar: "👩‍💻",
      rating: 5,
      company: "Google"
    },
    {
      text: "The best investment I've made in myself. The courses are practical, well-structured, and the community support is incredible. Highly recommended!",
      author: "Michael Chen",
      role: "Product Designer at Apple",
      avatar: "👨‍🎨",
      rating: 5,
      company: "Apple"
    },
    {
      text: "I've tried many platforms, but EduVillage stands out. The interactive projects and real-time feedback helped me master React in record time.",
      author: "Emily Rodriguez",
      role: "Full Stack Engineer",
      avatar: "👩‍💼",
      rating: 5,
      company: "Microsoft"
    },
    {
      text: "As a working professional, I needed flexible learning. EduVillage's AI-powered approach adapted perfectly to my schedule and learning style.",
      author: "David Kim",
      role: "Data Scientist",
      avatar: "👨‍🔬",
      rating: 5,
      company: "Amazon"
    },
    {
      text: "The quality of instructors and content is unmatched. I went from beginner to landing a six-figure job in under a year. Life-changing!",
      author: "Priya Patel",
      role: "ML Engineer at Tesla",
      avatar: "👩‍🚀",
      rating: 5,
      company: "Tesla"
    },
    {
      text: "EduVillage doesn't just teach you to code - it teaches you to think like a developer. The problem-solving skills I gained are invaluable.",
      author: "James Wilson",
      role: "Tech Lead at Netflix",
      avatar: "👨‍💼",
      rating: 5,
      company: "Netflix"
    }
  ];

  const courses = [
    { title: 'Full Stack Web Development', students: '50K+', rating: 4.9, icon: '💻', color: '#3B82F6' },
    { title: 'Data Science & AI', students: '35K+', rating: 4.8, icon: '📊', color: '#10B981' },
    { title: 'Mobile App Development', students: '28K+', rating: 4.9, icon: '📱', color: '#F59E0B' },
    { title: 'Cloud Computing & DevOps', students: '22K+', rating: 4.7, icon: '☁️', color: '#8B5CF6' }
  ];

  return (
    <div className="home-ultra">
      <canvas className="particle-canvas" ref={canvasRef}></canvas>
      
      {/* Cursor follower */}
      <div 
        className="cursor-glow" 
        style={{
          left: mousePos.x + 'px',
          top: mousePos.y + 'px'
        }}
      ></div>

      {/* HERO SECTION - ULTRA */}
      <section className="hero-ultra">
        <div className="hero-gradient-orb orb-1"></div>
        <div className="hero-gradient-orb orb-2"></div>
        <div className="hero-gradient-orb orb-3"></div>
        
        <div className="hero-container">
          <div className="hero-content-ultra">
            <div className="hero-badge-ultra">
              <span className="badge-pulse"></span>
              <span className="badge-text">
                <span className="badge-icon">🚀</span>
                Join 100K+ Learners Worldwide
              </span>
              <span className="badge-shine"></span>
            </div>
            
            <h1 className="hero-title-ultra">
              Master
              <span className="typed-container">
                <span className="gradient-text-animated"> {typedText}</span>
                <span className="cursor-blink">|</span>
              </span>
              <br />
              Transform Your Future
            </h1>
            
            <p className="hero-description-ultra">
              Join the world's most advanced learning platform powered by AI. 
              Learn from industry experts, build real projects, and accelerate your career 
              with personalized education designed for the future.
            </p>

            <div className="hero-stats-premium">
              <div className="stat-premium">
                <div className="stat-icon-premium">⭐</div>
                <div className="stat-info-premium">
                  <span className="stat-number-premium">4.9/5</span>
                  <span className="stat-label-premium">Rating</span>
                </div>
              </div>
              <div className="stat-divider-premium"></div>
              <div className="stat-premium">
                <div className="stat-icon-premium">👥</div>
                <div className="stat-info-premium">
                  <span className="stat-number-premium">100K+</span>
                  <span className="stat-label-premium">Students</span>
                </div>
              </div>
              <div className="stat-divider-premium"></div>
              <div className="stat-premium">
                <div className="stat-icon-premium">🎓</div>
                <div className="stat-info-premium">
                  <span className="stat-number-premium">2000+</span>
                  <span className="stat-label-premium">Courses</span>
                </div>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="hero-cta-ultra">
                <Link to="/register" className="btn-ultra btn-primary-ultra">
                  <span className="btn-text">Start Learning Free</span>
                  <span className="btn-icon-wrapper">
                    <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="btn-shimmer"></span>
                </Link>
                <Link to="/courses" className="btn-ultra btn-secondary-ultra">
                  <span className="btn-text">Explore Courses</span>
                  <span className="btn-icon">🎯</span>
                </Link>
              </div>
            ) : (
              <div className="hero-cta-ultra">
                <Link 
                  to={user?.role === 'student' ? '/student/dashboard' : user?.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'} 
                  className="btn-ultra btn-primary-ultra"
                >
                  <span className="btn-text">Go to Dashboard</span>
                  <span className="btn-icon-wrapper">
                    <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="btn-shimmer"></span>
                </Link>
              </div>
            )}

            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span>SSL Secured</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✓</span>
                <span>Certified Programs</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">💯</span>
                <span>Money-back Guarantee</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-ultra" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
            <div className="visual-grid">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className={`visual-card visual-card-${i + 1}`}
                  style={{
                    transform: `translate(${(mousePos.x - window.innerWidth / 2) * 0.02 * (i + 1)}px, ${(mousePos.y - window.innerHeight / 2) * 0.02 * (i + 1)}px)`
                  }}
                >
                  <div className="card-glow"></div>
                  <div className="card-content-visual">
                    {i === 0 && (
                      <>
                        <div className="visual-icon">🎯</div>
                        <div className="visual-title">AI Tutor</div>
                        <div className="visual-subtitle">24/7 Available</div>
                        <div className="visual-status">
                          <span className="status-dot"></span>
                          <span>Online</span>
                        </div>
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <div className="visual-icon">📈</div>
                        <div className="visual-title">Progress</div>
                        <div className="progress-bar-visual">
                          <div className="progress-fill-visual" style={{width: '78%'}}></div>
                        </div>
                        <div className="visual-subtitle">78% Complete</div>
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <div className="visual-icon">🏆</div>
                        <div className="visual-title">Achievements</div>
                        <div className="achievement-badges">
                          <span>🥇</span>
                          <span>🥈</span>
                          <span>🥉</span>
                        </div>
                        <div className="visual-subtitle">15 Earned</div>
                      </>
                    )}
                    {i === 3 && (
                      <>
                        <div className="visual-icon">⚡</div>
                        <div className="visual-title">Streak</div>
                        <div className="streak-number">45</div>
                        <div className="visual-subtitle">Days in a row</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="visual-center-glow"></div>
          </div>
        </div>
      </section>

      {/* STATS SECTION - ULTRA */}
      <section className="stats-ultra" id="stats" data-animate>
        <div className="stats-grid-ultra">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`stat-card-ultra ${isVisible.stats ? 'animate-in' : ''}`}
              style={{
                '--stat-color': stat.color,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="stat-bg-pattern"></div>
              <div className="stat-icon-ultra">{stat.icon}</div>
              <div className="stat-number-ultra">{stat.number}</div>
              <div className="stat-label-ultra">{stat.label}</div>
              <div className="stat-trend">{stat.trend}</div>
              <div className="stat-glow-effect"></div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR COURSES */}
      <section className="popular-courses" id="courses" data-animate>
        <div className="section-header-ultra">
          <div className="badge-ultra">
            <span>🔥</span>
            <span>Trending Now</span>
          </div>
          <h2 className="section-title-ultra">
            Most Popular <span className="gradient-text-animated">Courses</span>
          </h2>
          <p className="section-subtitle-ultra">
            Join thousands of students already learning these in-demand skills
          </p>
        </div>

        <div className="courses-grid">
          {courses.map((course, index) => (
            <div 
              key={index} 
              className={`course-card-premium ${isVisible.courses ? 'animate-in' : ''}`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="course-icon-bg" style={{background: course.color}}></div>
              <div className="course-icon-large">{course.icon}</div>
              <h3 className="course-title-premium">{course.title}</h3>
              <div className="course-meta">
                <div className="course-students">
                  <span>👥</span>
                  <span>{course.students}</span>
                </div>
                <div className="course-rating">
                  <span>⭐</span>
                  <span>{course.rating}</span>
                </div>
              </div>
              <Link to="/courses" className="course-btn">
                <span>Explore Course</span>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION - ULTRA */}
      <section className="features-ultra" id="features" data-animate>
        <div className="section-header-ultra">
          <div className="badge-ultra">
            <span>✨</span>
            <span>Platform Features</span>
          </div>
          <h2 className="section-title-ultra">
            Everything You Need to <span className="gradient-text-animated">Excel</span>
          </h2>
          <p className="section-subtitle-ultra">
            Cutting-edge tools and features designed to maximize your learning potential
          </p>
        </div>

        <div className="features-grid-ultra">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card-ultra ${activeFeature === index ? 'active' : ''} ${isVisible.features ? 'animate-in' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
              style={{
                '--feature-color': feature.color,
                '--feature-gradient': feature.gradient,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="feature-glow-bg"></div>
              <div className="feature-icon-ultra">{feature.icon}</div>
              <h3 className="feature-title-ultra">{feature.title}</h3>
              <p className="feature-description-ultra">{feature.description}</p>
              <div className="feature-shine"></div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS - ULTRA */}
      <section className="how-it-works-ultra" id="how" data-animate>
        <div className="section-header-ultra">
          <div className="badge-ultra">
            <span>🎯</span>
            <span>Simple Process</span>
          </div>
          <h2 className="section-title-ultra">
            Start Learning in <span className="gradient-text-animated">3 Simple Steps</span>
          </h2>
        </div>

        <div className="steps-timeline">
          {[
            { number: '01', icon: '📝', title: 'Create Account', desc: 'Sign up free and get instant access to 2000+ courses' },
            { number: '02', icon: '🎯', title: 'Choose Your Path', desc: 'Let AI recommend perfect courses based on your goals' },
            { number: '03', icon: '🚀', title: 'Start Learning', desc: 'Learn at your pace with expert guidance and support' }
          ].map((step, index) => (
            <div 
              key={index} 
              className={`step-item-ultra ${isVisible.how ? 'animate-in' : ''}`}
              style={{animationDelay: `${index * 0.2}s`}}
            >
              <div className="step-number-ultra">{step.number}</div>
              <div className="step-icon-ultra">{step.icon}</div>
              <h3 className="step-title-ultra">{step.title}</h3>
              <p className="step-desc-ultra">{step.desc}</p>
              {index < 2 && <div className="step-connector-ultra"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS - ULTRA */}
      <section className="testimonials-ultra" id="testimonials" data-animate>
        <div className="section-header-ultra">
          <div className="badge-ultra">
            <span>💬</span>
            <span>Success Stories</span>
          </div>
          <h2 className="section-title-ultra">
            Loved by <span className="gradient-text-animated">100K+ Learners</span>
          </h2>
          <p className="section-subtitle-ultra">
            See what our students have achieved with EduVillage
          </p>
        </div>

        <div className="testimonials-carousel">
          <div className="testimonials-wrapper" style={{transform: `translateX(-${activeTestimonial * 100}%)`}}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-slide">
                <div className="testimonial-card-ultra">
                  <div className="testimonial-header">
                    <div className="testimonial-quote">"</div>
                    <div className="testimonial-stars">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                  </div>
                  <p className="testimonial-text-ultra">{testimonial.text}</p>
                  <div className="testimonial-author-ultra">
                    <div className="author-avatar-ultra">{testimonial.avatar}</div>
                    <div className="author-info">
                      <div className="author-name-ultra">{testimonial.author}</div>
                      <div className="author-role-ultra">{testimonial.role}</div>
                      <div className="author-company">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="testimonial-glow"></div>
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
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION - ULTRA */}
      <section className="cta-ultra" id="cta" data-animate>
        <div className="cta-glow-orb cta-orb-1"></div>
        <div className="cta-glow-orb cta-orb-2"></div>
        <div className="cta-glow-orb cta-orb-3"></div>
        
        <div className={`cta-content-ultra ${isVisible.cta ? 'animate-in' : ''}`}>
          <div className="cta-badge">
            <span>🎉</span>
            <span>Limited Time Offer</span>
          </div>
          <h2 className="cta-title-ultra">
            Ready to Transform Your Career?
          </h2>
          <p className="cta-subtitle-ultra">
            Join 100,000+ students who are already learning the skills of tomorrow
          </p>
          
          {!isAuthenticated && (
            <div className="cta-buttons-ultra">
              <Link to="/register" className="btn-ultra btn-primary-ultra btn-xl">
                <span className="btn-text">Start Learning Free</span>
                <span className="btn-icon-wrapper">
                  <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="btn-shimmer"></span>
              </Link>
            </div>
          )}
          
          <div className="cta-features">
            <div className="cta-feature-item">✓ No credit card required</div>
            <div className="cta-feature-item">✓ 7-day money-back guarantee</div>
            <div className="cta-feature-item">✓ Cancel anytime</div>
          </div>
        </div>
      </section>

      {/* FOOTER - ULTRA */}
      <footer className="footer-ultra">
        <div className="footer-content-ultra">
          <div className="footer-brand-ultra">
            <div className="footer-logo-ultra">
              <span className="logo-icon-ultra">🎓</span>
              <span className="logo-text-ultra">EduVillage</span>
            </div>
            <p className="footer-tagline">
              Empowering learners worldwide with cutting-edge AI-powered education technology.
            </p>
            <div className="social-links-ultra">
              {[
                { icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z', label: 'Twitter' },
                { icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', label: 'Facebook' },
                { icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z', label: 'LinkedIn' }
              ].map((social, i) => (
                <a key={i} href="#" className="social-link-ultra" aria-label={social.label}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.icon}/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="footer-links-ultra">
            <h4>Platform</h4>
            <Link to="/courses">Browse Courses</Link>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#how">How It Works</a>
          </div>

          <div className="footer-links-ultra">
            <h4>Company</h4>
            <a href="#about">About Us</a>
            <a href="#careers">Careers</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-links-ultra">
            <h4>Support</h4>
            <a href="#help">Help Center</a>
            <a href="#faq">FAQ</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>

        <div className="footer-bottom-ultra">
          <p>© 2026 EduVillage by Civora Nexus. All rights reserved.</p>
          <p>Made with ❤️ for education and innovation</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;